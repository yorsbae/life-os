import { useCallback, useEffect, useState } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { toDateStr } from "../../utils/dates";

export interface FocusSession {
  id: string;
  task_id: string | null;
  mode: string;
  durasi_target: number;
  durasi_aktual: number;
  selesai: boolean;
  tanggal: string;
}

export function useFocusSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db
      .from("focus_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error) setSessions(data as FocusSession[]);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSessions();
  }, [fetchSessions]);

  const logSession = async (s: Omit<FocusSession, "id" | "tanggal">) => {
    if (!user) return;
    await db
      .from("focus_sessions")
      .insert({ ...s, user_id: user.id, tanggal: toDateStr() });
    await fetchSessions();
  };

  const today = toDateStr();
  const todays = sessions.filter((s) => s.tanggal === today);
  const todayMinutes = todays.reduce((a, s) => a + s.durasi_aktual, 0);

  return { sessions, todays, todayMinutes, logSession };
}
