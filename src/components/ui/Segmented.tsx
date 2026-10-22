import { tx } from "../../lib/i18n";
interface SegmentedProps<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}

/** Tab berbentuk pil, seperti "Hari Ini | Minggu | Bulan" pada desain. */
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedProps<T>) {
  return (
    <div
      className={`flex gap-1 p-1 rounded-full bg-surface border border-surface-light overflow-x-auto ${className}`}
      role="tablist"
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.key)}
            className={`flex-1 shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium transition ${
              active
                ? "bg-primary text-on-primary"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tx(o.label)}
          </button>
        );
      })}
    </div>
  );
}
