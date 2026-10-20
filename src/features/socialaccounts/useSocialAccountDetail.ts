import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";

export interface AccountMetric {
  id: string;
  account_id: string;
  tanggal: string;
  followers: number | null;
  insight_note: string | null;
}
export interface AccountEarning {
  id: string;
  account_id: string;
  tanggal: string;
  sumber: string;
  nominal: number;
  tipe: string;
  catatan: string | null;
}

export const EARNING_TIPE = ["Brand Deal", "Ad Revenue", "Salary", "Lainnya"];

export function useSocialAccountDetail(accountId: string) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AccountMetric[]>([]);
  const [earnings, setEarnings] = useState<AccountEarning[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [m, e] = await Promise.all([
      db
        .from("social_account_metrics")
        .select("*")
        .eq("account_id", accountId)
        .order("tanggal", { ascending: false }),
      db
        .from("social_account_earnings")
        .select("*")
        .eq("account_id", accountId)
        .order("tanggal", { ascending: false }),
    ]);
    if (m.data) setMetrics(m.data as AccountMetric[]);
    if (e.data) setEarnings(e.data as AccountEarning[]);
    setLoading(false);
  }, [user, accountId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addMetric = async (
    followers: number | null,
    insight_note: string,
    tanggal: string,
  ) => {
    if (!user) return;
    await db
      .from("social_account_metrics")
      .insert({
        account_id: accountId,
        user_id: user.id,
        followers,
        insight_note,
        tanggal,
      });
    await fetchAll();
  };
  const deleteMetric = async (id: string) => {
    await db.from("social_account_metrics").delete().eq("id", id);
    await fetchAll();
  };

  const addEarning = async (
    sumber: string,
    nominal: number,
    tipe: string,
    tanggal: string,
    catatan: string,
  ) => {
    if (!user) return;
    await db
      .from("social_account_earnings")
      .insert({
        account_id: accountId,
        user_id: user.id,
        sumber,
        nominal,
        tipe,
        tanggal,
        catatan,
      });
    await fetchAll();
  };
  const deleteEarning = async (id: string) => {
    await db.from("social_account_earnings").delete().eq("id", id);
    await fetchAll();
  };

  const totalEarnings = earnings.reduce((sum, e) => sum + e.nominal, 0);
  const latestFollowers = metrics[0]?.followers ?? null;

  return {
    metrics,
    earnings,
    loading,
    addMetric,
    deleteMetric,
    addEarning,
    deleteEarning,
    totalEarnings,
    latestFollowers,
  };
}
