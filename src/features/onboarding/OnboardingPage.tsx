import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/db";
import {
  useExerciseSchedule,
  HARI_LABEL,
} from "../exercise/useExerciseSchedule";
import { useBudgetTarget } from "../money/useBudgetTarget";
import { usePrimaryMenu, ALL_MENU_OPTIONS } from "../../hooks/usePrimaryMenu";
import CurrencyInput from "../../components/ui/CurrencyInput";

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1: jadwal latihan super simpel (cuma tandai hari mana aktif olahraga)
  const { saveDaySchedule } = useExerciseSchedule();
  const [activeDays, setActiveDays] = useState<Set<number>>(new Set());

  // Step 2: budget bulan ini
  const { saveTarget } = useBudgetTarget(new Date());
  const [targetSaving, setTargetSaving] = useState<number | null>(null);

  // Step 3: pilih menu favorit
  const { primaryPaths, togglePath } = usePrimaryMenu();

  const toggleDay = (hari: number) => {
    setActiveDays((prev) => {
      const next = new Set(prev);
      if (next.has(hari)) next.delete(hari);
      else next.add(hari);
      return next;
    });
  };

  const handleFinish = async () => {
    // Simpan jadwal: hari aktif = Strength (default sederhana), hari lain = Rest
    for (let hari = 0; hari <= 6; hari++) {
      await saveDaySchedule(
        hari,
        activeDays.has(hari) ? "Strength" : "Rest",
        null,
        null,
      );
    }
    if (targetSaving) await saveTarget({ target_saving: targetSaving });
    if (user)
      await db
        .from("profiles")
        .upsert({ id: user.id, onboarding_done: true });
    navigate("/");
  };

  const handleSkip = async () => {
    if (user)
      await db
        .from("profiles")
        .upsert({ id: user.id, onboarding_done: true });
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl p-6 space-y-5">
        <div className="flex justify-center gap-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 w-8 rounded-full ${s <= step ? "bg-gray-900 dark:bg-white" : "bg-gray-200 dark:bg-gray-700"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Selamat datang di Life OS! 👋
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Hari apa saja kamu biasanya olahraga?
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {HARI_LABEL.map((label, hari) => (
                <button
                  key={hari}
                  onClick={() => toggleDay(hari)}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    activeDays.has(hari)
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Bisa diatur lebih detail nanti di menu Body → Jadwal Mingguan.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Target Nabung Bulan Ini
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Opsional — bisa dilewati dan diatur nanti.
              </p>
            </div>
            <CurrencyInput
              value={targetSaving}
              onChange={setTargetSaving}
              placeholder="Target nabung (Rp)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pilih 4 Menu Favorit
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Ini yang akan muncul di navigasi bawah HP kamu. Bisa diganti
                kapan saja lewat Profile.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_MENU_OPTIONS.map((m) => {
                const isSelected = primaryPaths.includes(m.path);
                const isDisabled = !isSelected && primaryPaths.length >= 4;
                return (
                  <button
                    key={m.path}
                    onClick={() => togglePath(m.path)}
                    disabled={isDisabled}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                      isSelected
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                        : isDisabled
                          ? "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600"
                          : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm"
            >
              Kembali
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              Lanjut
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              Selesai, Mulai Pakai App
            </button>
          )}
        </div>

        <button
          onClick={handleSkip}
          className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          Lewati semua
        </button>
      </div>
    </div>
  );
}
