import { useCallback, useEffect, useState } from "react";
import { addDays, endOfWeek, startOfWeek } from "date-fns";
import { db } from "../../lib/db";
import { toDateStr } from "../../utils/dates";
import { computeScorecard, type Scorecard } from "../../utils/scorecard";

export interface TodayTask { id: string; judul: string; status: string; prioritas: string }
export interface TodayEvent { id: string; judul: string; tanggal_mulai: string }
export interface TodayHabit { id: string; nama: string; target: number; nilai: number }

export interface TodayData {
  tasks: TodayTask[];
  events: TodayEvent[];
  habits: TodayHabit[];
  spentToday: number;
  score: Scorecard;
}

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

export async function load(): Promise<TodayData> {
  const now = new Date();
  const today = toDateStr(now);
  const tomorrow = toDateStr(addDays(now, 1));
  const ws = toDateStr(startOfWeek(now, { weekStartsOn: 1 }));
  const we = toDateStr(endOfWeek(now, { weekStartsOn: 1 }));

  const [tasksToday, tasksWeek, habits, logs, events, spent, focus, journals, learnings] = await Promise.all([
    db.from("tasks").select("id,judul,status,prioritas").eq("tanggal_mulai", today),
    db.from("tasks").select("status").gte("tanggal_mulai", ws).lte("tanggal_mulai", we),
    db.from("habits").select("id,nama,target_harian,aktif"),
    db.from("habit_logs").select("habit_id,tanggal,nilai").gte("tanggal", ws).lte("tanggal", we),
    db.from("events").select("id,judul,tanggal_mulai").gte("tanggal_mulai", today).lt("tanggal_mulai", tomorrow).order("tanggal_mulai", { ascending: true }),
    db.from("expenses").select("nominal").eq("tanggal", today),
    db.from("focus_sessions").select("durasi_aktual").gte("tanggal", ws).lte("tanggal", we),
    db.from("journals").select("tanggal").gte("tanggal", ws).lte("tanggal", we),
    db.from("learnings").select("tanggal").gte("tanggal", ws).lte("tanggal", we),
  ]);

  const activeHabits = ((habits.data ?? []) as Record<string, unknown>[]).filter((h) => !!h.aktif);
  const target = new Map(activeHabits.map((h) => [String(h.id), Math.max(num(h.target_harian), 0.0001)]));
  const weekLogs = ((logs.data ?? []) as Record<string, unknown>[]).filter((l) => target.has(String(l.habit_id)));
  const habitPoints = weekLogs.reduce((a, l) => a + Math.min(num(l.nilai) / target.get(String(l.habit_id))!, 1), 0);
  const todayValue = new Map(weekLogs.filter((l) => l.tanggal === today).map((l) => [String(l.habit_id), num(l.nilai)]));

  const weekTasks = (tasksWeek.data ?? []) as Record<string, unknown>[];
  const reflect = new Set<string>([
    ...((journals.data ?? []) as Record<string, unknown>[]).map((r) => String(r.tanggal)),
    ...((learnings.data ?? []) as Record<string, unknown>[]).map((r) => String(r.tanggal)),
  ]);

  return {
    tasks: (tasksToday.data ?? []) as unknown as TodayTask[],
    events: (events.data ?? []) as unknown as TodayEvent[],
    habits: activeHabits.map((h) => ({
      id: String(h.id),
      nama: String(h.nama),
      target: num(h.target_harian),
      nilai: todayValue.get(String(h.id)) ?? 0,
    })),
    spentToday: ((spent.data ?? []) as Record<string, unknown>[]).reduce((a, r) => a + num(r.nominal), 0),
    score: computeScorecard({
      tasksTotal: weekTasks.length,
      tasksDone: weekTasks.filter((x) => x.status === "Selesai").length,
      habitCount: activeHabits.length,
      habitPoints,
      focusMinutes: ((focus.data ?? []) as Record<string, unknown>[]).reduce((a, r) => a + num(r.durasi_aktual), 0),
      reflectionDays: reflect.size,
    }),
  };
}

export function useToday() {
  const [data, setData] = useState<TodayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(() => {
    load().then(setData).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);
  useEffect(refresh, [refresh]);
  return { data, error, refresh };
}
