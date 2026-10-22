import { useState, type ButtonHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { t, tx } from "../../lib/i18n";

// Tombol hapus seragam + dialog konfirmasi bertema (pengganti window.confirm).
// Warna memakai token red-400 yang sudah pastel di tema ini, bukan red-500 mentah.

export function ConfirmDialog({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center px-6"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm bg-surface rounded-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-gray-100 whitespace-pre-line">{tx(message)}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="min-h-12 rounded-xl border border-surface-light text-gray-200 text-sm font-medium active:bg-surface-light"
          >
            {t("Batal")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-12 rounded-xl bg-red-400 text-gray-950 text-sm font-semibold active:bg-red-500"
          >
            {confirmLabel ?? t("Hapus")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface BaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> {
  /** Dijalankan setelah pengguna menyetujui. */
  onConfirm: () => void;
  /** Pesan konfirmasi. Kosongkan untuk menghapus langsung (mis. ada fitur undo). */
  confirmMessage?: string;
  /** Teks pada tombol; tanpa ini hanya ikon. */
  label?: string;
  size?: number;
}

/** Tombol hapus kecil di baris daftar: ikon tempat sampah, target sentuh 44px. */
export function DeleteButton({
  onConfirm,
  confirmMessage,
  label,
  size = 16,
  className = "",
  ...rest
}: BaseProps) {
  const [asking, setAsking] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={label ?? t("Hapus")}
        {...rest}
        onClick={() => (confirmMessage ? setAsking(true) : onConfirm())}
        className={`shrink-0 inline-flex items-center justify-center gap-1.5 min-w-11 min-h-11 rounded-xl text-red-400/80 active:bg-red-500/15 hover:text-red-400 transition ${
          label ? "px-3 text-xs font-medium" : ""
        } ${className}`}
      >
        <Trash2 size={size} aria-hidden />
        {label && <span>{label}</span>}
      </button>
      {asking && (
        <ConfirmDialog
          message={confirmMessage!}
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            onConfirm();
          }}
        />
      )}
    </>
  );
}

/** Tombol hapus lebar penuh (di dalam sheet/form): outline merah pastel, setara GhostButton. */
export function DangerButton({
  onConfirm,
  confirmMessage,
  label,
  className = "",
  ...rest
}: BaseProps & { label: string }) {
  const [asking, setAsking] = useState(false);
  return (
    <>
      <button
        type="button"
        {...rest}
        onClick={() => (confirmMessage ? setAsking(true) : onConfirm())}
        className={`w-full min-h-12 rounded-xl border border-red-400/40 bg-red-500/5 text-red-400 text-sm font-medium flex items-center justify-center gap-2 transition active:bg-red-500/15 disabled:opacity-50 ${className}`}
      >
        <Trash2 size={16} aria-hidden /> {label}
      </button>
      {asking && (
        <ConfirmDialog
          message={confirmMessage!}
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            onConfirm();
          }}
        />
      )}
    </>
  );
}
