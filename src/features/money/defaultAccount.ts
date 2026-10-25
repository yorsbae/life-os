import { db } from "../../lib/db";
import { getSetting, setSetting } from "../../utils/appSettings";

const KEY = "money_last_account";

/**
 * Sumber dana bawaan untuk transaksi baru: yang terakhir dipakai (bila masih ada), kalau tidak
 * akun pertama. Dipakai agar transaksi cepat (mis. Catat Cepat) tetap memotong saldo sebuah akun
 * dan tidak jatuh ke "tanpa akun".
 */
export async function defaultAccountName(): Promise<string | null> {
  const { data } = await db.from("accounts").select("nama").order("created_at", { ascending: true });
  const names = ((data ?? []) as { nama: string }[]).map((r) => r.nama);
  if (names.length === 0) return null;
  const last = await getSetting(KEY);
  return last && names.includes(last) ? last : names[0];
}

export async function rememberAccount(name: string | null | undefined) {
  if (name) await setSetting(KEY, name);
}
