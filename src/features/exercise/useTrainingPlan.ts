import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { useExercises } from "./useExercises";
import {
  getWeekTemplate,
  remapWeekToRestDays,
  PLAN_LABELS,
  type PlanTipe,
} from "./trainingTemplates";

import { t } from "../../lib/i18n";
export interface TrainingPlan {
  id: string;
  user_id: string;
  judul: string;
  tipe: PlanTipe;
  durasi_minggu: number;
  tanggal_mulai: string;
  hari_istirahat: number[];
  status: "Aktif" | "Selesai" | "Dibatalkan";
}

export interface PlanSession {
  id: string;
  plan_id: string;
  minggu_ke: number;
  tanggal: string;
  tipe: string;
  sub_kategori: string;
  target_durasi: number | null;
  target_jarak: number | null;
  intensity_multiplier: number;
  gerakan: string | null;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function dateKey(d: Date) {
  return d.toISOString().split("T")[0];
}
function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function useTrainingPlan() {
  const { user } = useAuth();
  const { exercises } = useExercises();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [sessions, setSessions] = useState<PlanSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivePlan = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: planData } = await db
      .from("training_plans")
      .select("*")
      .eq("status", "Aktif")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!planData) {
      setPlan(null);
      setSessions([]);
      setLoading(false);
      return;
    }

    setPlan(planData as TrainingPlan);

    const { data: sessionData } = await db
      .from("training_plan_sessions")
      .select("*")
      .eq("plan_id", planData.id)
      .order("tanggal", { ascending: true });

    setSessions((sessionData as PlanSession[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchActivePlan();
  }, [fetchActivePlan]);

  // Mulai plan baru: generate minggu 1 langsung, minggu berikutnya di-generate lazy
  const startPlan = async (
    tipe: PlanTipe,
    durasiMinggu: number,
    hariIstirahat: number[],
  ) => {
    if (!user) return { error: t("Belum login") };

    const tanggalMulai = startOfWeekMonday(new Date());
    const judul = PLAN_LABELS[tipe].label;

    const { data: newPlan, error } = await db
      .from("training_plans")
      .insert({
        user_id: user.id,
        judul,
        tipe,
        durasi_minggu: durasiMinggu,
        tanggal_mulai: dateKey(tanggalMulai),
        hari_istirahat: hariIstirahat,
        status: "Aktif",
      })
      .select()
      .single();

    if (error || !newPlan)
      return { error: error?.message ?? t("Gagal membuat plan") };

    await generateWeekSessions(newPlan as TrainingPlan, 1, 1.0);
    await fetchActivePlan();
    return { error: null };
  };

  const generateWeekSessions = async (
    planObj: TrainingPlan,
    mingguKe: number,
    multiplier: number,
  ) => {
    if (!user) return;
    const weekStart = addDays(
      new Date(planObj.tanggal_mulai),
      (mingguKe - 1) * 7,
    );
    const rawTemplate = getWeekTemplate(planObj.tipe, mingguKe);
    // Petakan ulang sesuai hari Rest pilihan user (bukan Rest default program)
    const template = remapWeekToRestDays(
      rawTemplate,
      planObj.hari_istirahat ?? [],
    );

    const rows = template.map((t) => ({
      plan_id: planObj.id,
      user_id: user.id,
      minggu_ke: mingguKe,
      tanggal: dateKey(addDays(weekStart, t.hariOffset)),
      tipe: t.tipe,
      sub_kategori: t.sub_kategori,
      target_durasi: t.target_durasi
        ? Math.round(t.target_durasi * multiplier)
        : null,
      target_jarak: t.target_jarak
        ? Math.round(t.target_jarak * multiplier * 10) / 10
        : null,
      intensity_multiplier: multiplier,
      gerakan: t.gerakan ?? null,
    }));

    await db.from("training_plan_sessions").insert(rows);
  };

  // Cek apakah minggu sekarang sudah di-generate. Kalau belum DAN minggu sebelumnya sudah lewat,
  // hitung tingkat kepatuhan minggu lalu lalu tentukan multiplier minggu ini (INI bagian "coaching"-nya)
  const ensureCurrentWeekGenerated = useCallback(async () => {
    if (!plan || plan.status !== "Aktif") return;

    const today = new Date();
    const mingguSekarang =
      Math.floor(
        (today.getTime() - new Date(plan.tanggal_mulai).getTime()) /
          (7 * 86400000),
      ) + 1;

    if (mingguSekarang > plan.durasi_minggu) {
      // Plan sudah selesai durasinya
      await db
        .from("training_plans")
        .update({ status: "Selesai" })
        .eq("id", plan.id);
      await fetchActivePlan();
      return;
    }

    const sudahAda = sessions.some((s) => s.minggu_ke === mingguSekarang);
    if (sudahAda) return;

    // Hitung kepatuhan minggu sebelumnya: berapa % sesi yang direncanakan match dengan log Exercise asli
    const sesiMingguLalu = sessions.filter(
      (s) => s.minggu_ke === mingguSekarang - 1,
    );
    let multiplierBaru = 1.0;
    // Rest day sengaja TIDAK dihitung di sini - itu bukan sesi yang "harus diselesaikan",
    // jadi tidak boleh bikin persentase kepatuhan keliatan rendah padahal semua sesi latihan
    // beneran sudah selesai dijalani
    const sesiLatihanMingguLalu = sesiMingguLalu.filter(
      (s) => s.tipe !== "Rest",
    );
    if (sesiLatihanMingguLalu.length > 0) {
      const multiplierLalu =
        sesiLatihanMingguLalu[0]?.intensity_multiplier ?? 1.0;
      const selesai = sesiLatihanMingguLalu.filter((s) =>
        exercises.some((e) => e.tanggal === s.tanggal && e.tipe === s.tipe),
      ).length;
      const persenSelesai = selesai / sesiLatihanMingguLalu.length;

      if (persenSelesai >= 0.9)
        multiplierBaru = Math.min(1.3, multiplierLalu + 0.1);
      else if (persenSelesai < 0.6)
        multiplierBaru = Math.max(0.7, multiplierLalu - 0.15);
      else multiplierBaru = multiplierLalu;
    }

    await generateWeekSessions(plan, mingguSekarang, multiplierBaru);
    await fetchActivePlan();
  }, [plan, sessions, exercises]);

  useEffect(() => {
    if (plan && !loading) ensureCurrentWeekGenerated();
  }, [plan?.id, loading]);

  const cancelPlan = async () => {
    if (!plan) return;
    await db
      .from("training_plans")
      .update({ status: "Dibatalkan" })
      .eq("id", plan.id);
    await fetchActivePlan();
  };

  const getSessionForDate = useCallback(
    (date: Date) => sessions.find((s) => s.tanggal === dateKey(date)) ?? null,
    [sessions],
  );

  const isSessionDone = useCallback(
    (session: PlanSession) =>
      exercises.some(
        (e) => e.tanggal === session.tanggal && e.tipe === session.tipe,
      ),
    [exercises],
  );

  return {
    plan,
    sessions,
    loading,
    startPlan,
    cancelPlan,
    getSessionForDate,
    isSessionDone,
  };
}
