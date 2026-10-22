import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, addMonths, endOfMonth, endOfWeek, startOfMonth, startOfWeek, isSameMonth } from "date-fns";
import { Bell, Briefcase, ChevronLeft, ChevronRight, Dumbbell, GraduationCap, ListChecks, User, type LucideIcon } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { Card, EmptyState, Fab } from "../../components/ui/Controls";
import { useEvents } from "./useEvents";
import { useTasks } from "../plan/useTasks";
import { useExpenses } from "../expense/useExpenses";
import { useIncomes } from "../income/useIncomes";
import { useExercises } from "../exercise/useExercises";
import EventModal from "./EventModal";
import { EVENT_TIPE_COLOR, EVENT_TIPE_LABEL, type CalendarEvent, type CalendarEventInput, type EventTipe } from "../../types";
import { toDateStr } from "../../utils/dates";
import { fmtDate, rupiah } from "../../utils/format";
import { t, tx } from "../../lib/i18n";

type View = "bulan" | "minggu" | "hari";

const TIPE_ICON: Record<EventTipe, LucideIcon> = {
  latihan: Dumbbell,
  belajar: GraduationCap,
  kerja: Briefcase,
  pengingat: Bell,
  pribadi: User,
};
const TASK_COLOR = "#7dc7a0";

interface DayItem {
  key: string;
  title: string;
  sort: string;
  range: string;
  color: string;
  icon: LucideIcon;
  done?: boolean;
  event?: CalendarEvent;
  taskId?: string;
}

const hm = (iso: string) => fmtDate(new Date(iso), "HH:mm");
const dayOf = (iso: string) => toDateStr(new Date(iso));

export default function CalendarPage() {
  const navigate = useNavigate();
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const { tasks } = useTasks();
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { exercises } = useExercises();

  const [view, setView] = useState<View>("bulan");
  const [selected, setSelected] = useState(() => toDateStr());
  const [modal, setModal] = useState<{ event: CalendarEvent | null } | null>(null);
  const today = toDateStr();
  const selDate = new Date(selected + "T00:00:00");

  // Semua item per tanggal: event + tugas
  const byDay = useMemo(() => {
    const map = new Map<string, DayItem[]>();
    const push = (d: string, it: DayItem) => map.set(d, [...(map.get(d) ?? []), it]);
    for (const e of events) {
      push(dayOf(e.tanggal_mulai), {
        key: "e" + e.id,
        title: e.judul,
        sort: hm(e.tanggal_mulai),
        range: e.tanggal_selesai ? `${hm(e.tanggal_mulai)} - ${hm(e.tanggal_selesai)}` : hm(e.tanggal_mulai),
        color: EVENT_TIPE_COLOR[e.tipe],
        icon: TIPE_ICON[e.tipe] ?? User,
        event: e,
      });
    }
    for (const x of tasks) {
      if (!x.tanggal_mulai) continue;
      push(x.tanggal_mulai, {
        key: "t" + x.id,
        title: x.judul,
        sort: x.jam_mulai ?? "99:99",
        range: x.jam_mulai ? (x.jam_selesai ? `${x.jam_mulai} - ${x.jam_selesai}` : x.jam_mulai) : t("Sepanjang hari"),
        color: TASK_COLOR,
        icon: ListChecks,
        done: x.status === "Selesai",
        taskId: x.id,
      });
    }
    for (const list of map.values()) list.sort((a, b) => a.sort.localeCompare(b.sort));
    return map;
  }, [events, tasks]);

  const dayItems = byDay.get(selected) ?? [];
  const spent = expenses.filter((e) => e.tanggal === selected).reduce((s, e) => s + e.nominal, 0);
  const earned = incomes.filter((i) => i.tanggal === selected).reduce((s, i) => s + i.nominal, 0);
  const workouts = exercises.filter((e) => e.tanggal === selected).length;

  // Navigasi panah mengikuti tampilan
  const shift = (dir: number) => {
    const base = selDate;
    const next = view === "bulan" ? addMonths(base, dir) : addDays(base, dir * (view === "minggu" ? 7 : 1));
    setSelected(toDateStr(next));
  };
  const heading = view === "bulan" ? fmtDate(selDate, "MMMM yyyy") : view === "minggu" ? `${fmtDate(startOfWeek(selDate, { weekStartsOn: 1 }), "d MMM")} – ${fmtDate(endOfWeek(selDate, { weekStartsOn: 1 }), "d MMM yyyy")}` : fmtDate(selDate, "EEEE, d MMM yyyy");

  const gridStart = startOfWeek(view === "bulan" ? startOfMonth(selDate) : selDate, { weekStartsOn: 1 });
  const gridEnd = view === "bulan" ? endOfWeek(endOfMonth(selDate), { weekStartsOn: 1 }) : endOfWeek(selDate, { weekStartsOn: 1 });
  const cells: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) cells.push(d);
  const weekdayHeads = cells.slice(0, 7);

  const listTitle = selected === today ? t("Hari Ini, {0}", [fmtDate(selDate, "d MMM yyyy")]) : fmtDate(selDate, "EEEE, d MMM yyyy");

  const handleSubmit = async (input: CalendarEventInput) => (modal?.event ? updateEvent(modal.event.id, input) : addEvent(input));

  return (
    <div className="pb-28">
      <PageHeader title={t("Kalender")} />
      <div className="px-4 space-y-4">
        <Segmented
          options={[
            { key: "bulan", label: t("Bulan") },
            { key: "minggu", label: t("Pekan") },
            { key: "hari", label: t("Hari") },
          ]}
          value={view}
          onChange={setView}
        />

        <div className="flex items-center gap-2">
          <button aria-label={t("Sebelumnya")} onClick={() => shift(-1)} className="p-1.5 text-gray-300">
            <ChevronLeft size={18} />
          </button>
          <p className="flex-1 text-center text-sm font-semibold text-gray-100 truncate">{tx(heading)}</p>
          <button aria-label={t("Berikutnya")} onClick={() => shift(1)} className="p-1.5 text-gray-300">
            <ChevronRight size={18} />
          </button>
        </div>

        {view !== "hari" && (
          <Card className="!p-3">
            <div className="grid grid-cols-7 mb-1">
              {weekdayHeads.map((d) => (
                <span key={d.toISOString()} className="text-center text-[10px] text-gray-400 py-1">
                  {fmtDate(d, "EEE")}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((d) => {
                const key = toDateStr(d);
                const active = key === selected;
                const items = byDay.get(key) ?? [];
                const muted = view === "bulan" && !isSameMonth(d, selDate);
                return (
                  <button key={key} onClick={() => setSelected(key)} aria-pressed={active} className="flex flex-col items-center gap-0.5 py-0.5">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] ${
                        active ? "bg-primary text-on-primary font-semibold" : key === today ? "ring-1 ring-primary text-primary" : muted ? "text-gray-600" : "text-gray-200"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    <span className="flex gap-0.5 h-1.5">
                      {items.slice(0, 3).map((it) => (
                        <span key={it.key} className="w-1 h-1 rounded-full" style={{ background: it.color }} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-100 px-1 capitalize">{tx(listTitle)}</p>
          {(spent > 0 || earned > 0 || workouts > 0) && (
            <div className="flex gap-2 flex-wrap px-1">
              {spent > 0 && <span className="text-[11px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-300">{t("Pengeluaran")} {rupiah(spent)}</span>}
              {earned > 0 && <span className="text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary">{t("Pemasukan")} {rupiah(earned)}</span>}
              {workouts > 0 && <span className="text-[11px] px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-300">{t("Olahraga")} ×{tx(workouts)}</span>}
            </div>
          )}
          {dayItems.length === 0 ? (
            <EmptyState title={t("Tidak ada jadwal")} hint={t("Tekan + untuk menambah jadwal.")} />
          ) : (
            dayItems.map((it) => {
              const Icon = it.icon;
              return (
                <Card
                  key={it.key}
                  onClick={() => (it.taskId ? navigate(`/plan/${it.taskId}`) : setModal({ event: it.event! }))}
                  className="!py-3 flex items-center gap-3"
                >
                  <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: it.color + "26", color: it.color }}>
                    <Icon size={18} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-sm truncate ${it.done ? "text-gray-500 line-through" : "text-gray-100"}`}>{tx(it.title)}</span>
                    <span className="block text-[11px] text-gray-400 truncate">
                      {tx(it.range)}
                      {it.event ? ` · ${tx(EVENT_TIPE_LABEL[it.event.tipe])}` : ` · ${t("Tugas")}`}
                    </span>
                  </span>
                  <ChevronRight size={16} className="text-gray-500 shrink-0" />
                </Card>
              );
            })
          )}
        </div>
      </div>

      <Fab onClick={() => setModal({ event: null })} label={t("Tambah jadwal")} />
      {modal && (
        <EventModal
          key={modal.event?.id ?? "new"}
          editingEvent={modal.event}
          defaultDate={selected}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          onDelete={
            modal.event
              ? async () => {
                  await deleteEvent(modal.event!.id);
                  setModal(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
