import { describe, it, expect } from "vitest";
import {
  createPinRecord,
  DEFAULT_LOCK_STATE,
  isValidPin,
  lockoutSeconds,
  parseLockState,
  registerFailure,
  registerSuccess,
  remainingLockMs,
  shouldRelock,
  verifyPin,
} from "./pin";

const FAST = 1000;

describe("PIN hash", () => {
  it("PIN benar lolos, PIN salah ditolak", async () => {
    const rec = await createPinRecord("123456", FAST);
    expect(await verifyPin("123456", rec)).toBe(true);
    expect(await verifyPin("123457", rec)).toBe(false);
    expect(await verifyPin("", rec)).toBe(false);
  });

  it("PIN yang sama menghasilkan salt dan hash berbeda", async () => {
    const a = await createPinRecord("4321", FAST);
    const b = await createPinRecord("4321", FAST);
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });

  it("hash tidak memuat PIN mentah", async () => {
    const rec = await createPinRecord("987654", FAST);
    expect(JSON.stringify(rec)).not.toContain("987654");
  });

  it("validasi format PIN", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
  });

  it("menolak membuat PIN tidak valid", async () => {
    await expect(createPinRecord("12", FAST)).rejects.toThrow(/PIN harus/);
  });

  it("record dengan iterations tidak masuk akal ditolak tanpa menjalankan KDF", async () => {
    const rec = await createPinRecord("1234", FAST);
    expect(await verifyPin("1234", { ...rec, iterations: 999_999_999 })).toBe(false);
    expect(await verifyPin("1234", { ...rec, hash: "!!bukan-base64!!" })).toBe(false);
  });
});

describe("jeda percobaan salah", () => {
  it("jadwal jeda naik bertahap", () => {
    expect([1, 2, 3, 4].map(lockoutSeconds)).toEqual([0, 0, 0, 0]);
    expect([5, 6, 7, 8, 9, 20].map(lockoutSeconds)).toEqual([30, 60, 300, 900, 3600, 3600]);
  });

  it("5 kali salah mengunci 30 detik, lalu sukses mereset", () => {
    let s = { ...DEFAULT_LOCK_STATE };
    const now = 1_000_000;
    for (let i = 0; i < 4; i++) s = registerFailure(s, now);
    expect(remainingLockMs(s, now)).toBe(0);
    s = registerFailure(s, now);
    expect(remainingLockMs(s, now)).toBe(30_000);
    expect(remainingLockMs(s, now + 31_000)).toBe(0);
    s = registerSuccess(s);
    expect(s.failed).toBe(0);
    expect(s.lockedUntil).toBe(0);
  });
});

describe("auto-lock", () => {
  it("mengunci setelah melewati batas menit di latar belakang", () => {
    expect(shouldRelock(1, 0, 59_999)).toBe(false);
    expect(shouldRelock(1, 0, 60_000)).toBe(true);
    expect(shouldRelock(0, 100, 100)).toBe(true); // 0 = langsung
    expect(shouldRelock(5, null, 999_999)).toBe(false); // tidak pernah ke latar belakang
  });
});

describe("parseLockState", () => {
  it("data rusak atau kosong -> keadaan awal", () => {
    expect(parseLockState(null)).toEqual(DEFAULT_LOCK_STATE);
    expect(parseLockState("{rusak")).toEqual(DEFAULT_LOCK_STATE);
    expect(parseLockState('{"pin":{"v":2}}').pin).toBeNull();
  });

  it("biometrik tidak bisa aktif tanpa PIN", () => {
    expect(parseLockState('{"biometric":true}').biometric).toBe(false);
  });

  it("nilai autoLockMin liar dinormalkan", () => {
    expect(parseLockState('{"autoLockMin":99999}').autoLockMin).toBe(1);
  });

  it("round-trip", async () => {
    const pin = await createPinRecord("2468", FAST);
    const s = { ...DEFAULT_LOCK_STATE, pin, biometric: true, autoLockMin: 5, failed: 2 };
    expect(parseLockState(JSON.stringify(s))).toEqual(s);
  });
});
