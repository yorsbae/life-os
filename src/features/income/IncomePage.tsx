import { useState } from "react";
import { useIncomes } from "./useIncomes";
import IncomeForm from "./IncomeForm";
import IncomeList from "./IncomeList";
import type { Income, IncomeInput } from "../../types";

interface IncomePageProps {
  embedded?: boolean;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function IncomePage({ embedded = false }: IncomePageProps) {
  const { incomes, loading, addIncome, updateIncome, deleteIncome } =
    useIncomes();
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const handleSubmit = async (input: IncomeInput) => {
    if (editingIncome) {
      const result = await updateIncome(editingIncome.id, input);
      if (!result.error) setEditingIncome(null);
      return result;
    }
    return addIncome(input);
  };

  const totalBulanIni = incomes
    .filter((i) => {
      const d = new Date(i.tanggal);
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, i) => sum + i.nominal, 0);

  const content = (
    <>
      {!embedded && (
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Pemasukan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total bulan ini:{" "}
            <span className="font-semibold text-green-600 dark:text-green-400">
              {formatRupiah(totalBulanIni)}
            </span>
          </p>
        </div>
      )}

      <IncomeForm
        onSubmit={handleSubmit}
        editingIncome={editingIncome}
        onCancelEdit={() => setEditingIncome(null)}
      />
      <IncomeList
        incomes={incomes}
        loading={loading}
        onEdit={setEditingIncome}
        onDelete={deleteIncome}
      />
    </>
  );

  if (embedded) return <div className="space-y-6">{content}</div>;

  return <div className="max-w-2xl mx-auto p-4 space-y-6">{content}</div>;
}
