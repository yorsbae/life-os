import type { ReactNode } from "react";
import Navbar from "./Navbar";
import QuickAddButton from "./QuickAdd/QuickAddButton";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      {/* pb-20 di mobile supaya konten paling bawah tidak ketutupan BottomNav (~64px + safe area) */}
      <div className="pb-20 md:pb-0">{children}</div>
      <QuickAddButton />
    </div>
  );
}
