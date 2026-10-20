import { useState } from "react";
import { useExpenses } from "./useExpenses";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import type { Expense, ExpenseInput } from "../../types";

interface ExpensePageProps {
  embedded?: boolean; // true kalau dipakai di dalam tab Money - skip wrapper & judul duplikat
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function ExpensePage({ embedded = false }: ExpensePageProps) {
  const { expenses, loading, addExpense, updateExpense, deleteExpense } =
    useExpenses();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleSubmit = async (input: ExpenseInput) => {
    if (editingExpense) {
      const result = await updateExpense(editingExpense.id, input);
      if (!result.error) setEditingExpense(null);
      return result;
    }
    return addExpense(input);
  };

  const totalBulanIni = expenses
    .filter((e) => {
      const d = new Date(e.tanggal);
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, e) => sum + e.nominal, 0);

  const content = (
    <>
      {!embedded && (
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Pengeluaran
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total bulan ini:{" "}
            <span className="font-semibold text-red-600 dark:text-red-400">
              {formatRupiah(totalBulanIni)}
            </span>
          </p>
        </div>
      )}

      <ExpenseForm
        onSubmit={handleSubmit}
        editingExpense={editingExpense}
        onCancelEdit={() => setEditingExpense(null)}
      />
      <ExpenseList
        expenses={expenses}
        loading={loading}
        onEdit={setEditingExpense}
        onDelete={deleteExpense}
      />
    </>
  );

  if (embedded) return <div className="space-y-6">{content}</div>;

  return <div className="max-w-2xl mx-auto p-4 space-y-6">{content}</div>;
}
