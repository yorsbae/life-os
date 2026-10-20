import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import type { BudgetTarget, BudgetTargetInput } from "../../types";

// Ubah objek Date jadi format YYYY-MM-01 (mewakili 1 bulan penuh)
export function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export function useBudgetTarget(selectedMonth: Date) {
  const { user } = useAuth();
  const [target, setTarget] = useState<BudgetTarget | null>(null);
  const [loading, setLoading] = useState(true);

  const monthKey = toMonthKey(selectedMonth);

  const fetchTarget = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await db
      .from("budget_targets")
      .select("*")
      .eq("bulan", monthKey)
      .maybeSingle();

    if (!error) setTarget(data as BudgetTarget | null);
    setLoading(false);
  }, [user, monthKey]);

  useEffect(() => {
    fetchTarget();
  }, [fetchTarget]);

  const saveTarget = async (input: Partial<BudgetTargetInput>) => {
    if (!user) return { error: "Belum login" };

    const { error } = await db
      .from("budget_targets")
      .upsert(
        { user_id: user.id, bulan: monthKey, ...input },
        { onConflict: "user_id,bulan" },
      );

    if (error) return { error: error.message };
    await fetchTarget();
    return { error: null };
  };

  return { target, loading, saveTarget };
}
