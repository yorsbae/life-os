import type { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { ProgressBar } from "./Progress";

import { tx } from "../../lib/i18n";
interface ItemRowProps {
  icon: LucideIcon;
  title: string;
  subtitle?: ReactNode;
  /** 0..100; jika diisi, tampil progress bar di bawah teks */
  progress?: number | null;
  trailing?: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
}

/** Baris daftar bergambar-ikon: ikon sampul, judul, subjudul, progress, panah. */
export default function ItemRow({ icon: Icon, title, subtitle, progress, trailing, onClick, chevron = true }: ItemRowProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className="card w-full p-3 flex items-center gap-3 text-left">
      <span className="w-11 h-11 rounded-xl bg-surface-light text-primary flex items-center justify-center shrink-0">
        <Icon size={20} />
      </span>
      <span className="flex-1 min-w-0 space-y-1">
        <span className="block text-sm font-medium text-gray-50 truncate">{tx(title)}</span>
        {subtitle && <span className="block text-[11px] text-gray-400 truncate">{tx(subtitle)}</span>}
        {progress != null && <ProgressBar value={progress} max={100} />}
      </span>
      {tx(trailing)}
      {onClick && chevron && <ChevronRight size={16} className="text-gray-500 shrink-0" />}
    </Comp>
  );
}
