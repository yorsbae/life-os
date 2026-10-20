import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";

const DURATION_OPTIONS = [15, 25, 45, 60]; // menit

export default function FocusModePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          handleComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const startSession = (minutes: number) => {
    setDurationMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setIsRunning(true);
    startTimeRef.current = Date.now();
    // Coba masuk fullscreen (kalau browser support & user gesture memungkinkan)
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const logSession = async (completed: boolean, actualMinutes: number) => {
    if (!user) return;
    await db.from("learnings").insert({
      user_id: user.id,
      topik: `Sesi Fokus${completed ? "" : " (berhenti lebih awal)"}`,
      materi: null,
      catatan: `Durasi target: ${durationMinutes} menit`,
      durasi: actualMinutes,
      tanggal: new Date().toISOString().split("T")[0],
    });
  };

  const handleComplete = async () => {
    setIsRunning(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    await logSession(true, durationMinutes ?? 0);
    alert("🎉 Sesi fokus selesai! Kerja bagus.");
    navigate("/");
  };

  const handleExitClick = () => {
    setShowExitConfirm(true);
  };

  const handleConfirmExit = async () => {
    const elapsedMinutes = Math.round(
      (Date.now() - startTimeRef.current) / 60000,
    );
    setIsRunning(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    await logSession(false, elapsedMinutes);
    navigate("/");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ===== Layar pilih durasi =====
  if (!isRunning) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center space-y-6 max-w-sm">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              🎯 Focus Mode
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Layar akan fullscreen distraction-free. Kamu tetap bisa keluar
              kapan saja, tapi akan ada konfirmasi dulu.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {DURATION_OPTIONS.map((min) => (
              <button
                key={min}
                onClick={() => startSession(min)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-4 text-gray-900 dark:text-white font-medium hover:border-gray-900 dark:hover:border-white transition"
              >
                {min} menit
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Batal, kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ===== Layar sesi berjalan (fullscreen distraction-free) =====
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50">
      <p className="text-gray-400 text-sm mb-4">
        Sesi fokus sedang berjalan...
      </p>
      <p className="text-white text-7xl font-bold font-mono tabular-nums">
        {formatTime(secondsLeft)}
      </p>
      <p className="text-gray-500 text-xs mt-2">
        dari target {durationMinutes} menit
      </p>

      <button
        onClick={handleExitClick}
        className="mt-12 text-gray-500 hover:text-gray-300 text-sm border border-gray-700 px-4 py-2 rounded-lg"
      >
        Keluar dari sesi
      </button>

      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full text-center space-y-4">
            <p className="text-gray-900 dark:text-white font-medium">
              Yakin mau keluar? Baru{" "}
              {Math.round((Date.now() - startTimeRef.current) / 60000)} dari{" "}
              {durationMinutes} menit.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2 rounded-lg text-sm"
              >
                Lanjutkan Fokus
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
