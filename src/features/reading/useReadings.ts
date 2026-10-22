import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";

import { t } from "../../lib/i18n";
export interface Reading {
  id: string;
  user_id: string;
  judul_buku: string;
  penulis: string | null;
  halaman_sekarang: number;
  total_halaman: number | null;
  status: "Dibaca" | "Selesai" | "Berhenti";
  insight: string | null;
  tanggal: string;
  created_at: string;
}

export type ReadingInput = Omit<Reading, "id" | "user_id" | "created_at">;

export function useReadings() {
  const { user } = useAuth();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReadings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await db
      .from("readings")
      .select("*")
      .order("tanggal", { ascending: false });
    if (!error) setReadings(data as Reading[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const addReading = async (input: ReadingInput) => {
    if (!user) return { error: t("Belum login") };
    const { error } = await db
      .from("readings")
      .insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchReadings();
    return { error: null };
  };

  const updateReading = async (id: string, input: Partial<ReadingInput>) => {
    const { error } = await db
      .from("readings")
      .update(input)
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchReadings();
    return { error: null };
  };

  const deleteReading = async (id: string) => {
    const { error } = await db.from("readings").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchReadings();
    return { error: null };
  };

  return { readings, loading, addReading, updateReading, deleteReading };
}
