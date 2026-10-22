import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import type { Activity, ActivityInput } from "../../types";

import { t } from "../../lib/i18n";
export function useActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error } = await db
      .from("activities")
      .select("*")
      .order("tanggal", { ascending: false });

    if (error) setError(error.message);
    else setActivities(data as Activity[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const addActivity = async (input: ActivityInput) => {
    if (!user) return { error: t("Belum login") };
    const { error } = await db
      .from("activities")
      .insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchActivities();
    return { error: null };
  };

  const updateActivity = async (id: string, input: ActivityInput) => {
    const { error } = await db
      .from("activities")
      .update(input)
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchActivities();
    return { error: null };
  };

  const deleteActivity = async (id: string) => {
    const { error } = await db.from("activities").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchActivities();
    return { error: null };
  };

  return {
    activities,
    loading,
    error,
    addActivity,
    updateActivity,
    deleteActivity,
  };
}
