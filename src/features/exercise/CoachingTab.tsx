import { useState } from "react";
import { Card, PrimaryButton, Chip, GhostButton } from "../../components/ui/Controls";
import { ProgressBar } from "../../components/ui/Progress";
import { Check, Circle, Moon, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { t, tx } from "../../lib/i18n";
import { fmtDate, num } from "../../utils/format";
import { useTrainingPlan } from "./useTrainingPlan";
import { PLAN_LABELS, type PlanTipe } from "./trainingTemplates";
import { DAY_ORDER, dayName } from "./bodyUi";

const PRESET_ISTIRAHAT: { label: string; hari: number[] }[] = [
  { label: "7 hari latihan", hari: [] },
  { label: "6 hari latihan (1 istirahat)", hari: [0] },
  { label: "5 hari latihan (2 istirahat)", hari: [0, 3] },
];

/** Program latihan terstruktur (intensitas naik/turun otomatis tiap minggu). */
export default function CoachingTab() {
  const { plan, sessions, loading, startPlan, cancelPlan, isSessionDone } = useTrainingPlan();
  const [selectedTipe, setSelectedTipe] = useState<PlanTipe>("5k");
  const [hariIstirahat, setHariIstirahat] = useState<number[]>([0]);
  const [isStarting, setIsStarting] = useState(false);

  const toggleHari = (hari: number) =>
    setHariIstirahat((prev) => (prev.includes(hari) ? prev.filter((h) => h !== hari) : [...prev, hari].sort()));

  const handleStart = async () => {
    setIsStarting(true);
    await startPlan(selectedTipe, PLAN_LABELS[selectedTipe].defaultDurasi, hariIstirahat);
    setIsStarting(false);
  };

  if (loading) return <p className="text-gray-400 text-sm py-8 text-center">{t("Memuat...")}</p>;

  if (!plan) {
    return (
      <div className="space-y-4">
        <Card>
          <p className="text-xs text-gray-300">
            {t("Program latihan terstruktur yang otomatis naik atau turun intensitasnya tiap minggu, tergantung konsistensimu. Bukan AI, hanya aturan sederhana.")}
          </p>
        </Card>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-100">{t("1. Pilih program")}</p>
          {(Object.keys(PLAN_LABELS) as PlanTipe[]).map((tipe) => (
            <button
              key={tipe}
              onClick={() => setSelectedTipe(tipe)}
              className={`w-full text-left p-4 rounded-2xl border transition ${
                selectedTipe === tipe ? "border-primary bg-primary/10" : "border-surface-light bg-surface"
              }`}
            >
              <p className="text-sm font-medium text-gray-50">{tx(PLAN_LABELS[tipe].label)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {tx(PLAN_LABELS[tipe].deskripsi)} · {t("{0} minggu", [PLAN_LABELS[tipe].defaultDurasi])}
              </p>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-100">{t("2. Pilih hari latihan dan istirahat")}</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_ISTIRAHAT.map((p) => (
              <Chip key={p.label} active={JSON.stringify(hariIstirahat) === JSON.stringify(p.hari)} onClick={() => setHariIstirahat(p.hari)}>
                {t(p.label)}
              </Chip>
            ))}
          </div>
          <p className="text-xs text-gray-400 pt-1">{t("Atau ketuk hari yang ingin dijadikan istirahat:")}</p>
          <div className="flex flex-wrap gap-2">
            {DAY_ORDER.map((hari) => (
              <button
                key={hari}
                onClick={() => toggleHari(hari)}
                className={`px-3 py-1.5 rounded-xl text-xs border ${
                  hariIstirahat.includes(hari) ? "border-primary bg-primary/15 text-primary" : "border-surface-light text-gray-300"
                }`}
              >
                {dayName(hari, "EEE")}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            {hariIstirahat.length === 0
              ? t("Latihan 7 hari penuh, tanpa istirahat.")
              : t("{0} hari latihan, {1} hari istirahat", [7 - hariIstirahat.length, hariIstirahat.length])}
          </p>
        </div>

        <PrimaryButton onClick={handleStart} disabled={isStarting}>
          {isStarting ? t("Menyiapkan program...") : t("Mulai Program Ini")}
        </PrimaryButton>
      </div>
    );
  }

  const mingguSekarang = Math.max(...sessions.map((s) => s.minggu_ke), 1);
  const sesiMingguIni = sessions.filter((s) => s.minggu_ke === mingguSekarang);
  const mult = sesiMingguIni[0]?.intensity_multiplier ?? 1;
  const doneCount = sesiMingguIni.filter((s) => s.tipe !== "Rest" && isSessionDone(s)).length;
  const totalCount = sesiMingguIni.filter((s) => s.tipe !== "Rest").length;
  const MultIcon = mult > 1 ? TrendingUp : mult < 1 ? TrendingDown : Minus;

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-50 truncate">{tx(plan.judul)}</p>
          <p className="text-xs text-gray-400">
            {t("Minggu {0} dari {1}", [mingguSekarang, plan.durasi_minggu])} ·{" "}
            {plan.hari_istirahat.length === 0
              ? t("7 hari latihan")
              : t("Istirahat: {0}", [plan.hari_istirahat.map((h) => dayName(h, "EEE")).join(", ")])}
          </p>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">{t("Intensitas minggu ini")}</span>
          <span className="flex items-center gap-1 text-primary font-medium">
            <MultIcon size={14} /> {Math.round(mult * 100)}%
          </span>
        </div>
        <ProgressBar value={doneCount} max={Math.max(totalCount, 1)} />
        <p className="text-[11px] text-gray-400">{t("{0} dari {1} sesi selesai", [doneCount, totalCount])}</p>
      </Card>

      <div className="space-y-2">
        {sesiMingguIni.map((s) => {
          const dateLabel = fmtDate(s.tanggal, "EEEE, d MMM");
          if (s.tipe === "Rest")
            return (
              <Card key={s.id} className="!py-3 flex items-center gap-3 opacity-80">
                <Moon size={18} className="text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-300">{t("Hari istirahat")}</p>
                  <p className="text-[11px] text-gray-500 truncate">{tx(dateLabel)}</p>
                </div>
              </Card>
            );
          const done = isSessionDone(s);
          return (
            <Card key={s.id} className={`!py-3 flex items-start gap-3 ${done ? "!border-primary/50" : ""}`}>
              {done ? <Check size={18} className="text-primary shrink-0 mt-0.5" /> : <Circle size={18} className="text-gray-600 shrink-0 mt-0.5" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-50 truncate">{tx(s.sub_kategori)}</p>
                <p className="text-[11px] text-gray-400">
                  {tx(dateLabel)}
                  {s.target_durasi ? ` · ${t("{0} menit", [s.target_durasi])}` : ""}
                  {s.target_jarak ? ` · ${t("{0} km", [num(s.target_jarak, 1)])}` : ""}
                </p>
                {s.gerakan && <p className="text-[11px] text-primary mt-1 break-words">{tx(s.gerakan)}</p>}
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400">
        {t("Minggu depan intensitas naik otomatis jika kamu menyelesaikan 90% sesi atau lebih, turun jika kurang dari 60%, dan tetap jika di antaranya.")}
      </p>
      <GhostButton className="!border-red-500/40 !text-red-400" onClick={() => confirm(t("Batalkan program ini?")) && cancelPlan()}>
        {t("Batalkan Program")}
      </GhostButton>
    </div>
  );
}
