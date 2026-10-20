import { useState, useMemo, type FormEvent } from "react";
import { useJournals } from "./useJournals";
import { MOOD_OPTIONS, type Journal, type JournalInput } from "../../types";

const initialForm: JournalInput = {
  konten: "",
  mood: null,
  tanggal: new Date().toISOString().split("T")[0],
};

// Hitung berapa hari berturut-turut ada entry journal (dihitung mundur dari hari ini/kemarin)
function calculateStreak(journals: Journal[]): number {
  if (journals.length === 0) return 0;

  const uniqueDates = Array.from(new Set(journals.map((j) => j.tanggal)))
    .sort()
    .reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Streak cuma valid kalau entry terakhir hari ini atau kemarin (kalau sudah lebih dari itu, streak putus)
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const curr = new Date(uniqueDates[i]);
    const next = new Date(uniqueDates[i + 1]);
    const diffDays = Math.round((curr.getTime() - next.getTime()) / 86400000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

export default function JournalPage() {
  const { journals, loading, addJournal, updateJournal, deleteJournal } =
    useJournals();
  const [editing, setEditing] = useState<Journal | null>(null);
  const [form, setForm] = useState<JournalInput>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const streak = useMemo(() => calculateStreak(journals), [journals]);

  const startEdit = (j: Journal) => {
    setEditing(j);
    setForm({ konten: j.konten, mood: j.mood, tanggal: j.tanggal });
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
      ? await updateJournal(editing.id, form)
      : await addJournal(form);

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
    if (confirm("Yakin hapus entry journal ini?")) deleteJournal(id);
  };

  return (
    <div className="space-y-4">
      {streak > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-xl p-3 text-center">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            🔥 Streak:{" "}
            <span className="font-semibold">{streak} hari berturut-turut</span>
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4"
      >
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {editing ? "Edit Journal" : "Tulis Journal Hari Ini"}
        </h2>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mood (opsional)
          </label>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() =>
                  setForm({ ...form, mood: form.mood === m ? null : m })
                }
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  form.mood === m
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Refleksi
          </label>
          <textarea
            required
            value={form.konten}
            onChange={(e) => setForm({ ...form, konten: e.target.value })}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
            placeholder="Bagaimana hari ini? Apa yang kamu pelajari atau rasakan?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tanggal
          </label>
          <input
            type="date"
            required
            value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
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
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:text-gray-300"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Memuat data...</p>
      ) : journals.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          Belum ada entry journal.
        </p>
      ) : (
        <div className="space-y-2">
          {journals.map((j) => (
            <div
              key={j.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">
                      {new Date(j.tanggal).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    {j.mood && (
                      <span className="text-xs px-2 py-0.5 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-300 rounded-full">
                        {j.mood}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {j.konten}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <button
                    onClick={() => startEdit(j)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(j.id)}
                    className="text-xs text-red-500 hover:text-red-700"
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
