import { useState, useMemo, useCallback } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { id } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useEvents } from "./useEvents";
import { useExpenses } from "../expense/useExpenses";
import { useIncomes } from "../income/useIncomes";
import { useExercises } from "../exercise/useExercises";
import { useExerciseSchedule } from "../exercise/useExerciseSchedule";
import { useTrainingPlan } from "../exercise/useTrainingPlan";
import EventModal from "./EventModal";
import DaySummaryPanel from "./DaySummaryPanel";
import {
  EVENT_TIPE_COLOR,
  type CalendarEvent,
  type CalendarEventInput,
} from "../../types";

const locales = { id };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: id }),
  getDay,
  locales,
});

interface CalendarDisplayEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarEvent;
}

interface DayIndicator {
  expense: number;
  income: number;
  runningKm: number;
  otherExerciseCount: number;
}

function formatRupiahSingkat(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`;
  if (n >= 1_000) return `${Math.round(n / 1000)}rb`;
  return `${n}`;
}

function dateKey(d: Date) {
  return d.toDateString();
}

export default function CalendarPage() {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { exercises } = useExercises();
  const { getScheduleForDate } = useExerciseSchedule();
  const { getSessionForDate: getPlanSessionForDate } = useTrainingPlan();

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [slotRange, setSlotRange] = useState<{ start: Date; end: Date } | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  const displayEvents: CalendarDisplayEvent[] = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.judul,
        start: new Date(e.tanggal_mulai),
        end: e.tanggal_selesai
          ? new Date(e.tanggal_selesai)
          : new Date(e.tanggal_mulai),
        resource: e,
      })),
    [events],
  );

  // Gabungkan expense+income+exercise jadi 1 peta indikator per tanggal
  const indicatorByDate = useMemo(() => {
    const map: Record<string, DayIndicator> = {};
    const ensure = (key: string) => {
      if (!map[key])
        map[key] = {
          expense: 0,
          income: 0,
          runningKm: 0,
          otherExerciseCount: 0,
        };
      return map[key];
    };

    for (const e of expenses)
      ensure(dateKey(new Date(e.tanggal))).expense += e.nominal;
    for (const i of incomes)
      ensure(dateKey(new Date(i.tanggal))).income += i.nominal;
    for (const ex of exercises) {
      const entry = ensure(dateKey(new Date(ex.tanggal)));
      if (ex.tipe === "Running" && ex.jarak) entry.runningKm += ex.jarak;
      else if (ex.tipe !== "Running") entry.otherExerciseCount += 1;
    }

    return map;
  }, [expenses, incomes, exercises]);

  const handleSelectSlot = useCallback((slotInfo: { start: Date }) => {
    setSelectedDate(slotInfo.start);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarDisplayEvent) => {
    setEditingEvent(event.resource);
    setSlotRange(null);
    setIsEventModalOpen(true);
  }, []);

  const handleAddEventFromPanel = () => {
    if (!selectedDate) return;
    setEditingEvent(null);
    setSlotRange({ start: selectedDate, end: selectedDate });
    setIsEventModalOpen(true);
  };

  const handleEditEventFromPanel = (eventId: string) => {
    const found = events.find((e) => e.id === eventId);
    if (found) {
      setEditingEvent(found);
      setSlotRange(null);
      setIsEventModalOpen(true);
    }
  };

  const handleSubmit = async (input: CalendarEventInput) => {
    if (editingEvent) return updateEvent(editingEvent.id, input);
    return addEvent(input);
  };

  const handleDelete = async () => {
    if (editingEvent && confirm("Yakin hapus jadwal ini?")) {
      await deleteEvent(editingEvent.id);
      setIsEventModalOpen(false);
    }
  };

  const eventPropGetter = useCallback((event: CalendarDisplayEvent) => {
    return {
      style: {
        backgroundColor: EVENT_TIPE_COLOR[event.resource.tipe],
        borderRadius: "6px",
        border: "none",
      },
    };
  }, []);

  // Custom header kotak tanggal: nomor tanggal + preview singkat semua jenis aktivitas hari itu
  const CustomDateHeader = useCallback(
    ({ date: cellDate, label }: { date: Date; label: string }) => {
      const ind = indicatorByDate[dateKey(cellDate)];
      const planSession = getPlanSessionForDate(cellDate);
      const weeklyPlan = getScheduleForDate(cellDate);
      const plan = planSession ?? weeklyPlan;
      const isFromCoaching = !!planSession;
      const showPlan =
        plan &&
        plan.tipe !== "Rest" &&
        !ind?.runningKm &&
        !ind?.otherExerciseCount;

      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDate(cellDate);
          }}
          className="flex flex-col items-end px-1 pt-1 pb-1 gap-0.5 text-[10px] leading-tight cursor-pointer active:bg-gray-100 dark:active:bg-gray-700 rounded touch-manipulation"
        >
          <span className="text-xs">{label}</span>
          {ind?.income > 0 && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              +{formatRupiahSingkat(ind.income)}
            </span>
          )}
          {ind?.expense > 0 && (
            <span className="text-red-500 dark:text-red-400 font-medium">
              -{formatRupiahSingkat(ind.expense)}
            </span>
          )}
          {ind?.runningKm > 0 && (
            <span className="text-orange-500 dark:text-orange-400 font-medium">
              🏃{ind.runningKm}km
            </span>
          )}
          {ind?.otherExerciseCount > 0 && (
            <span className="text-orange-500 dark:text-orange-400 font-medium">
              💪{ind.otherExerciseCount}x
            </span>
          )}
          {showPlan && (
            <span className="text-gray-400 dark:text-gray-500 italic">
              {isFromCoaching ? "🎯 " : ""}rencana: {plan.tipe}
            </span>
          )}
        </div>
      );
    },
    [indicatorByDate, getScheduleForDate, getPlanSessionForDate],
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Calendar
        </h1>
        <button
          onClick={() => {
            setEditingEvent(null);
            setSlotRange({ start: new Date(), end: new Date() });
            setIsEventModalOpen(true);
          }}
          className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
        >
          + Tambah Jadwal
        </button>
      </div>

      <p className="text-xs text-gray-400 -mt-2">
        💡 Klik tanggal untuk ringkasan lengkap. Pengeluaran/pemasukan/olahraga
        sudah muncul preview di kotak tanggal.
      </p>

      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
        style={{ height: "680px" }}
      >
        <Calendar
          localizer={localizer}
          events={displayEvents}
          startAccessor="start"
          endAccessor="end"
          selectable
          longPressThreshold={1}
          views={["month"]}
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter}
          components={{ month: { dateHeader: CustomDateHeader } }}
          culture="id"
          messages={{
            next: "Selanjutnya",
            previous: "Sebelumnya",
            today: "Hari ini",
            month: "Bulan",
            week: "Minggu",
            day: "Hari",
            agenda: "Agenda",
            noEventsInRange: "Tidak ada jadwal di rentang ini.",
          }}
        />
      </div>

      {selectedDate && (
        <DaySummaryPanel
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onAddEvent={handleAddEventFromPanel}
          onEditEvent={handleEditEventFromPanel}
        />
      )}

      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onSubmit={handleSubmit}
          onDelete={editingEvent ? handleDelete : undefined}
          editingEvent={editingEvent}
          defaultStart={slotRange?.start}
          defaultEnd={slotRange?.end}
        />
      )}
    </div>
  );
}
