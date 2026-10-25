import { parseDateStr } from "../../utils/dates";

// Perhitungan tanggal Program Latihan. Murni (tanpa React/DB) agar bisa diuji.
// Semua memakai tanggal LOKAL, bukan UTC (lihat catatan di useTrainingPlan).

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Senin pada minggu yang memuat `date` (pukul 00.00 lokal). */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d;
}

/** Selisih hari kalender a − b. */
export function dayDiff(a: Date, b: Date): number {
  return Math.round(
    (new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() -
      new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()) /
      86400000,
  );
}

/**
 * Hari istirahat pilihan pengguna memakai penomoran Date.getDay() (0 = Minggu ... 6 = Sabtu),
 * sedangkan template program memakai offset dari hari Senin (0 = Senin ... 6 = Minggu).
 */
export const dayToMondayOffset = (hari: number): number => (hari + 6) % 7;

/** Minggu ke-berapa program pada tanggal `now` (1 = minggu mulai). */
export function currentPlanWeek(planStart: string, now: Date): number {
  return Math.floor(dayDiff(now, parseDateStr(planStart)) / 7) + 1;
}
