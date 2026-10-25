import { useCallback, useEffect, useState } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { addDays } from "date-fns";
import { parseDateStr } from "../../utils/dates";
import { t } from "../../lib/i18n";
import { useExerciseSchedule } from "./useExerciseSchedule";
import { useTrainingPlan } from "./useTrainingPlan";

export interface WorkoutItem {
  key: string;
  tanggal: string;
  /** program = sesi dari Program Latihan aktif, jadwal = jadwal mingguan tetap. */
  source: "program" | "jadwal";
  rest: boolean;
  tipe: string;
  sub_kategori: string | null;
  target_durasi: number | null;
  target_jarak: number | null;
  gerakan: string | null;
  /** Nama program (hanya untuk source = program). */
  programTitle: string | null;
  done: boolean;
}

const doneKey = (tanggal: string, tipe: string) => `${tanggal}|${tipe}`;

/**
 * Agenda latihan per tanggal untuk halaman Plan: sesi Program Latihan aktif bila ada, kalau tidak
 * jadwal mingguan. Status selesai berasal dari catatan olahraga pada tanggal & tipe yang sama,
 * dan `markDone` mencatat latihan dari target sesi sehingga Plan dan Body selalu sinkron.
 *
 * `from`/`to` ('YYYY-MM-DD') membatasi catatan olahraga yang dimuat ke rentang yang sedang tampil.
 */
export function useWorkoutAgenda(from: string, to: string) {
  const { user } = useAuth();
  const { plan, sessions, loading: planLoading } = useTrainingPlan();
  const { schedules, loading: schedLoading } = useExerciseSchedule();
  const [done, setDone] = useState<Set<string>>(new Set());

  const refreshDone = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db.from("exercises").select("tanggal, tipe").gte("tanggal", from).lte("tanggal", to);
    if (error) return;
    setDone(new Set(((data ?? []) as { tanggal: string; tipe: string }[]).map((e) => doneKey(e.tanggal, e.tipe))));
  }, [user, from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshDone();
  }, [refreshDone]);

  const forDate = useCallback(
    (tanggal: string): WorkoutItem | null => {
      const session = sessions.find((s) => s.tanggal === tanggal);
      if (session) {
        return {
          key: `p-${session.id}`,
          tanggal,
          source: "program",
          rest: session.tipe === "Rest",
          tipe: session.tipe,
          sub_kategori: session.sub_kategori,
          target_durasi: session.target_durasi,
          target_jarak: session.target_jarak,
          gerakan: session.gerakan,
          programTitle: plan?.judul ?? null,
          done: session.tipe !== "Rest" && done.has(doneKey(tanggal, session.tipe)),
        };
      }
      // Selama program aktif, tanggal di dalam rentangnya hanya mengikuti program (bukan jadwal mingguan).
      if (plan) {
        const start = parseDateStr(plan.tanggal_mulai);
        const end = addDays(start, plan.durasi_minggu * 7 - 1);
        const d = parseDateStr(tanggal);
        if (d >= start && d <= end) return null;
      }
      const sch = schedules.find((x) => x.hari === parseDateStr(tanggal).getDay());
      if (!sch) return null;
      return {
        key: `j-${tanggal}`,
        tanggal,
        source: "jadwal",
        rest: sch.tipe === "Rest",
        tipe: sch.tipe,
        sub_kategori: sch.sub_kategori,
        target_durasi: null,
        target_jarak: null,
        gerakan: null,
        programTitle: null,
        done: sch.tipe !== "Rest" && done.has(doneKey(tanggal, sch.tipe)),
      };
    },
    [sessions, plan, schedules, done],
  );

  /** Catat latihan dari target sesi (satu ketukan). Tidak melakukan apa-apa bila sudah tercatat. */
  const markDone = async (item: WorkoutItem): Promise<{ error: string | null }> => {
    if (!user) return { error: t("Database belum siap") };
    if (item.rest || item.done) return { error: null };
    const { error } = await db.from("exercises").insert({
      user_id: user.id,
      tipe: item.tipe,
      sub_kategori: item.sub_kategori ?? item.tipe,
      durasi: item.target_durasi && item.target_durasi > 0 ? item.target_durasi : null,
      jarak: item.target_jarak ?? null,
      catatan: item.source === "program" ? t("Dari program latihan") : t("Dari jadwal latihan"),
      tanggal: item.tanggal,
    });
    if (error) return { error: error.message };
    await refreshDone();
    return { error: null };
  };

  return { loading: planLoading || schedLoading, forDate, markDone };
}
