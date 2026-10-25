import { useCallback, useEffect, useState } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { t } from "../../lib/i18n";
import type { AllocMode, PocketType } from "./pocketMath";

export interface Pocket {
  id: string;
  user_id: string;
  nama: string;
  ikon: string;
  tipe: PocketType;
  target: number;
  mode_alokasi: AllocMode;
  nilai_alokasi: number;
  created_at: string;
}
export type PocketInput = Pick<Pocket, "nama" | "ikon" | "tipe" | "target" | "mode_alokasi" | "nilai_alokasi">;

export interface PocketEntry {
  id: string;
  user_id: string;
  pocket_id: string;
  jenis: "isi" | "keluar";
  nominal: number;
  tanggal: string;
  catatan: string | null;
  created_at: string;
}
export type EntryInput = Pick<PocketEntry, "pocket_id" | "jenis" | "nominal" | "tanggal" | "catatan">;

/** Kantong dan riwayat isi/keluarnya. Perhitungan saldo ada di pocketMath / useMoney. */
export function usePocketData() {
  const { user } = useAuth();
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [entries, setEntries] = useState<PocketEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [p, e] = await Promise.all([
      db.from("pockets").select("*").order("created_at", { ascending: true }),
      db.from("pocket_entries").select("*").order("tanggal", { ascending: false }),
    ]);
    if (!p.error) setPockets(p.data as Pocket[]);
    if (!e.error) setEntries(e.data as PocketEntry[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  const addPocket = async (input: PocketInput) => {
    if (!user) return { error: t("Database belum siap") };
    const { error } = await db.from("pockets").insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchAll();
    return { error: null };
  };

  const updatePocket = async (id: string, input: Partial<PocketInput>) => {
    const { error } = await db.from("pockets").update(input).eq("id", id);
    if (error) return { error: error.message };
    await fetchAll();
    return { error: null };
  };

  /** Hapus kantong: riwayat isi/keluar ikut terhapus (cascade), pengeluaran dilepas dari kantong tapi tetap tercatat. */
  const deletePocket = async (id: string) => {
    const { error } = await db.transaction([
      { sql: "UPDATE expenses SET pocket_id = NULL WHERE pocket_id = ?", params: [id] },
      { sql: "DELETE FROM pockets WHERE id = ?", params: [id] },
    ]);
    if (error) return { error: error.message };
    await fetchAll();
    return { error: null };
  };

  /** Tambah beberapa riwayat sekaligus (satu transaksi database). */
  const addEntries = async (rows: EntryInput[]) => {
    if (!user) return { error: t("Database belum siap") };
    if (rows.length === 0) return { error: null };
    const { error } = await db.from("pocket_entries").insert(rows.map((r) => ({ ...r, user_id: user.id })));
    if (error) return { error: error.message };
    await fetchAll();
    return { error: null };
  };

  const deleteEntry = async (id: string) => {
    const { error } = await db.from("pocket_entries").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchAll();
    return { error: null };
  };

  return { pockets, entries, loading, addPocket, updatePocket, deletePocket, addEntries, deleteEntry, refetch: fetchAll };
}
