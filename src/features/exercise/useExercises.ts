import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import type { Exercise, ExerciseInput } from "../../types";

export function useExercises() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error } = await db
      .from("exercises")
      .select("*")
      .order("tanggal", { ascending: false });

    if (error) setError(error.message);
    else setExercises(data as Exercise[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const addExercise = async (input: ExerciseInput) => {
    if (!user) return { error: "Belum login" };
    const { error } = await db
      .from("exercises")
      .insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchExercises();
    return { error: null };
  };

  const updateExercise = async (id: string, input: ExerciseInput) => {
    const { error } = await db
      .from("exercises")
      .update(input)
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchExercises();
    return { error: null };
  };

  const deleteExercise = async (id: string) => {
    const { error } = await db.from("exercises").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchExercises();
    return { error: null };
  };

  return {
    exercises,
    loading,
    error,
    addExercise,
    updateExercise,
    deleteExercise,
  };
}
