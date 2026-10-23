// Perencana notifikasi "agenda pagi". Murni: menerima snapshot, mengembalikan daftar notifikasi
// yang perlu dijadwalkan (7 hari ke depan, satu per hari yang punya agenda).

import { parseDateStr } from "../../utils/dates";
import type { WidgetSnapshot } from "./snapshot";

/** ID notifikasi agenda pagi: 10..16. ID pengingat jadwal selalu >= 1000 (lihat utils/reminders). */
export const MORNING_ID_BASE = 10;
export const MORNING_ID_COUNT = 7;
export const DEFAULT_MORNING_TIME = "07:00";

export interface MorningLabels {
  title: string;
  /** Ringkasan bila judul disembunyikan, mis. "2 jadwal, 3 tugas hari ini". */
  summary: (events: number, tasks: number) => string;
  /** Penanda sisa, mis. "+2 lagi". */
  more: (n: number) => string;
}

export interface MorningNote {
  id: number;
  at: Date;
  title: string;
  body: string;
}

export function normalizeMorningTime(v: string | null | undefined): string {
  return v && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : DEFAULT_MORNING_TIME;
}

export function planMorning(
  s: WidgetSnapshot,
  time: string,
  now: Date,
  L: MorningLabels,
): MorningNote[] {
  const [hh, mm] = normalizeMorningTime(time).split(":").map(Number);
  const notes: MorningNote[] = [];

  s.days.slice(0, MORNING_ID_COUNT).forEach((day, i) => {
    const total = day.counts.e + day.counts.t;
    if (total === 0) return; // jangan mengganggu di hari tanpa agenda
    const base = parseDateStr(day.date);
    const at = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm, 0, 0);
    if (at.getTime() <= now.getTime()) return;

    let body: string;
    if (s.hide) {
      body = L.summary(day.counts.e, day.counts.t);
    } else {
      const parts = day.items
        .slice(0, 3)
        .map((it) => `${it.time ? `${it.time} ` : it.k === "t" ? "☐ " : ""}${it.title}`);
      body = parts.join(" · ") + (total > 3 ? ` ${L.more(total - 3)}` : "");
    }
    notes.push({ id: MORNING_ID_BASE + i, at, title: L.title, body });
  });

  return notes;
}
