import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { SeriesPoint } from "../../utils/analyticsUtils";

interface AnalyticsChartProps {
  title: string;
  series: SeriesPoint[];
  color?: string;
  unit?: string;
  today: number;
  total: number;
  average: number;
  insight: string | null;
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(Math.round(n));
}

export default function AnalyticsChart({
  title,
  series,
  color = "#111827",
  unit = "",
  today,
  total,
  average,
  insight,
}: AnalyticsChartProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-400 mb-1">Hari ini</p>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">
            {formatNumber(today)}
            {unit}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Total periode</p>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">
            {formatNumber(total)}
            {unit}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Rata-rata</p>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">
            {formatNumber(average)}
            {unit}
          </p>
        </div>
      </div>

      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <LineChart data={series}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              formatter={(value) => [
                `${formatNumber(Number(value))}${unit}`,
                "",
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: color }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {insight && (
        <p className="text-xs text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 rounded-lg p-2">
          💡 {insight}
        </p>
      )}
    </div>
  );
}
