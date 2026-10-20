import { useMemo } from "react";
import { useExpenses } from "../expense/useExpenses";
import { useIncomes } from "../income/useIncomes";
import { useExercises } from "../exercise/useExercises";
import { useLearnings } from "../learning/useLearnings";
import { useJournals } from "../journal/useJournals";
import { useNotes } from "../notes/useNotes";
import { useTrainingPlan } from "../exercise/useTrainingPlan";
import { useExerciseSchedule } from "../exercise/useExerciseSchedule";
import { useEvents } from "./useEvents";
import { EVENT_TIPE_LABEL, EVENT_TIPE_COLOR } from "../../types";

interface DaySummaryPanelProps {
  date: Date;
  onClose: () => void;
  onAddEvent: () => void;
  onEditEvent: (eventId: string) => void;
}

interface FeedItem {
  id: string;
  jam: string | null;
  label: string;
  detail: string;
  color: string;
  onClick?: () => void;
}

function isSameDay(dateStr: string, target: Date) {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  );
}

function formatJam(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DaySummaryPanel({
  date,
  onClose,
  onAddEvent,
  onEditEvent,
}: DaySummaryPanelProps) {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { exercises } = useExercises();
  const { learnings } = useLearnings();
  const { journals } = useJournals();
  const { notes } = useNotes();
  const { getSessionForDate: getPlanSessionForDate } = useTrainingPlan();
  const { getScheduleForDate } = useExerciseSchedule();
  const { events } = useEvents();

  const feed: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [];

    events
      .filter((e) => isSameDay(e.tanggal_mulai, date))
      .forEach((e) => {
        items.push({
          id: `event-${e.id}`,
          jam: formatJam(e.tanggal_mulai),
          label: EVENT_TIPE_LABEL[e.tipe],
          detail: e.judul,
          color: EVENT_TIPE_COLOR[e.tipe],
          onClick: () => onEditEvent(e.id),
        });
      });

    expenses
      .filter((e) => isSameDay(e.tanggal, date))
      .forEach((e) => {
        items.push({
          id: `exp-${e.id}`,
          jam: null,
          label: "Pengeluaran",
          detail: `${e.kategori} - Rp${e.nominal.toLocaleString("id-ID")}`,
          color: "#ef4444",
        });
      });

    incomes
      .filter((i) => isSameDay(i.tanggal, date))
      .forEach((i) => {
        items.push({
          id: `inc-${i.id}`,
          jam: null,
          label: "Pemasukan",
          detail: `${i.sumber} - Rp${i.nominal.toLocaleString("id-ID")}`,
          color: "#22c55e",
        });
      });

    exercises
      .filter((ex) => isSameDay(ex.tanggal, date))
      .forEach((ex) => {
        items.push({
          id: `ex-${ex.id}`,
          jam: null,
          label: "Latihan",
          detail: `${ex.tipe} - ${ex.sub_kategori}`,
          color: "#f97316",
        });
      });

    learnings
      .filter((l) => isSameDay(l.tanggal, date))
      .forEach((l) => {
        items.push({
          id: `learn-${l.id}`,
          jam: null,
          label: "Belajar",
          detail: l.topik,
          color: "#3b82f6",
        });
      });

    journals
      .filter((j) => isSameDay(j.tanggal, date))
      .forEach((j) => {
        items.push({
          id: `journal-${j.id}`,
          jam: null,
          label: "Journal",
          detail: j.mood ? `Mood: ${j.mood}` : "Entry journal",
          color: "#a855f7",
        });
      });

    notes
      .filter((n) => isSameDay(n.created_at, date))
      .forEach((n) => {
        items.push({
          id: `note-${n.id}`,
          jam: null,
          label: "Note",
          detail: n.judul,
          color: "#eab308",
        });
      });

    // Rencana latihan hari itu - Coaching plan diprioritaskan di atas jadwal mingguan biasa,
    // sama seperti prioritas yang dipakai widget Dashboard & indikator kotak tanggal
    const planSession = getPlanSessionForDate(date);
    const weeklyPlan = getScheduleForDate(date);
    const plan = planSession ?? weeklyPlan;
    if (plan) {
      const isRest = plan.tipe === "Rest";
      const sudahDicatat =
        !isRest &&
        exercises.some(
          (e) => isSameDay(e.tanggal, date) && e.tipe === plan.tipe,
        );
      items.push({
        id: "rencana-latihan",
        jam: null,
        label: planSession ? "Rencana (Coaching)" : "Rencana Latihan",
        detail: isRest
          ? "😴 Rest Day"
          : `${sudahDicatat ? "✅ " : ""}${plan.tipe} - ${plan.sub_kategori}`,
        color: "#f97316",
      });
    }

    // Item berjam (event) di atas, sisanya di bawah urut label
    return items.sort((a, b) => {
      if (a.jam && b.jam) return a.jam.localeCompare(b.jam);
      if (a.jam) return -1;
      if (b.jam) return 1;
      return 0;
    });
  }, [
    date,
    events,
    expenses,
    incomes,
    exercises,
    learnings,
    journals,
    notes,
    onEditEvent,
    getPlanSessionForDate,
    getScheduleForDate,
  ]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex justify-end z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-sm h-full overflow-y-auto p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {date.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
            <p className="text-xs text-gray-400">
              {feed.length} aktivitas tercatat
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <button
          onClick={onAddEvent}
          className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2 rounded-lg text-sm font-medium"
        >
          + Tambah Jadwal di Hari Ini
        </button>

        {feed.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">
            Tidak ada aktivitas tercatat di hari ini.
          </p>
        ) : (
          <div className="space-y-2">
            {feed.map((item) => (
              <div
                key={item.id}
                onClick={item.onClick}
                className={`flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700 ${
                  item.onClick
                    ? "cursor-pointer hover:border-gray-300 dark:hover:border-gray-500"
                    : ""
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">
                    {item.detail}
                  </p>
                  <p className="text-xs text-gray-400">{item.label}</p>
                </div>
                {item.jam && (
                  <span className="text-xs text-gray-400 shrink-0">
                    {item.jam}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
