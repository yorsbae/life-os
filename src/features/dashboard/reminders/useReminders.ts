import { useMemo } from "react";
import { useMoneySummary } from "../../money/useMoneySummary";
import { useExercises } from "../../exercise/useExercises";
import { useJournals } from "../../journal/useJournals";
import { useCreativeProjects } from "../../creative/useCreativeProjects";
import { useRecurringExpenses } from "../../money/useRecurringExpenses";
import { useGoals } from "../../goals/useGoals";
import { useWeeklyReview } from "../../weeklyreview/useWeeklyReview";

export interface Reminder {
  id: string;
  message: string;
  severity: "info" | "warning";
  icon: string;
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

    // 1. Budget kategori yang sudah >= 80%
    if (target?.budget_kategori) {
      for (const [kategori, budget] of Object.entries(target.budget_kategori)) {
        const used = expensePerKategori[kategori] ?? 0;
        const percent = (used / budget) * 100;
        if (percent >= 100) {
          reminders.push({
            id: `budget-${kategori}`,
            message: `Budget "${kategori}" sudah TERLAMPAUI (${Math.round(percent)}%)`,
            severity: "warning",
            icon: "💸",
            link: "/money",
          });
        } else if (percent >= 80) {
          reminders.push({
            id: `budget-${kategori}`,
            message: `Budget "${kategori}" sudah ${Math.round(percent)}% terpakai`,
            severity: "warning",
            icon: "💸",
            link: "/money",
          });
        }
      }
    }

    // 2. Belum olahraga hari ini (nudge lembut, bukan warning)
    const exerciseToday = exercises.some((e) => isToday(e.tanggal));
    if (!exerciseToday) {
      reminders.push({
        id: "no-exercise-today",
        message: "Belum ada catatan olahraga hari ini",
        severity: "info",
        icon: "💪",
        link: "/exercises",
      });
    }

    // 3. Belum isi journal hari ini
    const journalToday = journals.some((j) => isToday(j.tanggal));
    if (!journalToday) {
      reminders.push({
        id: "no-journal-today",
        message: "Belum menulis journal hari ini",
        severity: "info",
        icon: "📝",
        link: "/mind-growth",
      });
    }

    // 4. Target upload Creative Brain mendekati deadline (<= 2 hari, belum uploaded/archived)
    const now = new Date();
    projects
      .filter(
        (p) =>
          !p.is_archived &&
          p.status !== "uploaded" &&
          p.status !== "analisa" &&
          p.target_upload,
      )
      .forEach((p) => {
        const target = new Date(p.target_upload!);
        const diffDays = Math.ceil(
          (target.getTime() - now.getTime()) / 86400000,
        );
        if (diffDays <= 2 && diffDays >= 0) {
          reminders.push({
            id: `upload-${p.id}`,
            message: `"${p.judul}" target upload ${diffDays === 0 ? "HARI INI" : `tinggal ${diffDays} hari lagi`}`,
            severity: "warning",
            icon: "🎬",
            link: "/creative",
          });
        } else if (diffDays < 0) {
          reminders.push({
            id: `upload-${p.id}`,
            message: `"${p.judul}" sudah lewat target upload ${Math.abs(diffDays)} hari`,
            severity: "warning",
            icon: "🎬",
            link: "/creative",
          });
        }
      });

    // 5. Recurring expense yang jatuh tempo dalam 3 hari
    const todayDate = new Date().getDate();
    recurringItems
      .filter((r) => r.aktif)
      .forEach((r) => {
        let daysUntil = r.tanggal_jatuh_tempo - todayDate;
        if (daysUntil < 0) daysUntil += 30; // kasar, cukup untuk reminder (bukan kalkulasi presisi kalender)
        if (daysUntil <= 3) {
          reminders.push({
            id: `recurring-${r.id}`,
            message: `"${r.nama}" jatuh tempo ${daysUntil === 0 ? "HARI INI" : `${daysUntil} hari lagi`} (Rp${r.nominal.toLocaleString("id-ID")})`,
            severity: "info",
            icon: "🔁",
            link: "/money",
          });
        }
      });

    // 6. Goal mendekati deadline (<= 3 hari) dan belum tercapai
    goals
      .filter((g) => g.status === "Aktif" && g.tanggal_target)
      .forEach((g) => {
        const target = new Date(g.tanggal_target!);
        const diffDays = Math.ceil(
          (target.getTime() - now.getTime()) / 86400000,
        );
        const current = getProgress(g);
        if (current < g.target_value && diffDays <= 3 && diffDays >= 0) {
          reminders.push({
            id: `goal-${g.id}`,
            message: `Goal "${g.judul}" deadline ${diffDays === 0 ? "HARI INI" : `${diffDays} hari lagi`} (baru ${current}/${g.target_value})`,
            severity: "warning",
            icon: "🎯",
            link: "/goals",
          });
        }
      });

    // 7. Weekly Review belum diisi kalau sudah Jumat-Minggu (waktu wajar buat mulai refleksi minggu ini)
    const hariIni = now.getDay(); // 0=Minggu, 5=Jumat, 6=Sabtu
    const sudahAkhirMinggu = hariIni === 0 || hariIni === 5 || hariIni === 6;
    if (sudahAkhirMinggu && !weekReview) {
      reminders.push({
        id: "weekly-review-pending",
        message: "Belum isi Weekly Review minggu ini",
        severity: "info",
        icon: "🗓",
        link: "/mind-growth",
      });
    }

    return reminders;
  }, [
    target,
    expensePerKategori,
    exercises,
    journals,
    projects,
    recurringItems,
    goals,
    getProgress,
    weekReview,
  ]);
}
