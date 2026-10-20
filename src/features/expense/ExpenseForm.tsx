import { useState, type FormEvent } from "react";
import { KATEGORI_EXPENSE, type Expense, type ExpenseInput } from "../../types";
import CurrencyInput from "../../components/ui/CurrencyInput";

interface ExpenseFormProps {
  onSubmit: (input: ExpenseInput) => Promise<{ error: string | null }>;
  editingExpense?: Expense | null;
  onCancelEdit?: () => void;
}

const initialForm: ExpenseInput = {
  nominal: 0,
  kategori: "Makan",
  metode_pembayaran: "",
  catatan: "",
  tanggal: new Date().toISOString().split("T")[0],
};

const inputClass =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500";

export default function ExpenseForm({
  onSubmit,
  editingExpense,
  onCancelEdit,
}: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseInput>(
    editingExpense
      ? {
          nominal: editingExpense.nominal,
          kategori: editingExpense.kategori,
          metode_pembayaran: editingExpense.metode_pembayaran,
          catatan: editingExpense.catatan,
          tanggal: editingExpense.tanggal,
        }
      : initialForm,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const { error } = await onSubmit(form);
    if (error) {
      setError(error);
      setIsSubmitting(false);
      return;
    }
    if (!editingExpense) setForm(initialForm);
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4"
    >
      <h2 className="font-semibold text-gray-900 dark:text-white">
        {editingExpense ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
      </h2>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nominal
          </label>
          <CurrencyInput
            value={form.nominal || null}
            onChange={(val) => setForm({ ...form, nominal: val ?? 0 })}
            className={inputClass}
            placeholder="50.000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kategori
          </label>
          <select
            value={form.kategori}
            onChange={(e) =>
              setForm({
                ...form,
                kategori: e.target.value as ExpenseInput["kategori"],
              })
            }
            className={inputClass}
          >
            {KATEGORI_EXPENSE.map((kat) => (
              <option key={kat} value={kat}>
                {kat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Metode Bayar
          </label>
          <input
            type="text"
            value={form.metode_pembayaran ?? ""}
            onChange={(e) =>
              setForm({ ...form, metode_pembayaran: e.target.value })
            }
            className={inputClass}
            placeholder="Cash, QRIS, Debit..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tanggal
          </label>
          <input
            type="date"
            required
            value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Catatan
        </label>
        <textarea
          value={form.catatan ?? ""}
          onChange={(e) => setForm({ ...form, catatan: e.target.value })}
          rows={2}
          className={inputClass}
          placeholder="Opsional..."
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {isSubmitting ? "Menyimpan..." : editingExpense ? "Update" : "Simpan"}
        </button>
        {editingExpense && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}
