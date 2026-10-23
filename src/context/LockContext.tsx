import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  createPinRecord,
  DEFAULT_LOCK_STATE,
  isValidPin,
  registerFailure,
  registerSuccess,
  remainingLockMs,
  shouldRelock,
  verifyPin,
  type LockState,
} from "../lib/appLock/pin";
import { loadLockState, saveLockState } from "../lib/appLock/store";
import { t } from "../lib/i18n";
import { withTimeout } from "../utils/withTimeout";

export type UnlockResult = { ok: true } | { ok: false; waitSec: number };

interface LockCtx {
  ready: boolean;
  loadError: boolean;
  /** PIN sudah diatur. */
  enabled: boolean;
  locked: boolean;
  biometric: boolean;
  biometricAvailable: boolean;
  autoLockMin: number;
  failed: number;
  waitSec: () => number;
  retryLoad: () => void;
  unlockWithPin: (pin: string) => Promise<UnlockResult>;
  unlockWithBiometric: () => Promise<boolean>;
  enable: (pin: string) => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  disable: (pin: string) => Promise<boolean>;
  setBiometric: (on: boolean) => Promise<boolean>;
  setAutoLock: (min: number) => Promise<void>;
  lockNow: () => void;
}

const Ctx = createContext<LockCtx | null>(null);

async function biometricAuth(): Promise<boolean> {
  try {
    const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
    await BiometricAuth.authenticate({
      reason: t("Buka Life OS"),
      cancelTitle: t("Batal"),
      allowDeviceCredential: false,
      androidTitle: t("Buka Life OS"),
    });
    return true;
  } catch {
    return false;
  }
}

export function LockProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LockState>(DEFAULT_LOCK_STATE);
  const stateRef = useRef(state);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [locked, setLocked] = useState(true); // aman sebelum status terbaca
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const backgroundedAt = useRef<number | null>(null);
  const [loadTick, setLoadTick] = useState(0);

  const commit = useCallback(async (next: LockState) => {
    stateRef.current = next;
    setState(next);
    await saveLockState(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    withTimeout(loadLockState(), 8000, "Penyimpanan aman")
      .then((s) => {
        if (cancelled) return;
        stateRef.current = s;
        setState(s);
        setLocked(!!s.pin);
        setLoadError(false);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loadTick]);

  // Ketersediaan biometrik (hanya Android).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    import("@aparajita/capacitor-biometric-auth")
      .then(({ BiometricAuth }) => BiometricAuth.checkBiometry())
      .then((r) => setBiometricAvailable(r.isAvailable))
      .catch(() => setBiometricAvailable(false));
  }, []);

  // FLAG_SECURE: sembunyikan layar di recent apps dan blokir screenshot selama kunci aktif.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !ready) return;
    import("@capacitor-community/privacy-screen")
      .then(({ PrivacyScreen }) => (state.pin ? PrivacyScreen.enable() : PrivacyScreen.disable()))
      .catch(() => {});
  }, [ready, state.pin]);

  // Kunci otomatis setelah N menit di latar belakang.
  useEffect(() => {
    const goBackground = () => {
      backgroundedAt.current = Date.now();
    };
    const comeForeground = () => {
      const s = stateRef.current;
      if (s.pin && shouldRelock(s.autoLockMin, backgroundedAt.current, Date.now())) setLocked(true);
      backgroundedAt.current = null;
    };
    if (Capacitor.isNativePlatform()) {
      const h = CapApp.addListener("appStateChange", ({ isActive }) => (isActive ? comeForeground() : goBackground()));
      return () => {
        h.then((x) => x.remove());
      };
    }
    const onVis = () => (document.hidden ? goBackground() : comeForeground());
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const unlockWithPin = useCallback(
    async (pin: string): Promise<UnlockResult> => {
      const s = stateRef.current;
      const wait = remainingLockMs(s, Date.now());
      if (wait > 0) return { ok: false, waitSec: Math.ceil(wait / 1000) };
      if (!s.pin) {
        setLocked(false);
        return { ok: true };
      }
      if (await verifyPin(pin, s.pin)) {
        await commit(registerSuccess(s));
        setLocked(false);
        return { ok: true };
      }
      const next = registerFailure(s, Date.now());
      await commit(next);
      return { ok: false, waitSec: Math.ceil(remainingLockMs(next, Date.now()) / 1000) };
    },
    [commit],
  );

  const unlockWithBiometric = useCallback(async () => {
    const s = stateRef.current;
    if (!s.pin || !s.biometric) return false;
    // Selama jeda percobaan salah, biometrik tidak boleh jadi jalan pintas.
    if (remainingLockMs(s, Date.now()) > 0) return false;
    if (!(await biometricAuth())) return false;
    await commit(registerSuccess(s));
    setLocked(false);
    return true;
  }, [commit]);

  const enable = useCallback(
    async (pin: string) => {
      if (!isValidPin(pin)) throw new Error(t("PIN harus 4-6 digit angka."));
      await commit({ ...stateRef.current, pin: await createPinRecord(pin), failed: 0, lockedUntil: 0 });
    },
    [commit],
  );

  const checkPin = useCallback(async (pin: string) => {
    const s = stateRef.current;
    if (!s.pin) return false;
    if (remainingLockMs(s, Date.now()) > 0) return false;
    if (await verifyPin(pin, s.pin)) return true;
    await commit(registerFailure(s, Date.now()));
    return false;
  }, [commit]);

  const changePin = useCallback(
    async (oldPin: string, newPin: string) => {
      if (!isValidPin(newPin) || !(await checkPin(oldPin))) return false;
      await commit({ ...registerSuccess(stateRef.current), pin: await createPinRecord(newPin) });
      return true;
    },
    [checkPin, commit],
  );

  const disable = useCallback(
    async (pin: string) => {
      if (!(await checkPin(pin))) return false;
      await commit({ ...DEFAULT_LOCK_STATE, autoLockMin: stateRef.current.autoLockMin });
      setLocked(false);
      return true;
    },
    [checkPin, commit],
  );

  const setBiometric = useCallback(
    async (on: boolean) => {
      if (on && !(await biometricAuth())) return false;
      await commit({ ...stateRef.current, biometric: on && !!stateRef.current.pin });
      return true;
    },
    [commit],
  );

  const setAutoLock = useCallback(
    async (min: number) => {
      await commit({ ...stateRef.current, autoLockMin: min });
    },
    [commit],
  );

  const value = useMemo<LockCtx>(
    () => ({
      ready,
      loadError,
      enabled: !!state.pin,
      locked: locked && (!!state.pin || loadError || !ready),
      biometric: state.biometric,
      biometricAvailable,
      autoLockMin: state.autoLockMin,
      failed: state.failed,
      waitSec: () => Math.ceil(remainingLockMs(stateRef.current, Date.now()) / 1000),
      retryLoad: () => {
        setReady(false);
        setLoadTick((n) => n + 1);
      },
      unlockWithPin,
      unlockWithBiometric,
      enable,
      changePin,
      disable,
      setBiometric,
      setAutoLock,
      lockNow: () => stateRef.current.pin && setLocked(true),
    }),
    [ready, loadError, state, locked, biometricAvailable, unlockWithPin, unlockWithBiometric, enable, changePin, disable, setBiometric, setAutoLock],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLock(): LockCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLock harus dipakai di dalam LockProvider");
  return c;
}
