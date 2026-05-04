"use client";

import { useMemo, useState, useCallback } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Brush,
  ResponsiveContainer,
} from "recharts";
import { useJeonseRateData } from "@/hooks/useJeonseRateData";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const COLORS = [
  "#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed", "#0891b2",
  "#db2777", "#65a30d", "#ea580c", "#0f766e", "#4f46e5", "#be185d",
];

export function JeonseRateTab() {
  const { data: rateRows = [], isLoading } = useJeonseRateData();

  const { chartData, series } = useMemo(() => {
    if (rateRows.length === 0) return { chartData: [], series: [] };

    const allDates = [...new Set(rateRows.map((r) => r.date))].sort();
    const regionNames = [...new Set(rateRows.map((r) => r.regionName))];
    const lookup = new Map(rateRows.map((r) => [`${r.regionName}__${r.date}`, r.rate]));

    const chartData = allDates.map((date) => {
      const point: Record<string, string | number> = { date };
      for (const rn of regionNames) {
        const v = lookup.get(`${rn}__${date}`);
        if (v !== undefined) point[rn] = v;
      }
      return point;
    });

    const series = regionNames.map((rn, i) => ({
      key: rn,
      label: rn,
      color: COLORS[i % COLORS.length],
    }));

    return { chartData, series };
  }, [rateRows]);

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

  if (isLoading) return <Skeleton className="w-full h-[480px] rounded-lg" />;

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          전세가율 추이 (전세지수 ÷ 매매지수 × 100)
        </h3>
      </div>

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
            tickFormatter={(v) => `${v.toFixed(1)}`}
            className="text-muted-foreground"
            width={55}
            label={{
              value: "전세가율 (%)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              style: { fontSize: 11, fill: "currentColor" },
            }}
          />
          <Tooltip
            formatter={(v, name) => [typeof v === "number" ? `${v.toFixed(2)}%` : v, name]}
          />
          <ReferenceLine
            y={80}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            label={{ value: "80%", fontSize: 10, fill: "hsl(var(--muted-foreground))", position: "insideTopRight" }}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
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

      <div className="flex flex-wrap items-center gap-1.5 text-xs px-1">
        <button
          onClick={toggleAll}
          className="px-2 py-0.5 rounded border border-border text-muted-foreground hover:bg-muted transition-colors shrink-0"
        >
          {allHidden ? "전체 켜기" : "전체 끄기"}
        </button>
        {series.map((s) => (
          <button
            key={s.key}
            onClick={() => toggleKey(s.key)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded border border-border transition-opacity hover:bg-muted",
              hiddenKeys.has(s.key) && "opacity-40"
            )}
          >
            <span
              className="inline-block w-4 h-0.5 shrink-0"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
