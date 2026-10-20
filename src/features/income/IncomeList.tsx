import type { Income } from "../../types";

interface IncomeListProps {
  incomes: Income[];
  loading: boolean;
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
}

function formatRupiah(nominal: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(nominal);
}
function formatTanggal(tanggal: string) {
  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function IncomeList({
  incomes,
  loading,
  onEdit,
  onDelete,
}: IncomeListProps) {
  if (loading)
    return (
      <p className="text-gray-400 text-sm py-8 text-center">Memuat data...</p>
    );
  if (incomes.length === 0)
    return (
      <p className="text-gray-400 text-sm py-8 text-center">
        Belum ada pemasukan tercatat.
      </p>
    );

  const handleDelete = (id: string) => {
    if (confirm("Yakin hapus data ini?")) onDelete(id);
  };

  return (
    <div className="space-y-2">
      {incomes.map((income) => (
        <div
          key={income.id}
          className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {income.sumber}
              </span>
              <span className="text-xs text-gray-400">
                {formatTanggal(income.tanggal)}
              </span>
            </div>
            {income.catatan && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {income.catatan}
              </p>
            )}
            {income.kategori && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                {income.kategori}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 ml-4">
            <span className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
              +{formatRupiah(income.nominal)}
            </span>
            <button
              onClick={() => onEdit(income)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(income.id)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Hapus
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
