import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import type { Income, IncomeInput } from "../../types";

import { t } from "../../lib/i18n";
export function useIncomes() {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncomes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error } = await db
      .from("incomes")
      .select("*")
      .order("tanggal", { ascending: false });

    if (error) setError(error.message);
    else setIncomes(data as Income[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const addIncome = async (input: IncomeInput) => {
    if (!user) return { error: t("Belum login") };
    const { error } = await db
      .from("incomes")
      .insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchIncomes();
    return { error: null };
  };

  const updateIncome = async (id: string, input: IncomeInput) => {
    const { error } = await db.from("incomes").update(input).eq("id", id);
    if (error) return { error: error.message };
    await fetchIncomes();
    return { error: null };
  };

  const deleteIncome = async (id: string) => {
    const { error } = await db.from("incomes").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchIncomes();
    return { error: null };
  };

  return { incomes, loading, error, addIncome, updateIncome, deleteIncome, refetch: fetchIncomes };
}
