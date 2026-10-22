import { useState } from "react";
import { useWeightLogs } from "./useWeightLogs";

import { t, intlLocale } from "../../lib/i18n";
import { DeleteButton } from "../../components/ui/DeleteButton";
export default function WeightHistorySection() {
  const { logs, loading, addLog, deleteLog } = useWeightLogs();
  const [berat, setBerat] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!berat) return;
    setIsSubmitting(true);
    await addLog(berat, tanggal);
    setBerat(null);
    setIsSubmitting(false);
  };

  const trend = logs.length >= 2 ? logs[0].berat - logs[1].berat : null;

  return (
    <div className="bg-surface rounded-xl border border-surface-light p-5 space-y-3">
      <h2 className="font-semibold text-gray-50">
        {t("Histori Berat Badan")}</h2>

      <div className="flex gap-2">
        {/* Pakai input angka biasa (bukan CurrencyInput yang formatnya ribuan) karena ini kg, bukan rupiah */}
        <input
          type="number"
          step="0.1"
          placeholder={t("Berat (kg)")}
          value={berat ?? ""}
          onChange={(e) =>
            setBerat(e.target.value ? Number(e.target.value) : null)
          }
          className="flex-1 px-3 py-2 border border-surface-light bg-bg text-gray-100 rounded-lg text-sm"
        />
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="px-3 py-2 border border-surface-light bg-bg text-gray-100 rounded-lg text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={isSubmitting || !berat}
          className="bg-primary text-on-primary px-4 rounded-lg text-sm disabled:opacity-50"
        >
          +
        </button>
      </div>

      {trend !== null && (
        <p className="text-xs text-gray-400">
          {trend > 0 ? t("📈 Naik {0} kg", [trend.toFixed(1)]) : trend < 0 ? t("📉 Turun {0} kg", [Math.abs(trend).toFixed(1)]) : t("➡️ Tidak berubah")}{" "}
          {t("dari catatan sebelumnya")}</p>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">{t("Memuat...")}</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-400 text-sm">{t("Belum ada catatan berat badan.")}</p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {logs.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between text-sm py-1"
            >
              <span className="text-gray-400">
                {new Date(l.tanggal).toLocaleDateString(intlLocale(), {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="text-gray-50 font-medium">
                {Math.round(l.berat * 10) / 10} kg
              </span>
              <DeleteButton label={t("Hapus")} confirmMessage={t("Yakin hapus data ini?")} onConfirm={() => deleteLog(l.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
