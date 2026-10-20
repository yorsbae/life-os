import { Link } from "react-router-dom";
import { useRecurringExpenses } from "../../money/useRecurringExpenses";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function daysUntilDue(tanggal: number) {
  const now = new Date();
  let due = new Date(now.getFullYear(), now.getMonth(), tanggal);
  if (due < now) due = new Date(now.getFullYear(), now.getMonth() + 1, tanggal);
  return Math.ceil((due.getTime() - now.getTime()) / 86400000);
}

export default function RecurringExpenseWidget() {
  const { items, loading, totalBulanan } = useRecurringExpenses();

  const aktif = items.filter((i) => i.aktif);
  // Urutkan berdasarkan yang paling dekat jatuh tempo
  const terdekat = [...aktif]
    .sort(
      (a, b) =>
        daysUntilDue(a.tanggal_jatuh_tempo) -
        daysUntilDue(b.tanggal_jatuh_tempo),
    )
    .slice(0, 3);

  if (loading) return null;
  if (aktif.length === 0) return null; // belum ada recurring, tidak usah tampilkan widget kosong

  return (
    <Link
      to="/money"
      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-gray-400 dark:hover:border-gray-500 transition"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          🔁 Recurring Expense
        </h3>
        <span className="text-xs text-gray-400">
          {formatRupiah(totalBulanan)}/bulan
        </span>
      </div>

      <div className="space-y-2">
        {terdekat.map((item) => {
          const days = daysUntilDue(item.tanggal_jatuh_tempo);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-900 dark:text-white truncate">
                {item.nama}
              </span>
              <span
                className={`text-xs shrink-0 ml-2 ${days <= 3 ? "text-yellow-600 dark:text-yellow-400 font-medium" : "text-gray-400"}`}
              >
                {days === 0 ? "Hari ini" : `${days} hari lagi`}
              </span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
