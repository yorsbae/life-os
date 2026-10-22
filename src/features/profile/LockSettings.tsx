import { useState } from "react";
import { Card, GhostButton, PrimaryButton, SectionTitle, Sheet, Toggle } from "../../components/ui/Controls";
import Select from "../../components/ui/Select";
import { useLock } from "../../context/LockContext";
import { isValidPin, PIN_MAX, PIN_MIN } from "../../lib/appLock/pin";
import { t } from "../../lib/i18n";

function PinInput({ value, onChange, label, autoFocus }: { value: string; onChange: (v: string) => void; label: string; autoFocus?: boolean }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        maxLength={PIN_MAX}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className="input-field text-center text-xl tracking-[0.4em]"
        placeholder="••••"
      />
    </label>
  );
}

type Mode = null | "enable" | "change" | "disable";

export default function LockSettings() {
  const lock = useLock();
  const [mode, setMode] = useState<Mode>(null);
  const [cur, setCur] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    setMode(null);
    setCur("");
    setPin("");
    setPin2("");
    setError("");
  };

  const submit = async () => {
    setError("");
    if (mode !== "disable") {
      if (!isValidPin(pin)) return setError(t("PIN harus {0}-{1} digit angka.", [PIN_MIN, PIN_MAX]));
      if (pin !== pin2) return setError(t("Konfirmasi PIN tidak cocok."));
    }
    setBusy(true);
    try {
      if (mode === "enable") {
        await lock.enable(pin);
        close();
      } else if (mode === "change") {
        if (await lock.changePin(cur, pin)) close();
        else setError(lock.waitSec() > 0 ? t("Terlalu banyak percobaan. Coba lagi nanti.") : t("PIN lama salah"));
      } else if (mode === "disable") {
        if (await lock.disable(cur)) close();
        else setError(lock.waitSec() > 0 ? t("Terlalu banyak percobaan. Coba lagi nanti.") : t("PIN salah"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Gagal menyimpan"));
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "enable" ? t("Atur PIN") : mode === "change" ? t("Ubah PIN") : t("Matikan Kunci Aplikasi");

  return (
    <>
      <Card className="space-y-3">
        <SectionTitle>{t("Kunci Aplikasi")}</SectionTitle>
        <p className="text-xs text-gray-400">
          {t("PIN disimpan sebagai hash berkunci salt di penyimpanan aman Android (Keystore), bukan PIN aslinya. Layar disembunyikan dari recent apps dan screenshot saat kunci aktif.")}
        </p>
        {!lock.enabled ? (
          <PrimaryButton onClick={() => setMode("enable")}>{t("Aktifkan PIN")}</PrimaryButton>
        ) : (
          <div className="space-y-3">
            {lock.biometricAvailable && (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-100">{t("Buka dengan sidik jari/wajah")}</p>
                  <p className="text-xs text-gray-400">{t("PIN tetap dipakai sebagai cadangan.")}</p>
                </div>
                <Toggle
                  checked={lock.biometric}
                  onChange={async (v) => {
                    if (!(await lock.setBiometric(v))) setError(t("Verifikasi biometrik dibatalkan."));
                    else setError("");
                  }}
                />
              </div>
            )}
            <label className="block space-y-1">
              <span className="text-xs text-gray-400">{t("Kunci otomatis")}</span>
              <Select
                value={String(lock.autoLockMin)}
                onChange={(e) => lock.setAutoLock(Number(e.target.value))}
                title={t("Kunci otomatis")}
              >
                <option value="0">{t("Langsung saat keluar aplikasi")}</option>
                <option value="1">{t("Setelah 1 menit")}</option>
                <option value="5">{t("Setelah 5 menit")}</option>
                <option value="15">{t("Setelah 15 menit")}</option>
                <option value="30">{t("Setelah 30 menit")}</option>
              </Select>
            </label>
            {error && !mode && <p className="text-xs text-red-400">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <GhostButton onClick={() => setMode("change")}>{t("Ubah PIN")}</GhostButton>
              <GhostButton onClick={lock.lockNow}>{t("Kunci sekarang")}</GhostButton>
            </div>
            <GhostButton className="!border-surface-light !text-gray-300" onClick={() => setMode("disable")}>
              {t("Matikan Kunci Aplikasi")}
            </GhostButton>
          </div>
        )}
      </Card>

      {mode && (
        <Sheet title={title} onClose={close}>
          {mode !== "enable" && <PinInput label={mode === "change" ? t("PIN lama") : t("PIN saat ini")} value={cur} onChange={setCur} autoFocus />}
          {mode !== "disable" && (
            <>
              <PinInput label={mode === "change" ? t("PIN baru") : t("PIN ({0}-{1} digit)", [PIN_MIN, PIN_MAX])} value={pin} onChange={setPin} autoFocus={mode === "enable"} />
              <PinInput label={t("Ulangi PIN")} value={pin2} onChange={setPin2} />
            </>
          )}
          {mode === "enable" && (
            <p className="text-xs text-gray-400">{t("Jika lupa PIN, satu-satunya jalan adalah pasang ulang aplikasi lalu pulihkan dari file backup. Pastikan kamu sudah punya backup.")}</p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <PrimaryButton onClick={submit} disabled={busy}>
            {busy ? t("Memproses...") : mode === "disable" ? t("Matikan") : t("Simpan")}
          </PrimaryButton>
        </Sheet>
      )}
    </>
  );
}
