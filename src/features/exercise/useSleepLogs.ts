import { useCallback, useEffect, useState } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { toDateStr } from "../../utils/dates";

import { t } from "../../lib/i18n";
export interface SleepLog {
  id: string;
  user_id: string;
  tanggal: string;
  jam: number;
}

export function useSleepLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db
      .from("sleep_logs")
      .select("*")
      .order("tanggal", { ascending: false })
      .limit(120);
    if (!error) setLogs(data as SleepLog[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, [fetchLogs]);

  /** Simpan jam tidur untuk satu tanggal (satu catatan per tanggal; menimpa yang lama). */
  const saveSleep = async (jam: number, tanggal: string = toDateStr()) => {
    if (!user) return { error: t("Database belum siap") };
    const { error } = await db
      .from("sleep_logs")
      .upsert({ user_id: user.id, tanggal, jam }, { onConflict: "user_id,tanggal" });
    if (error) return { error: error.message };
    await fetchLogs();
    return { error: null };
  };

  const deleteSleep = async (id: string) => {
    await db.from("sleep_logs").delete().eq("id", id);
    await fetchLogs();
  };

  const latest = logs[0] ?? null;
  const last7 = logs.slice(0, 7);
  const avg7 = last7.length ? last7.reduce((s, l) => s + l.jam, 0) / last7.length : null;

  return { logs, loading, latest, avg7, saveSleep, deleteSleep };
}
