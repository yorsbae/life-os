import { useExpenses } from "../../expense/useExpenses";
import { useIncomes } from "../../income/useIncomes";
import { useExercises } from "../../exercise/useExercises";
import { useLearnings } from "../../learning/useLearnings";

interface FeedItem {
  id: string;
  tanggal: string;
  label: string;
  detail: string;
  color: string;
}

function formatTanggal(tanggal: string) {
  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export default function RecentActivityWidget() {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { exercises } = useExercises();
  const { learnings } = useLearnings();

  const feed: FeedItem[] = [
    ...expenses.map((e) => ({
      id: `expense-${e.id}`,
      tanggal: e.tanggal,
      label: "Pengeluaran",
      detail: `${e.kategori} - Rp${e.nominal.toLocaleString("id-ID")}`,
      color: "bg-red-500",
    })),
    ...incomes.map((i) => ({
      id: `income-${i.id}`,
      tanggal: i.tanggal,
      label: "Pemasukan",
      detail: `${i.sumber} - Rp${i.nominal.toLocaleString("id-ID")}`,
      color: "bg-green-500",
    })),
    ...exercises.map((ex) => ({
      id: `exercise-${ex.id}`,
      tanggal: ex.tanggal,
      label: "Latihan",
      detail: ex.sub_kategori,
      color: "bg-orange-500",
    })),
    ...learnings.map((l) => ({
      id: `learning-${l.id}`,
      tanggal: l.tanggal,
      label: "Belajar",
      detail: l.topik,
      color: "bg-blue-500",
    })),
  ]
    .sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
    )
    .slice(0, 8);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        Aktivitas Terakhir
      </h3>

      {feed.length === 0 ? (
        <p className="text-gray-400 text-sm">Belum ada aktivitas tercatat.</p>
      ) : (
        <div className="space-y-3">
          {feed.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full shrink-0 ${item.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white truncate">
                  {item.detail}
                </p>
                <p className="text-xs text-gray-400">{item.label}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {formatTanggal(item.tanggal)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
