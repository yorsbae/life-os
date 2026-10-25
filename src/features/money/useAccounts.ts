import { useCallback, useEffect, useState } from "react";
import { db } from "../../lib/db";
import type { SqlStatement } from "../../lib/db/types";
import { useAuth } from "../../context/AuthContext";
import { getSetting, setSetting } from "../../utils/appSettings";
import { t } from "../../lib/i18n";
import { ACCOUNT_TYPES, type AccountType } from "./accountMath";

export { ACCOUNT_TYPES };
export type { AccountType };

export interface Account {
  id: string;
  user_id: string;
  nama: string;
  tipe: AccountType | string;
  saldo_awal: number;
  created_at: string;
}

export interface AccountPatch {
  nama?: string;
  tipe?: string;
  saldo_awal?: number;
}

// Akun default "Dompet" dibuat satu kali saja (flag di app_settings). Promise ini mencegah
// dua hook yang aktif bersamaan membuatnya dobel.
let seeding: Promise<void> | null = null;

/**
 * Daftar sumber dana (cash, bank — bisa banyak rekening —, e-wallet, investasi) beserta CRUD-nya.
 * Saldo dihitung di tempat lain (accountMath.computeBalances / useMoney) dari data transaksi.
 */
export function useAccountList() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db.from("accounts").select("*").order("created_at", { ascending: true });
    if (error) {
      setLoading(false);
      return;
    }
    let rows = data as Account[];
    if (rows.length === 0) {
      if (!seeding) {
        seeding = (async () => {
          if (await getSetting("accounts_seeded")) return;
          await setSetting("accounts_seeded", "1");
          await db.from("accounts").insert({ user_id: user.id, nama: "Dompet", tipe: "Tunai", saldo_awal: 0 });
        })().finally(() => {
          seeding = null;
        });
      }
      await seeding;
      const again = await db.from("accounts").select("*").order("created_at", { ascending: true });
      if (!again.error) rows = again.data as Account[];
    }
    setAccounts(rows);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = async (nama: string, tipe: string, saldoAwal: number) => {
    if (!user) return { error: t("Database belum siap") };
    const name = nama.trim();
    if (!name) return { error: t("Nama akun wajib diisi") };
    if (accounts.some((a) => a.nama.toLowerCase() === name.toLowerCase()))
      return { error: t("Nama akun sudah dipakai") };
    const { error } = await db
      .from("accounts")
      .insert({ user_id: user.id, nama: name, tipe, saldo_awal: saldoAwal });
    if (error) return { error: error.message };
    await fetchAccounts();
    return { error: null };
  };

  /**
   * Ubah nama/jenis/saldo awal. Transaksi menyimpan akun berdasarkan NAMA, jadi mengganti nama
   * ikut memperbarui seluruh pengeluaran, pemasukan, dan transfer dalam satu transaksi database.
   * Mengembalikan `renamed` agar pemanggil memuat ulang data transaksi.
   */
  const updateAccount = async (id: string, patch: AccountPatch) => {
    const cur = accounts.find((a) => a.id === id);
    if (!cur) return { error: t("Akun tidak ditemukan"), renamed: false };
    const sets: string[] = [];
    const vals: (string | number)[] = [];
    let renamed = false;
    let nextName = cur.nama;

    if (patch.nama !== undefined) {
      nextName = patch.nama.trim();
      if (!nextName) return { error: t("Nama akun wajib diisi"), renamed: false };
      if (accounts.some((a) => a.id !== id && a.nama.toLowerCase() === nextName.toLowerCase()))
        return { error: t("Nama akun sudah dipakai"), renamed: false };
      if (nextName !== cur.nama) {
        sets.push("nama = ?");
        vals.push(nextName);
        renamed = true;
      }
    }
    if (patch.tipe !== undefined && patch.tipe !== cur.tipe) {
      sets.push("tipe = ?");
      vals.push(patch.tipe);
    }
    if (patch.saldo_awal !== undefined && patch.saldo_awal !== cur.saldo_awal) {
      sets.push("saldo_awal = ?");
      vals.push(patch.saldo_awal);
    }
    if (sets.length === 0) return { error: null, renamed: false };

    const stmts: SqlStatement[] = [{ sql: `UPDATE accounts SET ${sets.join(", ")} WHERE id = ?`, params: [...vals, id] }];
    if (renamed) {
      const o = cur.nama;
      const n = nextName;
      stmts.push(
        { sql: "UPDATE expenses SET metode_pembayaran = ? WHERE metode_pembayaran = ?", params: [n, o] },
        { sql: "UPDATE incomes SET akun = ? WHERE akun = ?", params: [n, o] },
        { sql: "UPDATE transfers SET dari_akun = ? WHERE dari_akun = ?", params: [n, o] },
        { sql: "UPDATE transfers SET ke_akun = ? WHERE ke_akun = ?", params: [n, o] },
      );
    }
    const { error } = await db.transaction(stmts);
    if (error) return { error: error.message, renamed: false };
    await fetchAccounts();
    return { error: null, renamed };
  };

  const deleteAccount = async (id: string) => {
    if (accounts.length <= 1) return { error: t("Minimal harus ada satu sumber dana") };
    const { error } = await db.from("accounts").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchAccounts();
    return { error: null };
  };

  return { accounts, loading, addAccount, updateAccount, deleteAccount, refetch: fetchAccounts };
}
