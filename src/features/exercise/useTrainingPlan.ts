import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { getWeekTemplate, remapWeekToRestDays, PLAN_LABELS, type PlanTipe } from "./trainingTemplates";
import { parseDateStr, toDateStr } from "../../utils/dates";
import { addDays, currentPlanWeek, dayToMondayOffset, startOfWeekMonday } from "./planDates";

// Semua perhitungan tanggal memakai tanggal LOKAL. Versi lama memakai toISOString() (UTC): di WIB
// sebelum pukul 07.00 tanggalnya mundur sehari, sehingga program mulai di hari Minggu dan sesi
// "hari ini" yang tampil sebenarnya sesi kemarin.
import { t } from "../../lib/i18n";

export interface TrainingPlan {
  id: string;
  user_id: string;
  judul: string;
  tipe: PlanTipe;
  durasi_minggu: number;
  tanggal_mulai: string;
  /** Hari istirahat memakai penomoran Date.getDay(): 0 = Minggu ... 6 = Sabtu. */
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

// Pembuatan sesi dijalankan berurutan: dua pemanggil bersamaan (mis. widget Beranda dan halaman Plan)
// tidak boleh sama-sama menganggap minggu ini belum ada lalu membuat sesi ganda.
let lock: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => {});
  return run;
}

async function generateWeekSessions(plan: TrainingPlan, userId: string, mingguKe: number, multiplier: number) {
  return exclusive(async () => {
    const exists = await db
      .from("training_plan_sessions")
      .select("id")
      .eq("plan_id", plan.id)
      .eq("minggu_ke", mingguKe)
      .limit(1);
    if (exists.error || ((exists.data ?? []) as unknown[]).length > 0) return;

    const weekStart = addDays(parseDateStr(plan.tanggal_mulai), (mingguKe - 1) * 7);
    // Template memakai offset dari Senin; pilihan pengguna memakai getDay() -> konversi dulu.
    const restOffsets = (plan.hari_istirahat ?? []).map(dayToMondayOffset);
    const template = remapWeekToRestDays(getWeekTemplate(plan.tipe, mingguKe), restOffsets);

    const rows = template.map((s) => ({
      plan_id: plan.id,
      user_id: userId,
      minggu_ke: mingguKe,
      tanggal: toDateStr(addDays(weekStart, s.hariOffset)),
      tipe: s.tipe,
      sub_kategori: s.sub_kategori,
      target_durasi: s.target_durasi ? Math.round(s.target_durasi * multiplier) : null,
      target_jarak: s.target_jarak ? Math.round(s.target_jarak * multiplier * 10) / 10 : null,
      intensity_multiplier: multiplier,
      gerakan: s.gerakan ?? null,
    }));
    if (rows.length > 0) await db.from("training_plan_sessions").insert(rows);
  });
}

const doneKey = (tanggal: string, tipe: string) => `${tanggal}|${tipe}`;

export function useTrainingPlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [sessions, setSessions] = useState<PlanSession[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;

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
      setDone(new Set());
      setLoading(false);
      return;
    }
    const p = planData as TrainingPlan;

    const fetchSessions = async () => {
      const { data } = await db
        .from("training_plan_sessions")
        .select("*")
        .eq("plan_id", p.id)
        .order("tanggal", { ascending: true });
      // Buang duplikat (sisa dari versi lama yang bisa membuat sesi ganda): satu sesi per tanggal+tipe+nama.
      const seen = new Set<string>();
      return ((data ?? []) as PlanSession[]).filter((s) => {
        const k = `${s.tanggal}|${s.tipe}|${s.sub_kategori}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    };
    // Hanya dua kolom, hanya sejak program dimulai (bukan seluruh riwayat olahraga).
    const fetchDone = async () => {
      const { data } = await db.from("exercises").select("tanggal, tipe").gte("tanggal", p.tanggal_mulai);
      return new Set(((data ?? []) as { tanggal: string; tipe: string }[]).map((e) => doneKey(e.tanggal, e.tipe)));
    };

    const [firstList, doneSet] = await Promise.all([fetchSessions(), fetchDone()]);
    let list = firstList;

    // Pastikan minggu berjalan sudah dibuat; selesaikan program bila durasinya habis.
    const week = Math.max(1, currentPlanWeek(p.tanggal_mulai, new Date()));
    if (week > p.durasi_minggu) {
      await db.from("training_plans").update({ status: "Selesai" }).eq("id", p.id);
      setPlan(null);
      setSessions([]);
      setDone(new Set());
      setLoading(false);
      return;
    }
    if (!list.some((s) => s.minggu_ke === week)) {
      // Coaching sederhana: intensitas minggu ini ditentukan kepatuhan minggu lalu.
      // Hari istirahat tidak dihitung (bukan sesi yang harus diselesaikan).
      const lastWeek = list.filter((s) => s.minggu_ke === week - 1 && s.tipe !== "Rest");
      let multiplier = 1.0;
      if (lastWeek.length > 0) {
        const prev = lastWeek[0].intensity_multiplier ?? 1.0;
        const ratio = lastWeek.filter((s) => doneSet.has(doneKey(s.tanggal, s.tipe))).length / lastWeek.length;
        if (ratio >= 0.9) multiplier = Math.min(1.3, prev + 0.1);
        else if (ratio < 0.6) multiplier = Math.max(0.7, prev - 0.15);
        else multiplier = prev;
      }
      await generateWeekSessions(p, user.id, week, multiplier);
      list = await fetchSessions();
    }

    setPlan(p);
    setSessions(list);
    setDone(doneSet);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Mulai plan baru: minggu 1 dibuat langsung, minggu berikutnya dibuat saat tiba (lihat load()).
  const startPlan = async (tipe: PlanTipe, durasiMinggu: number, hariIstirahat: number[]) => {
    if (!user) return { error: t("Belum login") };
    const judul = PLAN_LABELS[tipe].label;

    const { data: newPlan, error } = await db
      .from("training_plans")
      .insert({
        user_id: user.id,
        judul,
        tipe,
        durasi_minggu: durasiMinggu,
        tanggal_mulai: toDateStr(startOfWeekMonday(new Date())),
        hari_istirahat: hariIstirahat,
        status: "Aktif",
      })
      .select()
      .single();

    if (error || !newPlan) return { error: error?.message ?? t("Gagal membuat plan") };

    await generateWeekSessions(newPlan as TrainingPlan, user.id, 1, 1.0);
    await load();
    return { error: null };
  };

  const cancelPlan = async () => {
    if (!plan) return;
    await db.from("training_plans").update({ status: "Dibatalkan" }).eq("id", plan.id);
    await load();
  };

  const getSessionForDate = useCallback(
    (date: Date) => {
      const key = toDateStr(date);
      return sessions.find((s) => s.tanggal === key) ?? null;
    },
    [sessions],
  );

  const isSessionDone = useCallback(
    (session: PlanSession) => done.has(doneKey(session.tanggal, session.tipe)),
    [done],
  );

  return { plan, sessions, loading, startPlan, cancelPlan, getSessionForDate, isSessionDone, refresh: load };
}
