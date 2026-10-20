import { createContext, useContext, useState, type ReactNode } from "react";

// Status UI global: drawer modul + pencarian. Dipakai PageHeader di setiap halaman.
interface ShellContextType {
  drawerOpen: boolean;
  searchOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  openSearch: () => void;
  closeSearch: () => void;
}

const ShellContext = createContext<ShellContextType | undefined>(undefined);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <ShellContext.Provider
      value={{
        drawerOpen,
        searchOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        openSearch: () => setSearchOpen(true),
        closeSearch: () => setSearchOpen(false),
      }}
    >
      {children}
    </ShellContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell harus dipakai di dalam ShellProvider");
  return ctx;
}
