import { getSetting, setSetting } from "../../utils/appSettings";
import { normalizeMorningTime } from "./morning";

// Pengaturan widget & agenda pagi. Disimpan di app_settings (milik perangkat ini, tidak ikut backup).
const K_TITLES = "widget_titles";
const K_MORNING = "morning_enabled";
const K_MORNING_TIME = "morning_time";

export interface WidgetSettings {
  /** Tampilkan judul agenda di widget dan notifikasi pagi. */
  showTitles: boolean;
  morningEnabled: boolean;
  morningTime: string;
}

/**
 * Bila pengguna belum memilih, judul disembunyikan saat App Lock aktif: widget terlihat tanpa PIN,
 * jadi default aman lebih baik daripada membocorkan agenda di layar utama.
 */
export async function loadWidgetSettings(lockEnabled: boolean): Promise<WidgetSettings> {
  const [titles, morning, time] = await Promise.all([
    getSetting(K_TITLES),
    getSetting(K_MORNING),
    getSetting(K_MORNING_TIME),
  ]);
  return {
    showTitles: titles === null ? !lockEnabled : titles === "1",
    morningEnabled: morning === "1",
    morningTime: normalizeMorningTime(time),
  };
}

export const saveShowTitles = (v: boolean) => setSetting(K_TITLES, v ? "1" : "0");
export const saveMorningEnabled = (v: boolean) => setSetting(K_MORNING, v ? "1" : "0");
export const saveMorningTime = (v: string) => setSetting(K_MORNING_TIME, normalizeMorningTime(v));
