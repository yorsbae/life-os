import { useMemo, useState } from "react";
import { Trash2, Moon, Lightbulb } from "lucide-react";
import { subDays } from "date-fns";
import { Card, PrimaryButton, SectionTitle } from "../../components/ui/Controls";
import { BarChart } from "../../components/Analytics/Charts";
import { t } from "../../lib/i18n";
import { fmtDate, num } from "../../utils/format";
import { toDateStr } from "../../utils/dates";
import { useSleepLogs } from "./useSleepLogs";
import { useExerciseSchedule } from "./useExerciseSchedule";

const SLEEP_GOAL = 8;

export default function RecoveryTab() {
  const { logs, latest, avg7, saveSleep, deleteSleep } = useSleepLogs();
  const { schedules } = useExerciseSchedule();
  const [jam, setJam] = useState("");
  const [tanggal, setTanggal] = useState(toDateStr());
  const [msg, setMsg] = useState("");

  const series = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const key = toDateStr(d);
        return { label: fmtDate(d, "EEE"), value: logs.find((l) => l.tanggal === key)?.jam ?? 0 };
      }),
    [logs],
  );

  const restDays = schedules.filter((s) => s.tipe === "Rest").length;
  const tip =
    avg7 === null
      ? t("Catat jam tidurmu setiap hari untuk melihat pola pemulihan.")
      : avg7 < 6
        ? t("Rata-rata tidurmu kurang dari 6 jam. Kurangi intensitas latihan dan tidur lebih awal.")
        : avg7 < 7
          ? t("Tidurmu masih di bawah 7 jam. Usahakan tidur lebih awal agar pemulihan optimal.")
          : t("Tidurmu sudah cukup baik. Pertahankan kebiasaan ini.");

  const submit = async () => {
    const v = Number(jam.replace(",", "."));
    if (!(v > 0 && v <= 24)) return setMsg(t("Jam tidur tidak valid"));
    const res = await saveSleep(v, tanggal);
    setMsg(res.error ?? "");
    if (!res.error) setJam("");
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0"><Moon size={18} /></span>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">{t("Tidur terakhir")}</p>
            <p className="text-xl font-bold text-gray-50">{latest ? t("{0} jam", [num(latest.jam, 1)]) : "—"}</p>
          </div>
          <div className="ml-auto text-right min-w-0">
            <p className="text-xs text-gray-400">{t("Rata-rata 7 hari")}</p>
            <p className="text-sm font-semibold text-primary">{avg7 !== null ? t("{0} jam", [num(avg7, 1)]) : "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="input-field min-w-0" inputMode="decimal" placeholder={t("Jam tidur")} value={jam} onChange={(e) => setJam(e.target.value)} />
          <input className="input-field min-w-0" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </div>
        {msg && <p className="text-xs text-red-400">{msg}</p>}
        <PrimaryButton onClick={submit}>{t("Simpan Tidur")}</PrimaryButton>
      </Card>

      <div className="space-y-2">
        <SectionTitle>{t("Tidur 7 Hari Terakhir")}</SectionTitle>
        <Card>
          <BarChart data={series} target={SLEEP_GOAL} yFormat={(v) => num(v, 0)} ariaLabel={t("Tidur 7 Hari Terakhir")} />
          <p className="text-[11px] text-gray-400 mt-1">{t("Garis kuning: target {0} jam", [SLEEP_GOAL])}</p>
        </Card>
      </div>

      <Card className="flex gap-3">
        <Lightbulb size={18} className="text-primary shrink-0 mt-0.5" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-gray-100">{tip}</p>
          <p className="text-[11px] text-gray-400">{t("Hari istirahat terjadwal: {0} per minggu", [restDays])}</p>
        </div>
      </Card>

      {logs.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>{t("Riwayat Tidur")}</SectionTitle>
          {logs.slice(0, 10).map((l) => (
            <Card key={l.id} className="!py-3 flex items-center gap-3">
              <span className="text-sm text-gray-100">{t("{0} jam", [num(l.jam, 1)])}</span>
              <span className="flex-1 text-right text-[11px] text-gray-400">{fmtDate(l.tanggal, "EEE, d MMM yyyy")}</span>
              <button aria-label={t("Hapus")} className="text-gray-500" onClick={() => confirm(t("Yakin hapus data ini?")) && deleteSleep(l.id)}>
                <Trash2 size={15} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
