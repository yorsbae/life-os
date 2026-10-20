import { db } from "../lib/db";

// Pengaturan kecil milik perangkat ini (bukan data pengguna, tidak ikut backup).

export async function getSetting(key: string): Promise<string | null> {
  const { data } = await db
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  return db.from("app_settings").upsert({ key, value });
}
