import { useCallback, useEffect, useState } from "react";
import { getSetting, setSetting } from "../../utils/appSettings";

const KEY = "payday_day";

/** Tanggal gajian tiap bulan (1–31), disimpan di pengaturan perangkat. null = belum diatur. */
export function usePayday() {
  const [day, setDay] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSetting(KEY).then((v) => {
      if (cancelled) return;
      const n = Number(v);
      setDay(Number.isInteger(n) && n >= 1 && n <= 31 ? n : null);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (n: number | null) => {
    if (n !== null && (!Number.isInteger(n) || n < 1 || n > 31)) return;
    await setSetting(KEY, n === null ? "" : String(n));
    setDay(n);
  }, []);

  return { day, loaded, save };
}
