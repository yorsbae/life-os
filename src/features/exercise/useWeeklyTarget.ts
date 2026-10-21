import { useCallback, useEffect, useState } from "react";
import { getSetting, setSetting } from "../../utils/appSettings";

const KEY = "weekly_workout_target";
const DEFAULT = 4;

/** Target sesi olahraga per minggu (disimpan di pengaturan perangkat). */
export function useWeeklyTarget() {
  const [target, setTargetState] = useState(DEFAULT);

  useEffect(() => {
    getSetting(KEY).then((v) => {
      const n = Number(v);
      if (v && n > 0) setTargetState(n);
    });
  }, []);

  const setTarget = useCallback(async (n: number) => {
    const v = Math.min(14, Math.max(1, Math.round(n)));
    setTargetState(v);
    await setSetting(KEY, String(v));
  }, []);

  return { target, setTarget };
}
