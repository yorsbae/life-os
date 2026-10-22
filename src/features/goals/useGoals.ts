import { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { useReadings } from "../reading/useReadings";
import { useExercises } from "../exercise/useExercises";
import { useCreativeProjects } from "../creative/useCreativeProjects";

import { t } from "../../lib/i18n";
export type GoalTipe =
  | "reading_count"
  | "exercise_count"
  | "creative_upload_count"
  | "custom";

export interface Goal {
  id: string;
  user_id: string;
  judul: string;
  tipe: GoalTipe;
  target_value: number;
  current_value_manual: number;
  tanggal_mulai: string;
  tanggal_target: string | null;
  status: "Aktif" | "Tercapai" | "Dibatalkan";
  satuan: string | null;
}
export type GoalInput = Omit<Goal, "id" | "user_id">;

export const GOAL_TIPE_LABEL: Record<GoalTipe, string> = {
  reading_count: "Jumlah buku selesai dibaca",
  exercise_count: "Jumlah sesi olahraga",
  creative_upload_count: "Jumlah konten ter-upload",
  custom: "Custom (update manual)",
};

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const { readings } = useReadings();
  const { exercises } = useExercises();
  const { projects } = useCreativeProjects();

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await db
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setGoals(data as Goal[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = async (input: GoalInput) => {
    if (!user) return { error: t("Belum login") };
    const { error } = await db
      .from("goals")
      .insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchGoals();
    return { error: null };
  };

  const updateGoal = async (id: string, input: Partial<GoalInput>) => {
    const { error } = await db.from("goals").update(input).eq("id", id);
    if (error) return { error: error.message };
    await fetchGoals();
    return { error: null };
  };

  const deleteGoal = async (id: string) => {
    await db.from("goals").delete().eq("id", id);
    await fetchGoals();
  };

  // Hitung progress otomatis berdasarkan tipe goal - ini "coaching pasif" yang kita diskusikan:
  // bukan AI ngomong, tapi progress asli ditarik dari data yang sudah kamu catat sendiri
  const getProgress = useMemo(() => {
    return (goal: Goal): number => {
      const sejakMulai = (tanggal: string) =>
        new Date(tanggal) >= new Date(goal.tanggal_mulai);

      if (goal.tipe === "reading_count") {
        return readings.filter(
          (r) => r.status === "Selesai" && sejakMulai(r.tanggal),
        ).length;
      }
      if (goal.tipe === "exercise_count") {
        return exercises.filter((e) => sejakMulai(e.tanggal)).length;
      }
      if (goal.tipe === "creative_upload_count") {
        return projects.filter(
          (p) => p.tanggal_upload && sejakMulai(p.tanggal_upload),
        ).length;
      }
      return goal.current_value_manual; // tipe 'custom'
    };
  }, [readings, exercises, projects]);

  return { goals, loading, addGoal, updateGoal, deleteGoal, getProgress };
}
