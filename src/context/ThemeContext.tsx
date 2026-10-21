import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Aplikasi selalu bertema gelap. Yang bisa diubah: warna aksen dan ukuran teks.
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
const FONT_PX: Record<FontSize, string> = { small: "14px", normal: "16px", large: "18px" };

interface ThemeContextType {
  accent: AccentKey;
  setAccent: (a: AccentKey) => void;
  fontSize: FontSize;
  setFontSize: (f: FontSize) => void;
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

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    const color = ACCENTS.find((a) => a.key === accent)!.color;
    root.style.setProperty("--color-primary", color);
    root.style.setProperty("--color-primary-dim", `color-mix(in srgb, ${color} 70%, black)`);
    root.style.fontSize = FONT_PX[fontSize];
    try {
      localStorage.setItem("lifeos-accent", accent);
      localStorage.setItem("lifeos-font", fontSize);
    } catch {
      /* abaikan */
    }
  }, [accent, fontSize]);

  return <ThemeContext.Provider value={{ accent, setAccent, fontSize, setFontSize }}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme harus dipakai di dalam ThemeProvider");
  return ctx;
}
