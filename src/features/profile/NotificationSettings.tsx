import { useEventReminders } from "../../hooks/useEventReminders";

import { t, tx } from "../../lib/i18n";
export default function NotificationSettings() {
  const { isEnabled, isSupported, error, enable, disable } =
    useEventReminders();

  const card =
    "bg-surface rounded-xl border border-surface-light p-5 space-y-2";

  if (!isSupported) {
    return (
      <div className={card}>
        <h2 className="font-semibold text-gray-50">
          {t("🔔 Pengingat")}</h2>
        <p className="text-xs text-gray-400">
          {t("Pengingat jadwal hanya tersedia di aplikasi Android.")}</p>
      </div>
    );
  }

  return (
    <div className={card}>
      <h2 className="font-semibold text-gray-50">
        {t("🔔 Pengingat Jadwal")}</h2>
      <p className="text-xs text-gray-400">
        {t("Notifikasi 30 menit sebelum jadwal Calendar dimulai. Dijadwalkan di HP kamu sendiri, jadi tetap jalan tanpa internet dan saat aplikasi tertutup.")}</p>

      {error && <p className="text-xs text-red-500">{tx(error)}</p>}

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {isEnabled ? t("Pengingat aktif") : t("Pengingat belum aktif")}
        </p>
        {isEnabled ? (
          <button
            onClick={disable}
            className="text-sm text-red-500 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-lg"
          >
            {t("Matikan")}</button>
        ) : (
          <button
            onClick={enable}
            className="text-sm bg-primary text-on-primary px-3 py-1.5 rounded-lg"
          >
            {t("Aktifkan")}</button>
        )}
      </div>
    </div>
  );
}
