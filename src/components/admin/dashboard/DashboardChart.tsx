"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { type ChartPoint } from "@/lib/actions/dashboard";

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  notation: "compact",
  compactDisplay: "short",
});

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl shadow-lg px-4 py-3 text-sm min-w-[160px]">
      <p className="font-semibold text-foreground mb-2 capitalize">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: p.color }}
            />
            {p.name}
          </span>
          <span className="font-medium text-foreground">
            {p.dataKey === "facturado"
              ? ARS.format(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DashboardChart({ data }: { data: ChartPoint[] }) {
  const hasData = data.some((d) => d.pedidos > 0 || d.facturado > 0);

  if (!hasData) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        Aún no hay datos suficientes para mostrar el gráfico.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="pedidos"
          orientation="left"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <YAxis
          yAxisId="facturado"
          orientation="right"
          tickFormatter={(v) => ARS.format(v)}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          formatter={(value) => (
            <span style={{ color: "var(--muted-foreground)" }}>{value}</span>
          )}
        />
        <Line
          yAxisId="pedidos"
          type="monotone"
          dataKey="pedidos"
          name="Pedidos"
          stroke="#7c3aed"
          strokeWidth={2}
          dot={{ r: 3, fill: "#7c3aed", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <Line
          yAxisId="facturado"
          type="monotone"
          dataKey="facturado"
          name="Facturado"
          stroke="#be185d"
          strokeWidth={2}
          dot={{ r: 3, fill: "#be185d", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
