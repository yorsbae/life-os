import { Link } from "react-router-dom";
import { Dumbbell, Moon, Target, Check } from "lucide-react";
import { useExerciseSchedule } from "../../exercise/useExerciseSchedule";
import { useTrainingPlan } from "../../exercise/useTrainingPlan";
import { SectionTitle } from "../../../components/ui/Controls";
import { t, tx } from "../../../lib/i18n";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchedule = any;

export default function ExercisePlanWidget() {
  const { getScheduleForDate, loading } = useExerciseSchedule();
  const { getSessionForDate, isSessionDone, loading: planLoading } = useTrainingPlan();

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  // Program coaching diprioritaskan bila ada sesi terjadwal
  const todayPlanSession = getSessionForDate(today);
  const tomorrowPlanSession = getSessionForDate(tomorrow);
  const todaySchedule = todayPlanSession ?? getScheduleForDate(today);
  const tomorrowSchedule = tomorrowPlanSession ?? getScheduleForDate(tomorrow);

  if (loading || planLoading) return null;
  if (!todaySchedule && !tomorrowSchedule) return null;

  const renderLine = (label: string, schedule: AnySchedule, isPlan: boolean) => {
    if (!schedule) return null;
    const isRest = schedule.tipe === "Rest";
    const done = isPlan && isSessionDone(schedule);
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400 w-16 shrink-0">{label}</span>
        {isRest ? (
          <span className="text-gray-400 flex items-center gap-1.5">
            <Moon size={14} /> {t("Hari istirahat")}
          </span>
        ) : (
          <span className="text-gray-100 flex items-center gap-1.5 min-w-0">
            {isPlan ? <Target size={14} className="text-primary shrink-0" /> : <Dumbbell size={14} className="text-primary shrink-0" />}
            <span className="truncate">
              {tx(schedule.tipe)}
              {schedule.sub_kategori ? ` - ${tx(schedule.sub_kategori)}` : ""}
            </span>
            {done && <Check size={14} className="text-primary shrink-0" />}
          </span>
        )}
      </div>
    );
  };

  return (
    <Link to="/exercises" className="card p-4 block space-y-3">
      <SectionTitle>{t("Rencana Latihan")}</SectionTitle>
      <div className="space-y-2">
        {renderLine(t("Hari ini"), todaySchedule, !!todayPlanSession)}
        {renderLine(t("Besok"), tomorrowSchedule, !!tomorrowPlanSession)}
      </div>
    </Link>
  );
}
