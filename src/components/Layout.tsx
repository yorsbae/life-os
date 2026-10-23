import type { ReactNode } from "react";
import BottomNav from "./BottomNav";
import MoreSheet from "./MoreSheet";
import QuickCapture from "./QuickCapture";
import GlobalSearchModal from "./Search/GlobalSearchModal";
import { useShell } from "../context/ShellContext";

export default function Layout({ children }: { children: ReactNode }) {
  const { searchOpen, closeSearch } = useShell();
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-2xl mx-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <BottomNav />
      <MoreSheet />
      <QuickCapture />
      {searchOpen && <GlobalSearchModal onClose={closeSearch} />}
    </div>
  );
}
