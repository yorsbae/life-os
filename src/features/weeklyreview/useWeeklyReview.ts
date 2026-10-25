import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";

import { t } from "../../lib/i18n";
import { toDateStr } from "../../utils/dates";
export interface WeeklyReview {
  id: string;
  user_id: string;
  minggu_mulai: string;
  apa_yang_berhasil: string | null;
  apa_yang_gagal: string | null;
  yang_mau_diubah: string | null;
}

// Dapatkan tanggal Senin dari minggu yang mengandung `date`
// Memakai tanggal LOKAL: toISOString() menggeser ke UTC sehingga di WIB sebelum pukul 07.00
// hasilnya mundur satu hari (Senin dini hari terbaca Minggu).
function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return toDateStr(d);
}

export function useWeeklyReview(weekOf: Date = new Date()) {
  const { user } = useAuth();
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [loading, setLoading] = useState(true);

  const mingguMulai = getMonday(weekOf);

  const fetchReview = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await db
      .from("weekly_reviews")
      .select("*")
      .eq("minggu_mulai", mingguMulai)
      .maybeSingle();

    if (!error) setReview(data as WeeklyReview | null);
    setLoading(false);
  }, [user, mingguMulai]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const saveReview = async (
    input: Partial<Omit<WeeklyReview, "id" | "user_id" | "minggu_mulai">>,
  ) => {
    if (!user) return { error: t("Belum login") };
    const { error } = await db
      .from("weekly_reviews")
      .upsert(
        { user_id: user.id, minggu_mulai: mingguMulai, ...input },
        { onConflict: "user_id,minggu_mulai" },
      );

    if (error) return { error: error.message };
    await fetchReview();
    return { error: null };
  };

  return { review, loading, saveReview, mingguMulai };
}
