import { useState } from "react";
import { useExpenses } from "../../features/expense/useExpenses";
import { useIncomes } from "../../features/income/useIncomes";
import { useExercises } from "../../features/exercise/useExercises";
import { useLearnings } from "../../features/learning/useLearnings";
import { KATEGORI_EXPENSE } from "../../types";
import CurrencyInput from "../ui/CurrencyInput";

type QuickType = "expense" | "income" | "exercise" | "learning";

const TYPE_OPTIONS: { type: QuickType; label: string; icon: string }[] = [
  { type: "expense", label: "Pengeluaran", icon: "💸" },
  { type: "income", label: "Pemasukan", icon: "💰" },
  { type: "exercise", label: "Latihan", icon: "🏃" },
  { type: "learning", label: "Belajar", icon: "📚" },
];

interface QuickAddModalProps {
  onClose: () => void;
}

const today = new Date().toISOString().split("T")[0];

export default function QuickAddModal({ onClose }: QuickAddModalProps) {
  const [selectedType, setSelectedType] = useState<QuickType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { addExpense } = useExpenses();
  const { addIncome } = useIncomes();
  const { addExercise } = useExercises();
  const { addLearning } = useLearnings();

  // State form per tipe - simpel, cuma field yang penting untuk "quick" entry
  const [expenseForm, setExpenseForm] = useState<{
    nominal: number | null;
    kategori: string;
  }>({ nominal: null, kategori: KATEGORI_EXPENSE[0] });
  const [incomeForm, setIncomeForm] = useState<{
    nominal: number | null;
    sumber: string;
  }>({ nominal: null, sumber: "" });
  const [exerciseForm, setExerciseForm] = useState({
    sub_kategori: "",
    durasi: "",
  });
  const [learningForm, setLearningForm] = useState({ topik: "" });

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);
    let result: { error: string | null } = { error: null };

    if (selectedType === "expense") {
      result = await addExpense({
        nominal: expenseForm.nominal ?? 0,
        kategori: expenseForm.kategori as any,
        metode_pembayaran: null,
        catatan: null,
        tanggal: today,
      });
    } else if (selectedType === "income") {
      result = await addIncome({
        nominal: incomeForm.nominal ?? 0,
        sumber: incomeForm.sumber,
        kategori: null,
        catatan: null,
        tanggal: today,
      });
    } else if (selectedType === "exercise") {
      result = await addExercise({
        tipe: "Running",
        sub_kategori: exerciseForm.sub_kategori,
        durasi: exerciseForm.durasi ? Number(exerciseForm.durasi) : null,
        jarak: null,
        catatan: null,
        tanggal: today,
      });
    } else if (selectedType === "learning") {
      result = await addLearning({
        topik: learningForm.topik,
        materi: null,
        catatan: null,
        tanggal: today,
        durasi: null,
      });
    }

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {!selectedType ? (
          // Step 1: pilih tipe data yang mau ditambahkan
          <>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Tambah Cepat
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => setSelectedType(opt.type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          // Step 2: mini form sesuai tipe yang dipilih
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedType(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ←
              </button>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Tambah{" "}
                {TYPE_OPTIONS.find((o) => o.type === selectedType)?.label}
              </h2>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            {selectedType === "expense" && (
              <div className="space-y-3">
                <CurrencyInput
                  autoFocus
                  placeholder="Nominal"
                  value={expenseForm.nominal}
                  onChange={(val) =>
                    setExpenseForm({ ...expenseForm, nominal: val })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
                />
                <select
                  value={expenseForm.kategori}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, kategori: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
                >
                  {KATEGORI_EXPENSE.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedType === "income" && (
              <div className="space-y-3">
                <CurrencyInput
                  autoFocus
                  placeholder="Nominal"
                  value={incomeForm.nominal}
                  onChange={(val) =>
                    setIncomeForm({ ...incomeForm, nominal: val })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Sumber (misal: Gaji)"
                  value={incomeForm.sumber}
                  onChange={(e) =>
                    setIncomeForm({ ...incomeForm, sumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
                />
              </div>
            )}

            {selectedType === "exercise" && (
              <div className="space-y-3">
                <input
                  type="text"
                  autoFocus
                  placeholder="Jenis latihan (misal: Easy Run)"
                  value={exerciseForm.sub_kategori}
                  onChange={(e) =>
                    setExerciseForm({
                      ...exerciseForm,
                      sub_kategori: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Durasi (menit)"
                  value={exerciseForm.durasi}
                  onChange={(e) =>
                    setExerciseForm({ ...exerciseForm, durasi: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
                />
              </div>
            )}

            {selectedType === "learning" && (
              <div className="space-y-3">
                <input
                  type="text"
                  autoFocus
                  placeholder="Topik yang dipelajari"
                  value={learningForm.topik}
                  onChange={(e) => setLearningForm({ topik: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
