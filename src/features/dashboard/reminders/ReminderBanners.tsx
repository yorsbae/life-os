import { Link } from "react-router-dom";
import { useReminders } from "./useReminders";

export default function ReminderBanners() {
  const reminders = useReminders();

  if (reminders.length === 0) return null;

  return (
    <div className="space-y-2">
      {reminders.map((r) => (
        <Link
          key={r.id}
          to={r.link}
          className={`flex items-center gap-2 p-3 rounded-xl text-sm transition hover:opacity-80 ${
            r.severity === "warning"
              ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800"
              : "bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
          }`}
        >
          <span>{r.icon}</span>
          <span className="flex-1">{r.message}</span>
          <span className="text-xs opacity-60">→</span>
        </Link>
      ))}
    </div>
  );
}
