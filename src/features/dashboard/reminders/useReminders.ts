import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { Wallet, Dumbbell, BookOpen, Clapperboard, Repeat, Target, CalendarCheck, type LucideIcon } from "lucide-react";
import { db } from "../../../lib/db";
import { useAuth } from "../../../context/AuthContext";
import { useRecurringExpenses } from "../../money/useRecurringExpenses";
import { useWeeklyReview } from "../../weeklyreview/useWeeklyReview";
import { t, tx } from "../../../lib/i18n";
import { rupiah } from "../../../utils/format";
import { parseDateStr, toDateStr } from "../../../utils/dates";
import { daysUntilPayday } from "../../money/pocketMath";

/** Selisih hari kalender dari hari ini (negatif = sudah lewat). null bila tanggal tidak valid. */
function daysFromToday(tanggal: string, now: Date): number | null {
  const d = parseDateStr(tanggal.slice(0, 10));
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export interface Reminder {
  id: string;
  message: string;
  severity: "info" | "warning";
  icon: LucideIcon;
  link: string;
}

interface BudgetMap {
  [kategori: string]: number;
}
interface UrgentGoal {
  id: string;
  judul: string;
  tipe: string;
  target_value: number;
  current_value_manual: number;
  tanggal_mulai: string;
  tanggal_target: string;
  progress: number;
}
interface CreativeLite {
  id: string;
  judul: string;
  target_upload: string;
}
interface LightData {
  budget: BudgetMap | null;
  spentPerKategori: Record<string, number>;
  exerciseToday: boolean;
  journalToday: boolean;
  projects: CreativeLite[];
  goals: UrgentGoal[];
}

const EMPTY: LightData = { budget: null, spentPerKategori: {}, exerciseToday: true, journalToday: true, projects: [], goals: [] };

// Pengingat hanya butuh beberapa fakta kecil (ada olahraga/jurnal hari ini? anggaran bulan ini?),
// bukan seluruh isi tabel. Dulu Beranda memuat SEMUA pengeluaran, pemasukan, olahraga, jurnal, buku,
// dan proyek kreatif (termasuk kolom teks panjang) setiap dibuka, sehingga makin lama makin lambat.
// Semua query di sini kecil dan berfilter.
async function loadLight(): Promise<LightData> {
  const now = new Date();
  const today = toDateStr(now);
  const monthStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const nextMonth = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const soon = toDateStr(addDays(now, 3));

  const [bt, spent, ex, jr, cp, gl] = await Promise.all([
    db.from("budget_targets").select("budget_kategori").eq("bulan", monthKey).maybeSingle(),
    db.from("expenses").select("kategori, nominal").gte("tanggal", monthStart).lt("tanggal", nextMonth),
    db.from("exercises").select("id").eq("tanggal", today).limit(1),
    db.from("journals").select("id").eq("tanggal", today).limit(1),
    db
      .from("creative_projects")
      .select("id, judul, target_upload")
      .eq("is_archived", false)
      .neq("status", "uploaded")
      .neq("status", "analisa")
      .neq("target_upload", null),
    db
      .from("goals")
      .select("id, judul, tipe, target_value, current_value_manual, tanggal_mulai, tanggal_target")
      .eq("status", "Aktif")
      .gte("tanggal_target", today)
      .lte("tanggal_target", soon),
  ]);

  const spentPerKategori: Record<string, number> = {};
  for (const r of (spent.data ?? []) as { kategori: string; nominal: number }[])
    spentPerKategori[r.kategori] = (spentPerKategori[r.kategori] ?? 0) + r.nominal;

  // Progress target hanya dihitung untuk target yang tenggatnya <= 3 hari (biasanya tidak ada).
  const goals: UrgentGoal[] = [];
  for (const g of (gl.data ?? []) as Omit<UrgentGoal, "progress">[]) {
    let progress = g.current_value_manual;
    if (g.tipe === "reading_count") {
      const r = await db.from("readings").select("id").eq("status", "Selesai").gte("tanggal", g.tanggal_mulai);
      progress = ((r.data ?? []) as unknown[]).length;
    } else if (g.tipe === "exercise_count") {
      const r = await db.from("exercises").select("id").gte("tanggal", g.tanggal_mulai);
      progress = ((r.data ?? []) as unknown[]).length;
    } else if (g.tipe === "creative_upload_count") {
      const r = await db.from("creative_projects").select("id").neq("tanggal_upload", null).gte("tanggal_upload", g.tanggal_mulai);
      progress = ((r.data ?? []) as unknown[]).length;
    }
    goals.push({ ...g, progress });
  }

  return {
    budget: ((bt.data as { budget_kategori: BudgetMap | null } | null)?.budget_kategori ?? null),
    spentPerKategori,
    exerciseToday: ((ex.data ?? []) as unknown[]).length > 0,
    journalToday: ((jr.data ?? []) as unknown[]).length > 0,
    projects: (cp.data ?? []) as CreativeLite[],
    goals,
  };
}

export function useReminders(): Reminder[] {
  const { user } = useAuth();
  const { items: recurringItems } = useRecurringExpenses();
  const { review: weekReview } = useWeeklyReview();
  const [light, setLight] = useState<LightData>(EMPTY);

  const refresh = useCallback(() => {
    loadLight().then(setLight).catch(() => {});
  }, []);
  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  return useMemo(() => {
    const reminders: Reminder[] = [];

    // 1. Anggaran kategori yang sudah >= 80%
    if (light.budget) {
      for (const [kategori, budget] of Object.entries(light.budget)) {
        if (!(budget > 0)) continue;
        const used = light.spentPerKategori[kategori] ?? 0;
        const percent = (used / budget) * 100;
        const name = String(tx(kategori));
        if (percent >= 100) {
          reminders.push({
            id: `budget-${kategori}`,
            message: t('Anggaran "{0}" sudah terlampaui ({1}%)', [name, Math.round(percent)]),
            severity: "warning",
            icon: Wallet,
            link: "/money",
          });
        } else if (percent >= 80) {
          reminders.push({
            id: `budget-${kategori}`,
            message: t('Anggaran "{0}" sudah {1}% terpakai', [name, Math.round(percent)]),
            severity: "warning",
            icon: Wallet,
            link: "/money",
          });
        }
      }
    }

    // 2. Belum olahraga hari ini (dorongan lembut)
    if (!light.exerciseToday) {
      reminders.push({
        id: "no-exercise-today",
        message: t("Belum ada catatan olahraga hari ini"),
        severity: "info",
        icon: Dumbbell,
        link: "/exercises",
      });
    }

    // 3. Belum menulis jurnal hari ini
    if (!light.journalToday) {
      reminders.push({
        id: "no-journal-today",
        message: t("Belum menulis jurnal hari ini"),
        severity: "info",
        icon: BookOpen,
        link: "/journal",
      });
    }

    // 4. Target upload konten mendekati tenggat
    const now = new Date();
    light.projects.forEach((p) => {
        const diffDays = daysFromToday(p.target_upload, now);
        if (diffDays === null) return;
        if (diffDays <= 2 && diffDays >= 0) {
          reminders.push({
            id: `upload-${p.id}`,
            message:
              diffDays === 0
                ? t('Target unggah "{0}" jatuh hari ini', [p.judul])
                : t('Target unggah "{0}" tinggal {1} hari lagi', [p.judul, diffDays]),
            severity: "warning",
            icon: Clapperboard,
            link: "/creative",
          });
        } else if (diffDays < 0) {
          reminders.push({
            id: `upload-${p.id}`,
            message: t('"{0}" sudah lewat target unggah {1} hari', [p.judul, Math.abs(diffDays)]),
            severity: "warning",
            icon: Clapperboard,
            link: "/creative",
          });
        }
    });

    // 5. Pengeluaran rutin yang jatuh tempo dalam 3 hari
    recurringItems
      .filter((r) => r.aktif)
      .forEach((r) => {
        const daysUntil = daysUntilPayday(r.tanggal_jatuh_tempo, now);
        if (daysUntil <= 3) {
          reminders.push({
            id: `recurring-${r.id}`,
            message:
              daysUntil === 0
                ? t('"{0}" jatuh tempo hari ini ({1})', [r.nama, rupiah(r.nominal)])
                : t('"{0}" jatuh tempo {1} hari lagi ({2})', [r.nama, daysUntil, rupiah(r.nominal)]),
            severity: "info",
            icon: Repeat,
            link: "/money",
          });
        }
      });

    // 6. Target mendekati tenggat (<= 3 hari)
    light.goals.forEach((g) => {
        const diffDays = daysFromToday(g.tanggal_target, now);
        const current = g.progress;
        if (diffDays !== null && current < g.target_value && diffDays <= 3 && diffDays >= 0) {
          reminders.push({
            id: `goal-${g.id}`,
            message:
              diffDays === 0
                ? t('Target "{0}" tenggatnya hari ini (baru {1}/{2})', [g.judul, current, g.target_value])
                : t('Target "{0}" tenggat {1} hari lagi (baru {2}/{3})', [g.judul, diffDays, current, g.target_value]),
            severity: "warning",
            icon: Target,
            link: "/goals",
          });
        }
    });

    // 7. Review mingguan belum diisi (Jumat–Minggu)
    const hariIni = now.getDay();
    if ((hariIni === 0 || hariIni === 5 || hariIni === 6) && !weekReview) {
      reminders.push({
        id: "weekly-review-pending",
        message: t("Belum mengisi review mingguan"),
        severity: "info",
        icon: CalendarCheck,
        link: "/learning",
      });
    }

    return reminders;
  }, [light, recurringItems, weekReview]);
}
