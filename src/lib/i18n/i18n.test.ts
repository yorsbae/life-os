import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { en } from "./en";
import { zh } from "./zh";
import { ja } from "./ja";

// Pengecekan konsistensi bahasa: setiap teks t("...") di kode harus punya terjemahan en/zh/ja.
// Teks yang sudah belum terjemah saat pengecekan ini dibuat dicatat di i18n-baseline.json agar
// tidak menggagalkan tes; teks BARU tanpa terjemahan akan menggagalkan tes.
// Perbarui baseline (hanya untuk MENGURANGI isinya): UPDATE_I18N_BASELINE=1 npx vitest run src/lib/i18n

const SRC = join(process.cwd(), "src");
const BASELINE = join(SRC, "lib/i18n/i18n-baseline.json");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) && !p.includes("/lib/i18n/")) out.push(p);
  }
  return out;
}

function usedKeys(): Set<string> {
  const keys = new Set<string>();
  const re = /\bt\(\s*("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/g;
  for (const f of walk(SRC)) {
    const text = readFileSync(f, "utf8");
    for (const m of text.matchAll(re)) {
      const raw = m[1];
      try {
        keys.add(raw[0] === '"' ? JSON.parse(raw) : JSON.parse(`"${raw.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"')}"`));
      } catch {
        /* literal aneh, lewati */
      }
    }
  }
  keys.delete("");
  return keys;
}

const LANGS = { en, zh, ja } as const;

describe("kelengkapan terjemahan", () => {
  const used = usedKeys();
  const missing = Object.fromEntries(
    Object.entries(LANGS).map(([lang, dict]) => [lang, [...used].filter((k) => !(k in dict)).sort()]),
  ) as Record<keyof typeof LANGS, string[]>;

  if (process.env.UPDATE_I18N_BASELINE === "1") {
    it("menulis baseline", () => {
      writeFileSync(BASELINE, JSON.stringify(missing, null, 1) + "\n");
    });
    return;
  }

  const baseline: Record<string, string[]> = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : { en: [], zh: [], ja: [] };

  for (const lang of Object.keys(LANGS) as (keyof typeof LANGS)[]) {
    it(`teks baru punya terjemahan ${lang}`, () => {
      const allowed = new Set(baseline[lang] ?? []);
      const fresh = missing[lang].filter((k) => !allowed.has(k));
      expect(fresh, `Tambahkan terjemahan ${lang} untuk:\n${fresh.join("\n")}`).toEqual([]);
    });
  }
});
