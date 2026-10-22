import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { t } from "../../lib/i18n";

// Pengganti elemen select native: pemilih bottom-sheet dengan target sentuh besar (min 48px),
// tanda centang pada pilihan aktif, dan kolom cari otomatis kalau pilihan banyak.
// API sengaja mirip select native: terima <option> sebagai children dan onChange(e) dengan
// e.target.value, jadi tinggal ganti tag tanpa mengubah handler yang sudah ada.

interface Opt {
  value: string;
  label: ReactNode;
  text: string;
  disabled: boolean;
}

function nodeText(n: ReactNode): string {
  if (n == null || typeof n === "boolean") return "";
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(nodeText).join("");
  if (isValidElement(n)) return nodeText((n.props as { children?: ReactNode }).children);
  return "";
}

function readOptions(children: ReactNode, out: Opt[] = []): Opt[] {
  Children.forEach(children, (c) => {
    if (!isValidElement(c)) return;
    const el = c as ReactElement<{
      value?: string | number;
      disabled?: boolean;
      children?: ReactNode;
    }>;
    if (el.type === Fragment) {
      readOptions(el.props.children, out);
    } else if (el.type === "option") {
      const label = el.props.children;
      const text = nodeText(label);
      out.push({
        value: el.props.value !== undefined ? String(el.props.value) : text,
        label,
        text,
        disabled: !!el.props.disabled,
      });
    }
  });
  return out;
}

const SEARCH_THRESHOLD = 8;

export interface SelectProps {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Judul bottom-sheet. */
  title?: string;
}

export default function Select({
  value,
  onChange,
  children,
  className = "",
  disabled,
  placeholder,
  title,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  const options = useMemo(() => readOptions(children), [children]);
  const current = options.find((o) => o.value === value);
  const searchable = options.length > SEARCH_THRESHOLD;
  const visible = query.trim()
    ? options.filter((o) => o.text.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    selectedRef.current?.scrollIntoView({ block: "center" });
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pick = (o: Opt) => {
    if (o.disabled) return;
    onChange({ target: { value: o.value } });
    close();
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={`input-field min-h-12 flex items-center justify-between gap-2 text-left disabled:opacity-50 ${className}`}
      >
        <span className={`truncate ${current ? "" : "text-gray-500"}`}>
          {current ? current.label : (placeholder ?? t("Pilih"))}
        </span>
        <ChevronDown size={18} className="text-gray-400 shrink-0" aria-hidden />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[70] bg-black/60 flex items-end" onClick={close}>
            <div
              role="dialog"
              aria-label={title ?? t("Pilih")}
              className="w-full max-h-[75vh] flex flex-col bg-surface rounded-t-3xl pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-3" />
              <h2 className="px-5 pb-2 text-sm font-semibold text-gray-50">{title ?? t("Pilih")}</h2>
              {searchable && (
                <div className="px-4 pb-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("Cari...")}
                      className="input-field"
                      style={{ paddingLeft: "2.25rem" }}
                    />
                  </div>
                </div>
              )}
              <div role="listbox" className="overflow-y-auto px-2">
                {visible.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-gray-400">{t("Tidak ada hasil")}</p>
                )}
                {visible.map((o) => {
                  const selected = o.value === value;
                  return (
                    <button
                      key={o.value}
                      ref={selected ? selectedRef : undefined}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={o.disabled}
                      onClick={() => pick(o)}
                      className={`w-full min-h-12 px-3 py-3 rounded-xl flex items-center justify-between gap-3 text-left text-sm transition active:bg-surface-light disabled:opacity-40 ${
                        selected ? "bg-primary/10 text-primary font-medium" : "text-gray-100"
                      }`}
                    >
                      <span className="min-w-0 break-words">{o.label}</span>
                      {selected && <Check size={18} className="shrink-0" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
