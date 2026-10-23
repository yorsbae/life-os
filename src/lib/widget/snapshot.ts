// Ringkasan agenda untuk widget Home Screen Android dan notifikasi agenda pagi.
// Fungsi murni (tanpa DB/DOM/Capacitor) supaya mudah dites. Hasilnya berupa JSON kecil yang
// ditulis aplikasi ke penyimpanan privat; widget native hanya membaca JSON itu.
//
// Privasi: bila `hideTitles` aktif, judul TIDAK ikut ditulis sama sekali (bukan sekadar disembunyikan
// di tampilan), sehingga tidak ada teks sensitif yang tersimpan di luar database aplikasi.

import { addDays, format } from "date-fns";

export const SNAPSHOT_VERSION = 1;
export const WIDGET_DAYS = 7;
export const MAX_ITEMS_PER_DAY = 6;

export interface WidgetEventIn {
  judul: string;
  tanggal_mulai: string;
}
export interface WidgetTaskIn {
  judul: string;
  prioritas: string;
  status: string;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  jam_mulai: string | null;
}
export interface WidgetHabitIn {
  id: string;
  target_harian: number;
}
export interface WidgetLogIn {
  habit_id: string;
  nilai: number;
}

/** Teks yang dilokalkan oleh aplikasi; `{0}` diganti angka oleh widget. */
export interface WidgetLabels {
  agenda: string;
  empty: string;
  more: string;
  habit: string;
  overdue: string;
  event: string;
  task: string;
  setup: string;
}

export interface WidgetItem {
  /** "e" = jadwal, "t" = tugas. */
  k: "e" | "t";
  /** "HH:mm" atau "" bila tanpa jam. */
  time: string;
  /** Kosong bila judul disembunyikan. */
  title: string;
}

export interface WidgetDay {
  date: string; // yyyy-MM-dd (lokal)
  items: WidgetItem[];
  /** Jumlah total sebelum dipotong MAX_ITEMS_PER_DAY. */
  counts: { e: number; t: number };
  more: number;
}

export interface WidgetSnapshot {
  v: typeof SNAPSHOT_VERSION;
  generatedAt: number;
  /** Tanggal pembuatan (yyyy-MM-dd); habit dan tugas terlambat hanya berlaku pada hari ini. */
  date: string;
  hide: boolean;
  labels: WidgetLabels;
  days: WidgetDay[];
  habits: { done: number; total: number } | null;
  overdue: number;
}

export interface BuildInput {
  now: Date;
  events: WidgetEventIn[];
  tasks: WidgetTaskIn[];
  habits: WidgetHabitIn[];
  todayLogs: WidgetLogIn[];
  hideTitles: boolean;
  labels: WidgetLabels;
}

const ds = (d: Date) => format(d, "yyyy-MM-dd");
const PRIORITY_RANK: Record<string, number> = { P1: 1, P2: 2, P3: 3 };

interface Row extends WidgetItem {
  rank: number;
}

function compare(a: Row, b: Row): number {
  // Yang punya jam lebih dulu (urut jam), lalu yang tanpa jam menurut prioritas.
  if (a.time && b.time) return a.time.localeCompare(b.time) || a.rank - b.rank;
  if (a.time) return -1;
  if (b.time) return 1;
  return a.rank - b.rank || a.title.localeCompare(b.title);
}

export function buildWidgetSnapshot(input: BuildInput): WidgetSnapshot {
  const { now, hideTitles } = input;
  const today = ds(now);
  const dates = Array.from({ length: WIDGET_DAYS }, (_, n) => ds(addDays(now, n)));
  const buckets = new Map<string, Row[]>(dates.map((d) => [d, []]));

  for (const e of input.events) {
    const start = new Date(e.tanggal_mulai);
    if (Number.isNaN(start.getTime())) continue;
    buckets.get(ds(start))?.push({ k: "e", time: format(start, "HH:mm"), title: e.judul, rank: 0 });
  }

  let overdue = 0;
  for (const t of input.tasks) {
    if (t.status === "Selesai") continue;
    const due = (t.tanggal_selesai ?? t.tanggal_mulai)?.slice(0, 10);
    if (!due) continue;
    if (due < today) {
      overdue++;
      continue;
    }
    buckets.get(due)?.push({
      k: "t",
      time: t.jam_mulai ? t.jam_mulai.slice(0, 5) : "",
      title: t.judul,
      rank: PRIORITY_RANK[t.prioritas] ?? 2,
    });
  }

  const days: WidgetDay[] = dates.map((date) => {
    const rows = (buckets.get(date) ?? []).sort(compare);
    const shown = rows.slice(0, MAX_ITEMS_PER_DAY);
    return {
      date,
      items: shown.map((r) => ({ k: r.k, time: r.time, title: hideTitles ? "" : r.title })),
      counts: { e: rows.filter((r) => r.k === "e").length, t: rows.filter((r) => r.k === "t").length },
      more: rows.length - shown.length,
    };
  });

  const valueOf = (id: string) => input.todayLogs.find((l) => l.habit_id === id)?.nilai ?? 0;
  const habits =
    input.habits.length === 0
      ? null
      : { total: input.habits.length, done: input.habits.filter((h) => valueOf(h.id) >= h.target_harian).length };

  return {
    v: SNAPSHOT_VERSION,
    generatedAt: now.getTime(),
    date: today,
    hide: hideTitles,
    labels: input.labels,
    days,
    habits,
    overdue,
  };
}

/** Tanda tangan untuk mendeteksi "tidak ada yang berubah" (mengabaikan waktu pembuatan). */
export function snapshotSignature(s: WidgetSnapshot): string {
  return JSON.stringify({ ...s, generatedAt: 0 });
}
