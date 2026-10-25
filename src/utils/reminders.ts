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
  // >= 1000: ID di bawahnya dicadangkan (mis. notifikasi agenda pagi 10..16, lihat lib/widget/morning).
  return Math.max(h & 0x7fffffff, 1000);
}

async function cancelAll() {
  const pending = await LocalNotifications.getPending();
  // Hanya pengingat jadwal (ID >= 1000); jangan menyentuh notifikasi agenda pagi.
  const mine = pending.notifications.filter((n) => n.id >= 1000);
  if (mine.length > 0) {
    await LocalNotifications.cancel({
      notifications: mine.map((n) => ({ id: n.id })),
    });
  }
}

// Dijalankan berurutan (dua pemanggil bersamaan tidak boleh saling membatalkan jadwal) dan dilewati
// bila daftar pengingat yang akan dijadwalkan sama dengan sinkron terakhir. Sebelumnya setiap kali
// Beranda dimuat, hingga 60 notifikasi dibatalkan lalu dijadwalkan ulang lewat jembatan native.
let chain: Promise<void> = Promise.resolve();
let lastSignature: string | null = null;

/** Lupakan sinkron terakhir (mis. setelah pengingat dimatikan atau backup dipulihkan). */
function resetSignature() {
  lastSignature = null;
}

/** Jadwalkan ulang pengingat sesuai daftar event terkini. Aman dipanggil kapan saja. */
export function syncEventReminders(events: ReminderEvent[]): Promise<void> {
  const run = chain.then(() => doSync(events));
  chain = run.catch(() => {});
  return run;
}

async function doSync(events: ReminderEvent[]) {
  if (!remindersSupported() || !(await remindersEnabled())) return;

  const now = Date.now();
  const horizon = now + HORIZON_DAYS * 86_400_000;
  const upcoming = events
    .map((e) => ({ e, at: new Date(e.tanggal_mulai).getTime() - LEAD_MINUTES * 60_000 }))
    .filter((x) => Number.isFinite(x.at) && x.at > now && x.at < horizon)
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX_SCHEDULED);

  const signature = `${intlLocale()}|${upcoming.map(({ e, at }) => `${e.id}@${at}:${e.judul}`).join("|")}`;
  if (signature === lastSignature) return;

  await cancelAll();
  if (upcoming.length === 0) {
    lastSignature = signature;
    return;
  }

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
  lastSignature = signature; // hanya setelah berhasil, agar kegagalan dicoba lagi
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
  resetSignature();
  await syncEventReminders(await loadEvents());
  return { error: null };
}

export async function disableReminders() {
  await setSetting(SETTING_KEY, "0");
  resetSignature();
  if (remindersSupported()) await cancelAll();
}

/** Dipanggil setelah restore backup agar jadwal mengikuti data baru. */
export async function resyncRemindersFromDb() {
  resetSignature();
  await syncEventReminders(await loadEvents());
}
