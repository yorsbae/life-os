import { useState, type FormEvent } from "react";
import {
  useRecurringExpenses,
  type RecurringExpense,
  type RecurringExpenseInput,
} from "./useRecurringExpenses";
import CurrencyInput from "../../components/ui/CurrencyInput";
import { KATEGORI_EXPENSE } from "../../types";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

const initialForm: RecurringExpenseInput = {
  nama: "",
  nominal: 0,
  kategori: KATEGORI_EXPENSE[0],
  tanggal_jatuh_tempo: 1,
  aktif: true,
};

export default function RecurringExpenseTab() {
  const { items, loading, addItem, updateItem, deleteItem, totalBulanan } =
    useRecurringExpenses();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [form, setForm] = useState<RecurringExpenseInput>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (i: RecurringExpense) => {
    setEditing(i);
    setForm({
      nama: i.nama,
      nominal: i.nominal,
      kategori: i.kategori,
      tanggal_jatuh_tempo: i.tanggal_jatuh_tempo,
      aktif: i.aktif,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (editing) await updateItem(editing.id, form);
    else await addItem(form);
    setIsSubmitting(false);
    cancelForm();
  };

  // Hitung berapa hari lagi jatuh tempo (untuk sorting mental cepat)
  const daysUntilDue = (tanggal: number) => {
    const now = new Date();
    let due = new Date(now.getFullYear(), now.getMonth(), tanggal);
    if (due < now)
      due = new Date(now.getFullYear(), now.getMonth() + 1, tanggal);
    return Math.ceil((due.getTime() - now.getTime()) / 86400000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Recurring Expense
          </h2>
          <p className="text-xs text-gray-400">
            Total/bulan:{" "}
            <span className="text-red-500 font-medium">
              {formatRupiah(totalBulanan)}
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-3 py-1.5 rounded-lg"
        >
          + Tambah
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <input
            type="text"
            required
            placeholder="Nama (misal: Netflix)"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput
              value={form.nominal || null}
              onChange={(v) => setForm({ ...form, nominal: v ?? 0 })}
              placeholder="Nominal/bulan"
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm"
            />
            <input
              type="number"
              min={1}
              max={31}
              placeholder="Tgl jatuh tempo"
              value={form.tanggal_jatuh_tempo}
              onChange={(e) =>
                setForm({
                  ...form,
                  tanggal_jatuh_tempo: Number(e.target.value),
                })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm"
            />
          </div>
          <select
            value={form.kategori ?? ""}
            onChange={(e) => setForm({ ...form, kategori: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm"
          >
            {KATEGORI_EXPENSE.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              {isSubmitting ? "Menyimpan..." : editing ? "Update" : "Simpan"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Memuat...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          Belum ada recurring expense.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div
              key={i.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {i.nama}
                  </span>
                  {!i.aktif && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-full">
                      Nonaktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Tgl {i.tanggal_jatuh_tempo} ·{" "}
                  {daysUntilDue(i.tanggal_jatuh_tempo)} hari lagi
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-red-500 text-sm">
                  {formatRupiah(i.nominal)}
                </span>
                <button
                  onClick={() => updateItem(i.id, { aktif: !i.aktif })}
                  className="text-xs text-gray-500 dark:text-gray-400"
                >
                  {i.aktif ? "Matikan" : "Aktifkan"}
                </button>
                <button
                  onClick={() => startEdit(i)}
                  className="text-xs text-gray-500 dark:text-gray-400"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteItem(i.id)}
                  className="text-xs text-red-500"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
