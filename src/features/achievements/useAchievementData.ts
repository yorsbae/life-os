import { useEffect, useState } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { toDateStr } from "../../utils/dates";

// Hook mandiri: membaca langsung tabel yang dibutuhkan supaya tidak bergantung pada hook modul lain.
type R = Record<string, unknown>;
export interface AchievementData {
  habits: R[];
  habitLogs: R[];
  readings: R[];
  exercises: R[];
  focus: R[];
  journals: R[];
  incomes: R[];
  expenses: R[];
  budgets: R[];
  creative: R[];
}
const EMPTY: AchievementData = { habits: [], habitLogs: [], readings: [], exercises: [], focus: [], journals: [], incomes: [], expenses: [], budgets: [], creative: [] };

export function useAchievementData() {
  const { user } = useAuth();
  const [data, setData] = useState<AchievementData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const get = async (table: string) => ((await db.from(table).select("*")).data ?? []) as R[];
      const [habits, habitLogs, readings, exercises, focus, journals, incomes, expenses, budgets, creative] = await Promise.all(
        ["habits", "habit_logs", "readings", "exercises", "focus_sessions", "journals", "incomes", "expenses", "budget_targets", "creative_projects"].map(get),
      );
      if (!cancelled) {
        setData({ habits, habitLogs, readings, exercises, focus, journals, incomes, expenses, budgets, creative });
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { data, loading };
}

/** Streak berjalan (hari berurutan sampai hari ini; hari ini belum terisi tidak memutus). */
export function currentStreak(dates: Set<string>): number {
  let n = 0;
  const d = new Date();
  if (!dates.has(toDateStr(d))) d.setDate(d.getDate() - 1);
  while (dates.has(toDateStr(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Streak terpanjang sepanjang waktu. */
export function longestStreak(dates: Set<string>): number {
  const sorted = [...dates].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const s of sorted) {
    const d = new Date(s + "T00:00:00");
    run = prev && Math.round((d.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
