import { Link } from "react-router-dom";
import { useExerciseSchedule } from "../../exercise/useExerciseSchedule";
import { useTrainingPlan } from "../../exercise/useTrainingPlan";

export default function ExercisePlanWidget() {
  const { getScheduleForDate, loading } = useExerciseSchedule();
  const {
    getSessionForDate,
    isSessionDone,
    loading: planLoading,
  } = useTrainingPlan();

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  // Coaching plan diprioritaskan - kalau ada sesi terjadwal dari program aktif, itu yang dipakai
  const todayPlanSession = getSessionForDate(today);
  const tomorrowPlanSession = getSessionForDate(tomorrow);
  const todaySchedule = todayPlanSession ?? getScheduleForDate(today);
  const tomorrowSchedule = tomorrowPlanSession ?? getScheduleForDate(tomorrow);

  if (loading || planLoading) return null;
  if (!todaySchedule && !tomorrowSchedule) return null;

  const renderLine = (label: string, schedule: any, isPlan: boolean) => {
    if (!schedule) return null;
    const isRest = schedule.tipe === "Rest";
    const done = isPlan && isSessionDone(schedule);
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400 w-14 shrink-0">{label}</span>
        {isRest ? (
          <span className="text-gray-500 dark:text-gray-400">😴 Rest Day</span>
        ) : (
          <span className="text-gray-900 dark:text-white flex items-center gap-1">
            {isPlan && <span title="Dari program Coaching">🎯</span>}
            🏋️ {schedule.tipe}
            {schedule.sub_kategori ? ` - ${schedule.sub_kategori}` : ""}
            {isPlan && done && <span className="text-green-500">✓</span>}
          </span>
        )}
      </div>
    );
  };

  return (
    <Link
      to="/exercises"
      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-gray-400 dark:hover:border-gray-500 transition"
    >
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
        Rencana Latihan
      </h3>
      <div className="space-y-1.5">
        {renderLine("Hari ini", todaySchedule, !!todayPlanSession)}
        {renderLine("Besok", tomorrowSchedule, !!tomorrowPlanSession)}
      </div>
    </Link>
  );
}
