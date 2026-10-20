import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";

export interface ExerciseSchedule {
  id: string;
  user_id: string;
  hari: number; // 0=Minggu ... 6=Sabtu
  tipe: string; // 'Rest' atau tipe olahraga
  sub_kategori: string | null;
  catatan: string | null;
}

export const HARI_LABEL = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jum'at",
  "Sabtu",
];

export function useExerciseSchedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ExerciseSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await db
      .from("exercise_schedules")
      .select("*")
      .order("hari", { ascending: true });
    if (!error) setSchedules(data as ExerciseSchedule[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Simpan/update jadwal 1 hari tertentu (upsert berdasarkan hari)
  const saveDaySchedule = async (
    hari: number,
    tipe: string,
    sub_kategori: string | null,
    catatan: string | null,
  ) => {
    if (!user) return { error: "Belum login" };
    const { error } = await db
      .from("exercise_schedules")
      .upsert(
        { user_id: user.id, hari, tipe, sub_kategori, catatan },
        { onConflict: "user_id,hari" },
      );

    if (error) return { error: error.message };
    await fetchSchedules();
    return { error: null };
  };

  // Cari jadwal untuk 1 tanggal spesifik (dicocokkan lewat hari-dalam-minggu)
  const getScheduleForDate = useCallback(
    (date: Date) => schedules.find((s) => s.hari === date.getDay()) ?? null,
    [schedules],
  );

  return { schedules, loading, saveDaySchedule, getScheduleForDate };
}
