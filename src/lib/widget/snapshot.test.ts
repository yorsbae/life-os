import { describe, it, expect } from "vitest";
import {
  buildWidgetSnapshot,
  MAX_ITEMS_PER_DAY,
  snapshotSignature,
  WIDGET_DAYS,
  type BuildInput,
  type WidgetLabels,
} from "./snapshot";
import { DEFAULT_MORNING_TIME, normalizeMorningTime, planMorning, type MorningLabels } from "./morning";

const labels: WidgetLabels = {
  agenda: "Agenda", empty: "Kosong", more: "+{0} lagi", habit: "Habit {0}/{1}",
  overdue: "{0} terlambat", event: "Jadwal", task: "Tugas", setup: "Buka app",
};
// Jumat 23 Okt 2026, 06:00 waktu lokal
const NOW = new Date(2026, 9, 23, 6, 0, 0);

const base = (over: Partial<BuildInput> = {}): BuildInput => ({
  now: NOW, events: [], tasks: [], habits: [], todayLogs: [], hideTitles: false, labels, ...over,
});
const task = (o: Partial<BuildInput["tasks"][number]> = {}) => ({
  judul: "T", prioritas: "P2", status: "Todo", tanggal_mulai: null, tanggal_selesai: "2026-10-23", jam_mulai: null, ...o,
});

describe("buildWidgetSnapshot", () => {
  it("selalu 7 hari berurutan mulai hari ini, hari kosong tetap ada", () => {
    const s = buildWidgetSnapshot(base());
    expect(s.days).toHaveLength(WIDGET_DAYS);
    expect(s.days[0].date).toBe("2026-10-23");
    expect(s.days[6].date).toBe("2026-10-29");
    expect(s.days.every((d) => d.items.length === 0 && d.more === 0)).toBe(true);
  });

  it("jadwal diurutkan menurut jam; tugas berjam ikut diurutkan, tugas tanpa jam di akhir menurut prioritas", () => {
    const s = buildWidgetSnapshot(base({
      events: [
        { judul: "Siang", tanggal_mulai: new Date(2026, 9, 23, 13, 0).toISOString() },
        { judul: "Pagi", tanggal_mulai: new Date(2026, 9, 23, 9, 30).toISOString() },
      ],
      tasks: [
        task({ judul: "Santai", prioritas: "P3" }),
        task({ judul: "Penting", prioritas: "P1" }),
        task({ judul: "Jam 11", jam_mulai: "11:00:00" }),
      ],
    }));
    expect(s.days[0].items.map((i) => i.title)).toEqual(["Pagi", "Jam 11", "Siang", "Penting", "Santai"]);
    expect(s.days[0].items[1].time).toBe("11:00");
  });

  it("tugas selesai tidak tampil; tugas lewat tenggat dihitung sebagai terlambat, bukan item", () => {
    const s = buildWidgetSnapshot(base({
      tasks: [task({ status: "Selesai" }), task({ tanggal_selesai: "2026-10-20" }), task({ tanggal_selesai: "2026-10-22" })],
    }));
    expect(s.days[0].items).toHaveLength(0);
    expect(s.overdue).toBe(2);
  });

  it("tugas tanpa tanggal diabaikan; tanpa tenggat memakai tanggal mulai", () => {
    const s = buildWidgetSnapshot(base({
      tasks: [task({ judul: "Tanpa tgl", tanggal_selesai: null, tanggal_mulai: null }), task({ judul: "Mulai", tanggal_selesai: null, tanggal_mulai: "2026-10-24" })],
    }));
    expect(s.days[1].items.map((i) => i.title)).toEqual(["Mulai"]);
    expect(s.days[0].items).toHaveLength(0);
  });

  it("event di luar 7 hari atau dengan tanggal rusak diabaikan", () => {
    const s = buildWidgetSnapshot(base({
      events: [
        { judul: "Jauh", tanggal_mulai: new Date(2026, 10, 30, 9).toISOString() },
        { judul: "Rusak", tanggal_mulai: "bukan-tanggal" },
      ],
    }));
    expect(s.days.flatMap((d) => d.items)).toHaveLength(0);
  });

  it("dipotong di MAX_ITEMS_PER_DAY, sisanya masuk `more`, counts tetap total", () => {
    const events = Array.from({ length: 9 }, (_, i) => ({ judul: `E${i}`, tanggal_mulai: new Date(2026, 9, 23, 8 + (i % 10), i).toISOString() }));
    const s = buildWidgetSnapshot(base({ events }));
    expect(s.days[0].items).toHaveLength(MAX_ITEMS_PER_DAY);
    expect(s.days[0].more).toBe(9 - MAX_ITEMS_PER_DAY);
    expect(s.days[0].counts.e).toBe(9);
  });

  it("hideTitles: judul tidak ikut ditulis sama sekali (tidak ada di JSON)", () => {
    const s = buildWidgetSnapshot(base({
      hideTitles: true,
      events: [{ judul: "Operasi RAHASIA", tanggal_mulai: new Date(2026, 9, 23, 9).toISOString() }],
      tasks: [task({ judul: "Gugat RAHASIA" })],
    }));
    expect(JSON.stringify(s)).not.toContain("RAHASIA");
    expect(s.days[0].items.every((i) => i.title === "")).toBe(true);
    expect(s.days[0].items[0].time).toBe("09:00");
    expect(s.hide).toBe(true);
  });

  it("habit: hitung selesai bila nilai >= target; null bila tidak ada habit", () => {
    expect(buildWidgetSnapshot(base()).habits).toBeNull();
    const s = buildWidgetSnapshot(base({
      habits: [{ id: "a", target_harian: 8 }, { id: "b", target_harian: 1 }, { id: "c", target_harian: 3 }],
      todayLogs: [{ habit_id: "a", nilai: 8 }, { habit_id: "b", nilai: 0 }, { habit_id: "c", nilai: 5 }],
    }));
    expect(s.habits).toEqual({ done: 2, total: 3 });
  });

  it("signature mengabaikan generatedAt tetapi peka terhadap isi", () => {
    const a = buildWidgetSnapshot(base());
    const b = buildWidgetSnapshot(base({ now: new Date(2026, 9, 23, 6, 5) }));
    expect(snapshotSignature(a)).toBe(snapshotSignature(b));
    const c = buildWidgetSnapshot(base({ tasks: [task()] }));
    expect(snapshotSignature(a)).not.toBe(snapshotSignature(c));
  });
});

describe("planMorning", () => {
  const L: MorningLabels = {
    title: "Agenda hari ini",
    summary: (e, t) => `${e} jadwal, ${t} tugas`,
    more: (n) => `+${n} lagi`,
  };
  const snap = (over: Partial<BuildInput> = {}) => buildWidgetSnapshot(base({
    events: [
      { judul: "Rapat", tanggal_mulai: new Date(2026, 9, 23, 9).toISOString() },
      { judul: "Gym", tanggal_mulai: new Date(2026, 9, 24, 18).toISOString() },
    ],
    tasks: [task({ judul: "Laporan" })],
    ...over,
  }));

  it("satu notifikasi per hari beragenda, jam sesuai pengaturan, ID 10..16", () => {
    const notes = planMorning(snap(), "07:30", NOW, L);
    expect(notes.map((n) => n.id)).toEqual([10, 11]);
    expect(notes[0].at).toEqual(new Date(2026, 9, 23, 7, 30));
    expect(notes[0].body).toBe("09:00 Rapat · ☐ Laporan");
  });

  it("melewati hari yang jamnya sudah lewat", () => {
    const late = new Date(2026, 9, 23, 8, 0);
    expect(planMorning(snap(), "07:00", late, L).map((n) => n.id)).toEqual([11]);
  });

  it("judul disembunyikan -> hanya ringkasan angka", () => {
    const notes = planMorning(snap({ hideTitles: true }), "07:00", NOW, L);
    expect(notes[0].body).toBe("1 jadwal, 1 tugas");
    expect(JSON.stringify(notes)).not.toContain("Rapat");
  });

  it("lebih dari 3 item -> 3 pertama + sisa", () => {
    const events = Array.from({ length: 5 }, (_, i) => ({ judul: `E${i}`, tanggal_mulai: new Date(2026, 9, 24, 9 + i).toISOString() }));
    const notes = planMorning(snap({ events, tasks: [] }), "07:00", NOW, L);
    expect(notes[0].body).toBe("09:00 E0 · 10:00 E1 · 11:00 E2 +2 lagi");
  });

  it("jam tidak valid kembali ke default", () => {
    expect(normalizeMorningTime("25:99")).toBe(DEFAULT_MORNING_TIME);
    expect(normalizeMorningTime(null)).toBe(DEFAULT_MORNING_TIME);
    expect(normalizeMorningTime("06:15")).toBe("06:15");
  });
});
