import { describe, it, expect, vi, beforeEach } from "vitest";

const mem = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => void mem.set(k, v),
});
let native = true;
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => native } }));
const get = vi.fn();
const set = vi.fn();
vi.mock("@aparajita/capacitor-secure-storage", () => ({ SecureStorage: { get, set } }));

import { loadLockState, saveLockState } from "./store";
import { DEFAULT_LOCK_STATE } from "./pin";

beforeEach(() => {
  mem.clear();
  get.mockReset();
  set.mockReset();
  native = true;
});

describe("loadLockState (native)", () => {
  it("instalasi baru: nilai kosong -> status bawaan", async () => {
    get.mockResolvedValue(null);
    expect((await loadLockState()).pin).toBeNull();
  });

  it("Keystore gagal dan PIN tidak pernah aktif -> lanjut tanpa PIN (tidak macet)", async () => {
    get.mockRejectedValue(new Error("keystore rusak"));
    expect(await loadLockState()).toEqual(DEFAULT_LOCK_STATE);
    expect(get).toHaveBeenCalledTimes(2); // dicoba ulang sekali
  });

  it("Keystore gagal tetapi PIN pernah aktif -> error dilempar, kunci tidak dilewati", async () => {
    mem.set("lifeos-lock-flag", "1");
    get.mockRejectedValue(new Error("keystore rusak"));
    await expect(loadLockState()).rejects.toThrow("keystore rusak");
  });

  it("berhasil pada percobaan kedua", async () => {
    get.mockRejectedValueOnce(new Error("sementara")).mockResolvedValueOnce(null);
    expect((await loadLockState()).pin).toBeNull();
  });

  it("menulis penanda saat status disimpan", async () => {
    set.mockResolvedValue(undefined);
    await saveLockState({ ...DEFAULT_LOCK_STATE, pin: { salt: "s", hash: "h", iter: 1 } as never });
    expect(mem.get("lifeos-lock-flag")).toBe("1");
  });
});
