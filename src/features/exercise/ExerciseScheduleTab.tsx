import { useState, useEffect } from "react";
import { useExerciseSchedule, HARI_LABEL } from "./useExerciseSchedule";
import {
  EXERCISE_TIPE_PRESETS,
  SUB_KATEGORI_RUNNING,
  SUB_KATEGORI_STRENGTH,
} from "../../types";

const TIPE_OPTIONS = ["Rest", ...EXERCISE_TIPE_PRESETS];

export default function ExerciseScheduleTab() {
  const { schedules, loading, saveDaySchedule } = useExerciseSchedule();

  // State lokal per hari (0-6), supaya bisa edit tanpa langsung nyimpen tiap keystroke
  const [localState, setLocalState] = useState<
    Record<number, { tipe: string; sub: string }>
  >({});

  useEffect(() => {
    const initial: Record<number, { tipe: string; sub: string }> = {};
    for (let hari = 0; hari <= 6; hari++) {
      const existing = schedules.find((s) => s.hari === hari);
      initial[hari] = {
        tipe: existing?.tipe ?? "Rest",
        sub: existing?.sub_kategori ?? "",
      };
    }
    setLocalState(initial);
  }, [schedules]);

  const handleSave = async (hari: number) => {
    const val = localState[hari];
    await saveDaySchedule(hari, val.tipe, val.sub || null, null);
  };

  const subPresets = (tipe: string) =>
    tipe === "Running"
      ? SUB_KATEGORI_RUNNING
      : tipe === "Strength"
        ? SUB_KATEGORI_STRENGTH
        : null;

  if (loading)
    return <p className="text-gray-400 text-sm py-8 text-center">Memuat...</p>;

  // Urutkan tampilan mulai Senin (index 1) supaya lebih natural, Minggu (0) di akhir
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">
        Atur rencana latihan rutin per hari. Ini akan muncul otomatis di
        Dashboard dan sebagai preview di Calendar.
      </p>

      {displayOrder.map((hari) => {
        const val = localState[hari] ?? { tipe: "Rest", sub: "" };
        const presets = subPresets(val.tipe);

        return (
          <div
            key={hari}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {HARI_LABEL[hari]}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={val.tipe}
                onChange={(e) =>
                  setLocalState({
                    ...localState,
                    [hari]: { tipe: e.target.value, sub: "" },
                  })
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm"
              >
                {TIPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {val.tipe !== "Rest" &&
                (presets ? (
                  <select
                    value={val.sub}
                    onChange={(e) =>
                      setLocalState({
                        ...localState,
                        [hari]: { ...val, sub: e.target.value },
                      })
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm"
                  >
                    <option value="">Pilih jenis...</option>
                    {presets.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Jenis (opsional)"
                    value={val.sub}
                    onChange={(e) =>
                      setLocalState({
                        ...localState,
                        [hari]: { ...val, sub: e.target.value },
                      })
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm"
                  />
                ))}
            </div>
            <button
              onClick={() => handleSave(hari)}
              className="mt-2 text-xs text-blue-500 hover:underline"
            >
              Simpan {HARI_LABEL[hari]}
            </button>
          </div>
        );
      })}
    </div>
  );
}
