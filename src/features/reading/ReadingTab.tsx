import { useState, useMemo, type FormEvent } from "react";
import { useReadings, type Reading, type ReadingInput } from "./useReadings";

// Sama persis logic-nya dengan streak Journal - dipakai berulang
function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniqueDates = Array.from(new Set(dates)).sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const diffDays = Math.round(
      (new Date(uniqueDates[i]).getTime() -
        new Date(uniqueDates[i + 1]).getTime()) /
        86400000,
    );
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

const initialForm: ReadingInput = {
  judul_buku: "",
  penulis: "",
  halaman_sekarang: 0,
  total_halaman: null,
  status: "Dibaca",
  insight: "",
  tanggal: new Date().toISOString().split("T")[0],
};

const inputClass =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm";

export default function ReadingTab() {
  const { readings, loading, addReading, updateReading, deleteReading } =
    useReadings();
  const streak = useMemo(
    () => calculateStreak(readings.map((r) => r.tanggal)),
    [readings],
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reading | null>(null);
  const [form, setForm] = useState<ReadingInput>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (r: Reading) => {
    setEditing(r);
    setForm({
      judul_buku: r.judul_buku,
      penulis: r.penulis,
      halaman_sekarang: r.halaman_sekarang,
      total_halaman: r.total_halaman,
      status: r.status,
      insight: r.insight,
      tanggal: r.tanggal,
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
    if (editing) await updateReading(editing.id, form);
    else await addReading(form);
    setIsSubmitting(false);
    cancelForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin hapus catatan bacaan ini?")) deleteReading(id);
  };

  // Update cepat halaman sekarang langsung dari list, tanpa buka form penuh
  const handleQuickUpdatePage = async (r: Reading, newPage: number) => {
    await updateReading(r.id, {
      halaman_sekarang: newPage,
      tanggal: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-900 dark:text-white">Reading</h2>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <span className="text-xs px-2 py-1 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-300 rounded-full">
              🔥 {streak} hari
            </span>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="text-sm bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-3 py-1.5 rounded-lg"
          >
            + Buku Baru
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <input
            type="text"
            required
            placeholder="Judul buku"
            value={form.judul_buku}
            onChange={(e) => setForm({ ...form, judul_buku: e.target.value })}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Penulis (opsional)"
            value={form.penulis ?? ""}
            onChange={(e) => setForm({ ...form, penulis: e.target.value })}
            className={inputClass}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Halaman sekarang"
              value={form.halaman_sekarang}
              onChange={(e) =>
                setForm({ ...form, halaman_sekarang: Number(e.target.value) })
              }
              className={inputClass}
            />
            <input
              type="number"
              placeholder="Total halaman"
              value={form.total_halaman ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  total_halaman: e.target.value ? Number(e.target.value) : null,
                })
              }
              className={inputClass}
            />
          </div>

          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as ReadingInput["status"],
              })
            }
            className={inputClass}
          >
            <option value="Dibaca">Sedang Dibaca</option>
            <option value="Selesai">Selesai</option>
            <option value="Berhenti">Berhenti</option>
          </select>

          <textarea
            placeholder="Insight / apa yang bisa diambil"
            value={form.insight ?? ""}
            onChange={(e) => setForm({ ...form, insight: e.target.value })}
            rows={3}
            className={inputClass}
          />

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
      ) : readings.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          Belum ada buku dicatat.
        </p>
      ) : (
        <div className="space-y-3">
          {readings.map((r) => {
            const progress = r.total_halaman
              ? Math.min(
                  100,
                  Math.round((r.halaman_sekarang / r.total_halaman) * 100),
                )
              : null;
            return (
              <div
                key={r.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {r.judul_buku}
                    </span>
                    {r.penulis && (
                      <p className="text-xs text-gray-400">{r.penulis}</p>
                    )}
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      {r.status}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(r)}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {r.total_halaman && (
                  <>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        Hal. {r.halaman_sekarang} / {r.total_halaman} (
                        {progress}%)
                      </p>
                      {/* Update cepat halaman tanpa buka form penuh */}
                      <button
                        onClick={() => {
                          const next = prompt(
                            "Sudah sampai halaman berapa?",
                            String(r.halaman_sekarang),
                          );
                          if (next && !isNaN(Number(next)))
                            handleQuickUpdatePage(r, Number(next));
                        }}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Update halaman
                      </button>
                    </div>
                  </>
                )}

                {r.insight && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                    "{r.insight}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
