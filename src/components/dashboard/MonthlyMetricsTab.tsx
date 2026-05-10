"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useFilterStore } from "@/lib/store/filter-store";
import { REGION_CODES } from "@/lib/data/regions";
import { useJeonseRateData } from "@/hooks/useJeonseRateData";
import { useJeonseConversionRateData } from "@/hooks/useJeonseConversionRateData";
import { useInterestRateData } from "@/hooks/useInterestRateData";
import { Skeleton } from "@/components/ui/skeleton";
import type { PriceRow, PriceType } from "@/types/price-data";

interface MonthRow {
  month: string;
  maemae?: number;
  jeonse?: number;
  jeonseRate?: number;
  conversionRate?: number;
  mortgageRate?: number;
}

interface ChartPoint {
  month: string;
  maemae: number | null;
  jeonse: number | null;
  jeonseRate: number | null;
  optimalJeonseRate: number | null;
}

function aggregateToMonthly(rows: PriceRow[], priceType: PriceType): Map<string, number> {
  const monthMap = new Map<string, { date: string; value: number }>();
  for (const row of rows) {
    if (row.priceType !== priceType) continue;
    const month = row.date.slice(0, 7);
    const existing = monthMap.get(month);
    if (!existing || row.date > existing.date) {
      monthMap.set(month, { date: row.date, value: row.value });
    }
  }
  return new Map([...monthMap].map(([k, v]) => [k, v.value]));
}

export function MonthlyMetricsTab({ data, loading }: { data: PriceRow[]; loading: boolean }) {
  const committedParams = useFilterStore((s) => s.committedParams);
  const regions = committedParams?.regions ?? [];

  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const effectiveRegion = regions.includes(selectedRegion) ? selectedRegion : (regions[0] ?? "");

  const { data: jeonseRateRows = [], isLoading: jrLoading } = useJeonseRateData();
  const { data: convRateRows = [], isLoading: crLoading } = useJeonseConversionRateData();
  const { data: mortgageRateMap = new Map(), isLoading: mrLoading } = useInterestRateData();

  const tableData = useMemo((): MonthRow[] => {
    if (!effectiveRegion) return [];
    const regionCode = REGION_CODES[effectiveRegion];
    if (!regionCode) return [];

    const regionPriceData = data.filter((r) => r.regionCode === regionCode);
    const maemaeMap = aggregateToMonthly(regionPriceData, "매매");
    const jeonseMap = aggregateToMonthly(regionPriceData, "전세");

    const jeonseRateMap = new Map<string, number>();
    for (const r of jeonseRateRows) {
      if (r.regionName === effectiveRegion) jeonseRateMap.set(r.date, r.rate);
    }

    const convRateMap = new Map<string, number>();
    for (const r of convRateRows) {
      if (r.regionName === effectiveRegion) convRateMap.set(r.date, r.rate);
    }

    const allMonths = new Set<string>([
      ...maemaeMap.keys(),
      ...jeonseMap.keys(),
      ...jeonseRateMap.keys(),
      ...convRateMap.keys(),
      ...mortgageRateMap.keys(),
    ]);

    return [...allMonths]
      .sort()
      .reverse()
      .map((month) => ({
        month,
        maemae: maemaeMap.get(month),
        jeonse: jeonseMap.get(month),
        jeonseRate: jeonseRateMap.get(month),
        conversionRate: convRateMap.get(month),
        mortgageRate: mortgageRateMap.get(month),
      }));
  }, [data, effectiveRegion, jeonseRateRows, convRateRows, mortgageRateMap]);

  const chartData = useMemo((): ChartPoint[] => {
    return [...tableData].reverse().map((row) => ({
      month: row.month,
      maemae: row.maemae ?? null,
      jeonse: row.jeonse ?? null,
      jeonseRate: row.jeonseRate ?? null,
      optimalJeonseRate:
        row.mortgageRate !== undefined && row.conversionRate !== undefined && row.conversionRate !== 0
          ? (row.mortgageRate / row.conversionRate) * 100
          : null,
    }));
  }, [tableData]);

  const isLoading = loading || jrLoading || crLoading || mrLoading;

  if (isLoading) return <Skeleton className="w-full h-[480px] rounded-lg" />;

  if (regions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[480px] text-muted-foreground text-sm">
        데이터가 없습니다. 지역을 선택하고 조회해 주세요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground shrink-0">지역</span>
        <select
          value={effectiveRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="border rounded px-2 py-1 bg-background text-sm max-w-xs"
        >
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* 멀티 차트: 매매·전세지수(라인) + 전세가율·적정전세가율(바) */}
      <div className="rounded-lg border bg-card p-3">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={chartData}
            margin={{ top: 4, right: 52, bottom: 0, left: 0 }}
            barGap={0}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: string) => v.slice(2)}
              minTickGap={32}
            />
            <YAxis
              yAxisId="index"
              tick={{ fontSize: 10 }}
              width={46}
              tickFormatter={(v: number) => v.toFixed(0)}
              label={{ value: "지수", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 10, fill: "var(--muted-foreground)" } }}
            />
            <YAxis
              yAxisId="rate"
              orientation="right"
              tick={{ fontSize: 10 }}
              width={46}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              label={{ value: "%", angle: 90, position: "insideRight", offset: 10, style: { fontSize: 10, fill: "var(--muted-foreground)" } }}
            />
            <Tooltip
              contentStyle={{ fontSize: 11 }}
              formatter={(value: unknown, name: unknown) => {
                const label = String(name ?? "");
                if (typeof value !== "number") return ["-", label];
                if (label === "매매지수" || label === "전세지수") return [value.toFixed(1), label];
                return [`${value.toFixed(1)}%`, label];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />

            {/* 전세가율 — 기준 바 (먼저 렌더링) */}
            <Bar
              yAxisId="rate"
              dataKey="jeonseRate"
              name="전세가율"
              fill="#8b5cf6"
              fillOpacity={0.55}
              radius={[2, 2, 0, 0]}
            />
            {/* 적정 전세가율 — 같은 x 위치에 오버랩 */}
            <Bar
              yAxisId="rate"
              dataKey="optimalJeonseRate"
              name="적정 전세가율"
              fill="#f59e0b"
              fillOpacity={0.55}
              radius={[2, 2, 0, 0]}
              shape={(props: any) => {
                const { x, y, width, height } = props;
                if (!height || height <= 0) return <g />;
                return (
                  <rect
                    x={x - width}
                    y={y}
                    width={width}
                    height={height}
                    fill="#f59e0b"
                    fillOpacity={0.55}
                    rx={2}
                    ry={2}
                  />
                );
              }}
            />

            {/* 라인 차트 (바 위에 렌더링) */}
            <Line
              yAxisId="index"
              type="monotone"
              dataKey="maemae"
              name="매매지수"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              yAxisId="index"
              type="monotone"
              dataKey="jeonse"
              name="전세지수"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted border-b">
              <th className="text-left p-2 pl-3 font-medium text-muted-foreground">월</th>
              <th className="text-right p-2 font-medium text-muted-foreground">매매지수</th>
              <th className="text-right p-2 font-medium text-muted-foreground">전세지수</th>
              <th className="text-right p-2 font-medium text-muted-foreground">전세가율(%)</th>
              <th className="text-right p-2 font-medium text-muted-foreground">전환율(%)</th>
              <th className="text-right p-2 font-medium text-muted-foreground">가율×전환율</th>
              <th className="text-right p-2 font-medium text-muted-foreground">금리(%)</th>
              <th className="text-center p-2 font-medium text-muted-foreground">점유 우위</th>
              <th className="text-right p-2 font-medium text-muted-foreground">적정 전세가율(%)</th>
              <th className="text-right p-2 pr-3 font-medium text-muted-foreground">하락가능률</th>
            </tr>
          </thead>
          <tbody>
            {tableData.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-4 text-center text-muted-foreground text-sm">
                  해당 지역의 데이터가 없습니다
                </td>
              </tr>
            ) : (
              tableData.map((row) => {
                const combined =
                  row.jeonseRate !== undefined && row.conversionRate !== undefined
                    ? (row.jeonseRate * row.conversionRate) / 100
                    : undefined;

                const occupancy = (() => {
                  if (combined === undefined || row.mortgageRate === undefined || row.conversionRate === undefined) return undefined;
                  if (row.mortgageRate <= combined) return "자가";
                  if (row.mortgageRate >= row.conversionRate) return "월세";
                  return "전세";
                })();

                const optimalJeonseRate =
                  row.mortgageRate !== undefined && row.conversionRate !== undefined && row.conversionRate !== 0
                    ? (row.mortgageRate / row.conversionRate) * 100
                    : undefined;

                const declineRate =
                  row.jeonseRate !== undefined && row.conversionRate !== undefined && row.conversionRate !== 0
                    ? (1 - row.jeonseRate / 100) / (row.conversionRate / 100)
                    : undefined;

                const occupancyColor =
                  occupancy === "자가" ? "text-blue-600 font-medium" :
                  occupancy === "월세" ? "text-rose-600 font-medium" :
                  "text-amber-600 font-medium";

                return (
                  <tr key={row.month} className="border-b hover:bg-muted/30">
                    <td className="text-left p-2 pl-3 font-mono text-xs text-muted-foreground">
                      {row.month}
                    </td>
                    <td className="text-right p-2">{row.maemae?.toFixed(1) ?? "-"}</td>
                    <td className="text-right p-2">{row.jeonse?.toFixed(1) ?? "-"}</td>
                    <td className="text-right p-2">{row.jeonseRate?.toFixed(2) ?? "-"}</td>
                    <td className="text-right p-2">{row.conversionRate?.toFixed(2) ?? "-"}</td>
                    <td className="text-right p-2">{combined?.toFixed(2) ?? "-"}</td>
                    <td className="text-right p-2">{row.mortgageRate?.toFixed(2) ?? "-"}</td>
                    <td className={`text-center p-2 ${occupancy ? occupancyColor : ""}`}>
                      {occupancy ?? "-"}
                    </td>
                    <td className="text-right p-2">{optimalJeonseRate?.toFixed(1) ?? "-"}</td>
                    <td className="text-right p-2 pr-3">{declineRate?.toFixed(1) ?? "-"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
