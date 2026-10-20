import { useState } from "react";
import { useTrainingPlan } from "./useTrainingPlan";
import { PLAN_LABELS, type PlanTipe } from "./trainingTemplates";
import { HARI_LABEL } from "./useExerciseSchedule";

const PRESET_ISTIRAHAT: { label: string; hari: number[] }[] = [
  { label: "7 Hari Full (0 Rest)", hari: [] },
  { label: "6 Hari (1 Rest)", hari: [0] }, // default Minggu
  { label: "5 Hari (2 Rest)", hari: [0, 3] }, // default Minggu + Rabu
];

export default function CoachingTab() {
  const { plan, sessions, loading, startPlan, cancelPlan, isSessionDone } =
    useTrainingPlan();
  const [selectedTipe, setSelectedTipe] = useState<PlanTipe>("5k");
  const [hariIstirahat, setHariIstirahat] = useState<number[]>([0]); // default: cuma Minggu Rest
  const [isStarting, setIsStarting] = useState(false);

  const toggleHari = (hari: number) => {
    setHariIstirahat((prev) =>
      prev.includes(hari)
        ? prev.filter((h) => h !== hari)
        : [...prev, hari].sort(),
    );
  };

  const handleStart = async () => {
    setIsStarting(true);
    await startPlan(
      selectedTipe,
      PLAN_LABELS[selectedTipe].defaultDurasi,
      hariIstirahat,
    );
    setIsStarting(false);
  };

  if (loading)
    return <p className="text-gray-400 text-sm py-8 text-center">Memuat...</p>;

  if (!plan) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            💡 Coaching di sini bekerja kayak Garmin Coach — bukan AI, tapi
            program terstruktur yang otomatis naik/turun intensitasnya tiap
            minggu tergantung seberapa konsisten kamu jalanin.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            1. Pilih Program
          </p>
          {(Object.keys(PLAN_LABELS) as PlanTipe[]).map((tipe) => (
            <button
              key={tipe}
              onClick={() => setSelectedTipe(tipe)}
              className={`w-full text-left p-4 rounded-xl border transition ${
                selectedTipe === tipe
                  ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}
            >
              <p className="font-medium text-gray-900 dark:text-white">
                {PLAN_LABELS[tipe].label}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {PLAN_LABELS[tipe].deskripsi} ·{" "}
                {PLAN_LABELS[tipe].defaultDurasi} minggu
              </p>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            2. Pilih Hari Latihan / Istirahat
          </p>

          <div className="flex flex-wrap gap-2">
            {PRESET_ISTIRAHAT.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setHariIstirahat(preset.hari)}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  JSON.stringify(hariIstirahat) === JSON.stringify(preset.hari)
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400 pt-1">
            Atau atur manual, klik hari yang mau jadi Rest:
          </p>
          <div className="flex flex-wrap gap-2">
            {HARI_LABEL.map((label, hari) => (
              <button
                key={hari}
                onClick={() => toggleHari(hari)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  hariIstirahat.includes(hari)
                    ? "bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {hariIstirahat.includes(hari) ? "😴 " : ""}
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            {hariIstirahat.length === 0
              ? "Latihan 7 hari penuh, tanpa Rest."
              : `${7 - hariIstirahat.length} hari latihan, ${hariIstirahat.length} hari Rest (${hariIstirahat.map((h) => HARI_LABEL[h]).join(", ")})`}
          </p>
        </div>

        <button
          onClick={handleStart}
          disabled={isStarting}
          className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {isStarting ? "Menyiapkan program..." : "Mulai Program Ini"}
        </button>
      </div>
    );
  }

  const mingguSekarang = Math.max(...sessions.map((s) => s.minggu_ke), 1);
  const sesiMingguIni = sessions.filter((s) => s.minggu_ke === mingguSekarang);
  const currentMultiplier = sesiMingguIni[0]?.intensity_multiplier ?? 1.0;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {plan.judul}
            </p>
            <p className="text-xs text-gray-400">
              Minggu {mingguSekarang} dari {plan.durasi_minggu} ·{" "}
              {plan.hari_istirahat.length === 0
                ? "7 hari latihan"
                : `Rest: ${plan.hari_istirahat.map((h) => HARI_LABEL[h]).join(", ")}`}
            </p>
          </div>
          <button
            onClick={() => confirm("Batalkan program ini?") && cancelPlan()}
            className="text-xs text-red-500"
          >
            Batalkan
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Level intensitas minggu ini:
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              currentMultiplier > 1
                ? "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-300"
                : currentMultiplier < 1
                  ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            {currentMultiplier > 1
              ? "📈 Naik"
              : currentMultiplier < 1
                ? "📉 Turun"
                : "➡️ Normal"}{" "}
            ({Math.round(currentMultiplier * 100)}%)
          </span>
        </div>

        <div className="space-y-2">
          {sesiMingguIni.map((s) => {
            if (s.tipe === "Rest") {
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                >
                  <span>😴</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Rest Day
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.tanggal).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              );
            }
            const done = isSessionDone(s);
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${done ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950" : "border-gray-200 dark:border-gray-700"}`}
              >
                <span>{done ? "✅" : "⬜"}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {s.sub_kategori}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.tanggal).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    })}
                    {s.target_durasi && ` · ${s.target_durasi} menit`}
                    {s.target_jarak && ` · ${s.target_jarak} km`}
                  </p>
                  {s.gerakan && (
                    <p className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                      🏋️ {s.gerakan}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        💡 Minggu depan intensitas naik otomatis kalau kamu selesaikan ≥90% sesi
        minggu ini, turun kalau &lt;60%, atau tetap kalau di antaranya.
      </p>
    </div>
  );
}
