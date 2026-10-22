import { useEffect, useState } from "react";
import { getSetting, setSetting } from "../../utils/appSettings";

import { t } from "../../lib/i18n";
export default function WeatherSettings() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    getSetting("weather_enabled").then((v) => setEnabled(v === "1"));
  }, []);

  const toggle = async () => {
    const next = !enabled;
    await setSetting("weather_enabled", next ? "1" : "0");
    setEnabled(next);
  };

  return (
    <div className="bg-surface rounded-xl border border-surface-light p-5 space-y-2">
      <h2 className="font-semibold text-gray-50">
        {t("☀️ Cuaca di Dashboard")}</h2>
      <p className="text-xs text-gray-400">
        {t("Satu-satunya fitur yang memakai internet. Jika aktif, koordinat lokasimu dikirim ke layanan cuaca Open-Meteo. Seluruh data lain tetap hanya ada di HP ini.")}</p>
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {enabled ? t("Aktif") : t("Mati")}
        </p>
        <button
          onClick={toggle}
          className={
            enabled
              ? "text-sm text-red-500 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-lg"
              : "text-sm bg-primary text-on-primary px-3 py-1.5 rounded-lg"
          }
        >
          {enabled ? t("Matikan") : t("Aktifkan")}
        </button>
      </div>
    </div>
  );
}
