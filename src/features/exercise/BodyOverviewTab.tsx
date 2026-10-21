import { useMemo, useState } from "react";
import { ChevronRight, Moon, Scale } from "lucide-react";
import { endOfWeek, startOfWeek } from "date-fns";
import { Card, GhostButton, PrimaryButton, SectionTitle, Sheet, EmptyState } from "../../components/ui/Controls";
import { Ring } from "../../components/ui/Progress";
import { LineChart } from "../../components/Analytics/Charts";
import { t } from "../../lib/i18n";
import { fmtDate, num } from "../../utils/format";
import { toDateStr } from "../../utils/dates";
import { useExercises } from "./useExercises";
import { useWeeklyTarget } from "./useWeeklyTarget";
import { useSleepLogs } from "./useSleepLogs";
import { useWeightLogs } from "../profile/useWeightLogs";

type Tab = "ringkasan" | "latihan" | "metrik" | "pemulihan";

function delta(cur: number | undefined, prev: number | undefined, unit: string) {
  if (cur === undefined || prev === undefined) return null;
  const d = cur - prev;
  if (Math.abs(d) < 0.05) return null;
  return `${d > 0 ? "+" : "−"}${num(Math.abs(d), 1)} ${unit}`;
}

export default function BodyOverviewTab({ onGo }: { onGo: (t: Tab) => void }) {
  const { exercises } = useExercises();
  const { target, setTarget } = useWeeklyTarget();
  const { logs: weights } = useWeightLogs();
  const { logs: sleeps } = useSleepLogs();
  const [editTarget, setEditTarget] = useState(false);
  const [draft, setDraft] = useState(String(target));

  const weekCount = useMemo(() => {
    const from = toDateStr(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const to = toDateStr(endOfWeek(new Date(), { weekStartsOn: 1 }));
    return exercises.filter((e) => e.tanggal >= from && e.tanggal <= to).length;
  }, [exercises]);

  const weightSeries = useMemo(
    () =>
      [...weights]
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
        .slice(-12)
        .map((w) => ({ label: fmtDate(w.tanggal, "d/M"), value: w.berat })),
    [weights],
  );

  const wDelta = delta(weights[0]?.berat, weights[1]?.berat, t("kg"));
  const sDelta = delta(sleeps[0]?.jam, sleeps[1]?.jam, t("jam"));

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-4">
        <Ring value={weekCount} max={target} size={104} stroke={10}>
          <span className="text-2xl font-bold text-gray-50 leading-none">{weekCount}x</span>
          <span className="text-[10px] text-gray-400 mt-1">{t("Minggu ini")}</span>
        </Ring>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs text-gray-400">{t("Target")}</p>
          <button onClick={() => { setDraft(String(target)); setEditTarget(true); }} className="flex items-center gap-1 text-lg font-semibold text-gray-50">
            {target}x <ChevronRight size={16} className="text-gray-400" />
          </button>
          <p className="text-[11px] text-gray-400">
            {weekCount >= target ? t("Target minggu ini tercapai!") : t("{0} sesi lagi untuk mencapai target", [target - weekCount])}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card onClick={() => onGo("metrik")} className="space-y-2">
          <Scale size={18} className="text-primary" />
          <p className="text-[11px] text-gray-400">{t("Berat Badan")}</p>
          <p className="text-xl font-bold text-gray-50 truncate">{weights[0] ? t("{0} kg", [num(weights[0].berat, 1)]) : "—"}</p>
          {wDelta && <p className="text-[11px] text-gray-400">{wDelta}</p>}
        </Card>
        <Card onClick={() => onGo("pemulihan")} className="space-y-2">
          <Moon size={18} className="text-primary" />
          <p className="text-[11px] text-gray-400">{t("Tidur")}</p>
          <p className="text-xl font-bold text-gray-50 truncate">{sleeps[0] ? t("{0} jam", [num(sleeps[0].jam, 1)]) : "—"}</p>
          {sDelta && <p className="text-[11px] text-gray-400">{sDelta}</p>}
        </Card>
      </div>

      <div className="space-y-2">
        <SectionTitle>{t("Riwayat Berat Badan")}</SectionTitle>
        <Card>
          {weightSeries.length < 2 ? (
            <EmptyState icon={Scale} title={t("Belum cukup data")} hint={t("Catat berat badan minimal 2 kali untuk melihat tren.")} />
          ) : (
            <LineChart data={weightSeries} yFormat={(v) => num(v, 0)} ariaLabel={t("Riwayat Berat Badan")} />
          )}
        </Card>
      </div>

      {editTarget && (
        <Sheet title={t("Target latihan per minggu")} onClose={() => setEditTarget(false)}>
          <label className="block space-y-1.5">
            <span className="text-xs text-gray-400">{t("Jumlah sesi per minggu")}</span>
            <input className="input-field" type="number" inputMode="numeric" min={1} max={14} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
          </label>
          <PrimaryButton onClick={async () => { await setTarget(Number(draft) || target); setEditTarget(false); }}>{t("Simpan")}</PrimaryButton>
          <GhostButton onClick={() => setEditTarget(false)}>{t("Batal")}</GhostButton>
        </Sheet>
      )}
    </div>
  );
}
