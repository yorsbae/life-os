// Sistem bahasa Life OS: Indonesia, English, 中文, 日本語.
//
// Kunci terjemahan = teks sumber persis seperti di kode (Bahasa Indonesia atau Inggris).
//   t("Simpan")                      -> "Save" (en), "保存" (zh), "保存" (ja)
//   t("{0} dari {1} selesai", [3,5]) -> placeholder {0}, {1}
//   tx(value)                        -> terjemahkan jika value string yang ada di kamus,
//                                       selain itu dikembalikan apa adanya (aman untuk data DB).
// Bahasa Indonesia memakai kunci apa adanya kecuali ada entri di id.ts (mis. kunci berbahasa Inggris).
// Tiap file bahasa terpisah: id.ts, en.ts, zh.ts, ja.ts (Record<string, string>).

import { id as idDict } from "./id";
import { en as enDict } from "./en";
import { zh as zhDict } from "./zh";
import { ja } from "./ja";
import { enUS, id as idLoc, ja as jaLoc, zhCN } from "date-fns/locale";
import type { Locale } from "date-fns";

export type Lang = "id" | "en" | "zh" | "ja";

export const LANGUAGES: { code: Lang; native: string; english: string }[] = [
  { code: "id", native: "Bahasa Indonesia", english: "Indonesian" },
  { code: "en", native: "English", english: "English" },
  { code: "zh", native: "中文", english: "Chinese" },
  { code: "ja", native: "日本語", english: "Japanese" },
];

const DICTS: Record<Lang, Record<string, string>> = { id: idDict, en: enDict, zh: zhDict, ja };
const STORAGE_KEY = "lifeos-lang";

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "id" || saved === "en" || saved === "zh" || saved === "ja") return saved;
    const n = (navigator.language || "id").toLowerCase();
    if (n.startsWith("zh")) return "zh";
    if (n.startsWith("ja")) return "ja";
    if (n.startsWith("en")) return "en";
  } catch {
    /* localStorage bisa tidak tersedia */
  }
  return "id";
}

let current: Lang = detect();

export function getLang(): Lang {
  return current;
}

export function setLangRaw(l: Lang) {
  current = l;
  try {
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l === "zh" ? "zh-CN" : l;
  } catch {
    /* abaikan */
  }
}

function fill(s: string, params?: (string | number)[] | Record<string, string | number>) {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => {
    const v = Array.isArray(params) ? params[Number(k)] : params[k];
    return v === undefined ? m : String(v);
  });
}

export function t(key: string, params?: (string | number)[] | Record<string, string | number>): string {
  const hit = DICTS[current][key];
  return fill(hit ?? key, params);
}

/** Terjemahkan hanya jika string dikenal; aman dipanggil pada nilai apa pun. */
export function tx<T>(v: T): T | string {
  if (typeof v !== "string") return v;
  const hit = DICTS[current][v];
  return hit ?? v;
}

const DATE_LOCALES: Record<Lang, Locale> = { id: idLoc, en: enUS, zh: zhCN, ja: jaLoc };
export function dateLocale(): Locale {
  return DATE_LOCALES[current];
}

const INTL: Record<Lang, string> = { id: "id-ID", en: "en-US", zh: "zh-CN", ja: "ja-JP" };
export function intlLocale(): string {
  return INTL[current];
}
