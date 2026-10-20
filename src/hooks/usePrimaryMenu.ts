import { useState, useEffect } from "react";

export interface MenuOption {
  path: string;
  label: string;
  icon: string;
}

export const ALL_MENU_OPTIONS: MenuOption[] = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/money", label: "Money", icon: "💰" },
  { path: "/exercises", label: "Body", icon: "💪" },
  { path: "/mind-growth", label: "Mind & Growth", icon: "🧠" },
  { path: "/creative", label: "Creative", icon: "🎬" },
  { path: "/notes", label: "Notes", icon: "📝" },
  { path: "/projects", label: "Projects", icon: "🛠️" },
  { path: "/social-accounts", label: "Social Accounts", icon: "📱" },
  { path: "/goals", label: "Goals", icon: "🎯" },
  { path: "/achievements", label: "Achievements", icon: "🏆" },
  { path: "/calendar", label: "Calendar", icon: "🗓" },
  { path: "/analytics", label: "Analytics", icon: "📊" },
];

const DEFAULT_PRIMARY_PATHS = ["/", "/money", "/calendar", "/creative"];
const STORAGE_KEY = "primary-menu-paths";

// Preferensi ini murni UI (bukan data pribadi penting), jadi cukup disimpan
// di HP masing-masing (localStorage) - tidak perlu ribet sinkron ke server.
export function usePrimaryMenu() {
  const [primaryPaths, setPrimaryPaths] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_PRIMARY_PATHS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(primaryPaths));
  }, [primaryPaths]);

  const togglePath = (path: string) => {
    setPrimaryPaths((prev) => {
      if (prev.includes(path)) return prev.filter((p) => p !== path);
      if (prev.length >= 4) return prev; // maksimal 4 slot di bottom nav
      return [...prev, path];
    });
  };

  const primaryMenu = ALL_MENU_OPTIONS.filter((m) =>
    primaryPaths.includes(m.path),
  );

  return { primaryPaths, primaryMenu, togglePath };
}
