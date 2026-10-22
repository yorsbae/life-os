// Grafik SVG ringan bertema Life OS (tanpa dependensi). Viewbox tetap, skala otomatis.
import { num } from "../../utils/format";

import { tx } from "../../lib/i18n";
export interface ChartPoint {
  label: string;
  value: number;
}

const W = 340;
const PAD = { l: 34, r: 10, t: 10, b: 22 };
const GRID = "#2e3a33";
const TEXT = "#8b8f93";
const PRIMARY = "#7dc7a0";

function niceRange(min: number, max: number, pad = 0.1) {
  if (min === max) {
    const d = Math.abs(min) * 0.1 || 1;
    return { lo: min - d, hi: max + d };
  }
  const d = (max - min) * pad;
  return { lo: min - d, hi: max + d };
}

function xLabelIndexes(n: number, maxLabels = 6) {
  if (n <= maxLabels) return new Set(Array.from({ length: n }, (_, i) => i));
  const step = (n - 1) / (maxLabels - 1);
  return new Set(Array.from({ length: maxLabels }, (_, i) => Math.round(i * step)));
}

interface BaseProps {
  data: ChartPoint[];
  height?: number;
  /** Fungsi format label sumbu Y */
  yFormat?: (v: number) => string;
  ariaLabel?: string;
}

export function LineChart({
  data,
  height = 160,
  yFormat = (v) => num(v, 1),
  zeroBased = false,
  dots = true,
  ariaLabel,
}: BaseProps & { zeroBased?: boolean; dots?: boolean }) {
  if (data.length === 0) return null;
  const vals = data.map((d) => d.value);
  const rawMin = zeroBased ? 0 : Math.min(...vals);
  const rawMax = Math.max(...vals, zeroBased ? 1 : -Infinity);
  const { lo, hi } = zeroBased ? { lo: 0, hi: rawMax * 1.1 || 1 } : niceRange(rawMin, rawMax);
  const iw = W - PAD.l - PAD.r;
  const ih = height - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - ((v - lo) / (hi - lo || 1)) * ih;
  const ticks = [lo, lo + (hi - lo) / 2, hi];
  const labels = xLabelIndexes(data.length);
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(" ");
  const area = `${path} L${x(data.length - 1).toFixed(1)} ${PAD.t + ih} L${x(0).toFixed(1)} ${PAD.t + ih} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id="lcFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.28" />
          <stop offset="100%" stopColor={PRIMARY} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((tv, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(tv)} y2={y(tv)} stroke={GRID} strokeDasharray="3 3" />
          <text x={PAD.l - 6} y={y(tv) + 3} textAnchor="end" fontSize="9" fill={TEXT}>
            {yFormat(tv)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#lcFill)" />
      <path d={path} fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {dots &&
        data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.value)} r="3" fill="#202520" stroke={PRIMARY} strokeWidth="1.6" />)}
      {data.map((d, i) =>
        labels.has(i) ? (
          <text
            key={i}
            x={x(i)}
            y={height - 6}
            textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
            fontSize="9"
            fill={TEXT}
          >
            {tx(d.label)}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function BarChart({
  data,
  height = 150,
  yFormat = (v) => num(v, 1),
  target,
  ariaLabel,
}: BaseProps & { target?: number }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), target ?? 0, 1) * 1.1;
  const iw = W - PAD.l - PAD.r;
  const ih = height - PAD.t - PAD.b;
  const slot = iw / data.length;
  const bw = Math.min(26, slot * 0.6);
  const y = (v: number) => PAD.t + ih - (v / max) * ih;
  const labels = xLabelIndexes(data.length, 8);
  const ticks = [0, max / 2, max];

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
      {ticks.map((tv, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(tv)} y2={y(tv)} stroke={GRID} strokeDasharray="3 3" />
          <text x={PAD.l - 6} y={y(tv) + 3} textAnchor="end" fontSize="9" fill={TEXT}>
            {yFormat(tv)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = PAD.l + slot * i + slot / 2;
        const h = PAD.t + ih - y(d.value);
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={y(d.value)} width={bw} height={Math.max(h, d.value > 0 ? 2 : 0)} rx="3" fill={PRIMARY} fillOpacity="0.85" />
            {labels.has(i) && (
              <text x={cx} y={height - 6} textAnchor="middle" fontSize="9" fill={TEXT}>
                {tx(d.label)}
              </text>
            )}
          </g>
        );
      })}
      {target !== undefined && (
        <line x1={PAD.l} x2={W - PAD.r} y1={y(target)} y2={y(target)} stroke="#e5c07b" strokeDasharray="4 3" strokeWidth="1.2" />
      )}
    </svg>
  );
}

/** Dua deret garis (mis. pengeluaran vs pemasukan). */
export function DualLineChart({
  a,
  b,
  height = 160,
  yFormat = (v) => num(v, 0),
  ariaLabel,
}: {
  a: ChartPoint[];
  b: ChartPoint[];
  height?: number;
  yFormat?: (v: number) => string;
  ariaLabel?: string;
}) {
  const all = [...a, ...b].map((d) => d.value);
  if (a.length === 0) return null;
  const hi = Math.max(...all, 1) * 1.1;
  const iw = W - PAD.l - PAD.r;
  const ih = height - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (a.length === 1 ? iw / 2 : (i / (a.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - (v / hi) * ih;
  const mk = (s: ChartPoint[]) => s.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(" ");
  const labels = xLabelIndexes(a.length);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full h-auto" role="img" aria-label={ariaLabel}>
      {[0, hi / 2, hi].map((tv, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(tv)} y2={y(tv)} stroke={GRID} strokeDasharray="3 3" />
          <text x={PAD.l - 6} y={y(tv) + 3} textAnchor="end" fontSize="9" fill={TEXT}>
            {yFormat(tv)}
          </text>
        </g>
      ))}
      <path d={mk(a)} fill="none" stroke="#e57373" strokeWidth="2" strokeLinejoin="round" />
      <path d={mk(b)} fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinejoin="round" />
      {a.map((d, i) =>
        labels.has(i) ? (
          <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === a.length - 1 ? "end" : "middle"} fontSize="9" fill={TEXT}>
            {tx(d.label)}
          </text>
        ) : null,
      )}
    </svg>
  );
}
