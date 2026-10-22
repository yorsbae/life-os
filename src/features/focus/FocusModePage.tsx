import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { Card, PrimaryButton, GhostButton } from "../../components/ui/Controls";
import { Ring } from "../../components/ui/Progress";
import { useTasks } from "../plan/useTasks";
import { useFocusSessions } from "./useFocusSessions";
import { t, tx } from "../../lib/i18n";
import { num } from "../../utils/format";
import Select from "../../components/ui/Select";

type Mode = "pomodoro" | "50/10" | "timer";
const MODE_MIN: Record<Mode, number> = { pomodoro: 25, "50/10": 50, timer: 15 };
const MODE_LABEL: Record<Mode, string> = { pomodoro: "Pomodoro", "50/10": "50/10", timer: "Timer" }; // nama mode disimpan apa adanya di DB

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function FocusModePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tasks } = useTasks();
  const { todays, todayMinutes, logSession } = useFocusSessions();

  const [mode, setMode] = useState<Mode>("pomodoro");
  const [minutes, setMinutes] = useState(25);
  const [taskId, setTaskId] = useState<string>((location.state as { taskId?: string } | null)?.taskId ?? "");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const startedAt = useRef(0);
  const finished = useRef(false);

  const total = minutes * 60;

  const changeMode = (m: Mode) => {
    if (running) return;
    setMode(m);
    setMinutes(MODE_MIN[m]);
    setSecondsLeft(MODE_MIN[m] * 60);
  };

  // Timer berbasis waktu dinding (bukan hitung tick) supaya akurat saat layar mati / tab di-background.
  useEffect(() => {
    if (!running) return;
    const end = startedAt.current + total * 1000;
    const tick = () => {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0 && !finished.current) {
        finished.current = true;
        setRunning(false);
        setDone(true);
        logSession({ task_id: taskId || null, mode: MODE_LABEL[mode], durasi_target: minutes, durasi_aktual: minutes, selesai: true });
        navigator.vibrate?.(400);
      }
    };
    const i = setInterval(tick, 500);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const start = () => {
    finished.current = false;
    if (done) setSecondsLeft(total);
    setDone(false);
    startedAt.current = Date.now() - (total - (done ? total : secondsLeft)) * 1000;
    setRunning(true);
  };

  const stop = async () => {
    const elapsed = Math.round((total - secondsLeft) / 60);
    setRunning(false);
    if (elapsed >= 1)
      await logSession({ task_id: taskId || null, mode: MODE_LABEL[mode], durasi_target: minutes, durasi_aktual: elapsed, selesai: false });
    setSecondsLeft(total);
  };

  const open = tasks.filter((t) => t.status !== "Selesai");

  return (
    <div className="min-h-screen bg-bg pb-10">
      <PageHeader title={t("Mode Fokus")} left="back" search={false} onBack={() => (running ? undefined : navigate(-1))} />
      <div className="px-4 space-y-5 max-w-md mx-auto">
        <Segmented
          options={(Object.keys(MODE_LABEL) as Mode[]).map((k) => ({ key: k, label: k === "timer" ? t("Timer") : MODE_LABEL[k] }))}
          value={mode}
          onChange={changeMode}
        />

        <div className="flex justify-center py-4">
          <Ring value={total - secondsLeft} max={total} size={240} stroke={10}>
            <span className="text-5xl font-bold text-gray-50 tabular-nums">{fmt(secondsLeft)}</span>
            <span className="text-xs text-gray-400 mt-1">{done ? t("Selesai!") : t("Fokus")}</span>
          </Ring>
        </div>

        {mode === "timer" && !running && (
          <div className="flex items-center justify-center gap-4">
            <button className="w-9 h-9 rounded-full bg-surface-light text-gray-200" onClick={() => { const m = Math.max(5, minutes - 5); setMinutes(m); setSecondsLeft(m * 60); }}>−</button>
            <span className="text-sm text-gray-200 w-24 text-center">{t("{0} menit", [minutes])}</span>
            <button className="w-9 h-9 rounded-full bg-surface-light text-gray-200" onClick={() => { const m = Math.min(180, minutes + 5); setMinutes(m); setSecondsLeft(m * 60); }}>+</button>
          </div>
        )}

        <label className="block space-y-1.5">
          <span className="text-xs text-gray-400">{t("Tugas")}</span>
          <Select className="input-field" value={taskId} onChange={(e) => setTaskId(e.target.value)} disabled={running}>
            <option value="">{t("Tanpa tugas")}</option>
            {open.map((t) => <option key={t.id} value={t.id}>{tx(t.judul)}</option>)}
          </Select>
        </label>

        {running ? <GhostButton onClick={stop}>{t("Berhenti")}</GhostButton> : <PrimaryButton onClick={start}>{secondsLeft < total && secondsLeft > 0 ? t("Lanjutkan") : t("Mulai")}</PrimaryButton>}

        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center"><p className="text-xs text-gray-400">{t("Hari ini")}</p><p className="text-lg font-semibold text-gray-50">{t("{0} sesi", [todays.length])}</p></Card>
          <Card className="text-center"><p className="text-xs text-gray-400">{t("Total hari ini")}</p><p className="text-lg font-semibold text-gray-50">{todayMinutes >= 60 ? t("{0} jam {1} mnt", [num(Math.floor(todayMinutes / 60)), todayMinutes % 60]) : t("{0} mnt", [todayMinutes])}</p></Card>
        </div>
      </div>
    </div>
  );
}
