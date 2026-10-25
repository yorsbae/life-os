import { useEffect, useState } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";

/** Total pengeluaran pada satu tanggal ('YYYY-MM-DD'), tanpa memuat seluruh tabel pengeluaran. */
export function useDaySpent(tanggal: string): number {
  const { user } = useAuth();
  const [spent, setSpent] = useState(0);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    db.from("expenses")
      .select("nominal")
      .eq("tanggal", tanggal)
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setSpent(((data ?? []) as { nominal: number }[]).reduce((s, r) => s + r.nominal, 0));
      });
    return () => {
      cancelled = true;
    };
  }, [user, tanggal]);
  return spent;
}
