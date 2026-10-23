import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Delete, Fingerprint, Lock } from "lucide-react";
import { useLock } from "../context/LockContext";
import { PIN_MAX, PIN_MIN } from "../lib/appLock/pin";
import { t } from "../lib/i18n";
import { lastLoadError } from "../lib/appLock/store";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "bio", "0", "del"] as const;

function fmtWait(sec: number): string {
  if (sec >= 3600) return t("{0} jam", [Math.ceil(sec / 3600)]);
  if (sec >= 60) return t("{0} menit", [Math.ceil(sec / 60)]);
  return t("{0} detik", [sec]);
}

function LockScreen() {
  const lock = useLock();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [wait, setWait] = useState(lock.waitSec());
  const [busy, setBusy] = useState(false);

  // Hitung mundur selama dikunci karena salah berkali-kali.
  useEffect(() => {
    if (wait <= 0) return;
    const id = setInterval(() => setWait(lock.waitSec()), 500);
    return () => clearInterval(id);
  }, [wait, lock]);

  const tryBiometric = useCallback(async () => {
    if (lock.biometric && lock.biometricAvailable) await lock.unlockWithBiometric();
  }, [lock]);

  // Tawarkan biometrik otomatis begitu layar kunci muncul.
  useEffect(() => {
    if (lock.locked && lock.biometric && lock.biometricAvailable && lock.waitSec() === 0) {
      tryBiometric();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lock.locked]);

  const submit = useCallback(
    async (value: string) => {
      setBusy(true);
      const res = await lock.unlockWithPin(value);
      setBusy(false);
      setPin("");
      if (!res.ok) {
        setWait(res.waitSec);
        setError(res.waitSec > 0 ? t("Terlalu banyak percobaan. Coba lagi dalam {0}.", [fmtWait(res.waitSec)]) : t("PIN salah"));
      }
    },
    [lock],
  );

  const press = (k: string) => {
    if (busy || wait > 0) return;
    setError("");
    if (k === "del") return setPin((p) => p.slice(0, -1));
    if (k === "bio") return void tryBiometric();
    const next = (pin + k).slice(0, PIN_MAX);
    setPin(next);
  };

  if (lock.loadError) {
    return (
      <Shell>
        <p className="text-sm text-gray-100 text-center">{t("Gagal membuka penyimpanan aman. Data kamu tidak diubah.")}</p>
        {lastLoadError && <p className="mt-2 text-[11px] text-gray-500 text-center px-8 break-words">{lastLoadError}</p>}
        <button onClick={lock.retryLoad} className="mt-4 px-6 min-h-12 rounded-xl bg-primary text-on-primary font-semibold text-sm">
          {t("Coba lagi")}
        </button>
      </Shell>
    );
  }

  const showBio = lock.biometric && lock.biometricAvailable;

  return (
    <Shell>
      <h1 className="text-lg font-semibold text-gray-50">{t("Masukkan PIN")}</h1>
      <div className="flex gap-3 my-6 h-4" aria-label={t("{0} digit dimasukkan", [pin.length])} role="status">
        {Array.from({ length: Math.max(PIN_MIN, pin.length) }).map((_, i) => (
          <span key={i} className={`w-3.5 h-3.5 rounded-full border ${i < pin.length ? "bg-primary border-primary" : "border-gray-500"}`} />
        ))}
      </div>
      <p className={`text-xs min-h-8 text-center px-6 ${wait > 0 ? "text-red-400" : "text-gray-400"}`} role="alert">
        {wait > 0 ? t("Terlalu banyak percobaan. Coba lagi dalam {0}.", [fmtWait(wait)]) : error}
      </p>
      <div className="grid grid-cols-3 gap-3 w-full max-w-[18rem]">
        {KEYS.map((k) =>
          k === "bio" && !showBio ? (
            <span key={k} />
          ) : (
            <button
              key={k}
              type="button"
              disabled={wait > 0 || busy}
              aria-label={k === "del" ? t("Hapus digit") : k === "bio" ? t("Pakai sidik jari") : k}
              onClick={() => press(k)}
              className="h-16 rounded-2xl bg-surface text-xl text-gray-50 flex items-center justify-center active:bg-surface-light disabled:opacity-40"
            >
              {k === "del" ? <Delete size={22} /> : k === "bio" ? <Fingerprint size={24} className="text-primary" /> : k}
            </button>
          ),
        )}
      </div>
      <button
        type="button"
        disabled={pin.length < PIN_MIN || busy || wait > 0}
        onClick={() => submit(pin)}
        className="mt-5 w-full max-w-[18rem] min-h-12 rounded-xl bg-primary text-on-primary font-semibold text-sm disabled:opacity-40"
      >
        {t("Buka")}
      </button>
      <p className="mt-6 text-[11px] text-gray-500 text-center px-8">
        {t("Lupa PIN? Hapus lalu pasang ulang aplikasi, kemudian pulihkan dari file backup.")}
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] bg-bg flex flex-col items-center justify-center pb-[env(safe-area-inset-bottom)]">
      <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-4">
        <Lock size={26} className="text-primary" />
      </div>
      {children}
    </div>
  );
}

/** Membungkus aplikasi: konten tetap terpasang (state tidak hilang) tetapi `inert` saat terkunci. */
export default function LockGate({ children }: { children: ReactNode }) {
  const lock = useLock();
  if (!lock.ready)
    return (
      <div className="fixed inset-0 bg-bg flex items-center justify-center">
        <p className="text-gray-400 text-sm">{t("Memuat...")}</p>
      </div>
    );
  return (
    <>
      <div inert={lock.locked} aria-hidden={lock.locked}>
        {lock.ready ? children : null}
      </div>
      {lock.locked && <LockScreen />}
    </>
  );
}
