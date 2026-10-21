import type { ReactNode } from "react";

/** Label kecil di atas input (gaya form pada desain). */
export default function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1.5 min-w-0 ${className}`}>
      <span className="text-xs text-gray-400">{label}</span>
      {children}
    </label>
  );
}
