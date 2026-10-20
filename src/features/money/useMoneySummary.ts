import { useMemo } from "react";
import { useExpenses } from "../expense/useExpenses";
import { useIncomes } from "../income/useIncomes";
import { useBudgetTarget } from "./useBudgetTarget";

function isInMonth(tanggal: string, monthDate: Date) {
  const d = new Date(tanggal);
  return (
    d.getMonth() === monthDate.getMonth() &&
    d.getFullYear() === monthDate.getFullYear()
  );
}

function isCurrentMonth(monthDate: Date) {
  const now = new Date();
  return (
    monthDate.getMonth() === now.getMonth() &&
    monthDate.getFullYear() === now.getFullYear()
  );
}

// monthOffset: 0 = bulan yang sedang dipilih, 1 = 1 bulan sebelum itu, dst
function shiftMonth(date: Date, offset: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() - offset);
  return d;
}

export function useMoneySummary(selectedMonth: Date) {
  const { expenses, loading: le } = useExpenses();
  const { incomes, loading: li } = useIncomes();
  const { target, loading: lt, saveTarget } = useBudgetTarget(selectedMonth);

  const loading = le || li || lt;

  const expenseThisMonth = useMemo(
    () => expenses.filter((e) => isInMonth(e.tanggal, selectedMonth)),
    [expenses, selectedMonth],
  );
  const incomeThisMonth = useMemo(
    () => incomes.filter((i) => isInMonth(i.tanggal, selectedMonth)),
    [incomes, selectedMonth],
  );

  const totalExpense = expenseThisMonth.reduce((sum, e) => sum + e.nominal, 0);
  const totalIncome = incomeThisMonth.reduce((sum, i) => sum + i.nominal, 0);
  const saldo = totalIncome - totalExpense;

  const expensePerKategori = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenseThisMonth)
      map[e.kategori] = (map[e.kategori] ?? 0) + e.nominal;
    return map;
  }, [expenseThisMonth]);

  // Saran otomatis HANYA relevan kalau lagi lihat bulan berjalan (bukan bulan lampau)
  const suggestion = useMemo(() => {
    if (!isCurrentMonth(selectedMonth)) {
      return {
        suggestedSaving: null,
        suggestedBudget: {},
        hasEnoughHistory: false,
      };
    }

    const monthsBack = [1, 2, 3];
    const netPerMonth = monthsBack.map((m) => {
      const monthDate = shiftMonth(selectedMonth, m);
      const inc = incomes
        .filter((i) => isInMonth(i.tanggal, monthDate))
        .reduce((s, i) => s + i.nominal, 0);
      const exp = expenses
        .filter((e) => isInMonth(e.tanggal, monthDate))
        .reduce((s, e) => s + e.nominal, 0);
      return inc - exp;
    });
    const validNet = netPerMonth.filter((n) => n !== 0);
    const suggestedSaving =
      validNet.length > 0
        ? Math.round(validNet.reduce((a, b) => a + b, 0) / validNet.length)
        : null;

    const kategoriTotals: Record<string, number[]> = {};
    for (const m of monthsBack) {
      const monthDate = shiftMonth(selectedMonth, m);
      const expMonth = expenses.filter((e) => isInMonth(e.tanggal, monthDate));
      const perKategori: Record<string, number> = {};
      for (const e of expMonth)
        perKategori[e.kategori] = (perKategori[e.kategori] ?? 0) + e.nominal;
      for (const [kat, val] of Object.entries(perKategori)) {
        if (!kategoriTotals[kat]) kategoriTotals[kat] = [];
        kategoriTotals[kat].push(val);
      }
    }
    const suggestedBudget: Record<string, number> = {};
    for (const [kat, vals] of Object.entries(kategoriTotals)) {
      suggestedBudget[kat] = Math.round(
        (vals.reduce((a, b) => a + b, 0) / vals.length) * 1.1,
      );
    }

    return {
      suggestedSaving,
      suggestedBudget,
      hasEnoughHistory: validNet.length > 0,
    };
  }, [expenses, incomes, selectedMonth]);

  return {
    loading,
    totalExpense,
    totalIncome,
    saldo,
    expensePerKategori,
    target,
    saveTarget,
    suggestion,
  };
}
