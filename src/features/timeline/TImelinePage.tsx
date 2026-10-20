import { useMemo, useState } from "react";
import { useExpenses } from "../expense/useExpenses";
import { useIncomes } from "../income/useIncomes";
import { useActivities } from "../activity/useActivities";
import { useExercises } from "../exercise/useExercises";
import { useLearnings } from "../learning/useLearnings";
import { useEvents } from "../calendar/useEvents";
import { EVENT_TIPE_LABEL } from "../../types";

type FeedType =
  | "expense"
  | "income"
  | "activity"
  | "exercise"
  | "learning"
  | "event";

interface FeedItem {
  id: string;
  tanggal: string; // dipakai untuk sorting & grouping (ISO date atau datetime)
  type: FeedType;
  label: string;
  detail: string;
  color: string;
}

const FILTER_OPTIONS: { type: FeedType; label: string; color: string }[] = [
  { type: "expense", label: "Pengeluaran", color: "bg-red-500" },
  { type: "income", label: "Pemasukan", color: "bg-green-500" },
  { type: "activity", label: "Aktivitas", color: "bg-blue-500" },
  { type: "exercise", label: "Latihan", color: "bg-orange-500" },
  { type: "learning", label: "Belajar", color: "bg-purple-500" },
  { type: "event", label: "Jadwal", color: "bg-pink-500" },
];

function formatTanggalGroup(tanggal: string) {
  const d = new Date(tanggal);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(d, today)) return "Hari ini";
  if (isSameDay(d, yesterday)) return "Kemarin";
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatJam(tanggal: string) {
  return new Date(tanggal).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TimelinePage() {
  const { expenses, loading: le } = useExpenses();
  const { incomes, loading: li } = useIncomes();
  const { activities, loading: la } = useActivities();
  const { exercises, loading: lx } = useExercises();
  const { learnings, loading: ll } = useLearnings();
  const { events, loading: lc } = useEvents();

  const loading = le || li || la || lx || ll || lc;

  // Filter aktif - default semua tipe ditampilkan
  const [activeFilters, setActiveFilters] = useState<Set<FeedType>>(
    new Set(FILTER_OPTIONS.map((f) => f.type)),
  );

  const toggleFilter = (type: FeedType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // Gabungkan semua sumber data jadi satu list FeedItem yang seragam
  const allFeed: FeedItem[] = useMemo(() => {
    return [
      ...expenses.map((e) => ({
        id: `expense-${e.id}`,
        tanggal: e.tanggal,
        type: "expense" as const,
        label: "Pengeluaran",
        detail: `${e.kategori} - Rp${e.nominal.toLocaleString("id-ID")}${e.catatan ? ` (${e.catatan})` : ""}`,
        color: "bg-red-500",
      })),
      ...incomes.map((i) => ({
        id: `income-${i.id}`,
        tanggal: i.tanggal,
        type: "income" as const,
        label: "Pemasukan",
        detail: `${i.sumber} - Rp${i.nominal.toLocaleString("id-ID")}`,
        color: "bg-green-500",
      })),
      ...activities.map((a) => ({
        id: `activity-${a.id}`,
        tanggal: a.tanggal,
        type: "activity" as const,
        label: "Aktivitas",
        detail: `${a.judul}${a.durasi ? ` (${a.durasi} menit)` : ""}`,
        color: "bg-blue-500",
      })),
      ...exercises.map((ex) => ({
        id: `exercise-${ex.id}`,
        tanggal: ex.tanggal,
        type: "exercise" as const,
        label: "Latihan",
        detail: `${ex.sub_kategori}${ex.jarak ? ` - ${ex.jarak}km` : ""}${ex.durasi ? ` (${ex.durasi} menit)` : ""}`,
        color: "bg-orange-500",
      })),
      ...learnings.map((l) => ({
        id: `learning-${l.id}`,
        tanggal: l.tanggal,
        type: "learning" as const,
        label: "Belajar",
        detail: l.topik,
        color: "bg-purple-500",
      })),
      ...events.map((ev) => ({
        id: `event-${ev.id}`,
        tanggal: ev.tanggal_mulai,
        type: "event" as const,
        label: EVENT_TIPE_LABEL[ev.tipe],
        detail: `${ev.judul} (${formatJam(ev.tanggal_mulai)})`,
        color: "bg-pink-500",
      })),
    ].sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
    );
  }, [expenses, incomes, activities, exercises, learnings, events]);

  // Terapkan filter yang aktif
  const filteredFeed = allFeed.filter((item) => activeFilters.has(item.type));

  // Kelompokkan berdasarkan tanggal (misal "Hari ini", "Kemarin", "12 Juli 2026")
  const grouped = useMemo(() => {
    const groups: Record<string, FeedItem[]> = {};
    for (const item of filteredFeed) {
      const key = formatTanggalGroup(item.tanggal);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [filteredFeed]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Timeline</h1>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.type}
            onClick={() => toggleFilter(f.type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              activeFilters.has(f.type)
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-500 border-gray-200"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${f.color}`} />
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Memuat data...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          Tidak ada data untuk filter ini.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                {dateLabel}
              </p>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-200"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${item.color}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {item.detail}
                      </p>
                      <p className="text-xs text-gray-400">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
