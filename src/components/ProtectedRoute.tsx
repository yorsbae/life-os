import { useAuth } from "../context/AuthContext";

import { t, tx } from "../lib/i18n";
// Tidak ada login lagi. Komponen ini sekarang hanya menahan halaman
// sampai database lokal siap (atau menampilkan error jika gagal dibuka).
export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, dbError } = useAuth();

  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="space-y-2">
          <p className="text-red-500 font-medium">{t("Database gagal dibuka")}</p>
          <p className="text-xs text-gray-400 break-words">{tx(dbError)}</p>
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">{t("Memuat...")}</p>
      </div>
    );
  }

  return <>{children}</>;
}
