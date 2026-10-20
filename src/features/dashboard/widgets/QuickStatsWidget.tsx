import { useActivities } from "../../activity/useActivities";
import { useExercises } from "../../exercise/useExercises";
import { useLearnings } from "../../learning/useLearnings";

function isThisWeek(tanggal: string) {
  const d = new Date(tanggal);
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  return d >= sevenDaysAgo;
}

export default function QuickStatsWidget() {
  const { activities } = useActivities();
  const { exercises } = useExercises();
  const { learnings } = useLearnings();

  const stats = [
    {
      label: "Aktivitas",
      value: activities.filter((a) => isThisWeek(a.tanggal)).length,
    },
    {
      label: "Sesi Latihan",
      value: exercises.filter((e) => isThisWeek(e.tanggal)).length,
    },
    {
      label: "Topik Belajar",
      value: learnings.filter((l) => isThisWeek(l.tanggal)).length,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center"
        >
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {stat.value}
          </p>
          <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          <p className="text-[10px] text-gray-300 dark:text-gray-600">
            7 hari terakhir
          </p>
        </div>
      ))}
    </div>
  );
}
