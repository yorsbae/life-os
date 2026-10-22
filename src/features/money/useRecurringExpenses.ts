import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";

import { t } from "../../lib/i18n";
export interface RecurringExpense {
  id: string;
  user_id: string;
  nama: string;
  nominal: number;
  kategori: string | null;
  tanggal_jatuh_tempo: number;
  aktif: boolean;
}
export type RecurringExpenseInput = Omit<RecurringExpense, "id" | "user_id">;

export function useRecurringExpenses() {
  const { user } = useAuth();
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await db
      .from("recurring_expenses")
      .select("*")
      .order("tanggal_jatuh_tempo", { ascending: true });
    if (!error) setItems(data as RecurringExpense[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (input: RecurringExpenseInput) => {
    if (!user) return { error: t("Belum login") };
    const { error } = await db
      .from("recurring_expenses")
      .insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchItems();
    return { error: null };
  };

  const updateItem = async (
    id: string,
    input: Partial<RecurringExpenseInput>,
  ) => {
    const { error } = await db
      .from("recurring_expenses")
      .update(input)
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchItems();
    return { error: null };
  };

  const deleteItem = async (id: string) => {
    await db.from("recurring_expenses").delete().eq("id", id);
    await fetchItems();
  };

  const totalBulanan = items
    .filter((i) => i.aktif)
    .reduce((sum, i) => sum + i.nominal, 0);

  return { items, loading, addItem, updateItem, deleteItem, totalBulanan };
}
