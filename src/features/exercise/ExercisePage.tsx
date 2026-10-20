import { useState, type FormEvent } from "react";
import { useExercises } from "./useExercises";
import ExerciseScheduleTab from "./ExerciseScheduleTab";
import CoachingTab from "./CoachingTab";
import {
  EXERCISE_TIPE_PRESETS,
  DISTANCE_BASED_TYPES,
  SUB_KATEGORI_RUNNING,
  SUB_KATEGORI_STRENGTH,
  type Exercise,
  type ExerciseInput,
} from "../../types";

const CUSTOM_VALUE = "__custom__";

const initialForm: ExerciseInput = {
  tipe: "Running",
  sub_kategori: SUB_KATEGORI_RUNNING[0],
  durasi: null,
  jarak: null,
  catatan: "",
  tanggal: new Date().toISOString().split("T")[0],
};

export default function ExercisePage() {
  const [pageTab, setPageTab] = useState<"log" | "jadwal" | "coaching">("log");
  const { exercises, loading, addExercise, updateExercise, deleteExercise } =
    useExercises();
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [form, setForm] = useState<ExerciseInput>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Apakah tipe yang lagi dipilih ada di daftar preset, atau custom (diketik sendiri)
  const isPresetTipe = EXERCISE_TIPE_PRESETS.includes(form.tipe as any);
  const [showCustomTipeInput, setShowCustomTipeInput] = useState(false);

  // Sub-kategori pakai preset kalau tipe-nya Running/Strength, selain itu bebas ketik
  const subKategoriPresets =
    form.tipe === "Running"
      ? SUB_KATEGORI_RUNNING
      : form.tipe === "Strength"
        ? SUB_KATEGORI_STRENGTH
        : null;
  const [showCustomSubInput, setShowCustomSubInput] = useState(false);

  const handleTipeSelectChange = (value: string) => {
    if (value === CUSTOM_VALUE) {
      setShowCustomTipeInput(true);
      setForm({ ...form, tipe: "", sub_kategori: "" });
      return;
    }
    setShowCustomTipeInput(false);
    setShowCustomSubInput(false);
    setForm({
      ...form,
      tipe: value,
      sub_kategori:
        value === "Running"
          ? SUB_KATEGORI_RUNNING[0]
          : value === "Strength"
            ? SUB_KATEGORI_STRENGTH[0]
            : "",
      jarak: DISTANCE_BASED_TYPES.includes(value as any) ? form.jarak : null,
    });
  };

  const handleSubKategoriSelectChange = (value: string) => {
    if (value === CUSTOM_VALUE) {
      setShowCustomSubInput(true);
      setForm({ ...form, sub_kategori: "" });
      return;
    }
    setShowCustomSubInput(false);
    setForm({ ...form, sub_kategori: value });
  };

  const startEdit = (exercise: Exercise) => {
    setEditing(exercise);
    setForm({
      tipe: exercise.tipe,
      sub_kategori: exercise.sub_kategori,
      durasi: exercise.durasi,
      jarak: exercise.jarak,
      catatan: exercise.catatan,
      tanggal: exercise.tanggal,
    });
    // Kalau tipe dari data lama bukan preset, langsung tampilkan mode custom
    setShowCustomTipeInput(
      !EXERCISE_TIPE_PRESETS.includes(exercise.tipe as any),
    );
    setShowCustomSubInput(
      exercise.tipe !== "Running" && exercise.tipe !== "Strength",
    );
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(initialForm);
    setShowCustomTipeInput(false);
    setShowCustomSubInput(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = editing
      ? await updateExercise(editing.id, form)
      : await addExercise(form);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setEditing(null);
    setForm(initialForm);
    setShowCustomTipeInput(false);
    setShowCustomSubInput(false);
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin hapus data ini?")) deleteExercise(id);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
        Latihan
      </h1>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setPageTab("log")}
          className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap shrink-0 ${pageTab === "log" ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" : "border-transparent text-gray-400"}`}
        >
          Log Latihan
        </button>
        <button
          onClick={() => setPageTab("jadwal")}
          className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap shrink-0 ${pageTab === "jadwal" ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" : "border-transparent text-gray-400"}`}
        >
          Jadwal Mingguan
        </button>
        <button
          onClick={() => setPageTab("coaching")}
          className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap shrink-0 ${pageTab === "coaching" ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" : "border-transparent text-gray-400"}`}
        >
          Coaching
        </button>
      </div>

      {pageTab === "coaching" ? (
        <CoachingTab />
      ) : pageTab === "jadwal" ? (
        <ExerciseScheduleTab />
      ) : (
        <>
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4"
          >
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {editing ? "Edit Latihan" : "Tambah Latihan"}
            </h2>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Tipe Latihan: dropdown preset + opsi custom */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipe Latihan
                </label>
                {!showCustomTipeInput ? (
                  <select
                    value={isPresetTipe ? form.tipe : CUSTOM_VALUE}
                    onChange={(e) => handleTipeSelectChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
                  >
                    {EXERCISE_TIPE_PRESETS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value={CUSTOM_VALUE}>+ Tipe Lainnya...</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Ketik tipe latihan (misal: Boxing)"
                      value={form.tipe}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tipe: e.target.value,
                          jarak: DISTANCE_BASED_TYPES.includes(
                            e.target.value as any,
                          )
                            ? form.jarak
                            : null,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomTipeInput(false);
                        setForm({ ...form, tipe: EXERCISE_TIPE_PRESETS[0] });
                      }}
                      className="px-3 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>

              {/* Sub-kategori: preset kalau Running/Strength, bebas kalau tipe lain */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jenis / Sub-kategori
                </label>
                {subKategoriPresets && !showCustomSubInput ? (
                  <select
                    value={form.sub_kategori}
                    onChange={(e) =>
                      handleSubKategoriSelectChange(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
                  >
                    {subKategoriPresets.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    <option value={CUSTOM_VALUE}>+ Lainnya...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Misal: Sparring, Vinyasa Flow, dst"
                    value={form.sub_kategori}
                    onChange={(e) =>
                      setForm({ ...form, sub_kategori: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
                  />
                )}
              </div>

              {DISTANCE_BASED_TYPES.includes(form.tipe as any) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jarak (km, opsional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={form.jarak ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        jarak: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
                    placeholder="5.0"
                  />
                </div>
              )}

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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
                  placeholder="30"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={form.tanggal}
                  onChange={(e) =>
                    setForm({ ...form, tanggal: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
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
            <p className="text-gray-400 text-sm py-8 text-center">
              Memuat data...
            </p>
          ) : exercises.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">
              Belum ada latihan tercatat.
            </p>
          ) : (
            <div className="space-y-2">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {ex.sub_kategori}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(ex.tanggal).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                        {ex.tipe}
                      </span>
                      {ex.jarak && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                          {ex.jarak} km
                        </span>
                      )}
                      {ex.durasi && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                          {ex.durasi} menit
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={() => startEdit(ex)}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ex.id)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
