// Skor mingguan 0-100 per area, dihitung dari data yang sudah ada (tanpa input baru).

export interface ScoreInput {
  tasksTotal: number;
  tasksDone: number;
  /** Jumlah habit aktif. */
  habitCount: number;
  /** Jumlah poin habit pekan ini: per log min(nilai/target, 1). Maksimum = habitCount * 7. */
  habitPoints: number;
  focusMinutes: number;
  /** Jumlah hari berbeda yang punya jurnal atau catatan belajar. */
  reflectionDays: number;
}

export type ScoreKey = "tasks" | "habits" | "focus" | "reflection";
export interface ScoreItem {
  key: ScoreKey;
  /** null = belum ada data untuk area ini (tidak ikut rata-rata). */
  score: number | null;
}
export interface Scorecard {
  items: ScoreItem[];
  overall: number | null;
}

export const FOCUS_WEEKLY_GOAL_MIN = 150;
export const REFLECTION_WEEKLY_GOAL_DAYS = 4;

const pct = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 100);

export function computeScorecard(i: ScoreInput): Scorecard {
  const items: ScoreItem[] = [
    { key: "tasks", score: i.tasksTotal > 0 ? pct(i.tasksDone / i.tasksTotal) : null },
    { key: "habits", score: i.habitCount > 0 ? pct(i.habitPoints / (i.habitCount * 7)) : null },
    { key: "focus", score: pct(i.focusMinutes / FOCUS_WEEKLY_GOAL_MIN) },
    { key: "reflection", score: pct(i.reflectionDays / REFLECTION_WEEKLY_GOAL_DAYS) },
  ];
  const known = items.filter((x): x is { key: ScoreKey; score: number } => x.score !== null);
  const overall = known.length ? Math.round(known.reduce((a, x) => a + x.score, 0) / known.length) : null;
  return { items, overall };
}
