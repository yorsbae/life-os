import { useEffect, useState, type ReactNode } from "react";
import PageHeader from "../../components/ui/PageHeader";
import LanguagePicker from "../../components/ui/LanguagePicker";
import { Card, Chip, GhostButton, SectionTitle, Toggle } from "../../components/ui/Controls";
import { ACCENTS, useTheme, type FontSize } from "../../context/ThemeContext";
import Segmented from "../../components/ui/Segmented";
import { useLanguage } from "../../context/LanguageContext";
import { HOME_SECTIONS, loadHomeSections, saveHomeSections, type HomeSection } from "../../utils/homeSections";
import { MODULE_MENU } from "../../hooks/usePrimaryMenu";
import { exportAllData, exportTransactionsCsv, readBackupFile, restoreBackup } from "../../utils/exportData";
import { MIN_PASSWORD_LENGTH, PasswordRequiredError } from "../../utils/backupCrypto";
import { hideAmounts, setHideAmounts } from "../../lib/privacy";
import NotificationSettings from "./NotificationSettings";
import LockSettings from "./LockSettings";
import WidgetSettings from "./WidgetSettings";
import WeatherSettings from "./WeatherSettings";
import { t, tx } from "../../lib/i18n";

export const APP_VERSION = "3.0.0";

export function SubPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pb-10">
      <PageHeader title={title} left="back" search={false} />
      <div className="px-4 space-y-4">{children}</div>
    </div>
  );
}

export function AppearancePage() {
  const { accent, setAccent, fontSize, setFontSize, mode, setMode } = useTheme();
  const sizes: { key: FontSize; label: string }[] = [
    { key: "small", label: t("Kecil") }, { key: "normal", label: t("Normal") }, { key: "large", label: t("Besar") },
  ];
  return (
    <SubPage title={t("Tampilan")}>
      <Card className="space-y-3">
        <SectionTitle>{t("Tema")}</SectionTitle>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { key: "dark", label: t("Gelap") },
            { key: "light", label: t("Terang") },
            { key: "system", label: t("Ikuti sistem") },
          ]}
        />
      </Card>
      <Card className="space-y-3">
        <SectionTitle>{t("Warna aksen")}</SectionTitle>
        <div className="flex gap-3 flex-wrap">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              onClick={() => setAccent(a.key)}
              aria-label={t(a.label)}
              aria-pressed={accent === a.key}
              className={`w-10 h-10 rounded-full border-2 ${accent === a.key ? "border-gray-50" : "border-transparent"}`}
              style={{ background: a.color }}
            />
          ))}
        </div>
      </Card>
      <Card className="space-y-3">
        <SectionTitle>{t("Ukuran teks")}</SectionTitle>
        <div className="flex gap-2">
          {sizes.map((s) => <Chip key={s.key} active={fontSize === s.key} onClick={() => setFontSize(s.key)}>{tx(s.label)}</Chip>)}
        </div>
      </Card>
    </SubPage>
  );
}

const SECTION_LABEL: Record<HomeSection, string> = {
  week: "Strip minggu", summary: "Ringkasan Hari Ini", focus: "Kartu Fokus", quickadd: "Tambah Cepat",
  reminders: "Pengingat", quote: "Kutipan harian", training: "Rencana Latihan", recurring: "Pengeluaran Rutin",
};

export function ModulesPage() {
  const [sections, setSections] = useState<Record<HomeSection, boolean> | null>(null);
  useEffect(() => { loadHomeSections().then(setSections); }, []);
  const toggle = (k: HomeSection) => {
    if (!sections) return;
    const next = { ...sections, [k]: !sections[k] };
    setSections(next);
    saveHomeSections(next);
  };
  return (
    <SubPage title={t("Dashboard & Modul")}>
      <Card className="space-y-3">
        <SectionTitle>{t("Bagian di Home")}</SectionTitle>
        {sections && HOME_SECTIONS.map((k) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-200">{t(SECTION_LABEL[k])}</span>
            <Toggle checked={sections[k]} onChange={() => toggle(k)} />
          </div>
        ))}
      </Card>
      <Card className="space-y-2">
        <SectionTitle>{t("Modul di menu samping")}</SectionTitle>
        <p className="text-xs text-gray-400">{t("Semua modul tersedia dari ikon menu di pojok kiri atas.")}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {MODULE_MENU.map((m) => <Chip key={m.path} tone="primary">{t(m.label)}</Chip>)}
        </div>
      </Card>
    </SubPage>
  );
}

export function RemindersPage() {
  return (
    <SubPage title={t("Pengingat")}>
      <NotificationSettings />
      <WidgetSettings />
      <WeatherSettings />
    </SubPage>
  );
}

export function DataPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [encrypt, setEncrypt] = useState(true);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  // File terenkripsi yang menunggu kata sandi untuk dipulihkan.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importPw, setImportPw] = useState("");

  const doExport = async () => {
    setError("");
    if (encrypt) {
      if (pw.length < MIN_PASSWORD_LENGTH) {
        setError(t("Kata sandi minimal {0} karakter.", [MIN_PASSWORD_LENGTH]));
        return;
      }
      if (pw !== pw2) {
        setError(t("Konfirmasi kata sandi tidak cocok."));
        return;
      }
    }
    setExporting(true);
    const res = await exportAllData(encrypt ? pw : undefined);
    if (res.error) setError(res.error);
    else {
      setPw("");
      setPw2("");
    }
    setExporting(false);
  };

  const doCsv = async () => {
    setError("");
    setExportingCsv(true);
    const res = await exportTransactionsCsv();
    if (res.error) setError(res.error);
    setExportingCsv(false);
  };

  const restoreFrom = async (file: File, password?: string) => {
    setMsg(null);
    setImporting(true);
    try {
      const preview = await readBackupFile(file, password);
      setPendingFile(null);
      setImportPw("");
      const when = new Date(preview.exportedAt).toLocaleString();
      if (!confirm(t("Pulihkan backup ini?\n\nDibuat: {0}\nTotal data: {1} baris\n\nSEMUA data yang ada sekarang akan DIGANTI dengan isi backup. Tindakan ini tidak bisa dibatalkan.", [when, preview.totalRows]))) return;
      const res = await restoreBackup(preview.backup);
      if (res.error) setMsg({ ok: false, text: res.error });
      else {
        setMsg({ ok: true, text: t("Data berhasil dipulihkan. Memuat ulang...") });
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (err) {
      if (err instanceof PasswordRequiredError) {
        setPendingFile(file);
        setMsg({ ok: false, text: err.message });
      } else {
        setMsg({ ok: false, text: err instanceof Error ? err.message : t("Gagal membaca file backup") });
      }
    } finally {
      setImporting(false);
    }
  };

  const doImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingFile(null);
    setImportPw("");
    await restoreFrom(file);
  };

  const inputCls = "w-full px-3 py-2 border border-surface-light bg-bg text-gray-100 rounded-lg text-sm";

  return (
    <SubPage title={t("Data & Backup")}>
      <Card className="space-y-3">
        <p className="text-xs text-gray-400">
          {t("Data hanya tersimpan di HP ini. Jika aplikasi dihapus atau HP hilang, data ikut hilang, jadi simpan backup secara berkala.")}{" "}
          {encrypt
            ? t("Backup akan dienkripsi dengan kata sandi. Jika kata sandi hilang, backup tidak bisa dibuka siapa pun, termasuk kamu.")
            : t("Tanpa enkripsi, file backup berisi semua datamu dalam bentuk teks biasa (JSON). Simpan di tempat yang aman.")}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-200">{t("Enkripsi dengan kata sandi")}</span>
          <Toggle checked={encrypt} onChange={setEncrypt} />
        </div>
        {encrypt && (
          <div className="space-y-2">
            <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t("Kata sandi backup")} className={inputCls} />
            <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder={t("Ulangi kata sandi")} className={inputCls} />
          </div>
        )}
        {error && <p className="text-xs text-red-400">{tx(error)}</p>}
        <GhostButton onClick={doExport} disabled={exporting}>{exporting ? t("Menyiapkan file...") : t("Buat Backup")}</GhostButton>
        <label className={`block w-full text-center border border-surface-light text-gray-200 py-3 rounded-xl text-sm font-medium ${importing ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}>
          {importing ? t("Memproses...") : t("Pulihkan dari Backup")}
          <input type="file" accept="application/json,.json" className="hidden" onChange={doImport} />
        </label>
        <div className="space-y-1">
          <GhostButton onClick={doCsv} disabled={exportingCsv}>{exportingCsv ? t("Menyiapkan file...") : t("Ekspor Transaksi (CSV)")}</GhostButton>
          <p className="text-xs text-gray-400">{t("CSV tidak dienkripsi. Simpan di tempat yang aman.")}</p>
        </div>
        {pendingFile && (
          <div className="space-y-2">
            <input type="password" autoComplete="current-password" autoFocus value={importPw} onChange={(e) => setImportPw(e.target.value)} placeholder={t("Kata sandi backup")} className={inputCls} />
            <GhostButton onClick={() => restoreFrom(pendingFile, importPw)} disabled={importing || !importPw}>{t("Buka Backup")}</GhostButton>
          </div>
        )}
        {msg && <p className={`text-xs ${msg.ok ? "text-primary" : "text-red-400"}`}>{tx(msg.text)}</p>}
      </Card>
    </SubPage>
  );
}

export function PrivacyPage() {
  const { remount } = useLanguage();
  const [hide, setHide] = useState(hideAmounts());
  return (
    <SubPage title={t("Privasi & Keamanan")}>
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-gray-100">{t("Sembunyikan nominal uang")}</p>
            <p className="text-xs text-gray-400">{t("Angka rupiah ditampilkan sebagai titik-titik di seluruh aplikasi.")}</p>
          </div>
          <Toggle checked={hide} onChange={(v) => { setHide(v); setHideAmounts(v); remount(); }} />
        </div>
      </Card>
      <LockSettings />
      <Card className="space-y-2">
        <SectionTitle>{t("Data tetap di HP kamu")}</SectionTitle>
        <p className="text-xs text-gray-400">{t("Life OS tidak memakai akun, server, atau cloud. Semua data disimpan di penyimpanan privat aplikasi dan tidak dikirim ke mana pun. Satu-satunya fitur yang memakai internet adalah Cuaca (opsional, mati secara default).")}</p>
      </Card>
    </SubPage>
  );
}

export function LanguagePage() {
  return (
    <SubPage title={t("Bahasa")}>
      <LanguagePicker />
    </SubPage>
  );
}

export function AboutPage() {
  return (
    <SubPage title={t("Tentang Life OS")}>
      <Card className="text-center space-y-1 py-6">
        <p className="text-2xl font-bold text-primary">Life OS</p>
        <p className="text-xs text-gray-400">{t("Better Habits · A Greater You")}</p>
        <p className="text-xs text-gray-500 pt-2">{t("Versi {0}", [APP_VERSION])}</p>
      </Card>
      <Card><p className="text-sm text-gray-300">{t("Aplikasi manajemen hidup pribadi: keuangan, kegiatan, kebiasaan, olahraga, belajar, jurnal, dan tujuan dalam satu tempat. Berjalan sepenuhnya di HP, tanpa server dan tanpa akun.")}</p></Card>
    </SubPage>
  );
}
