import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { getSetting, setSetting } from "../../utils/appSettings";
import { useExpenses } from "../expense/useExpenses";
import { useIncomes } from "../income/useIncomes";
import { useTransfers } from "./useTransfers";

import { t } from "../../lib/i18n";
export const ACCOUNT_TYPES = ["Tunai", "Bank", "E-Wallet"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface Account {
  id: string;
  user_id: string;
  nama: string;
  tipe: AccountType | string;
  saldo_awal: number;
  created_at: string;
}

// Akun default "Dompet" dibuat satu kali saja (flag di app_settings). Promise ini mencegah
// dua hook yang aktif bersamaan membuatnya dobel.
let seeding: Promise<void> | null = null;

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { transfers } = useTransfers();

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: true });
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

  const updateAccount = async (id: string, input: { tipe?: string; saldo_awal?: number }) => {
    const { error } = await db.from("accounts").update(input).eq("id", id);
    if (error) return { error: error.message };
    await fetchAccounts();
    return { error: null };
  };

  const deleteAccount = async (id: string) => {
    await db.from("accounts").delete().eq("id", id);
    await fetchAccounts();
  };

  // saldo = saldo awal + pemasukan(akun) − pengeluaran(metode_pembayaran) ± transfer
  const { balances, total, unassigned } = useMemo(() => {
    const bal: Record<string, number> = {};
    for (const a of accounts) bal[a.nama] = a.saldo_awal ?? 0;
    let untracked = 0;
    const add = (name: string | null | undefined, v: number) => {
      if (name && name in bal) bal[name] += v;
      else untracked += v;
    };
    for (const i of incomes) add(i.akun, i.nominal);
    for (const e of expenses) add(e.metode_pembayaran, -e.nominal);
    for (const tr of transfers) {
      if (tr.dari_akun in bal) bal[tr.dari_akun] -= tr.nominal;
      if (tr.ke_akun in bal) bal[tr.ke_akun] += tr.nominal;
    }
    const sumAccounts = Object.values(bal).reduce((s, v) => s + v, 0);
    return { balances: bal, total: sumAccounts + untracked, unassigned: untracked };
  }, [accounts, incomes, expenses, transfers]);

  return { accounts, loading, balances, total, unassigned, addAccount, updateAccount, deleteAccount };
}
