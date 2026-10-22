// Enkripsi file backup dengan kata sandi: PBKDF2-SHA256 -> AES-256-GCM.
// Format amplop (JSON teks, aman dibagikan):
//   { format: "lifeos-backup-encrypted", v: 1, kdf: "PBKDF2-SHA256", iterations, salt, iv, data }
// salt/iv/data = base64. Header ikut diautentikasi lewat AAD, jadi mengubah
// iterations/salt/versi akan gagal verifikasi (bukan menghasilkan data ngaco).

export const ENCRYPTED_BACKUP_FORMAT = "lifeos-backup-encrypted";
export const ENCRYPTED_BACKUP_VERSION = 1;
export const KDF_ITERATIONS = 310_000; // rekomendasi OWASP untuk PBKDF2-HMAC-SHA256
export const MIN_PASSWORD_LENGTH = 8;

// Batas atas supaya file yang dimanipulasi tidak bisa memaksa KDF berjalan berjam-jam.
const MAX_ITERATIONS = 2_000_000;

export interface EncryptedBackupEnvelope {
  format: typeof ENCRYPTED_BACKUP_FORMAT;
  v: number;
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  data: string;
}

export class WrongPasswordError extends Error {
  constructor() {
    super("Kata sandi salah atau file backup rusak.");
    this.name = "WrongPasswordError";
  }
}

export class PasswordRequiredError extends Error {
  constructor() {
    super("Backup ini terenkripsi. Masukkan kata sandi untuk membukanya.");
    this.name = "PasswordRequiredError";
  }
}

// Chunked supaya tidak kena "Maximum call stack size exceeded" pada backup besar.
function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function aad(v: number, iterations: number): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(`${ENCRYPTED_BACKUP_FORMAT}|${v}|PBKDF2-SHA256|${iterations}`);
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password.normalize("NFKC")),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function isEncryptedBackup(parsed: unknown): parsed is EncryptedBackupEnvelope {
  return (
    !!parsed &&
    typeof parsed === "object" &&
    (parsed as { format?: unknown }).format === ENCRYPTED_BACKUP_FORMAT
  );
}

/** Enkripsi teks JSON backup menjadi amplop terenkripsi (string JSON). */
export async function encryptBackup(
  plainJson: string,
  password: string,
  iterations: number = KDF_ITERATIONS,
): Promise<string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, iterations);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad(ENCRYPTED_BACKUP_VERSION, iterations) },
    key,
    new TextEncoder().encode(plainJson),
  );
  const envelope: EncryptedBackupEnvelope = {
    format: ENCRYPTED_BACKUP_FORMAT,
    v: ENCRYPTED_BACKUP_VERSION,
    kdf: "PBKDF2-SHA256",
    iterations,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(cipher)),
  };
  return JSON.stringify(envelope);
}

/** Buka amplop terenkripsi. Melempar WrongPasswordError bila sandi salah/file diubah. */
export async function decryptBackup(
  envelope: EncryptedBackupEnvelope,
  password: string,
): Promise<string> {
  if (
    envelope.v !== ENCRYPTED_BACKUP_VERSION ||
    envelope.kdf !== "PBKDF2-SHA256" ||
    !Number.isInteger(envelope.iterations) ||
    envelope.iterations < 1 ||
    envelope.iterations > MAX_ITERATIONS ||
    typeof envelope.salt !== "string" ||
    typeof envelope.iv !== "string" ||
    typeof envelope.data !== "string"
  ) {
    throw new Error("Format backup terenkripsi tidak dikenali. Perbarui aplikasi dulu.");
  }
  try {
    const key = await deriveKey(password, fromBase64(envelope.salt), envelope.iterations);
    const plain = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: fromBase64(envelope.iv),
        additionalData: aad(envelope.v, envelope.iterations),
      },
      key,
      fromBase64(envelope.data),
    );
    return new TextDecoder().decode(plain);
  } catch {
    throw new WrongPasswordError();
  }
}
