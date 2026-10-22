import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, addMonths, endOfMonth, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { Card, CheckCircle, EmptyState, Fab } from "../../components/ui/Controls";
import { toDateStr } from "../../utils/dates";
import { fmtDate } from "../../utils/format";
import { t, tx } from "../../lib/i18n";
import { useTasks, formatRange, type Task } from "./useTasks";
import TaskForm from "./TaskForm";

type Range = "hari" | "minggu" | "bulan";

export default function PlanPage() {
  const navigate = useNavigate();
  const { tasks, toggleDone, addTask } = useTasks();
  const [range, setRange] = useState<Range>("hari");
  const [offset, setOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const changeRange = (r: Range) => {
    setRange(r);
    setOffset(0);
  };

  const { from, to, heading } = useMemo(() => {
    const now = new Date();
    if (range === "hari") {
      const d = addDays(now, offset);
      return { from: toDateStr(d), to: toDateStr(d), heading: fmtDate(d, "EEEE, d MMM yyyy") };
    }
    if (range === "minggu") {
      const s = addDays(startOfWeek(now, { weekStartsOn: 1 }), offset * 7);
      const e = addDays(s, 6);
      return { from: toDateStr(s), to: toDateStr(e), heading: `${fmtDate(s, "d MMM")} – ${fmtDate(e, "d MMM yyyy")}` };
    }
    const m = addMonths(now, offset);
    return { from: toDateStr(startOfMonth(m)), to: toDateStr(endOfMonth(m)), heading: fmtDate(m, "MMMM yyyy") };
  }, [range, offset]);

  const visible = tasks.filter((x) => x.tanggal_mulai && x.tanggal_mulai >= from && x.tanggal_mulai <= to);
  const doneCount = visible.filter((x) => x.status === "Selesai").length;

  const groups = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const x of visible) m.set(x.tanggal_mulai!, [...(m.get(x.tanggal_mulai!) ?? []), x]);
    return [...m.entries()];
  }, [visible]);

  const row = (task: Task) => (
    <Card key={task.id} className="!py-3 flex items-center gap-3">
      <CheckCircle checked={task.status === "Selesai"} onClick={() => toggleDone(task)} />
      <button className="flex-1 min-w-0 text-left" onClick={() => navigate(`/plan/${task.id}`)}>
        <p className={`text-sm truncate ${task.status === "Selesai" ? "text-gray-500 line-through" : "text-gray-100"}`}>{tx(task.judul)}</p>
        <p className="text-[11px] text-gray-400 truncate">
          {formatRange(task)}
          {task.kategori ? ` · ${tx(task.kategori)}` : ""}
        </p>
      </button>
      {task.status === "In Progress" && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">{t("Dalam proses")}</span>
      )}
      {task.prioritas === "P1" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 shrink-0">P1</span>}
    </Card>
  );

  return (
    <div className="pb-28">
      <PageHeader title={t("Kegiatan")} />
      <div className="px-4 space-y-4">
        <Segmented
          options={[
            { key: "hari", label: t("Hari Ini") },
            { key: "minggu", label: t("Pekan") },
            { key: "bulan", label: t("Bulan") },
          ]}
          value={range}
          onChange={changeRange}
        />

        <div className="flex items-center gap-2">
          <button aria-label={t("Sebelumnya")} onClick={() => setOffset((o) => o - 1)} className="p-1.5 text-gray-300">
            <ChevronLeft size={18} />
          </button>
          <p className="flex-1 text-center text-sm font-medium text-gray-200">{tx(heading)}</p>
          <button aria-label={t("Berikutnya")} onClick={() => setOffset((o) => o + 1)} className="p-1.5 text-gray-300">
            <ChevronRight size={18} />
          </button>
        </div>
        {visible.length > 0 && (
          <p className="text-xs text-gray-400 px-1 -mt-2 text-center">{t("{0} dari {1} selesai", [doneCount, visible.length])}</p>
        )}

        {visible.length === 0 ? (
          <EmptyState title={t("Belum ada kegiatan")} hint={t("Tekan + untuk menambah.")} />
        ) : range === "hari" ? (
          <div className="space-y-2">{visible.map(row)}</div>
        ) : (
          groups.map(([date, list]) => (
            <div key={date} className="space-y-2">
              <p className="text-xs text-gray-400 px-1">{fmtDate(date, "EEE, d MMM")}</p>
              {list.map(row)}
            </div>
          ))
        )}
      </div>
      <Fab onClick={() => setShowForm(true)} label={t("Tambah kegiatan")} />
      {showForm && (
        <TaskForm
          defaultDate={range === "hari" ? from : undefined}
          onClose={() => setShowForm(false)}
          onSave={async (task) => {
            await addTask(task);
          }}
        />
      )}
    </div>
  );
}
