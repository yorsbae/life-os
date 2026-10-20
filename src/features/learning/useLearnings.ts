import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import type { Learning, LearningInput } from "../../types";

export function useLearnings() {
  const { user } = useAuth();
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLearnings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error } = await db
      .from("learnings")
      .select("*")
      .order("tanggal", { ascending: false });

    if (error) setError(error.message);
    else setLearnings(data as Learning[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLearnings();
  }, [fetchLearnings]);

  const addLearning = async (input: LearningInput) => {
    if (!user) return { error: "Belum login" };
    const { error } = await db
      .from("learnings")
      .insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchLearnings();
    return { error: null };
  };

  const updateLearning = async (id: string, input: LearningInput) => {
    const { error } = await db
      .from("learnings")
      .update(input)
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchLearnings();
    return { error: null };
  };

  const deleteLearning = async (id: string) => {
    const { error } = await db.from("learnings").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchLearnings();
    return { error: null };
  };

  return {
    learnings,
    loading,
    error,
    addLearning,
    updateLearning,
    deleteLearning,
  };
}
