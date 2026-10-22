import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { MODULE_MENU } from "../hooks/usePrimaryMenu";
import { useShell } from "../context/ShellContext";

import { t, tx } from "../lib/i18n";
/** Drawer modul: dibuka dari ikon hamburger di header setiap halaman. */
export default function MoreSheet() {
  const { drawerOpen, closeDrawer } = useShell();
  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex" onClick={closeDrawer}>
      <aside
        className="w-72 max-w-[82vw] h-full bg-surface border-r border-surface-light p-4 pt-[max(1rem,env(safe-area-inset-top))] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-bold text-primary">Life OS</p>
            <p className="text-[11px] text-gray-400">{t("Better Habits · A Greater You")}</p>
          </div>
          <button onClick={closeDrawer} aria-label={t("Tutup")} className="p-1 text-gray-300">
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1">
          {MODULE_MENU.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={closeDrawer}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-200 hover:bg-surface-light"
            >
              <Icon size={18} className="text-primary" />
              {tx(label)}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 bg-black/55" />
    </div>
  );
}
