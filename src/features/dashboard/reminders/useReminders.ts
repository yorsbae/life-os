import { useMemo } from "react";
import { Wallet, Dumbbell, BookOpen, Clapperboard, Repeat, Target, CalendarCheck, type LucideIcon } from "lucide-react";
import { useMoneySummary } from "../../money/useMoneySummary";
import { useExercises } from "../../exercise/useExercises";
import { useJournals } from "../../journal/useJournals";
import { useCreativeProjects } from "../../creative/useCreativeProjects";
import { useRecurringExpenses } from "../../money/useRecurringExpenses";
import { useGoals } from "../../goals/useGoals";
import { useWeeklyReview } from "../../weeklyreview/useWeeklyReview";
import { t, tx } from "../../../lib/i18n";
import { rupiah } from "../../../utils/format";

export interface Reminder {
  id: string;
  message: string;
  severity: "info" | "warning";
  icon: LucideIcon;
  link: string;
}

function isToday(tanggal: string) {
  const d = new Date(tanggal);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function useReminders(): Reminder[] {
  const { target, expensePerKategori } = useMoneySummary(new Date());
  const { exercises } = useExercises();
  const { journals } = useJournals();
  const { projects } = useCreativeProjects();
  const { items: recurringItems } = useRecurringExpenses();
  const { goals, getProgress } = useGoals();
  const { review: weekReview } = useWeeklyReview();

  return useMemo(() => {
    const reminders: Reminder[] = [];

    // 1. Anggaran kategori yang sudah >= 80%
    if (target?.budget_kategori) {
      for (const [kategori, budget] of Object.entries(target.budget_kategori)) {
        const used = expensePerKategori[kategori] ?? 0;
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
    if (!exercises.some((e) => isToday(e.tanggal))) {
      reminders.push({
        id: "no-exercise-today",
        message: t("Belum ada catatan olahraga hari ini"),
        severity: "info",
        icon: Dumbbell,
        link: "/exercises",
      });
    }

    // 3. Belum menulis jurnal hari ini
    if (!journals.some((j) => isToday(j.tanggal))) {
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
    projects
      .filter((p) => !p.is_archived && p.status !== "uploaded" && p.status !== "analisa" && p.target_upload)
      .forEach((p) => {
        const diffDays = Math.ceil((new Date(p.target_upload!).getTime() - now.getTime()) / 86400000);
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
    const todayDate = new Date().getDate();
    recurringItems
      .filter((r) => r.aktif)
      .forEach((r) => {
        let daysUntil = r.tanggal_jatuh_tempo - todayDate;
        if (daysUntil < 0) daysUntil += 30;
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
    goals
      .filter((g) => g.status === "Aktif" && g.tanggal_target)
      .forEach((g) => {
        const diffDays = Math.ceil((new Date(g.tanggal_target!).getTime() - now.getTime()) / 86400000);
        const current = getProgress(g);
        if (current < g.target_value && diffDays <= 3 && diffDays >= 0) {
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
  }, [target, expensePerKategori, exercises, journals, projects, recurringItems, goals, getProgress, weekReview]);
}
