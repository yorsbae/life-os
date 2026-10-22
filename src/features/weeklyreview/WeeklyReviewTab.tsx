import { useState, useEffect } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, CircleOff, Target } from "lucide-react";
import { useWeeklyReview } from "./useWeeklyReview";
import Field from "../../components/ui/Field";
import { Card, PrimaryButton } from "../../components/ui/Controls";
import { t, tx } from "../../lib/i18n";
import { fmtDate } from "../../utils/format";

function rentangMinggu(mingguMulai: string) {
  const start = new Date(mingguMulai + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${fmtDate(start, "d MMM")} - ${fmtDate(end, "d MMM")}`;
}

export default function WeeklyReviewTab() {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = minggu ini, -1 = minggu lalu, dst

  const weekOf = new Date();
  weekOf.setDate(weekOf.getDate() + weekOffset * 7);

  const { review, loading, saveReview, mingguMulai } = useWeeklyReview(weekOf);

  const [berhasil, setBerhasil] = useState("");
  const [gagal, setGagal] = useState("");
  const [diubah, setDiubah] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBerhasil(review?.apa_yang_berhasil ?? "");
    setGagal(review?.apa_yang_gagal ?? "");
    setDiubah(review?.yang_mau_diubah ?? "");
  }, [review]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveReview({ apa_yang_berhasil: berhasil, apa_yang_gagal: gagal, yang_mau_diubah: diubah });
    setSaveMsg(result.error ? t("Gagal: {0}", [result.error]) : t("Tersimpan!"));
    setIsSaving(false);
    setTimeout(() => setSaveMsg(""), 2000);
  };

  return (
    <div className="space-y-4">
      <Card className="!py-2 !px-3 flex items-center justify-between">
        <button onClick={() => setWeekOffset((w) => w - 1)} aria-label={t("Sebelumnya")} className="p-2 text-gray-300">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center min-w-0">
          <p className="text-sm font-medium text-gray-50 truncate">
            {weekOffset === 0 ? t("Minggu Ini") : weekOffset === -1 ? t("Minggu Lalu") : rentangMinggu(mingguMulai)}
          </p>
          <p className="text-xs text-gray-400">{rentangMinggu(mingguMulai)}</p>
        </div>
        <button onClick={() => setWeekOffset((w) => w + 1)} disabled={weekOffset >= 0} aria-label={t("Selanjutnya")} className="p-2 text-gray-300 disabled:opacity-30">
          <ChevronRight size={18} />
        </button>
      </Card>

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">{t("Memuat...")}</p>
      ) : (
        <Card className="space-y-4">
          <Field label={t("Apa yang berhasil minggu ini?")}>
            <div className="space-y-1.5">
              <CheckCircle2 size={16} className="text-primary" />
              <textarea value={berhasil} onChange={(e) => setBerhasil(e.target.value)} className="input-field min-h-24" placeholder={t("Ceritakan pencapaian, sekecil apa pun...")} />
            </div>
          </Field>
          <Field label={t("Apa yang tidak berjalan, kenapa?")}>
            <div className="space-y-1.5">
              <CircleOff size={16} className="text-red-400" />
              <textarea value={gagal} onChange={(e) => setGagal(e.target.value)} className="input-field min-h-24" placeholder={t("Jujur saja, ini untuk dirimu sendiri...")} />
            </div>
          </Field>
          <Field label={t("Satu hal yang mau diubah minggu depan?")}>
            <div className="space-y-1.5">
              <Target size={16} className="text-primary" />
              <textarea value={diubah} onChange={(e) => setDiubah(e.target.value)} className="input-field min-h-20" placeholder={t("Fokus ke satu hal saja, jangan terlalu banyak...")} />
            </div>
          </Field>
          <PrimaryButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? t("Menyimpan...") : t("Simpan Review")}
          </PrimaryButton>
          {saveMsg && <p className="text-xs text-center text-gray-400">{tx(saveMsg)}</p>}
        </Card>
      )}
    </div>
  );
}
