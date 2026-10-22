import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { db } from "../lib/db";
import { getSetting, setSetting } from "./appSettings";

import { t, intlLocale } from "../lib/i18n";
// Pengingat jadwal Calendar lewat notifikasi LOKAL Android (dijadwalkan di perangkat,
// tanpa server, tanpa internet). Menggantikan Web Push + Edge Function `send-reminders`.
//
// Cara kerja: tiap kali daftar event berubah, semua pengingat lama dibatalkan lalu
// dijadwalkan ulang untuk event yang akan datang (maks. 60 hari ke depan, 60 notifikasi).

const SETTING_KEY = "reminders_enabled";
const LEAD_MINUTES = 30;
const HORIZON_DAYS = 60;
const MAX_SCHEDULED = 60;

interface ReminderEvent {
  id: string;
  judul: string;
  tanggal_mulai: string;
}

export function remindersSupported(): boolean {
  return Capacitor.isNativePlatform();
}

export async function remindersEnabled(): Promise<boolean> {
  return (await getSetting(SETTING_KEY)) === "1";
}

// Notifikasi Android butuh ID integer 32-bit; turunkan dari UUID event secara stabil (FNV-1a).
function notificationId(eventId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < eventId.length; i++) {
    h ^= eventId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h & 0x7fffffff) || 1;
}

async function cancelAll() {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }
}

/** Jadwalkan ulang pengingat sesuai daftar event terkini. Aman dipanggil kapan saja. */
export async function syncEventReminders(events: ReminderEvent[]) {
  if (!remindersSupported() || !(await remindersEnabled())) return;

  await cancelAll();

  const now = Date.now();
  const horizon = now + HORIZON_DAYS * 86_400_000;
  const upcoming = events
    .map((e) => ({ e, at: new Date(e.tanggal_mulai).getTime() - LEAD_MINUTES * 60_000 }))
    .filter((x) => Number.isFinite(x.at) && x.at > now && x.at < horizon)
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX_SCHEDULED);

  if (upcoming.length === 0) return;

  await LocalNotifications.schedule({
    notifications: upcoming.map(({ e, at }) => ({
      id: notificationId(e.id),
      title: "🗓 Jadwal Sebentar Lagi",
      body: `${e.judul} - ${new Date(e.tanggal_mulai).toLocaleTimeString(intlLocale(), {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      schedule: { at: new Date(at), allowWhileIdle: true },
    })),
  });
}

async function loadEvents(): Promise<ReminderEvent[]> {
  const { data } = await db.from("events").select("id, judul, tanggal_mulai");
  return (data as ReminderEvent[]) ?? [];
}

/** Minta izin notifikasi lalu aktifkan pengingat. */
export async function enableReminders(): Promise<{ error: string | null }> {
  if (!remindersSupported()) {
    return { error: t("Pengingat hanya tersedia di aplikasi Android.") };
  }
  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") {
    return { error: t("Izin notifikasi ditolak. Aktifkan lewat Pengaturan Android → Aplikasi → Life OS → Notifikasi.") };
  }
  await setSetting(SETTING_KEY, "1");
  await syncEventReminders(await loadEvents());
  return { error: null };
}

export async function disableReminders() {
  await setSetting(SETTING_KEY, "0");
  if (remindersSupported()) await cancelAll();
}

/** Dipanggil setelah restore backup agar jadwal mengikuti data baru. */
export async function resyncRemindersFromDb() {
  await syncEventReminders(await loadEvents());
}
