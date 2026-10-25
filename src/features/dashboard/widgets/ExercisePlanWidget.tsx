import { Link } from "react-router-dom";
import { addDays } from "date-fns";
import { Dumbbell, Moon, Target, Check } from "lucide-react";
import { useWorkoutAgenda, type WorkoutItem } from "../../exercise/useWorkoutAgenda";
import { SectionTitle } from "../../../components/ui/Controls";
import { toDateStr } from "../../../utils/dates";
import { t, tx } from "../../../lib/i18n";

// Sumber yang sama dengan halaman Plan (useWorkoutAgenda): sesi Program Latihan aktif diprioritaskan,
// kalau tidak ada memakai jadwal mingguan.
export default function ExercisePlanWidget() {
  const today = toDateStr();
  const tomorrow = toDateStr(addDays(new Date(), 1));
  const { forDate, loading } = useWorkoutAgenda(today, tomorrow);

  const todayItem = forDate(today);
  const tomorrowItem = forDate(tomorrow);

  if (loading) return null;
  if (!todayItem && !tomorrowItem) return null;

  const renderLine = (label: string, item: WorkoutItem | null) => {
    if (!item) return null;
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400 w-16 shrink-0">{tx(label)}</span>
        {item.rest ? (
          <span className="text-gray-400 flex items-center gap-1.5">
            <Moon size={14} /> {t("Hari istirahat")}
          </span>
        ) : (
          <span className="text-gray-100 flex items-center gap-1.5 min-w-0">
            {item.source === "program" ? <Target size={14} className="text-primary shrink-0" /> : <Dumbbell size={14} className="text-primary shrink-0" />}
            <span className="truncate">
              {tx(item.tipe)}
              {item.sub_kategori ? ` - ${tx(item.sub_kategori)}` : ""}
            </span>
            {item.done && <Check size={14} className="text-primary shrink-0" />}
          </span>
        )}
      </div>
    );
  };

  return (
    <Link to="/plan" className="card p-4 block space-y-3">
      <SectionTitle>{t("Rencana Latihan")}</SectionTitle>
      <div className="space-y-2">
        {renderLine(t("Hari ini"), todayItem)}
        {renderLine(t("Besok"), tomorrowItem)}
      </div>
    </Link>
  );
}
