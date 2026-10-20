import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, Search } from "lucide-react";
import { useShell } from "../../context/ShellContext";

interface PageHeaderProps {
  title: string;
  /** "menu" = hamburger buka drawer modul, "back" = kembali, "none" = tanpa ikon kiri */
  left?: "menu" | "back" | "none";
  /** Aksi kanan kustom. Jika tidak diisi dan search=true, tampil ikon cari. */
  right?: ReactNode;
  search?: boolean;
  onBack?: () => void;
  className?: string;
}

export default function PageHeader({
  title,
  left = "menu",
  right,
  search = true,
  onBack,
  className = "",
}: PageHeaderProps) {
  const navigate = useNavigate();
  const { openDrawer, openSearch } = useShell();

  return (
    <header className={`sticky top-0 z-20 bg-bg/95 backdrop-blur px-4 pt-[max(0.9rem,env(safe-area-inset-top))] pb-3 flex items-center gap-3 ${className}`}>
      {left === "menu" && (
        <button
          onClick={openDrawer}
          aria-label="Buka menu"
          className="p-1 -ml-1 text-gray-100"
        >
          <Menu size={22} />
        </button>
      )}
      {left === "back" && (
        <button
          onClick={onBack ?? (() => navigate(-1))}
          aria-label="Kembali"
          className="p-1 -ml-1 text-gray-100"
        >
          <ArrowLeft size={22} />
        </button>
      )}
      <h1 className="flex-1 text-lg font-semibold text-gray-50 truncate">
        {title}
      </h1>
      {right ??
        (search && (
          <button
            onClick={openSearch}
            aria-label="Cari"
            className="p-1 text-gray-300"
          >
            <Search size={20} />
          </button>
        ))}
    </header>
  );
}
