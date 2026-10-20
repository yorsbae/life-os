import { useState, type FormEvent } from "react";
import { useActivities } from "./useActivities";
import {
  KATEGORI_ACTIVITY,
  type Activity,
  type ActivityInput,
} from "../../types";

const initialForm: ActivityInput = {
  judul: "",
  kategori: "Bekerja",
  durasi: null,
  catatan: "",
  tanggal: new Date().toISOString().split("T")[0],
};

export default function ActivityPage() {
  const { activities, loading, addActivity, updateActivity, deleteActivity } =
    useActivities();
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState<ActivityInput>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const startEdit = (activity: Activity) => {
    setEditing(activity);
    setForm({
      judul: activity.judul,
      kategori: activity.kategori,
      durasi: activity.durasi,
      catatan: activity.catatan,
      tanggal: activity.tanggal,
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
      ? await updateActivity(editing.id, form)
      : await addActivity(form);

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
    if (confirm("Yakin hapus data ini?")) deleteActivity(id);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Aktivitas Harian</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-5 rounded-xl border border-gray-200 space-y-4"
      >
        <h2 className="font-semibold text-gray-900">
          {editing ? "Edit Aktivitas" : "Tambah Aktivitas"}
        </h2>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul
            </label>
            <input
              type="text"
              required
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Misal: Kerjakan laporan bulanan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              value={form.kategori}
              onChange={(e) =>
                setForm({
                  ...form,
                  kategori: e.target.value as ActivityInput["kategori"],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {KATEGORI_ACTIVITY.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="60"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              required
              value={form.tanggal}
              onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catatan
          </label>
          <textarea
            value={form.catatan ?? ""}
            onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {isSubmitting ? "Menyimpan..." : editing ? "Update" : "Simpan"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Memuat data...</p>
      ) : activities.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          Belum ada aktivitas tercatat.
        </p>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{a.judul}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(a.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {a.kategori}
                  </span>
                  {a.durasi && (
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                      {a.durasi} menit
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <button
                  onClick={() => startEdit(a)}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
