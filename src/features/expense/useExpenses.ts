import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import type { Expense, ExpenseInput } from "../../types";

import { t } from "../../lib/i18n";
export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // READ - ambil semua expense milik user yang sedang login
  const fetchExpenses = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    // Catatan: kita TIDAK perlu tulis .eq('user_id', user.id) secara manual
    // karena Row Level Security (RLS) di Supabase otomatis memfilter
    // hanya baris milik user yang sedang login. Ini querynya:
    const { data, error } = await db
      .from("expenses")
      .select("*")
      .order("tanggal", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setExpenses(data as Expense[]);
    }
    setLoading(false);
  }, [user]);

  // Jalankan fetchExpenses setiap kali komponen yang pakai hook ini dimuat
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // CREATE - tambah expense baru
  const addExpense = async (input: ExpenseInput) => {
    if (!user) return { error: t("Belum login") };

    const { error } = await db
      .from("expenses")
      .insert({ ...input, user_id: user.id }); // user_id wajib disertakan manual saat insert

    if (error) return { error: error.message };

    await fetchExpenses(); // refresh list setelah berhasil tambah
    return { error: null };
  };

  // UPDATE - edit expense yang sudah ada
  const updateExpense = async (id: string, input: ExpenseInput) => {

    const { error } = await db
      .from("expenses")
      .update(input)
      .eq("id", id);

    if (error) return { error: error.message };

    await fetchExpenses();
    return { error: null };
  };

  // DELETE - hapus expense
  const deleteExpense = async (id: string) => {

    const { error } = await db.from("expenses").delete().eq("id", id);

    if (error) return { error: error.message };

    await fetchExpenses();
    return { error: null };
  };

  return { expenses, loading, error, addExpense, updateExpense, deleteExpense };
}
