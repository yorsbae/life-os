import { useState, useEffect } from "react";
import { useProfile, type ProfileInput } from "./useProfile";
import {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  ACTIVITY_LEVELS,
} from "../../utils/bodyCalculations";
import {
  exportAllData,
  readBackupFile,
  restoreBackup,
} from "../../utils/exportData";
import WeatherSettings from "./WeatherSettings";
import NotificationSettings from "./NotificationSettings";
import CustomizeMenuSettings from "../../components/CustomizeMenuSettings";
import WeightHistorySection from "./WeightHistorySection";
import { useWeightLogs } from "./useWeightLogs";

const initialForm: ProfileInput = {
  nama: "",
  username: null,
  umur: null,
  jenis_kelamin: "Pria",
  tinggi_badan: null,
  berat_badan: null,
  target_berat_badan: null,
  aktivitas_level: "Sedang",
  onboarding_done: false,
};

export default function ProfilePage() {
  const { profile, loading, saveProfile } = useProfile();

  const [form, setForm] = useState<ProfileInput>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        nama: profile.nama,
        username: profile.username,
        umur: profile.umur,
        jenis_kelamin: profile.jenis_kelamin ?? "Pria",
        tinggi_badan: profile.tinggi_badan,
        berat_badan: profile.berat_badan,
        target_berat_badan: profile.target_berat_badan,
        aktivitas_level: profile.aktivitas_level ?? "Sedang",
        onboarding_done: profile.onboarding_done ?? false,
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage("");
    const result = await saveProfile(form);
    setSaveMessage(result.error ? `Gagal: ${result.error}` : "Tersimpan!");
    setIsSaving(false);
    setTimeout(() => setSaveMessage(""), 2000);
  };

  const { latestWeight } = useWeightLogs();
  const beratUntukKalkulasi = latestWeight ?? form.berat_badan;

  const canCalculate =
    beratUntukKalkulasi && form.tinggi_badan && form.umur && form.jenis_kelamin;
  const bmi = canCalculate
    ? calculateBMI(beratUntukKalkulasi!, form.tinggi_badan!)
    : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;
  const bmr = canCalculate
    ? calculateBMR(
        beratUntukKalkulasi!,
        form.tinggi_badan!,
        form.umur!,
        form.jenis_kelamin!,
      )
    : null;
  const tdee =
    bmr && form.aktivitas_level
      ? calculateTDEE(bmr, form.aktivitas_level)
      : null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportError("");
    const result = await exportAllData();
    if (result.error) setExportError(result.error);
    setIsExporting(false);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // supaya file yang sama bisa dipilih lagi
    if (!file) return;
    setImportMsg(null);
    setIsImporting(true);
    try {
      const preview = await readBackupFile(file);
      const when = new Date(preview.exportedAt).toLocaleString("id-ID");
      const ok = confirm(
        `Pulihkan backup ini?\n\nDibuat: ${when}\nTotal data: ${preview.totalRows} baris\n\nSEMUA data yang ada sekarang akan DIGANTI dengan isi backup. Tindakan ini tidak bisa dibatalkan.`,
      );
      if (!ok) return;
      const result = await restoreBackup(preview.backup);
      if (result.error) setImportMsg({ ok: false, text: result.error });
      else {
        setImportMsg({ ok: true, text: "Data berhasil dipulihkan. Memuat ulang..." });
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (err) {
      setImportMsg({
        ok: false,
        text: err instanceof Error ? err.message : "Gagal membaca file backup",
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (loading)
    return <p className="text-gray-400 text-sm py-8 text-center">Memuat...</p>;

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm";

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
        Profile
      </h1>

      {/* Data Diri */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Data Diri
        </h2>

        <input
          type="text"
          placeholder="Nama"
          value={form.nama ?? ""}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
          className={inputClass}
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Umur"
            value={form.umur ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                umur: e.target.value ? Number(e.target.value) : null,
              })
            }
            className={inputClass}
          />
          <select
            value={form.jenis_kelamin ?? "Pria"}
            onChange={(e) =>
              setForm({ ...form, jenis_kelamin: e.target.value })
            }
            className={inputClass}
          >
            <option value="Pria">Pria</option>
            <option value="Wanita">Wanita</option>
          </select>

          <input
            type="number"
            placeholder="Tinggi badan (cm)"
            value={form.tinggi_badan ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                tinggi_badan: e.target.value ? Number(e.target.value) : null,
              })
            }
            className={inputClass}
          />
          <input
            type="number"
            placeholder="Berat badan (kg)"
            value={form.berat_badan ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                berat_badan: e.target.value ? Number(e.target.value) : null,
              })
            }
            className={inputClass}
          />

          <input
            type="number"
            placeholder="Target berat (kg)"
            value={form.target_berat_badan ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                target_berat_badan: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
            className={inputClass}
          />
          <select
            value={form.aktivitas_level ?? "Sedang"}
            onChange={(e) =>
              setForm({ ...form, aktivitas_level: e.target.value })
            }
            className={inputClass}
          >
            {ACTIVITY_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg text-sm font-medium"
        >
          {isSaving ? "Menyimpan..." : "Simpan Data Diri"}
        </button>
        {saveMessage && (
          <p className="text-xs text-center text-gray-500">{saveMessage}</p>
        )}
      </div>

      <WeightHistorySection />

      {/* BMI/BMR/TDEE */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
          Body Metrics
        </h2>
        {!canCalculate ? (
          <p className="text-sm text-gray-400">
            Lengkapi umur, jenis kelamin, tinggi, dan berat badan untuk melihat
            perhitungan.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">BMI</p>
              <p className={`font-semibold text-lg ${bmiCategory?.color}`}>
                {bmi!.toFixed(1)}
              </p>
              <p className={`text-xs ${bmiCategory?.color}`}>
                {bmiCategory?.label}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">BMR</p>
              <p className="font-semibold text-lg text-gray-900 dark:text-white">
                {Math.round(bmr!)}
              </p>
              <p className="text-xs text-gray-400">kal/hari</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">TDEE</p>
              <p className="font-semibold text-lg text-gray-900 dark:text-white">
                {Math.round(tdee!)}
              </p>
              <p className="text-xs text-gray-400">kal/hari</p>
            </div>
          </div>
        )}
      </div>

      <CustomizeMenuSettings />

      <NotificationSettings />

      <WeatherSettings />

      {/* Export Data */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-2">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Backup & Pulihkan
        </h2>
        <p className="text-xs text-gray-400">
          Data hanya tersimpan di HP ini. Jika aplikasi dihapus atau HP hilang,
          data ikut hilang, jadi simpan backup secara berkala. File backup
          berisi semua datamu dalam bentuk teks biasa (JSON), simpan di tempat
          yang aman.
        </p>
        {exportError && <p className="text-xs text-red-500">{exportError}</p>}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {isExporting ? "Menyiapkan file..." : "⬇ Buat Backup"}
        </button>

        <label
          className={`block w-full text-center border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 ${isImporting ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        >
          {isImporting ? "Memproses..." : "⬆ Pulihkan dari Backup"}
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
        </label>
        {importMsg && (
          <p className={`text-xs ${importMsg.ok ? "text-green-600" : "text-red-500"}`}>
            {importMsg.text}
          </p>
        )}
      </div>
    </div>
  );
}
