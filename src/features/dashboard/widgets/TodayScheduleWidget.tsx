import { Link } from "react-router-dom";
import { useEvents } from "../../calendar/useEvents";
import { EVENT_TIPE_LABEL, EVENT_TIPE_COLOR } from "../../../types";

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatJam(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TodayScheduleWidget() {
  const { events, loading } = useEvents();

  const todayEvents = events
    .filter((e) => isToday(e.tanggal_mulai))
    .sort(
      (a, b) =>
        new Date(a.tanggal_mulai).getTime() -
        new Date(b.tanggal_mulai).getTime(),
    );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <Link
        to="/calendar"
        className="flex items-center justify-between mb-4 group"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Jadwal Hari Ini
        </h3>
        <span className="text-xs text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">
          Lihat kalender →
        </span>
      </Link>

      {loading ? (
        <p className="text-gray-400 text-sm">Memuat...</p>
      ) : todayEvents.length === 0 ? (
        <p className="text-gray-400 text-sm">Tidak ada jadwal hari ini.</p>
      ) : (
        <div className="space-y-2">
          {todayEvents.map((e) => (
            <div key={e.id} className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: EVENT_TIPE_COLOR[e.tipe] }}
              />
              <span className="text-xs text-gray-400 w-12 shrink-0">
                {formatJam(e.tanggal_mulai)}
              </span>
              <span className="text-sm text-gray-900 dark:text-white truncate">
                {e.judul}
              </span>
              <span className="text-xs text-gray-400 ml-auto shrink-0">
                {EVENT_TIPE_LABEL[e.tipe]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
