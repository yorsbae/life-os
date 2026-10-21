import { getSetting, setSetting } from "./appSettings";

// Bagian Home yang bisa dinyalakan/dimatikan di Profil -> Dashboard & Modul.
export const HOME_SECTIONS = ["week", "summary", "focus", "quickadd", "reminders", "quote", "training", "recurring"] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

const KEY = "home_sections";

export async function loadHomeSections(): Promise<Record<HomeSection, boolean>> {
  const raw = await getSetting(KEY);
  const base = Object.fromEntries(HOME_SECTIONS.map((s) => [s, true])) as Record<HomeSection, boolean>;
  if (!raw) return base;
  try {
    return { ...base, ...(JSON.parse(raw) as Partial<Record<HomeSection, boolean>>) };
  } catch {
    return base;
  }
}

export async function saveHomeSections(v: Record<HomeSection, boolean>) {
  await setSetting(KEY, JSON.stringify(v));
}
