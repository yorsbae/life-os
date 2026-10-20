import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { initDb, LOCAL_USER_ID } from "../lib/db";

// Life OS berjalan sepenuhnya lokal dan single-user: tidak ada login/akun.
// Konteks ini tetap bernama "Auth" agar seluruh hook yang memakai `useAuth()`
// tidak perlu diubah. Fungsinya sekarang:
//   1. Menyediakan satu pengguna lokal tetap (`user.id`).
//   2. Menahan tampilan (`loading`) sampai database SQLite siap & termigrasi.

interface LocalUser {
  id: string;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  dbError: string | null;
}

const LOCAL_USER: LocalUser = { id: LOCAL_USER_ID };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    initDb()
      .then(() => !cancelled && setReady(true))
      .catch((e: unknown) => {
        if (!cancelled)
          setDbError(e instanceof Error ? e.message : "Database gagal dibuka");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value: AuthContextType = {
    user: ready ? LOCAL_USER : null,
    loading: !ready && !dbError,
    dbError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider");
  }
  return context;
}
