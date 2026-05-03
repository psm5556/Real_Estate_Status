"use client";

import { useMemo, useState, useCallback } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { buildChartData } from "@/lib/transforms/chart-series";
import { normalizeTo100 } from "@/lib/transforms/normalize";
import { cn } from "@/lib/utils";
import type { PriceRow } from "@/types/price-data";
import type { PriceTypeOption } from "@/lib/store/filter-store";

interface TrendChartProps {
  data: PriceRow[];
  regions: string[];
  priceType: PriceTypeOption;
  normalize: boolean;
  loading?: boolean;
}

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

  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const toggleKey = useCallback((key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }, []);

  const allHidden = series.length > 0 && series.every((s) => hiddenKeys.has(s.key));
  const toggleAll = useCallback(() => {
    setHiddenKeys(allHidden ? new Set() : new Set(series.map((s) => s.key)));
  }, [allHidden, series]);

  const yDomain = useMemo(() => {
    const visibleKeys = series.filter((s) => !hiddenKeys.has(s.key)).map((s) => s.key);
    if (visibleKeys.length === 0) return ["auto", "auto"] as const;
    let min = Infinity;
    let max = -Infinity;
    for (const row of chartData) {
      for (const key of visibleKeys) {
        const v = row[key] as number | undefined;
        if (v !== undefined && isFinite(v)) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
    if (!isFinite(min) || !isFinite(max)) return ["auto", "auto"] as const;
    const pad = Math.max((max - min) * 0.05, 0.2);
    return [
      Math.floor((min - pad) * 10) / 10,
      Math.ceil((max + pad) * 10) / 10,
    ] as const;
  }, [chartData, series, hiddenKeys]);

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

  const totalWeeks = chartData.length;
  const tickInterval =
    totalWeeks <= 52 ? Math.floor(totalWeeks / 12) || 1
    : totalWeeks <= 260 ? Math.floor(totalWeeks / 26) || 1
    : Math.floor(totalWeeks / 52) || 1;

  return (
    <div className="flex flex-col gap-3">
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
            domain={yDomain}
            label={{
              value: normalize ? "지수 (2022-01-31=100)" : "지수",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              style: { fontSize: 11, fill: "currentColor" },
            }}
          />
          <Tooltip content={<CustomTooltip />} />

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
              hide={hiddenKeys.has(s.key)}
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

      {/* 커스텀 범례 */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs px-1">
        <button
          onClick={toggleAll}
          className="px-2 py-0.5 rounded border border-border text-muted-foreground hover:bg-muted transition-colors shrink-0"
        >
          {allHidden ? "전체 켜기" : "전체 끄기"}
        </button>
        {series.map((s) => {
          const label = `${s.regionName}${priceType === "both" ? ` ${s.priceType}` : ""}`;
          const hidden = hiddenKeys.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggleKey(s.key)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded border border-border transition-opacity hover:bg-muted",
                hidden && "opacity-40"
              )}
            >
              <span
                className="inline-block w-4 h-0.5 shrink-0"
                style={
                  s.dash
                    ? { borderTop: `2px dashed ${s.color}`, backgroundColor: "transparent" }
                    : { backgroundColor: s.color }
                }
              />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
