import { useMemo, useState } from "react";
import { addDays, differenceInCalendarDays, startOfWeek, subDays } from "date-fns";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { Card, Chip, EmptyState, SectionTitle } from "../../components/ui/Controls";
import { Ring } from "../../components/ui/Progress";
import { BarChart, LineChart, type ChartPoint } from "../../components/Analytics/Charts";
import { useTasks } from "../plan/useTasks";
import { useHabits } from "../habit/useHabits";
import { useExercises } from "../exercise/useExercises";
import { useWeeklyTarget } from "../exercise/useWeeklyTarget";
import { useExpenses } from "../expense/useExpenses";
import { useIncomes } from "../income/useIncomes";
import { useLearnings } from "../learning/useLearnings";
import { useFocusSessions } from "../focus/useFocusSessions";
import { t, tx } from "../../lib/i18n";
import { fmtDate, num, rupiah } from "../../utils/format";
import { toDateStr } from "../../utils/dates";
import { rupiahCompact as compactMoney } from "../../utils/compactMoney";

type View = "overview" | "money" | "activity";
type Range = "7" | "30" | "90" | "custom";

export default function AnalyticsPage() {
  const [view, setView] = useState<View>("overview");
  const [range, setRange] = useState<Range>("7");
  const [from, setFrom] = useState(toDateStr(subDays(new Date(), 13)));
  const [to, setTo] = useState(toDateStr());

  const { tasks } = useTasks();
  const { habits, valueOn } = useHabits();
  const { exercises } = useExercises();
  const { target: weeklyTarget } = useWeeklyTarget();
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { learnings } = useLearnings();
  const { sessions } = useFocusSessions();

  const { start, end } = useMemo(() => {
    if (range === "custom") return { start: from <= to ? from : to, end: from <= to ? to : from };
    return { start: toDateStr(subDays(new Date(), Number(range) - 1)), end: toDateStr() };
  }, [range, from, to]);

  const days = useMemo(() => {
    const n = Math.min(366, differenceInCalendarDays(new Date(end + "T00:00:00"), new Date(start + "T00:00:00")) + 1);
    return Array.from({ length: Math.max(1, n) }, (_, i) => toDateStr(addDays(new Date(start + "T00:00:00"), i)));
  }, [start, end]);
  const inRange = (d: string) => d >= start && d <= end;

  // ===== Life Overview =====
  const periodTasks = tasks.filter((x) => x.tanggal_mulai && inRange(x.tanggal_mulai));
  const tasksDone = periodTasks.filter((x) => x.status === "Selesai").length;
  const habitTotal = habits.length * days.length;
  const habitDone = habits.reduce((s, h) => s + days.filter((d) => valueOn(h.id, d) >= h.target_harian).length, 0);
  const periodExercises = exercises.filter((e) => inRange(e.tanggal));
  const exerciseTarget = Math.max(1, Math.round((weeklyTarget * days.length) / 7));
  const spent = expenses.filter((e) => inRange(e.tanggal)).reduce((s, e) => s + e.nominal, 0);

  const parts = [
    { done: tasksDone, total: periodTasks.length },
    { done: habitDone, total: habitTotal },
    { done: Math.min(periodExercises.length, exerciseTarget), total: exerciseTarget },
  ].filter((p) => p.total > 0);
  const overall = parts.length ? Math.round((parts.reduce((s, p) => s + p.done / p.total, 0) / parts.length) * 100) : 0;

  const perDay = (fn: (d: string) => number): ChartPoint[] =>
    days.map((d) => ({ label: fmtDate(d, days.length > 14 ? "d/M" : "EEE"), value: fn(d) }));

  // Skor aktivitas harian: tugas selesai + habit selesai + sesi olahraga + sesi fokus
  const activityScore = perDay((d) =>
    tasks.filter((x) => x.tanggal_mulai === d && x.status === "Selesai").length +
    habits.filter((h) => valueOn(h.id, d) >= h.target_harian).length +
    exercises.filter((e) => e.tanggal === d).length +
    sessions.filter((s) => s.tanggal === d).length,
  );

  // ===== Money =====
  const periodIncome = incomes.filter((i) => inRange(i.tanggal)).reduce((s, i) => s + i.nominal, 0);
  const expPerDay = perDay((d) => expenses.filter((e) => e.tanggal === d).reduce((s, e) => s + e.nominal, 0));
  const perKategori = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expenses) if (inRange(e.tanggal)) m[e.kategori] = (m[e.kategori] ?? 0) + e.nominal;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, start, end]);

  // ===== Activity =====
  const focusMinutes = sessions.filter((s) => inRange(s.tanggal)).reduce((s, x) => s + x.durasi_aktual, 0);
  const learnMinutes = learnings.filter((l) => inRange(l.tanggal)).reduce((s, l) => s + (l.durasi ?? 0), 0);
  const exerciseMinutes = periodExercises.reduce((s, e) => s + (e.durasi ?? 0), 0);
  const focusPerDay = perDay((d) => sessions.filter((s) => s.tanggal === d).reduce((a, s) => a + s.durasi_aktual, 0));
  const workoutsPerWeek: ChartPoint[] = useMemo(() => {
    const weeks = new Map<string, number>();
    for (const e of periodExercises) {
      const k = toDateStr(startOfWeek(new Date(e.tanggal + "T00:00:00"), { weekStartsOn: 1 }));
      weeks.set(k, (weeks.get(k) ?? 0) + 1);
    }
    return [...weeks.entries()].sort().map(([k, v]) => ({ label: fmtDate(k, "d/M"), value: v }));
  }, [periodExercises]);

  const legend = [
    { label: t("Tugas"), value: `${tasksDone}/${periodTasks.length}` },
    { label: t("Kebiasaan"), value: `${habitDone}/${habitTotal}` },
    { label: t("Olahraga"), value: `${Math.min(periodExercises.length, 99)}/${exerciseTarget}` },
    { label: t("Pengeluaran"), value: rupiah(spent) },
  ];

  const ranges: { key: Range; label: string }[] = [
    { key: "7", label: "7D" },
    { key: "30", label: "30D" },
    { key: "90", label: "90D" },
    { key: "custom", label: t("Kustom") },
  ];

  return (
    <div>
      <PageHeader title={t("Wawasan")} />
      <div className="px-4 space-y-4">
        <Segmented
          options={[
            { key: "overview", label: t("Ikhtisar Hidup") },
            { key: "money", label: t("Uang") },
            { key: "activity", label: t("Aktivitas") },
          ]}
          value={view}
          onChange={setView}
        />
        <Segmented options={ranges} value={range} onChange={setRange} />
        {range === "custom" && (
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="input-field" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} />
            <input type="date" className="input-field" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} />
          </div>
        )}

        {view === "overview" && (
          <>
            <Card className="space-y-3">
              <SectionTitle>{t("Rangkuman")}</SectionTitle>
              <div className="flex items-center gap-5">
                <Ring value={overall} max={100} size={104} stroke={10}>
                  <span className="text-xl font-bold text-gray-50">{tx(overall)}%</span>
                </Ring>
                <ul className="flex-1 min-w-0 space-y-1.5">
                  {legend.map((l) => (
                    <li key={l.label} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2 text-gray-300 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <span className="truncate">{tx(l.label)}</span>
                      </span>
                      <span className="text-gray-100 shrink-0">{tx(l.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
            <Card className="space-y-3">
              <SectionTitle>{t("Aktivitas Mingguan")}</SectionTitle>
              <LineChart data={activityScore} ariaLabel={t("Aktivitas Mingguan")} />
            </Card>
          </>
        )}

        {view === "money" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card><p className="text-xs text-gray-400">{t("Pemasukan")}</p><p className="text-base font-bold text-primary mt-1">{rupiah(periodIncome)}</p></Card>
              <Card><p className="text-xs text-gray-400">{t("Pengeluaran")}</p><p className="text-base font-bold text-gray-50 mt-1">{rupiah(spent)}</p></Card>
            </div>
            <Card className="space-y-3">
              <SectionTitle>{t("Pengeluaran per Hari")}</SectionTitle>
              <BarChart data={expPerDay} yFormat={compactMoney} ariaLabel={t("Pengeluaran per Hari")} />
            </Card>
            <div className="space-y-2">
              <SectionTitle>{t("Kategori Pengeluaran")}</SectionTitle>
              {perKategori.length === 0 ? (
                <EmptyState title={t("Belum ada pengeluaran")} />
              ) : (
                perKategori.map(([k, v]) => (
                  <Card key={k} className="!py-3 flex items-center justify-between text-sm">
                    <span className="text-gray-100">{tx(k)}</span>
                    <span className="text-gray-300">{spent ? Math.round((v / spent) * 100) : 0}% · {rupiah(v)}</span>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {view === "activity" && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: t("Fokus"), v: focusMinutes },
                { l: t("Belajar"), v: learnMinutes },
                { l: t("Olahraga"), v: exerciseMinutes },
              ].map((s) => (
                <Card key={s.l} className="text-center !px-2">
                  <p className="text-[11px] text-gray-400">{tx(s.l)}</p>
                  <p className="text-base font-bold text-gray-50 mt-1">{num(s.v, 0)}</p>
                  <p className="text-[10px] text-gray-500">{t("menit")}</p>
                </Card>
              ))}
            </div>
            <Card className="space-y-3">
              <SectionTitle>{t("Menit Fokus per Hari")}</SectionTitle>
              <BarChart data={focusPerDay} ariaLabel={t("Menit Fokus per Hari")} />
            </Card>
            <Card className="space-y-3">
              <SectionTitle>{t("Sesi Olahraga per Minggu")}</SectionTitle>
              {workoutsPerWeek.length === 0 ? <p className="text-xs text-gray-400">{t("Belum ada data")}</p> : <BarChart data={workoutsPerWeek} target={weeklyTarget} yFormat={(v) => num(v, 0)} ariaLabel={t("Sesi Olahraga per Minggu")} />}
            </Card>
            <div className="flex gap-2 flex-wrap">
              <Chip tone="primary">{t("{0} sesi fokus", [sessions.filter((s) => inRange(s.tanggal)).length])}</Chip>
              <Chip tone="primary">{t("{0} tugas selesai", [tasksDone])}</Chip>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
