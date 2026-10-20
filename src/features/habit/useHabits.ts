import { useCallback, useEffect, useState } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { toDateStr } from "../../utils/dates";

export interface Habit {
  id: string;
  user_id: string;
  nama: string;
  ikon: string;
  target_harian: number;
  satuan: string;
  aktif: boolean;
}
export interface HabitLog {
  id: string;
  habit_id: string;
  tanggal: string;
  nilai: number;
}
export type HabitInput = Pick<Habit, "nama" | "ikon" | "target_harian" | "satuan">;

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [h, l] = await Promise.all([
      db.from("habits").select("*").eq("aktif", true).order("created_at", { ascending: true }),
      db.from("habit_logs").select("*").order("tanggal", { ascending: false }).limit(2000),
    ]);
    if (!h.error) setHabits(h.data as Habit[]);
    if (!l.error) setLogs(l.data as HabitLog[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  const valueOn = useCallback(
    (habitId: string, tanggal: string) =>
      logs.find((x) => x.habit_id === habitId && x.tanggal === tanggal)?.nilai ?? 0,
    [logs],
  );

  const isDone = (h: Habit, tanggal = toDateStr()) =>
    valueOn(h.id, tanggal) >= h.target_harian;

  /** Set nilai hari tertentu (upsert per habit+tanggal). */
  const setValue = async (h: Habit, nilai: number, tanggal = toDateStr()) => {
    if (!user) return;
    const v = Math.max(0, nilai);
    const existing = logs.find((x) => x.habit_id === h.id && x.tanggal === tanggal);
    if (existing) await db.from("habit_logs").update({ nilai: v }).eq("id", existing.id);
    else
      await db.from("habit_logs").insert({
        habit_id: h.id,
        user_id: user.id,
        tanggal,
        nilai: v,
      });
    await fetchAll();
  };

  const toggle = (h: Habit, tanggal = toDateStr()) =>
    setValue(h, isDone(h, tanggal) ? 0 : h.target_harian, tanggal);

  const addHabit = async (input: HabitInput) => {
    if (!user) return { error: "Database belum siap" };
    const { error } = await db
      .from("habits")
      .insert({ ...input, user_id: user.id, aktif: true });
    if (error) return { error: error.message };
    await fetchAll();
    return { error: null };
  };

  const deleteHabit = async (id: string) => {
    await db.from("habits").delete().eq("id", id);
    await fetchAll();
  };

  /** Hari beruntun (streak) sampai hari ini; hari ini yang belum selesai tidak memutus. */
  const streakOf = (h: Habit) => {
    let n = 0;
    const d = new Date();
    if (!isDone(h, toDateStr(d))) d.setDate(d.getDate() - 1);
    while (isDone(h, toDateStr(d))) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  };

  return { habits, logs, loading, valueOn, isDone, setValue, toggle, addHabit, deleteHabit, streakOf };
}
