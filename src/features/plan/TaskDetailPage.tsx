import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Clock, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import { Card, Chip, CheckCircle, PrimaryButton, GhostButton, EmptyState } from "../../components/ui/Controls";
import { ProgressBar } from "../../components/ui/Progress";
import { fmtDate } from "../../utils/format";
import { t, tx } from "../../lib/i18n";
import { useTasks, useSubtasks, formatRange, priorityLabel, statusLabel, type TaskStatus } from "./useTasks";
import TaskForm from "./TaskForm";

const STATUSES: TaskStatus[] = ["Todo", "In Progress", "Selesai"];

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, loading, updateTask, deleteTask } = useTasks();
  const { subtasks, addSubtask, toggleSubtask, deleteSubtask } = useSubtasks(id);
  const [newSub, setNewSub] = useState("");
  const [editing, setEditing] = useState(false);

  const task = tasks.find((x) => x.id === id);
  const done = subtasks.filter((s) => s.is_done).length;

  if (!task)
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader title={t("Detail Tugas")} left="back" search={false} />
        <div className="px-4">{!loading && <EmptyState title={t("Tugas tidak ditemukan")} />}</div>
      </div>
    );

  const sameDay = !task.tanggal_selesai || task.tanggal_selesai === task.tanggal_mulai;
  const dateText = task.tanggal_mulai
    ? sameDay
      ? fmtDate(task.tanggal_mulai, "d MMM yyyy")
      : `${fmtDate(task.tanggal_mulai, "d MMM yyyy")} – ${fmtDate(task.tanggal_selesai!, "d MMM yyyy")}`
    : "—";

  return (
    <div className="min-h-screen bg-bg pb-10">
      <PageHeader
        title={t("Detail Tugas")}
        left="back"
        search={false}
        right={
          <button aria-label={t("Edit")} onClick={() => setEditing(true)} className="p-1 text-gray-300">
            <Pencil size={18} />
          </button>
        }
      />
      <div className="px-4 space-y-4 max-w-2xl mx-auto">
        <div className="flex gap-2 flex-wrap">
          <Chip tone={task.prioritas === "P1" ? "danger" : "default"}>{priorityLabel(task.prioritas)}</Chip>
          {task.kategori && <Chip tone="primary">{tx(task.kategori)}</Chip>}
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-50 break-words">{task.judul}</h2>
          {task.deskripsi && <p className="text-sm text-gray-400 mt-1 break-words">{task.deskripsi}</p>}
        </div>

        <Card className="space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">{t("Tanggal")}</p>
            <div className="flex items-center gap-2 text-sm text-gray-100">
              <Calendar size={16} className="text-primary shrink-0" />
              <span>{dateText}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-100 mt-1.5">
              <Clock size={16} className="text-primary shrink-0" />
              <span>{formatRange(task)}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">{t("Status")}</p>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map((s) => (
                <Chip
                  key={s}
                  active={task.status === s}
                  onClick={() =>
                    updateTask(task.id, { status: s, selesai_pada: s === "Selesai" ? new Date().toISOString() : null })
                  }
                >
                  {statusLabel(s)}
                </Chip>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-100">{t("Subtugas")}</h3>
            <span className="text-xs text-gray-400">{t("{0}/{1} selesai", [done, subtasks.length])}</span>
          </div>
          {subtasks.length > 0 && <ProgressBar value={done} max={subtasks.length} />}
          {subtasks.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <CheckCircle size={20} checked={s.is_done} onClick={() => toggleSubtask(s)} />
              <span className={`flex-1 min-w-0 break-words text-sm ${s.is_done ? "text-gray-500 line-through" : "text-gray-100"}`}>{s.judul}</span>
              <button aria-label={t("Hapus subtugas")} className="text-gray-600 shrink-0" onClick={() => deleteSubtask(s.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addSubtask(newSub);
              setNewSub("");
            }}
          >
            <input className="input-field min-w-0" placeholder={t("Tambah subtugas")} value={newSub} onChange={(e) => setNewSub(e.target.value)} />
            <button className="px-4 rounded-xl bg-primary text-on-primary text-sm font-medium shrink-0">{t("Tambah")}</button>
          </form>
        </Card>

        <PrimaryButton onClick={() => navigate("/focus", { state: { taskId: task.id } })}>{t("Mulai Fokus")}</PrimaryButton>
        <GhostButton
          className="!border-red-500/40 !text-red-400"
          onClick={async () => {
            if (!confirm(t("Hapus tugas ini?"))) return;
            await deleteTask(task.id);
            navigate("/plan", { replace: true });
          }}
        >
          {t("Hapus Tugas")}
        </GhostButton>
      </div>
      {editing && (
        <TaskForm
          initial={task}
          onClose={() => setEditing(false)}
          onSave={async (input) => {
            await updateTask(task.id, input);
          }}
        />
      )}
    </div>
  );
}
