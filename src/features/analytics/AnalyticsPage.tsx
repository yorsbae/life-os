import { useState, useMemo } from "react";
import { useExpenses } from "../expense/useExpenses";
import { useExercises } from "../exercise/useExercises";
import { useLearnings } from "../learning/useLearnings";
import { useCreativeProjects } from "../creative/useCreativeProjects";
import { useReadings } from "../reading/useReadings";
import { useWeightLogs } from "../profile/useWeightLogs";
import AnalyticsChart from "../../components/Analytics/AnalyticsChart";
import WeightTrendChart from "../../components/Analytics/WeightTrendChart";
import {
  aggregateByPeriod,
  generateInsight,
  type Granularity,
} from "../../utils/analyticsUtils";

const GRANULARITY_OPTIONS: {
  key: Granularity;
  label: string;
  count: number;
}[] = [
  { key: "daily", label: "Harian", count: 7 },
  { key: "weekly", label: "Mingguan", count: 6 },
  { key: "monthly", label: "Bulanan", count: 6 },
];

function isToday(tanggal: string) {
  const d = new Date(tanggal);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function AnalyticsPage() {
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const periodsCount = GRANULARITY_OPTIONS.find(
    (g) => g.key === granularity,
  )!.count;

  const { expenses } = useExpenses();
  const { exercises } = useExercises();
  const { learnings } = useLearnings();
  const { projects } = useCreativeProjects();
  const { readings } = useReadings();
  const { logs: weightLogs } = useWeightLogs();

  // ---- Money: total pengeluaran ----
  const expenseSeries = useMemo(
    () =>
      aggregateByPeriod(
        expenses.map((e) => ({ tanggal: e.tanggal, value: e.nominal })),
        granularity,
        periodsCount,
      ),
    [expenses, granularity, periodsCount],
  );
  const expenseToday = expenses
    .filter((e) => isToday(e.tanggal))
    .reduce((s, e) => s + e.nominal, 0);

  // ---- Body: total km lari ----
  const kmSeries = useMemo(
    () =>
      aggregateByPeriod(
        exercises
          .filter((e) => e.tipe === "Running")
          .map((e) => ({ tanggal: e.tanggal, value: e.jarak ?? 0 })),
        granularity,
        periodsCount,
      ),
    [exercises, granularity, periodsCount],
  );
  const kmToday = exercises
    .filter((e) => e.tipe === "Running" && isToday(e.tanggal))
    .reduce((s, e) => s + (e.jarak ?? 0), 0);

  // ---- Mind & Growth: jumlah topik belajar ----
  const learningSeries = useMemo(
    () =>
      aggregateByPeriod(
        learnings.map((l) => ({ tanggal: l.tanggal, value: 1 })),
        granularity,
        periodsCount,
      ),
    [learnings, granularity, periodsCount],
  );
  const learningToday = learnings.filter((l) => isToday(l.tanggal)).length;

  // ---- Creative Brain: jumlah upload (pakai tanggal_upload, hanya yang sudah ada tanggalnya) ----
  const uploadSeries = useMemo(
    () =>
      aggregateByPeriod(
        projects
          .filter((p) => p.tanggal_upload)
          .map((p) => ({ tanggal: p.tanggal_upload!, value: 1 })),
        granularity,
        periodsCount,
      ),
    [projects, granularity, periodsCount],
  );
  const uploadToday = projects.filter(
    (p) => p.tanggal_upload && isToday(p.tanggal_upload),
  ).length;

  // ---- Reading: jumlah aktivitas update bacaan ----
  const readingSeries = useMemo(
    () =>
      aggregateByPeriod(
        readings.map((r) => ({ tanggal: r.tanggal, value: 1 })),
        granularity,
        periodsCount,
      ),
    [readings, granularity, periodsCount],
  );
  const readingToday = readings.filter((r) => isToday(r.tanggal)).length;

  const calcTotal = (s: { value: number }[]) =>
    s.reduce((sum, i) => sum + i.value, 0);
  const calcAvg = (s: { value: number }[]) =>
    s.length ? calcTotal(s) / s.length : 0;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
        Analytics
      </h1>

      <div className="flex gap-2">
        {GRANULARITY_OPTIONS.map((g) => (
          <button
            key={g.key}
            onClick={() => setGranularity(g.key)}
            className={`text-sm px-3 py-1.5 rounded-lg border ${
              granularity === g.key
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <AnalyticsChart
        title="💰 Money — Pengeluaran"
        series={expenseSeries}
        color="#ef4444"
        unit=""
        today={expenseToday}
        total={calcTotal(expenseSeries)}
        average={calcAvg(expenseSeries)}
        insight={generateInsight(expenseSeries, "", "Pengeluaran")}
      />

      <AnalyticsChart
        title="💪 Body — Jarak Lari (km)"
        series={kmSeries}
        color="#f97316"
        unit=" km"
        today={kmToday}
        total={calcTotal(kmSeries)}
        average={calcAvg(kmSeries)}
        insight={generateInsight(kmSeries, " km", "Jarak lari")}
      />

      <AnalyticsChart
        title="🧠 Mind & Growth — Topik Belajar"
        series={learningSeries}
        color="#3b82f6"
        unit=""
        today={learningToday}
        total={calcTotal(learningSeries)}
        average={calcAvg(learningSeries)}
        insight={generateInsight(learningSeries, "", "Jumlah topik belajar")}
      />

      <AnalyticsChart
        title="🎬 Creative Brain — Upload"
        series={uploadSeries}
        color="#a855f7"
        unit=""
        today={uploadToday}
        total={calcTotal(uploadSeries)}
        average={calcAvg(uploadSeries)}
        insight={generateInsight(uploadSeries, "", "Jumlah upload")}
      />

      <AnalyticsChart
        title="📚 Reading — Aktivitas Baca"
        series={readingSeries}
        color="#3b82f6"
        unit=""
        today={readingToday}
        total={calcTotal(readingSeries)}
        average={calcAvg(readingSeries)}
        insight={generateInsight(readingSeries, "", "Aktivitas membaca")}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          ⚖️ Tren Berat Badan
        </h3>
        <WeightTrendChart logs={weightLogs} />
      </div>
    </div>
  );
}
