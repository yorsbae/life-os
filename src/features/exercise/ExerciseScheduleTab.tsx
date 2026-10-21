import { Card, EmptyState } from "../../components/ui/Controls";
import { t, tx } from "../../lib/i18n";
import { useExerciseSchedule } from "./useExerciseSchedule";
import { EXERCISE_TIPE_PRESETS, SUB_KATEGORI_RUNNING, SUB_KATEGORI_STRENGTH } from "../../types";
import { DAY_ORDER, dayName } from "./bodyUi";
import { CalendarX } from "lucide-react";

const TIPE_OPTIONS = ["Rest", ...EXERCISE_TIPE_PRESETS];

function presetsFor(tipe: string): readonly string[] | null {
  if (tipe === "Running") return SUB_KATEGORI_RUNNING;
  if (tipe === "Strength") return SUB_KATEGORI_STRENGTH;
  return null;
}

/** Jadwal latihan rutin per hari; tersimpan otomatis saat diubah. */
export default function ExerciseScheduleTab() {
  const { schedules, loading, saveDaySchedule } = useExerciseSchedule();

  if (loading) return <p className="text-gray-400 text-sm py-8 text-center">{t("Memuat...")}</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">
        {t("Atur rencana latihan rutin per hari. Muncul otomatis di Home dan sebagai pratinjau di Kalender.")}
      </p>
      {schedules.length === 0 && <EmptyState icon={CalendarX} title={t("Belum ada jadwal")} hint={t("Pilih tipe latihan untuk tiap hari di bawah.")} />}

      {DAY_ORDER.map((hari) => {
        const existing = schedules.find((s) => s.hari === hari);
        const tipe = existing?.tipe ?? "Rest";
        const sub = existing?.sub_kategori ?? "";
        const presets = presetsFor(tipe);
        return (
          <Card key={hari} className="space-y-2">
            <p className="text-sm font-medium text-gray-100">{dayName(hari)}</p>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="input-field min-w-0"
                value={tipe}
                onChange={(e) => saveDaySchedule(hari, e.target.value, null, null)}
              >
                {TIPE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{tx(o)}</option>
                ))}
              </select>
              {tipe !== "Rest" &&
                (presets ? (
                  <select className="input-field min-w-0" value={sub} onChange={(e) => saveDaySchedule(hari, tipe, e.target.value || null, null)}>
                    <option value="">{t("Pilih jenis...")}</option>
                    {presets.map((p) => (
                      <option key={p} value={p}>{tx(p)}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    key={tipe + sub}
                    className="input-field min-w-0"
                    placeholder={t("Jenis (opsional)")}
                    defaultValue={sub}
                    onBlur={(e) => e.target.value !== sub && saveDaySchedule(hari, tipe, e.target.value || null, null)}
                  />
                ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
