import { describe, it, expect } from "vitest";
import {
  decryptBackup,
  encryptBackup,
  isEncryptedBackup,
  WrongPasswordError,
  type EncryptedBackupEnvelope,
} from "./backupCrypto";

const FAST = 1000; // iterasi rendah agar tes cepat
const sample = JSON.stringify({ format: "lifeos-backup", tables: { notes: [{ id: "1", body: "rahasia ñ 日本" }] } });

describe("backupCrypto", () => {
  it("round-trip: enkripsi lalu dekripsi mengembalikan teks asli", async () => {
    const enc = await encryptBackup(sample, "sandi-kuat-123", FAST);
    const env = JSON.parse(enc);
    expect(isEncryptedBackup(env)).toBe(true);
    expect(enc).not.toContain("rahasia");
    expect(await decryptBackup(env, "sandi-kuat-123")).toBe(sample);
  });

  it("sandi salah ditolak dengan WrongPasswordError", async () => {
    const env = JSON.parse(await encryptBackup(sample, "sandi-kuat-123", FAST));
    await expect(decryptBackup(env, "sandi-salah-999")).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it("ciphertext yang diubah ditolak (integritas GCM)", async () => {
    const env: EncryptedBackupEnvelope = JSON.parse(await encryptBackup(sample, "sandi-kuat-123", FAST));
    const bytes = atob(env.data).split("");
    bytes[0] = String.fromCharCode(bytes[0].charCodeAt(0) ^ 1);
    env.data = btoa(bytes.join(""));
    await expect(decryptBackup(env, "sandi-kuat-123")).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it("header yang diubah (iterations) ditolak lewat AAD", async () => {
    const env: EncryptedBackupEnvelope = JSON.parse(await encryptBackup(sample, "sandi-kuat-123", FAST));
    env.iterations = FAST + 1;
    await expect(decryptBackup(env, "sandi-kuat-123")).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it("iterations berlebihan ditolak sebelum KDF jalan", async () => {
    const env: EncryptedBackupEnvelope = JSON.parse(await encryptBackup(sample, "sandi-kuat-123", FAST));
    env.iterations = 50_000_000;
    await expect(decryptBackup(env, "sandi-kuat-123")).rejects.toThrow(/tidak dikenali/);
  });

  it("sandi pendek ditolak saat enkripsi", async () => {
    await expect(encryptBackup(sample, "pendek", FAST)).rejects.toThrow(/minimal 8/);
  });

  it("dua enkripsi dari input sama menghasilkan salt/iv/ciphertext berbeda", async () => {
    const a = JSON.parse(await encryptBackup(sample, "sandi-kuat-123", FAST));
    const b = JSON.parse(await encryptBackup(sample, "sandi-kuat-123", FAST));
    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
    expect(a.data).not.toBe(b.data);
  });

  it("backup besar (>1 MB) tidak overflow stack", async () => {
    const big = JSON.stringify({ x: "a".repeat(2_000_000) });
    const env = JSON.parse(await encryptBackup(big, "sandi-kuat-123", FAST));
    expect(await decryptBackup(env, "sandi-kuat-123")).toBe(big);
  });
});
