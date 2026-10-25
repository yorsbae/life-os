import { useMemo, useState } from "react";
import { db, newId } from "../../lib/db";
import type { SqlStatement } from "../../lib/db/types";
import { useAuth } from "../../context/AuthContext";
import { t } from "../../lib/i18n";
import { rupiah } from "../../utils/format";
import { toDateStr } from "../../utils/dates";
import type { Expense, IncomeInput } from "../../types";
import { useExpenses } from "../expense/useExpenses";
import { useIncomes } from "../income/useIncomes";
import { useTransfers } from "./useTransfers";
import { useAccountList, type AccountPatch } from "./useAccounts";
import { usePocketData, type Pocket, type PocketInput } from "./usePocketData";
import { computeBalances, groupAccounts } from "./accountMath";
import { allocatedTotal, computePockets, isGiving, type Allocation } from "./pocketMath";
import { rememberAccount } from "./defaultAccount";

type Result = { error: string | null };

export interface SpendInput {
  pocketId: string;
  nominal: number;
  kategori: Expense["kategori"];
  akun: string;
  tanggal?: string;
  catatan?: string | null;
}

/**
 * Sumber kebenaran tunggal untuk layar uang: sumber dana, kantong, dan transaksi dimuat sekali dalam
 * SATU hook, jadi semua angka (Total, Saldo Utama, saldo kantong, saldo tiap akun) selalu dihitung dari
 * data yang sama dan ikut segar setelah setiap perubahan.
 *
 *   Total Saldo = Σ saldo semua sumber dana
 *   Saldo Utama = Total Saldo − Σ saldo kantong tabungan
 *
 * Pengeluaran dari kantong memotong sumber dana (lewat metode_pembayaran) DAN saldo kantong
 * (lewat expenses.pocket_id) sekaligus, sehingga keduanya tidak bisa saling menyimpang.
 */
export function useMoney() {
  const { user } = useAuth();
  const ex = useExpenses();
  const inc = useIncomes();
  const tr = useTransfers();
  const ac = useAccountList();
  const pk = usePocketData();

  // `loading` hanya true saat muat pertama, supaya layar tidak berkedip tiap data dimuat ulang.
  const anyLoading = ex.loading || inc.loading || tr.loading || ac.loading || pk.loading;
  const [ready, setReady] = useState(false);
  if (!anyLoading && !ready) setReady(true);

  const { balances, total, unassigned } = useMemo(
    () => computeBalances(ac.accounts, inc.incomes, ex.expenses, tr.transfers),
    [ac.accounts, inc.incomes, ex.expenses, tr.transfers],
  );
  const stats = useMemo(
    () => computePockets<Pocket>(pk.pockets, pk.entries, ex.expenses),
    [pk.pockets, pk.entries, ex.expenses],
  );
  const allocated = allocatedTotal(stats);
  const utama = total - allocated;
  const groups = useMemo(() => groupAccounts(ac.accounts, balances), [ac.accounts, balances]);
  const statOf = (id: string) => stats.find((s) => s.pocket.id === id);

  // ---------- sumber dana ----------
  const updateAccount = async (id: string, patch: AccountPatch): Promise<Result> => {
    const r = await ac.updateAccount(id, patch);
    if (r.renamed) await Promise.all([ex.refetch(), inc.refetch(), tr.refetch()]);
    return { error: r.error };
  };

  /** Samakan saldo aplikasi dengan saldo sebenarnya (mis. nilai investasi naik/turun) tanpa membuat transaksi palsu. */
  const reconcileAccount = async (id: string, actual: number): Promise<Result> => {
    const a = ac.accounts.find((x) => x.id === id);
    if (!a) return { error: t("Akun tidak ditemukan") };
    return updateAccount(id, { saldo_awal: a.saldo_awal + (actual - (balances[a.nama] ?? 0)) });
  };

  // ---------- kantong ----------
  const fillPocket = async (pocketId: string, nominal: number, catatan?: string | null): Promise<Result> => {
    const s = statOf(pocketId);
    if (!s) return { error: t("Kantong tidak ditemukan") };
    if (isGiving(s.pocket)) return { error: t("Kantong pemberian tidak punya saldo") };
    if (!(nominal > 0)) return { error: t("Nominal harus diisi") };
    if (nominal > utama) return { error: t("Saldo Utama tidak cukup ({0})", [rupiah(Math.max(utama, 0))]) };
    return pk.addEntries([{ pocket_id: pocketId, jenis: "isi", nominal, tanggal: toDateStr(), catatan: catatan ?? null }]);
  };

  /** Kembalikan uang dari kantong ke Saldo Utama (tidak mencatat pengeluaran). */
  const returnFromPocket = async (pocketId: string, nominal: number, catatan?: string | null): Promise<Result> => {
    const s = statOf(pocketId);
    if (!s) return { error: t("Kantong tidak ditemukan") };
    if (!(nominal > 0)) return { error: t("Nominal harus diisi") };
    if (nominal > s.saldo) return { error: t("Saldo kantong tidak cukup ({0})", [rupiah(Math.max(s.saldo, 0))]) };
    return pk.addEntries([{ pocket_id: pocketId, jenis: "keluar", nominal, tanggal: toDateStr(), catatan: catatan ?? null }]);
  };

  /** Bagi dari Saldo Utama ke beberapa kantong sekaligus (atomik). */
  const allocate = async (plan: Allocation[], catatan?: string | null): Promise<Result> => {
    const rows = plan.filter((a) => a.nominal > 0);
    if (rows.length === 0) return { error: t("Belum ada nominal yang dibagi") };
    for (const a of rows) {
      const s = statOf(a.pocketId);
      if (!s || isGiving(s.pocket)) return { error: t("Kantong tidak ditemukan") };
    }
    const sum = rows.reduce((x, a) => x + a.nominal, 0);
    if (sum > utama) return { error: t("Saldo Utama tidak cukup ({0})", [rupiah(Math.max(utama, 0))]) };
    const tanggal = toDateStr();
    return pk.addEntries(
      rows.map((a) => ({ pocket_id: a.pocketId, jenis: "isi" as const, nominal: a.nominal, tanggal, catatan: catatan ?? null })),
    );
  };

  /** Belanja dari kantong / catat pemberian: satu pengeluaran yang memotong sumber dana dan kantongnya. */
  const spendFromPocket = async (input: SpendInput): Promise<Result> => {
    const s = statOf(input.pocketId);
    if (!s) return { error: t("Kantong tidak ditemukan") };
    if (!(input.nominal > 0)) return { error: t("Nominal harus diisi") };
    if (!input.akun) return { error: t("Pilih sumber dana") };
    if (!isGiving(s.pocket) && input.nominal > s.saldo)
      return { error: t("Saldo kantong tidak cukup ({0})", [rupiah(Math.max(s.saldo, 0))]) };
    const res = await ex.addExpense({
      nominal: input.nominal,
      kategori: input.kategori,
      metode_pembayaran: input.akun,
      catatan: input.catatan ?? null,
      tanggal: input.tanggal ?? toDateStr(),
      pocket_id: input.pocketId,
    });
    if (!res.error) await rememberAccount(input.akun);
    return res;
  };

  /** Hapus satu riwayat isi/keluar, selama tidak membuat saldo kantong atau Saldo Utama menjadi minus. */
  const deleteEntry = async (entryId: string): Promise<Result> => {
    const e = pk.entries.find((x) => x.id === entryId);
    if (!e) return { error: null };
    const s = statOf(e.pocket_id);
    if (e.jenis === "isi" && s && s.saldo - e.nominal < 0)
      return { error: t("Tidak bisa dihapus: saldo kantong akan minus") };
    if (e.jenis === "keluar" && utama - e.nominal < 0)
      return { error: t("Tidak bisa dihapus: Saldo Utama akan minus") };
    return pk.deleteEntry(entryId);
  };

  const deletePocket = async (id: string): Promise<Result> => {
    const r = await pk.deletePocket(id);
    await ex.refetch();
    return r;
  };

  const addPocket = (input: PocketInput) => pk.addPocket(input);
  const updatePocket = (id: string, input: Partial<PocketInput>) => pk.updatePocket(id, input);

  /**
   * Catat pemasukan dan (opsional) langsung bagi ke kantong dalam SATU transaksi database,
   * sehingga tidak mungkin pemasukan tersimpan tetapi pembagiannya gagal separuh jalan.
   */
  const addIncomeAndAllocate = async (input: IncomeInput, plan: Allocation[]): Promise<Result> => {
    if (!user) return { error: t("Database belum siap") };
    const rows = plan.filter((a) => a.nominal > 0);
    const sum = rows.reduce((x, a) => x + a.nominal, 0);
    if (sum > input.nominal) return { error: t("Pembagian melebihi nominal pemasukan") };
    if (rows.some((a) => !statOf(a.pocketId))) return { error: t("Kantong tidak ditemukan") };
    const stmts: SqlStatement[] = [
      {
        sql: "INSERT INTO incomes (id, user_id, nominal, sumber, kategori, catatan, tanggal, akun) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params: [newId(), user.id, input.nominal, input.sumber, input.kategori ?? null, input.catatan ?? null, input.tanggal, input.akun ?? null],
      },
      ...rows.map((a) => ({
        sql: "INSERT INTO pocket_entries (id, user_id, pocket_id, jenis, nominal, tanggal, catatan) VALUES (?, ?, ?, 'isi', ?, ?, ?)",
        params: [newId(), user.id, a.pocketId, a.nominal, input.tanggal, t("Pembagian otomatis")],
      })),
    ];
    const { error } = await db.transaction(stmts);
    if (error) return { error: error.message };
    await Promise.all([inc.refetch(), pk.refetch()]);
    return { error: null };
  };

  return {
    loading: !ready,
    // sumber dana
    accounts: ac.accounts,
    groups,
    balances,
    total,
    unassigned,
    addAccount: ac.addAccount,
    updateAccount,
    reconcileAccount,
    deleteAccount: ac.deleteAccount,
    // kantong
    stats,
    pockets: pk.pockets,
    entries: pk.entries,
    allocated,
    utama,
    addPocket,
    updatePocket,
    deletePocket,
    fillPocket,
    returnFromPocket,
    allocate,
    spendFromPocket,
    deleteEntry,
    // transaksi
    expenses: ex.expenses,
    incomes: inc.incomes,
    transfers: tr.transfers,
    addExpense: ex.addExpense,
    updateExpense: ex.updateExpense,
    deleteExpense: ex.deleteExpense,
    addIncome: inc.addIncome,
    updateIncome: inc.updateIncome,
    addIncomeAndAllocate,
    addTransfer: tr.addTransfer,
    updateTransfer: tr.updateTransfer,
  };
}

export type Money = ReturnType<typeof useMoney>;
