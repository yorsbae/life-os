import { useMemo, useState } from "react";
import { Award, BookOpen, Clapperboard, Dumbbell, Flame, Medal, NotebookPen, PiggyBank, Timer, Trophy, type LucideIcon } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { ProgressBar } from "../../components/ui/Progress";
import { Card, EmptyState, GhostButton, SectionTitle } from "../../components/ui/Controls";
import { useAchievementData, currentStreak, longestStreak } from "./useAchievementData";
import { t, tx } from "../../lib/i18n";
import { fmtDate, rupiah, num } from "../../utils/format";

type Tab = "pencapaian" | "rekor";
const ym = (s: unknown) => String(s ?? "").slice(0, 7);
const nv = (v: unknown) => Number(v ?? 0);

interface Badge {
  id: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  current: number;
  target: number;
}

interface TimelineItem {
  id: string;
  tanggal: string;
  icon: LucideIcon;
  title: string;
  detail: string;
}

export default function AchievementsPage() {
  const { data, loading } = useAchievementData();
  const [tab, setTab] = useState<Tab>("pencapaian");
  const [showAll, setShowAll] = useState(false);

  const calc = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const { habits, habitLogs, readings, exercises, focus, journals, incomes, expenses, budgets, creative } = data;

    // Hari "habit tuntas" per habit
    const doneByHabit = new Map<string, Set<string>>();
    for (const h of habits) {
      const tgt = nv(h.target_harian) || 1;
      const set = new Set<string>();
      for (const l of habitLogs) if (l.habit_id === h.id && nv(l.nilai) >= tgt) set.add(String(l.tanggal));
      doneByHabit.set(String(h.id), set);
    }
    const habitCur = Math.max(0, ...[...doneByHabit.values()].map(currentStreak));
    const habitBest = Math.max(0, ...[...doneByHabit.values()].map(longestStreak));

    const journalDates = new Set(journals.map((j) => String(j.tanggal)));
    const booksDone = readings.filter((r) => r.status === "Selesai");
    const booksThisMonth = booksDone.filter((r) => ym(r.tanggal) === thisMonth).length;
    const booksPerMonth = new Map<string, number>();
    for (const r of booksDone) booksPerMonth.set(ym(r.tanggal), (booksPerMonth.get(ym(r.tanggal)) ?? 0) + 1);
    const exThisMonth = exercises.filter((e) => ym(e.tanggal) === thisMonth).length;
    const focusMin = focus.reduce((s, f) => s + nv(f.durasi_aktual), 0);
    const uploads = creative.filter((p) => p.tanggal_upload).length;

    const incMonth = incomes.filter((i) => ym(i.tanggal) === thisMonth).reduce((s, i) => s + nv(i.nominal), 0);
    const expMonth = expenses.filter((e) => ym(e.tanggal) === thisMonth).reduce((s, e) => s + nv(e.nominal), 0);
    const target = nv(budgets.find((b) => ym(b.bulan) === thisMonth)?.target_saving);

    const badges: Badge[] = [
      { id: "habit", icon: Flame, title: t("Konsisten Habit"), desc: t("7 hari berturut-turut"), current: habitCur, target: 7 },
      { id: "read", icon: BookOpen, title: t("Membaca"), desc: t("5 buku dalam 1 bulan"), current: booksThisMonth, target: 5 },
      { id: "sport", icon: Dumbbell, title: t("Olahraga"), desc: t("10 sesi dalam 1 bulan"), current: exThisMonth, target: 10 },
      { id: "focus", icon: Timer, title: t("Fokus"), desc: t("10 jam total sesi fokus"), current: Math.round(focusMin / 6) / 10, target: 10 },
      { id: "save", icon: PiggyBank, title: t("Hemat"), desc: target > 0 ? t("Capai target tabungan bulan ini") : t("Atur target tabungan di Money"), current: Math.max(0, incMonth - expMonth), target: target || 1 },
      { id: "journal", icon: NotebookPen, title: t("Jurnal"), desc: t("7 hari berturut-turut menulis"), current: currentStreak(journalDates), target: 7 },
      { id: "create", icon: Clapperboard, title: t("Kreator"), desc: t("Upload 3 konten"), current: uploads, target: 3 },
    ];

    // Rekor pribadi
    const monthNet = new Map<string, number>();
    for (const i of incomes) monthNet.set(ym(i.tanggal), (monthNet.get(ym(i.tanggal)) ?? 0) + nv(i.nominal));
    for (const e of expenses) monthNet.set(ym(e.tanggal), (monthNet.get(ym(e.tanggal)) ?? 0) - nv(e.nominal));
    const best = (arr: number[]) => (arr.length ? Math.max(...arr) : 0);
    const bestMonth = [...monthNet.entries()].sort((a, b) => b[1] - a[1])[0];

    const records: { id: string; icon: LucideIcon; label: string; value: string }[] = [
      { id: "streak", icon: Flame, label: t("Streak habit terpanjang"), value: t("{0} hari", [habitBest]) },
      { id: "jstreak", icon: NotebookPen, label: t("Streak jurnal terpanjang"), value: t("{0} hari", [longestStreak(journalDates)]) },
      { id: "dist", icon: Medal, label: t("Lari terjauh"), value: `${num(best(exercises.filter((e) => e.tipe === "Running").map((e) => nv(e.jarak))))} km` },
      { id: "dur", icon: Dumbbell, label: t("Latihan terlama"), value: t("{0} menit", [best(exercises.map((e) => nv(e.durasi)))]) },
      { id: "focus", icon: Timer, label: t("Sesi fokus terlama"), value: t("{0} menit", [best(focus.map((f) => nv(f.durasi_aktual)))]) },
      { id: "inc", icon: Trophy, label: t("Pemasukan terbesar"), value: rupiah(best(incomes.map((i) => nv(i.nominal)))) },
      { id: "save", icon: PiggyBank, label: t("Tabungan bulanan terbaik"), value: bestMonth ? rupiah(Math.max(0, bestMonth[1])) : rupiah(0) },
      { id: "books", icon: BookOpen, label: t("Buku terbanyak dalam 1 bulan"), value: t("{0} buku", [best([...booksPerMonth.values()])]) },
    ];

    // Riwayat pencapaian (timeline lama): buku selesai, konten ter-upload, rekor lari baru
    const timeline: TimelineItem[] = [];
    for (const r of booksDone)
      timeline.push({ id: `b${r.id}`, tanggal: String(r.tanggal), icon: BookOpen, title: t('Selesai baca "{0}"', [String(r.judul_buku)]), detail: String(r.insight ?? "") });
    for (const p of creative.filter((x) => x.tanggal_upload))
      timeline.push({ id: `u${p.id}`, tanggal: String(p.tanggal_upload), icon: Clapperboard, title: t('Upload konten "{0}"', [String(p.judul)]), detail: p.platform ? t("di {0}", [String(p.platform)]) : "" });
    let maxKm = 0;
    [...exercises].filter((e) => e.tipe === "Running" && nv(e.jarak) > 0).sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal))).forEach((e) => {
      if (nv(e.jarak) > maxKm) {
        maxKm = nv(e.jarak);
        timeline.push({ id: `p${e.id}`, tanggal: String(e.tanggal), icon: Medal, title: t("Rekor lari baru: {0} km", [nv(e.jarak)]), detail: t("Jarak terjauh baru!") });
      }
    });
    timeline.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

    return { badges, records, timeline };
  }, [data]);

  const badges = [...calc.badges].sort((a, b) => Number(b.current >= b.target) - Number(a.current >= a.target) || b.current / b.target - a.current / a.target);
  const shown = showAll ? badges : badges.slice(0, 3);

  return (
    <div className="pb-10">
      <PageHeader title={t("Achievements")} />
      <div className="px-4 space-y-4">
        <Segmented
          options={[
            { key: "pencapaian", label: t("Pencapaian") },
            { key: "rekor", label: t("Rekor") },
          ]}
          value={tab}
          onChange={setTab}
        />

        {loading ? (
          <p className="text-gray-400 text-sm py-8 text-center">{t("Memuat...")}</p>
        ) : tab === "pencapaian" ? (
          <>
            <div className="space-y-3">
              {shown.map((b) => {
                const done = b.current >= b.target;
                const Icon = b.icon;
                return (
                  <Card key={b.id} className="flex items-center gap-3">
                    <span className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${done ? "bg-primary text-on-primary" : "bg-surface-light text-primary"}`}>
                      {done ? <Award size={22} /> : <Icon size={22} />}
                    </span>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm font-semibold text-gray-50 truncate">{tx(b.title)}</p>
                      <p className="text-[11px] text-gray-400 break-words">{tx(b.desc)}</p>
                      <ProgressBar value={b.current} max={b.target} />
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0 text-right">
                      {done ? t("Tercapai") : `${num(b.current)}/${num(b.target)}`}
                    </span>
                  </Card>
                );
              })}
            </div>
            {badges.length > 3 && <GhostButton onClick={() => setShowAll((v) => !v)}>{showAll ? t("Sembunyikan") : t("Lihat Semua")}</GhostButton>}

            <div className="space-y-2 pt-2">
              <SectionTitle>{t("Riwayat")}</SectionTitle>
              {calc.timeline.length === 0 ? (
                <EmptyState icon={Trophy} title={t("Belum ada riwayat pencapaian")} hint={t("Selesaikan buku, upload konten, atau pecahkan rekor lari untuk mengisi riwayat ini.")} />
              ) : (
                calc.timeline.map((a) => {
                  const Icon = a.icon;
                  return (
                    <Card key={a.id} className="!py-3 flex items-start gap-3">
                      <Icon size={18} className="text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-100 break-words">{tx(a.title)}</p>
                        {a.detail && <p className="text-xs text-gray-400 mt-0.5 break-words">{tx(a.detail)}</p>}
                        <p className="text-[11px] text-gray-500 mt-1">{fmtDate(a.tanggal, "d MMMM yyyy")}</p>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {calc.records.map((r) => {
              const Icon = r.icon;
              return (
                <Card key={r.id} className="flex items-center gap-3">
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-surface-light text-primary flex items-center justify-center">
                    <Icon size={18} />
                  </span>
                  <p className="flex-1 min-w-0 text-sm text-gray-200 break-words">{tx(r.label)}</p>
                  <p className="text-sm font-semibold text-primary shrink-0 text-right">{tx(r.value)}</p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
