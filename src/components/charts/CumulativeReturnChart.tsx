"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { PriceRow } from "@/types/price-data";
import type { PriceTypeOption } from "@/lib/store/filter-store";

interface CumulativeReturnChartProps {
  data: PriceRow[];
  priceType: PriceTypeOption;
}

export function CumulativeReturnChart({ data, priceType }: CumulativeReturnChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    const filtered =
      priceType === "both" ? data : data.filter((r) => r.priceType === priceType);

    const groups = new Map<string, PriceRow[]>();
    for (const row of filtered) {
      const key =
        priceType === "both"
          ? `${row.regionName} ${row.priceType}`
          : row.regionName;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    const result: { label: string; value: number }[] = [];
    for (const [label, rows] of groups) {
      rows.sort((a, b) => a.date.localeCompare(b.date));
      const first = rows[0].value;
      const last = rows[rows.length - 1].value;
      if (first === 0) continue;
      result.push({ label, value: parseFloat(((last / first - 1) * 100).toFixed(3)) });
    }
    return result.sort((a, b) => b.value - a.value);
  }, [data, priceType]);

  if (chartData.length === 0) return null;

  const barHeight = 28;
  const chartHeight = Math.max(120, chartData.length * barHeight + 40);

  return (
    <div className="flex flex-col gap-2 pt-2 border-t">
      <h4 className="text-xs font-medium text-muted-foreground">기간 누적 등락률</h4>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 90, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
            className="text-muted-foreground"
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            width={88}
          />
          <Tooltip
            formatter={(v) => [
              typeof v === "number" ? `${v > 0 ? "+" : ""}${v.toFixed(3)}%` : v,
              "누적 등락률",
            ]}
          />
          <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={20}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.value >= 0 ? "#dc2626" : "#2563eb"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
