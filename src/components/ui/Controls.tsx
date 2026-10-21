import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Check, Inbox, Plus, type LucideIcon } from "lucide-react";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`card p-4 text-left w-full ${className}`}
    >
      {children}
    </Comp>
  );
}

export function PrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full bg-primary text-on-primary font-semibold rounded-xl py-3 text-sm transition active:scale-[0.99] disabled:opacity-50 ${className}`}
    />
  );
}

export function GhostButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full border border-primary/60 text-primary font-medium rounded-xl py-3 text-sm transition disabled:opacity-50 ${className}`}
    />
  );
}

export function Fab({
  onClick,
  label = "Tambah",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed right-5 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg shadow-black/40 flex items-center justify-center z-30"
    >
      <Plus size={24} />
    </button>
  );
}

export function Chip({
  children,
  active,
  onClick,
  tone = "default",
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  tone?: "default" | "danger" | "primary";
}) {
  const toneCls =
    tone === "danger"
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : tone === "primary"
        ? "bg-primary/15 text-primary border-primary/30"
        : active
          ? "bg-primary text-on-primary border-primary"
          : "bg-surface text-gray-300 border-surface-light";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${toneCls}`}
    >
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full relative transition ${
        checked ? "bg-primary" : "bg-surface-light"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function CheckCircle({
  checked,
  onClick,
  size = 24,
}: {
  checked: boolean;
  onClick?: () => void;
  size?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full flex items-center justify-center border-2 transition ${
        checked
          ? "bg-primary border-primary text-on-primary"
          : "border-gray-600 text-transparent"
      }`}
    >
      <Check size={size * 0.62} strokeWidth={3} />
    </button>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-sm font-semibold text-gray-100">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  hint?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="card p-6 text-center flex flex-col items-center gap-2">
      <Icon size={28} className="text-gray-500" strokeWidth={1.5} />
      <p className="text-sm font-medium text-gray-200">{title}</p>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {action}
    </div>
  );
}

/** Bottom sheet modal untuk form tambah/edit. */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[90vh] overflow-y-auto bg-surface rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto -mt-1" />
        <h2 className="text-base font-semibold text-gray-50">{title}</h2>
        {children}
      </div>
    </div>
  );
}
