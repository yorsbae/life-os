import { useState, useEffect } from "react";
import { useWeeklyReview } from "./useWeeklyReview";

function formatRentangMinggu(mingguMulai: string) {
  const start = new Date(mingguMulai);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`;
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
    setBerhasil(review?.apa_yang_berhasil ?? "");
    setGagal(review?.apa_yang_gagal ?? "");
    setDiubah(review?.yang_mau_diubah ?? "");
  }, [review]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveReview({
      apa_yang_berhasil: berhasil,
      apa_yang_gagal: gagal,
      yang_mau_diubah: diubah,
    });
    setSaveMsg(result.error ? `Gagal: ${result.error}` : "Tersimpan!");
    setIsSaving(false);
    setTimeout(() => setSaveMsg(""), 2000);
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {weekOffset === 0
              ? "Minggu Ini"
              : weekOffset === -1
                ? "Minggu Lalu"
                : formatRentangMinggu(mingguMulai)}
          </p>
          <p className="text-xs text-gray-400">
            {formatRentangMinggu(mingguMulai)}
          </p>
        </div>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          disabled={weekOffset >= 0}
          className="text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1 disabled:opacity-30"
        >
          →
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Memuat...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ✅ Apa yang berhasil minggu ini?
            </label>
            <textarea
              value={berhasil}
              onChange={(e) => setBerhasil(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Ceritakan pencapaian, sekecil apapun..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ❌ Apa yang tidak berjalan, kenapa?
            </label>
            <textarea
              value={gagal}
              onChange={(e) => setGagal(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Jujur saja, ini buat kamu sendiri..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              🎯 Satu hal yang mau diubah minggu depan?
            </label>
            <textarea
              value={diubah}
              onChange={(e) => setDiubah(e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Fokus ke 1 hal saja, jangan terlalu banyak..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Menyimpan..." : "Simpan Review"}
          </button>
          {saveMsg && (
            <p className="text-xs text-center text-gray-500">{saveMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}
