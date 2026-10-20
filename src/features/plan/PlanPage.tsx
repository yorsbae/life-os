import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, endOfMonth, format, startOfMonth, startOfWeek } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { Card, CheckCircle, EmptyState, Fab } from "../../components/ui/Controls";
import { toDateStr } from "../../utils/dates";
import { useTasks, formatRange, type Task } from "./useTasks";
import TaskForm from "./TaskForm";

type Range = "hari" | "minggu" | "bulan";

export default function PlanPage() {
  const navigate = useNavigate();
  const { tasks, toggleDone, addTask } = useTasks();
  const [range, setRange] = useState<Range>("hari");
  const [showForm, setShowForm] = useState(false);

  const { from, to, heading } = useMemo(() => {
    const now = new Date();
    if (range === "hari")
      return { from: toDateStr(now), to: toDateStr(now), heading: format(now, "EEEE, d MMM yyyy", { locale: idLocale }) };
    if (range === "minggu") {
      const s = startOfWeek(now, { weekStartsOn: 1 });
      return { from: toDateStr(s), to: toDateStr(addDays(s, 6)), heading: "Minggu ini" };
    }
    return { from: toDateStr(startOfMonth(now)), to: toDateStr(endOfMonth(now)), heading: format(now, "MMMM yyyy", { locale: idLocale }) };
  }, [range]);

  const visible = tasks.filter((t) => t.tanggal_mulai && t.tanggal_mulai >= from && t.tanggal_mulai <= to);

  // Kelompokkan per tanggal untuk tampilan Minggu/Bulan
  const groups = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of visible) m.set(t.tanggal_mulai!, [...(m.get(t.tanggal_mulai!) ?? []), t]);
    return [...m.entries()];
  }, [visible]);

  const row = (t: Task) => (
    <Card key={t.id} className="!py-3 flex items-center gap-3">
      <CheckCircle checked={t.status === "Selesai"} onClick={() => toggleDone(t)} />
      <button className="flex-1 min-w-0 text-left" onClick={() => navigate(`/plan/${t.id}`)}>
        <p className={`text-sm truncate ${t.status === "Selesai" ? "text-gray-500 line-through" : "text-gray-100"}`}>{t.judul}</p>
        <p className="text-[11px] text-gray-400">{formatRange(t)}</p>
      </button>
      {t.prioritas === "P1" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">P1</span>}
    </Card>
  );

  return (
    <div>
      <PageHeader title="Kegiatan" />
      <div className="px-4 space-y-4">
        <Segmented
          options={[
            { key: "hari", label: "Hari Ini" },
            { key: "minggu", label: "Minggu" },
            { key: "bulan", label: "Bulan" },
          ]}
          value={range}
          onChange={setRange}
        />
        <p className="text-sm font-medium text-gray-200 px-1 capitalize">{heading}</p>

        {visible.length === 0 ? (
          <EmptyState title="Belum ada kegiatan" hint="Tekan + untuk menambah." />
        ) : range === "hari" ? (
          <div className="space-y-2">{visible.map(row)}</div>
        ) : (
          groups.map(([date, list]) => (
            <div key={date} className="space-y-2">
              <p className="text-xs text-gray-400 px-1">{format(new Date(date), "EEE, d MMM", { locale: idLocale })}</p>
              {list.map(row)}
            </div>
          ))
        )}
      </div>
      <Fab onClick={() => setShowForm(true)} label="Tambah kegiatan" />
      {showForm && (
        <TaskForm
          onClose={() => setShowForm(false)}
          onSave={async (t) => {
            await addTask(t);
          }}
        />
      )}
    </div>
  );
}
