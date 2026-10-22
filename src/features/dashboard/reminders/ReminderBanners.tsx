import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Reminder } from "./useReminders";

import { tx } from "../../../lib/i18n";
export default function ReminderBanners({ reminders }: { reminders: Reminder[] }) {
  if (reminders.length === 0) return null;
  return (
    <div className="space-y-2">
      {reminders.slice(0, 4).map((r) => {
        const Icon = r.icon;
        return (
          <Link
            key={r.id}
            to={r.link}
            className={`flex items-center gap-3 p-3 rounded-2xl text-sm border ${
              r.severity === "warning"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                : "bg-primary/10 border-primary/30 text-gray-100"
            }`}
          >
            <Icon size={18} className={r.severity === "warning" ? "text-amber-300 shrink-0" : "text-primary shrink-0"} />
            <span className="flex-1 min-w-0 break-words">{tx(r.message)}</span>
            <ChevronRight size={16} className="opacity-60 shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
