import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Tema: gelap, terang, atau ikuti sistem. Selain itu bisa diubah: warna aksen dan ukuran teks.
export const ACCENTS = [
  { key: "mint", color: "#7dc7a0", label: "Mint" },
  { key: "sky", color: "#6aa8e8", label: "Biru" },
  { key: "amber", color: "#e6c25e", label: "Kuning" },
  { key: "rose", color: "#e87aa8", label: "Merah muda" },
  { key: "violet", color: "#a98be8", label: "Ungu" },
  { key: "orange", color: "#f0a35e", label: "Oranye" },
] as const;
export type AccentKey = (typeof ACCENTS)[number]["key"];
export type FontSize = "small" | "normal" | "large";
export type ThemeMode = "dark" | "light" | "system";
const MODES: readonly ThemeMode[] = ["dark", "light", "system"];

function systemPrefersLight(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  } catch {
    return false;
  }
}
const FONT_PX: Record<FontSize, string> = { small: "14px", normal: "16px", large: "18px" };

interface ThemeContextType {
  accent: AccentKey;
  setAccent: (a: AccentKey) => void;
  fontSize: FontSize;
  setFontSize: (f: FontSize) => void;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccent] = useState<AccentKey>(() => read("lifeos-accent", ACCENTS.map((a) => a.key), "mint"));
  const [fontSize, setFontSize] = useState<FontSize>(() => read("lifeos-font", ["small", "normal", "large"], "normal"));
  const [mode, setMode] = useState<ThemeMode>(() => read("lifeos-theme", MODES, "dark"));
  const [systemLight, setSystemLight] = useState<boolean>(systemPrefersLight);

  // Ikuti perubahan tema sistem saat mode "system".
  useEffect(() => {
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia("(prefers-color-scheme: light)");
    } catch {
      return;
    }
    const on = () => setSystemLight(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const light = mode === "light" || (mode === "system" && systemLight);
    root.classList.toggle("light", light);
    root.classList.toggle("dark", !light);
    const color = ACCENTS.find((a) => a.key === accent)!.color;
    // Di tema terang aksen digelapkan agar teks/tombol berkontras cukup di atas putih.
    const primary = light ? `color-mix(in srgb, ${color} 62%, black)` : color;
    root.style.setProperty("--color-primary", primary);
    root.style.setProperty("--color-primary-dim", `color-mix(in srgb, ${primary} 70%, black)`);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#f3f6f2" : "#151815");
    document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", light ? "light" : "dark");
    root.style.fontSize = FONT_PX[fontSize];
    try {
      localStorage.setItem("lifeos-accent", accent);
      localStorage.setItem("lifeos-font", fontSize);
      localStorage.setItem("lifeos-theme", mode);
    } catch {
      /* abaikan */
    }
  }, [accent, fontSize, mode, systemLight]);

  return <ThemeContext.Provider value={{ accent, setAccent, fontSize, setFontSize, mode, setMode }}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme harus dipakai di dalam ThemeProvider");
  return ctx;
}
