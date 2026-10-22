import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";

import { t } from "../../lib/i18n";
export interface WeightLog {
  id: string;
  user_id: string;
  berat: number;
  tanggal: string;
}

export function useWeightLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await db
      .from("body_weight_logs")
      .select("*")
      .order("tanggal", { ascending: false });
    if (!error) setLogs(data as WeightLog[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addLog = async (berat: number, tanggal: string) => {
    if (!user) return { error: t("Belum login") };
    const { error } = await db
      .from("body_weight_logs")
      .insert({ user_id: user.id, berat, tanggal });
    if (error) return { error: error.message };
    await fetchLogs();
    return { error: null };
  };

  const deleteLog = async (id: string) => {
    await db.from("body_weight_logs").delete().eq("id", id);
    await fetchLogs();
  };

  const latestWeight = logs[0]?.berat ?? null;

  return { logs, loading, addLog, deleteLog, latestWeight };
}
