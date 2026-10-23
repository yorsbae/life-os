import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { addDays } from "date-fns";
import { db } from "../db";
import { t } from "../i18n";
import { toDateStr } from "../../utils/dates";
import { MORNING_ID_BASE, MORNING_ID_COUNT, planMorning, type MorningLabels } from "./morning";
import { loadWidgetSettings, type WidgetSettings } from "./settings";
import { saveWidgetJson } from "./native";
import {
  buildWidgetSnapshot,
  snapshotSignature,
  WIDGET_DAYS,
  type WidgetEventIn,
  type WidgetHabitIn,
  type WidgetLabels,
  type WidgetLogIn,
  type WidgetSnapshot,
  type WidgetTaskIn,
} from "./snapshot";

// Membaca DB -> membangun snapshot -> menulis ke widget -> menjadwalkan notifikasi pagi.
// Aman dipanggil sering-sering: dijalankan berurutan dan dilewati bila isinya tidak berubah.

let lastSignature = "";
let chain: Promise<void> = Promise.resolve();

export interface SyncOptions {
  lockEnabled: boolean;
  /** Abaikan pengecekan "tidak berubah" (mis. setelah pengaturan diubah). */
  force?: boolean;
}

export function runWidgetSync(opts: SyncOptions): Promise<void> {
  chain = chain.then(() => doSync(opts)).catch(() => {});
  return chain;
}

function labels(): WidgetLabels {
  // `{0}`/`{1}` sengaja dibiarkan: diisi oleh widget native.
  return {
    agenda: t("Agenda hari ini"),
    empty: t("Tidak ada agenda"),
    more: t("+{0} lagi"),
    habit: t("Kebiasaan {0}/{1}"),
    overdue: t("{0} tugas terlambat"),
    event: t("Jadwal"),
    task: t("Tugas"),
    setup: t("Buka Life OS untuk memperbarui"),
  };
}

function morningLabels(): MorningLabels {
  return {
    title: t("☀️ Agenda hari ini"),
    summary: (e, k) => t("{0} jadwal, {1} tugas hari ini", [e, k]),
    more: (n) => t("+{0} lagi", [n]),
  };
}

async function readSnapshot(settings: WidgetSettings, now: Date): Promise<WidgetSnapshot | null> {
  const today = toDateStr(now);
  // Margin ±1 hari karena timestamp bisa tersimpan dalam UTC; pengelompokan akhir memakai tanggal lokal.
  const from = toDateStr(addDays(now, -1));
  const to = toDateStr(addDays(now, WIDGET_DAYS + 1));

  const [ev, tk, hb, lg] = await Promise.all([
    db.from("events").select("judul, tanggal_mulai").gte("tanggal_mulai", from).lt("tanggal_mulai", to),
    db
      .from("tasks")
      .select("judul, prioritas, status, tanggal_mulai, tanggal_selesai, jam_mulai")
      .neq("status", "Selesai")
      .limit(1000),
    db.from("habits").select("id, target_harian").eq("aktif", true),
    db.from("habit_logs").select("habit_id, nilai").eq("tanggal", today),
  ]);
  // Jangan menimpa snapshot yang baik dengan data setengah jadi.
  if (ev.error || tk.error || hb.error || lg.error) return null;

  return buildWidgetSnapshot({
    now,
    events: ev.data as WidgetEventIn[],
    tasks: tk.data as WidgetTaskIn[],
    habits: hb.data as WidgetHabitIn[],
    todayLogs: lg.data as WidgetLogIn[],
    hideTitles: !settings.showTitles,
    labels: labels(),
  });
}

async function applyMorning(settings: WidgetSettings, snap: WidgetSnapshot, now: Date) {
  const ids = Array.from({ length: MORNING_ID_COUNT }, (_, i) => ({ id: MORNING_ID_BASE + i }));
  await LocalNotifications.cancel({ notifications: ids }).catch(() => {});
  if (!settings.morningEnabled) return;
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") return;
  const notes = planMorning(snap, settings.morningTime, now, morningLabels());
  if (notes.length === 0) return;
  await LocalNotifications.schedule({
    notifications: notes.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      schedule: { at: n.at, allowWhileIdle: true },
    })),
  });
}

async function doSync({ lockEnabled, force }: SyncOptions) {
  if (!Capacitor.isNativePlatform()) return;
  const settings = await loadWidgetSettings(lockEnabled);
  const now = new Date();
  const snap = await readSnapshot(settings, now);
  if (!snap) return;

  const signature = `${snapshotSignature(snap)}|${settings.morningEnabled}|${settings.morningTime}`;
  if (!force && signature === lastSignature) return;

  await saveWidgetJson(JSON.stringify(snap));
  await applyMorning(settings, snap, now);
  lastSignature = signature; // hanya setelah semuanya berhasil, agar kegagalan dicoba lagi
}
