import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { WeightLog } from "../../features/profile/useWeightLogs";

interface WeightTrendChartProps {
  logs: WeightLog[];
}

export default function WeightTrendChart({ logs }: WeightTrendChartProps) {
  // Urutkan dari lama ke baru, ambil 20 terakhir biar chart tidak terlalu padat
  const data = [...logs]
    .sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
    )
    .slice(-20)
    .map((l) => ({
      label: new Date(l.tanggal).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      }),
      berat: l.berat,
    }));

  if (data.length < 2) {
    return (
      <p className="text-gray-400 text-sm py-8 text-center">
        Butuh minimal 2 catatan berat badan untuk lihat tren.
      </p>
    );
  }

  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
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
            domain={["dataMin - 2", "dataMax + 2"]}
          />
          <Tooltip
            formatter={(v) => [`${v} kg`, ""]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Line
            type="monotone"
            dataKey="berat"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#8b5cf6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
