import { useExpenses } from "../../expense/useExpenses";
import { useIncomes } from "../../income/useIncomes";

function formatRupiah(nominal: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(nominal);
}

function isThisMonth(tanggal: string) {
  const d = new Date(tanggal);
  const now = new Date();
  return (
    d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  );
}

export default function FinancialSummaryWidget() {
  const { expenses, loading: loadingExpenses } = useExpenses();
  const { incomes, loading: loadingIncomes } = useIncomes();

  const loading = loadingExpenses || loadingIncomes;

  const totalExpense = expenses
    .filter((e) => isThisMonth(e.tanggal))
    .reduce((sum, e) => sum + e.nominal, 0);
  const totalIncome = incomes
    .filter((i) => isThisMonth(i.tanggal))
    .reduce((sum, i) => sum + i.nominal, 0);
  const saldo = totalIncome - totalExpense;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        Keuangan Bulan Ini
      </h3>

      {loading ? (
        <p className="text-gray-400 text-sm">Memuat...</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Pemasukan</p>
            <p className="font-semibold text-green-600 dark:text-green-400 text-sm">
              {formatRupiah(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Pengeluaran</p>
            <p className="font-semibold text-red-600 dark:text-red-400 text-sm">
              {formatRupiah(totalExpense)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Saldo</p>
            <p
              className={`font-semibold text-sm ${saldo >= 0 ? "text-gray-900 dark:text-white" : "text-red-600 dark:text-red-400"}`}
            >
              {formatRupiah(saldo)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
