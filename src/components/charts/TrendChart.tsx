"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { buildChartData } from "@/lib/transforms/chart-series";
import { normalizeTo100 } from "@/lib/transforms/normalize";
import type { PriceRow } from "@/types/price-data";
import type { PriceTypeOption } from "@/lib/store/filter-store";

interface TrendChartProps {
  data: PriceRow[];
  regions: string[];
  priceType: PriceTypeOption;
  normalize: boolean;
  loading?: boolean;
}

// Recharts 커스텀 툴팁
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; strokeDasharray?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const sorted = [...payload].sort((a, b) => b.value - a.value);

  return (
    <div className="bg-background border rounded-lg shadow-md p-3 text-xs min-w-[180px]">
      <p className="font-medium mb-2 text-muted-foreground">{label}</p>
      {sorted.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-0.5 rounded"
              style={
                item.strokeDasharray
                  ? { borderTop: `2px dashed ${item.color}`, backgroundColor: "transparent" }
                  : { backgroundColor: item.color }
              }
            />
            <span className="text-muted-foreground">{item.name}</span>
          </div>
          <span className="font-mono font-medium">{item.value?.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({
  data,
  regions,
  priceType,
  normalize,
  loading,
}: TrendChartProps) {
  const { chartData, series } = useMemo(() => {
    const displayData = normalize ? normalizeTo100(data) : data;
    return buildChartData(displayData, regions, priceType);
  }, [data, regions, priceType, normalize]);

  if (loading) {
    return <Skeleton className="w-full h-[480px] rounded-lg" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[480px] text-muted-foreground text-sm">
        데이터가 없습니다. 지역을 선택하고 조회해 주세요.
      </div>
    );
  }

  // X축 날짜 포매팅 (데이터 밀도에 따라 자동 조정)
  const totalWeeks = chartData.length;
  const tickInterval =
    totalWeeks <= 52 ? Math.floor(totalWeeks / 12) || 1
    : totalWeeks <= 260 ? Math.floor(totalWeeks / 26) || 1
    : Math.floor(totalWeeks / 52) || 1;

  return (
    <ResponsiveContainer width="100%" height={480}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          interval={tickInterval}
          tickFormatter={(v) => v.slice(0, 7)}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => v.toFixed(1)}
          className="text-muted-foreground"
          width={55}
          label={{
            value: normalize ? "지수 (2022-01-31=100)" : "지수",
            angle: -90,
            position: "insideLeft",
            offset: 10,
            style: { fontSize: 11, fill: "currentColor" },
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          iconType="plainline"
        />

        {normalize && (
          <ReferenceLine
            y={100}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            label={{ value: "기준(100)", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
        )}

        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={`${s.regionName}${priceType === "both" ? ` ${s.priceType}` : ""}`}
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dash}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        ))}

        <Brush
          dataKey="date"
          height={24}
          stroke="hsl(var(--border))"
          fill="hsl(var(--background))"
          tickFormatter={(v) => v.slice(0, 7)}
          travellerWidth={8}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
