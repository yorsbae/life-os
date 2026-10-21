import { t, tx } from "../../lib/i18n";
import { rupiah } from "../../utils/format";

interface CategoryPieChartProps {
  data: Record<string, number>;
  /** Pesan saat kosong (opsional). */
  emptyText?: string;
}

// Palet hijau-kebiruan selaras tema (tidak ada warna merah/oranye terang).
export const CATEGORY_COLORS = ["#7dc7a0", "#5fb0c9", "#e5c07b", "#b79be0", "#e58f8f", "#8fb4e5", "#d6a37a", "#a3c97d"];

/** Donut kategori + legenda. Data: { kategori: nominal }. */
export default function CategoryPieChart({ data, emptyText }: CategoryPieChartProps) {
  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (entries.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">{emptyText ?? t("Belum ada data pengeluaran.")}</p>;
  }

  const r = 42;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-32 h-32 shrink-0 -rotate-90" role="img" aria-label={t("Kategori")}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#2e3a33" strokeWidth="16" />
        {entries.map(([name, v], i) => {
          const len = (v / total) * c;
          const el = (
            <circle
              key={name}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
              strokeWidth="16"
              strokeDasharray={`${Math.max(len - 1, 0)} ${c}`}
              strokeDashoffset={-acc}
            />
          );
          acc += len;
          return el;
        })}
      </svg>
      <ul className="flex-1 min-w-0 space-y-1.5">
        {entries.slice(0, 6).map(([name, v], i) => (
          <li key={name} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
            <span className="flex-1 min-w-0 truncate text-gray-200">{tx(name)}</span>
            <span className="text-gray-400 shrink-0">{Math.round((v / total) * 100)}%</span>
          </li>
        ))}
        <li className="text-[11px] text-gray-400 pt-1">{t("Total")}: {rupiah(total)}</li>
      </ul>
    </div>
  );
}
