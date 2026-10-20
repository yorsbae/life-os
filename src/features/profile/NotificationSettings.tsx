import { useEventReminders } from "../../hooks/useEventReminders";

export default function NotificationSettings() {
  const { isEnabled, isSupported, error, enable, disable } =
    useEventReminders();

  const card =
    "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-2";

  if (!isSupported) {
    return (
      <div className={card}>
        <h2 className="font-semibold text-gray-900 dark:text-white">
          🔔 Pengingat
        </h2>
        <p className="text-xs text-gray-400">
          Pengingat jadwal hanya tersedia di aplikasi Android.
        </p>
      </div>
    );
  }

  return (
    <div className={card}>
      <h2 className="font-semibold text-gray-900 dark:text-white">
        🔔 Pengingat Jadwal
      </h2>
      <p className="text-xs text-gray-400">
        Notifikasi 30 menit sebelum jadwal Calendar dimulai. Dijadwalkan di HP
        kamu sendiri, jadi tetap jalan tanpa internet dan saat aplikasi
        tertutup.
      </p>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {isEnabled ? "Pengingat aktif" : "Pengingat belum aktif"}
        </p>
        {isEnabled ? (
          <button
            onClick={disable}
            className="text-sm text-red-500 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-lg"
          >
            Matikan
          </button>
        ) : (
          <button
            onClick={enable}
            className="text-sm bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-3 py-1.5 rounded-lg"
          >
            Aktifkan
          </button>
        )}
      </div>
    </div>
  );
}
