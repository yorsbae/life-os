import { NavLink } from "react-router-dom";
import { TAB_MENU } from "../hooks/usePrimaryMenu";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur border-t border-surface-light pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto flex items-stretch justify-around">
        {TAB_MENU.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 flex-1 text-[10px] font-medium transition ${
                isActive ? "text-primary" : "text-gray-400"
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
