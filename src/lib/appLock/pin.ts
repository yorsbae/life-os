// Logika murni App Lock: hash PIN berkunci salt + jadwal jeda percobaan salah.
// Tidak menyentuh penyimpanan/DOM supaya mudah dites.

export const PIN_MIN = 4;
export const PIN_MAX = 6;
export const PIN_ITERATIONS = 210_000;

export interface PinRecord {
  v: 1;
  salt: string; // base64, 16 byte acak per PIN
  iterations: number;
  hash: string; // base64, PBKDF2-HMAC-SHA256 256-bit
}

export interface LockState {
  pin: PinRecord | null;
  /** Percobaan salah berturut-turut sejak terakhir berhasil. */
  failed: number;
  /** Epoch ms; sebelum waktu ini percobaan ditolak. */
  lockedUntil: number;
  biometric: boolean;
  /** Menit di latar belakang sebelum terkunci lagi. 0 = langsung saat keluar. */
  autoLockMin: number;
}

export const DEFAULT_LOCK_STATE: LockState = {
  pin: null,
  failed: 0,
  lockedUntil: 0,
  biometric: false,
  autoLockMin: 1,
};

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`).test(pin);
}

function toB64(b: Uint8Array): string {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
}
function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function derive(pin: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
  return new Uint8Array(bits);
}

export async function createPinRecord(pin: string, iterations: number = PIN_ITERATIONS): Promise<PinRecord> {
  if (!isValidPin(pin)) throw new Error(`PIN harus ${PIN_MIN}-${PIN_MAX} digit angka.`);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { v: 1, salt: toB64(salt), iterations, hash: toB64(await derive(pin, salt, iterations)) };
}

/** Bandingkan tanpa berhenti di byte pertama yang beda. */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyPin(pin: string, rec: PinRecord): Promise<boolean> {
  if (rec.v !== 1 || !Number.isInteger(rec.iterations) || rec.iterations < 1 || rec.iterations > 2_000_000) return false;
  try {
    const got = await derive(pin, fromB64(rec.salt), rec.iterations);
    return constantTimeEqual(got, fromB64(rec.hash));
  } catch {
    return false;
  }
}

/** Jeda (detik) setelah percobaan salah ke-`failed`: 1-4 bebas, lalu 30d, 1m, 5m, 15m, 1j. */
export function lockoutSeconds(failed: number): number {
  if (failed < 5) return 0;
  const steps = [30, 60, 300, 900, 3600];
  return steps[Math.min(failed - 5, steps.length - 1)];
}

export function remainingLockMs(state: LockState, now: number): number {
  return Math.max(0, state.lockedUntil - now);
}

export function registerFailure(state: LockState, now: number): LockState {
  const failed = state.failed + 1;
  return { ...state, failed, lockedUntil: now + lockoutSeconds(failed) * 1000 };
}

export function registerSuccess(state: LockState): LockState {
  return { ...state, failed: 0, lockedUntil: 0 };
}

/** Perlu mengunci lagi setelah kembali dari latar belakang? */
export function shouldRelock(autoLockMin: number, backgroundedAt: number | null, now: number): boolean {
  if (backgroundedAt === null) return false;
  return now - backgroundedAt >= autoLockMin * 60_000;
}

/** Baca hasil simpanan dengan aman: bentuk tak dikenal -> keadaan awal (jangan crash saat buka app). */
export function parseLockState(raw: string | null): LockState {
  if (!raw) return { ...DEFAULT_LOCK_STATE };
  try {
    const o = JSON.parse(raw) as Partial<LockState>;
    const p = o.pin;
    const pinOk =
      !!p && p.v === 1 && typeof p.salt === "string" && typeof p.hash === "string" && Number.isInteger(p.iterations);
    return {
      pin: pinOk ? (p as PinRecord) : null,
      failed: Number.isInteger(o.failed) && o.failed! >= 0 ? o.failed! : 0,
      lockedUntil: typeof o.lockedUntil === "number" ? o.lockedUntil : 0,
      biometric: !!o.biometric && pinOk,
      autoLockMin: [0, 1, 5, 15, 30].includes(o.autoLockMin as number) ? (o.autoLockMin as number) : 1,
    };
  } catch {
    return { ...DEFAULT_LOCK_STATE };
  }
}
