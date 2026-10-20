import { useState, type FormEvent } from "react";
import { useLearnings } from "./useLearnings";
import type { Learning, LearningInput } from "../../types";

const initialForm: LearningInput = {
  topik: "",
  materi: "",
  catatan: "",
  durasi: null,
  tanggal: new Date().toISOString().split("T")[0],
};

const inputClass =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500";

interface LearningPageProps {
  embedded?: boolean;
}

export default function LearningPage({ embedded = false }: LearningPageProps) {
  const { learnings, loading, addLearning, updateLearning, deleteLearning } =
    useLearnings();
  const [editing, setEditing] = useState<Learning | null>(null);
  const [form, setForm] = useState<LearningInput>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const startEdit = (learning: Learning) => {
    setEditing(learning);
    setForm({
      topik: learning.topik,
      materi: learning.materi,
      catatan: learning.catatan,
      durasi: learning.durasi,
      tanggal: learning.tanggal,
    });
  };
  const cancelEdit = () => {
    setEditing(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const result = editing
      ? await updateLearning(editing.id, form)
      : await addLearning(form);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    setEditing(null);
    setForm(initialForm);
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin hapus data ini?")) deleteLearning(id);
  };

  return (
    <div className={embedded ? "space-y-6" : "max-w-2xl mx-auto p-4 space-y-6"}>
      {!embedded && (
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Pembelajaran
        </h1>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4"
      >
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {editing ? "Edit Catatan Belajar" : "Tambah Catatan Belajar"}
        </h2>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Topik
          </label>
          <input
            type="text"
            required
            value={form.topik}
            onChange={(e) => setForm({ ...form, topik: e.target.value })}
            className={inputClass}
            placeholder="Misal: React Hooks"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Materi
          </label>
          <textarea
            value={form.materi ?? ""}
            onChange={(e) => setForm({ ...form, materi: e.target.value })}
            rows={3}
            className={inputClass}
            placeholder="Ringkasan apa yang dipelajari..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              required
              value={form.tanggal}
              onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Durasi (menit)
            </label>
            <input
              type="number"
              min={0}
              value={form.durasi ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  durasi: e.target.value ? Number(e.target.value) : null,
                })
              }
              className={inputClass}
              placeholder="45"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Catatan
          </label>
          <textarea
            value={form.catatan ?? ""}
            onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            rows={2}
            className={inputClass}
            placeholder="Opsional..."
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {isSubmitting ? "Menyimpan..." : editing ? "Update" : "Simpan"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Memuat data...</p>
      ) : learnings.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          Belum ada catatan belajar.
        </p>
      ) : (
        <div className="space-y-2">
          {learnings.map((l) => (
            <div
              key={l.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {l.topik}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(l.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  {l.materi && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {l.materi}
                    </p>
                  )}
                  {l.durasi && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      {l.durasi} menit
                    </span>
                  )}
                  {l.catatan && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 italic">
                      {l.catatan}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <button
                    onClick={() => startEdit(l)}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(l.id)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
