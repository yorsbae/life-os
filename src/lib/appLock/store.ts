import { Capacitor } from "@capacitor/core";
import { parseLockState, type LockState } from "./pin";

// Di Android nilai disimpan lewat SecureStorage (dienkripsi dengan kunci di Android Keystore).
// Di web/dev memakai localStorage — hanya untuk pengembangan, bukan perlindungan sungguhan.

const KEY = "lifeos-app-lock";

async function secure() {
  const { SecureStorage } = await import("@aparajita/capacitor-secure-storage");
  return SecureStorage;
}

/** Melempar error bila penyimpanan aman tidak terbaca: jangan diam-diam menganggap kunci mati. */
export async function loadLockState(): Promise<LockState> {
  if (Capacitor.isNativePlatform()) {
    const raw = await (await secure()).get(KEY);
    return parseLockState(typeof raw === "string" ? raw : null);
  }
  return parseLockState(localStorage.getItem(KEY));
}

export async function saveLockState(state: LockState): Promise<void> {
  const raw = JSON.stringify(state);
  if (Capacitor.isNativePlatform()) {
    await (await secure()).set(KEY, raw);
  } else {
    localStorage.setItem(KEY, raw);
  }
}
