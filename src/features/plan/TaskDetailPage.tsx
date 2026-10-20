import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Trash2 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import { Card, Chip, CheckCircle, PrimaryButton, GhostButton } from "../../components/ui/Controls";
import { useTasks, useSubtasks, formatRange, type TaskStatus } from "./useTasks";

const STATUSES: TaskStatus[] = ["Todo", "In Progress", "Selesai"];

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, updateTask, deleteTask } = useTasks();
  const { subtasks, addSubtask, toggleSubtask, deleteSubtask } = useSubtasks(id);
  const [newSub, setNewSub] = useState("");

  const task = tasks.find((t) => t.id === id);
  const done = subtasks.filter((s) => s.is_done).length;

  if (!task)
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader title="Detail Tugas" left="back" search={false} />
        <p className="px-4 text-sm text-gray-400">Tugas tidak ditemukan.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-bg pb-10">
      <PageHeader title="Detail Tugas" left="back" search={false} />
      <div className="px-4 space-y-4 max-w-2xl mx-auto">
        <div className="flex gap-2">
          <Chip tone={task.prioritas === "P1" ? "danger" : "default"}>{task.prioritas} Prioritas</Chip>
          {task.kategori && <Chip>{task.kategori}</Chip>}
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-50">{task.judul}</h2>
          {task.deskripsi && <p className="text-sm text-gray-400 mt-1">{task.deskripsi}</p>}
        </div>

        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-200">
            <Calendar size={16} className="text-primary" />
            {task.tanggal_mulai} · {formatRange(task)}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">Status</p>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map((s) => (
                <Chip
                  key={s}
                  active={task.status === s}
                  onClick={() =>
                    updateTask(task.id, {
                      status: s,
                      selesai_pada: s === "Selesai" ? new Date().toISOString() : null,
                    })
                  }
                >
                  {s === "In Progress" ? "Dalam Proses" : s}
                </Chip>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-100">Subtugas</h3>
            <span className="text-xs text-gray-400">{done}/{subtasks.length} selesai</span>
          </div>
          {subtasks.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <CheckCircle size={20} checked={s.is_done} onClick={() => toggleSubtask(s)} />
              <span className={`flex-1 text-sm ${s.is_done ? "text-gray-500 line-through" : "text-gray-100"}`}>{s.judul}</span>
              <button aria-label="Hapus subtugas" className="text-gray-600" onClick={() => deleteSubtask(s.id)}>
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
            <input className="input-field" placeholder="Tambah subtugas" value={newSub} onChange={(e) => setNewSub(e.target.value)} />
            <button className="px-4 rounded-xl bg-primary text-on-primary text-sm font-medium">Tambah</button>
          </form>
        </Card>

        <PrimaryButton onClick={() => navigate("/focus", { state: { taskId: task.id } })}>Mulai Fokus</PrimaryButton>
        <GhostButton
          className="!border-red-500/40 !text-red-400"
          onClick={async () => {
            if (!confirm("Hapus tugas ini?")) return;
            await deleteTask(task.id);
            navigate("/plan", { replace: true });
          }}
        >
          Hapus Tugas
        </GhostButton>
      </div>
    </div>
  );
}
