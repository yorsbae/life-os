function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toBase64(bytes.buffer);
}

// PIN (bukan hash-nya) dipakai sebagai "password" untuk turunkan kunci AES lewat PBKDF2.
// 100.000 iterasi supaya brute-force lambat walau PIN cuma 4-6 digit.
async function deriveKey(pin: string, saltB64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const salt = fromBase64(saltB64);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// Hasil enkripsi: IV (12 byte) + ciphertext digabung jadi 1 string base64, biar gampang disimpan 1 kolom
export async function encryptText(
  plainText: string,
  pin: string,
  saltB64: string,
): Promise<string> {
  const key = await deriveKey(pin, saltB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plainText),
  );
  const combined = new Uint8Array(iv.length + cipherBuf.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuf), iv.length);
  return toBase64(combined.buffer);
}

// Kalau PIN salah, AES-GCM akan gagal verifikasi integritas dan throw error (bukan hasil ngaco diam-diam)
export async function decryptText(
  cipherB64: string,
  pin: string,
  saltB64: string,
): Promise<string> {
  const key = await deriveKey(pin, saltB64);
  const combined = fromBase64(cipherB64);
  const iv = combined.slice(0, 12);
  const cipherBytes = combined.slice(12);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    cipherBytes as BufferSource,
  );
  return new TextDecoder().decode(plainBuf);
}
