import { useState, type FormEvent } from "react";
import {
  useGoals,
  GOAL_TIPE_LABEL,
  type Goal,
  type GoalInput,
  type GoalTipe,
} from "./useGoals";

const initialForm: GoalInput = {
  judul: "",
  tipe: "reading_count",
  target_value: 1,
  current_value_manual: 0,
  tanggal_mulai: new Date().toISOString().split("T")[0],
  tanggal_target: null,
  status: "Aktif",
};

export default function GoalsPage() {
  const { goals, loading, addGoal, updateGoal, deleteGoal, getProgress } =
    useGoals();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalInput>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (g: Goal) => {
    setEditing(g);
    setForm({
      judul: g.judul,
      tipe: g.tipe,
      target_value: g.target_value,
      current_value_manual: g.current_value_manual,
      tanggal_mulai: g.tanggal_mulai,
      tanggal_target: g.tanggal_target,
      status: g.status,
    });
    setShowForm(true);
  };
  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (editing) await updateGoal(editing.id, form);
    else await addGoal(form);
    setIsSubmitting(false);
    cancelForm();
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm";

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          🎯 Goals
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-3 py-1.5 rounded-lg"
        >
          + Goal Baru
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <input
            type="text"
            required
            placeholder="Judul goal (misal: Baca 12 buku tahun ini)"
            value={form.judul}
            onChange={(e) => setForm({ ...form, judul: e.target.value })}
            className={inputClass}
          />
          <select
            value={form.tipe}
            onChange={(e) =>
              setForm({ ...form, tipe: e.target.value as GoalTipe })
            }
            className={inputClass}
          >
            {Object.entries(GOAL_TIPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Target angka"
              value={form.target_value}
              onChange={(e) =>
                setForm({ ...form, target_value: Number(e.target.value) })
              }
              className={inputClass}
            />
            <input
              type="date"
              placeholder="Target tanggal (opsional)"
              value={form.tanggal_target ?? ""}
              onChange={(e) =>
                setForm({ ...form, tanggal_target: e.target.value || null })
              }
              className={inputClass}
            />
          </div>
          {form.tipe === "custom" && (
            <input
              type="number"
              placeholder="Progress saat ini (update manual)"
              value={form.current_value_manual}
              onChange={(e) =>
                setForm({
                  ...form,
                  current_value_manual: Number(e.target.value),
                })
              }
              className={inputClass}
            />
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              {isSubmitting ? "Menyimpan..." : editing ? "Update" : "Simpan"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Memuat...</p>
      ) : goals.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          Belum ada goal. Set 1 dulu, biar progress-nya keliatan otomatis dari
          data yang sudah kamu catat.
        </p>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const current = getProgress(g);
            const percent = Math.min(
              100,
              Math.round((current / g.target_value) * 100),
            );
            const isDone = current >= g.target_value;
            return (
              <div
                key={g.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {g.judul}
                    </span>
                    <p className="text-xs text-gray-400">
                      {GOAL_TIPE_LABEL[g.tipe]}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {g.tipe === "custom" && (
                      <button
                        onClick={() => {
                          const v = prompt(
                            "Update progress ke berapa?",
                            String(g.current_value_manual),
                          );
                          if (v)
                            updateGoal(g.id, {
                              current_value_manual: Number(v),
                            });
                        }}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Update
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(g)}
                      className="text-xs text-gray-500 dark:text-gray-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="text-xs text-red-500"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full ${isDone ? "bg-green-500" : "bg-blue-500"}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {current} / {g.target_value} ({percent}%){" "}
                  {isDone && "🎉 Tercapai!"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
