import { Capacitor } from "@capacitor/core";
import { DEFAULT_LOCK_STATE, parseLockState, type LockState } from "./pin";

// Di Android nilai disimpan lewat SecureStorage (dienkripsi dengan kunci di Android Keystore).
// Di web/dev memakai localStorage — hanya untuk pengembangan, bukan perlindungan sungguhan.

const KEY = "lifeos-app-lock";
// Penanda biasa (bukan rahasia): apakah PIN pernah diaktifkan di perangkat ini.
// Dipakai agar kegagalan Keystore tidak mengunci pengguna yang TIDAK pernah memasang PIN.
const FLAG = "lifeos-lock-flag";

/** Pesan error terakhir saat membaca penyimpanan aman (untuk ditampilkan agar mudah didiagnosis). */
export let lastLoadError = "";

function flag(): boolean | null {
  try {
    const v = localStorage.getItem(FLAG);
    return v === null ? null : v === "1";
  } catch {
    return null;
  }
}
function setFlag(on: boolean) {
  try {
    localStorage.setItem(FLAG, on ? "1" : "0");
  } catch {
    /* abaikan */
  }
}

async function secure() {
  const { SecureStorage } = await import("@aparajita/capacitor-secure-storage");
  return SecureStorage;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function attempt<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Keystore tidak merespons")), ms);
    p.then(
      (v) => (clearTimeout(id), resolve(v)),
      (e) => (clearTimeout(id), reject(e)),
    );
  });
}

async function readNative(): Promise<string | null> {
  const s = await secure();
  const raw = await s.get(KEY);
  return typeof raw === "string" ? raw : null;
}

/**
 * Membaca status kunci. Keystore Android kadang gagal/menggantung (terutama saat start dingin atau
 * di beberapa ROM), jadi dicoba dua kali. Jika tetap gagal dan PIN tidak pernah diaktifkan di
 * perangkat ini, aplikasi dibuka tanpa kunci alih-alih macet. Jika PIN pernah aktif, error dilempar
 * (jangan diam-diam melewati kunci).
 */
export async function loadLockState(): Promise<LockState> {
  if (!Capacitor.isNativePlatform()) {
    return parseLockState(localStorage.getItem(KEY));
  }
  let lastErr: unknown;
  for (let i = 0; i < 2; i++) {
    try {
      const state = parseLockState(await attempt(readNative(), 3000));
      setFlag(!!state.pin);
      lastLoadError = "";
      return state;
    } catch (e) {
      lastErr = e;
      await sleep(400);
    }
  }
  lastLoadError = lastErr instanceof Error ? lastErr.message : String(lastErr);
  if (flag() !== true) {
    console.warn("SecureStorage tidak bisa dibaca, lanjut tanpa PIN:", lastLoadError);
    return DEFAULT_LOCK_STATE;
  }
  throw lastErr instanceof Error ? lastErr : new Error(lastLoadError);
}

export async function saveLockState(state: LockState): Promise<void> {
  const raw = JSON.stringify(state);
  if (Capacitor.isNativePlatform()) {
    await (await secure()).set(KEY, raw);
  } else {
    localStorage.setItem(KEY, raw);
  }
  setFlag(!!state.pin);
}
