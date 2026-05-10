"use client";

import { useMemo, useState } from "react";
import { useFilterStore } from "@/lib/store/filter-store";
import { REGION_CODES } from "@/lib/data/regions";
import { useJeonseRateData } from "@/hooks/useJeonseRateData";
import { useJeonseConversionRateData } from "@/hooks/useJeonseConversionRateData";
import { Skeleton } from "@/components/ui/skeleton";
import type { PriceRow, PriceType } from "@/types/price-data";

interface MonthRow {
  month: string;
  maemae?: number;
  jeonse?: number;
  jeonseRate?: number;
  conversionRate?: number;
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
      }));
  }, [data, effectiveRegion, jeonseRateRows, convRateRows]);

  const isLoading = loading || jrLoading || crLoading;

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

      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left p-2 pl-3 font-medium text-muted-foreground">월</th>
              <th className="text-right p-2 font-medium text-muted-foreground">매매지수</th>
              <th className="text-right p-2 font-medium text-muted-foreground">전세지수</th>
              <th className="text-right p-2 font-medium text-muted-foreground">전세가율(%)</th>
              <th className="text-right p-2 font-medium text-muted-foreground">전환율(%)</th>
              <th className="text-right p-2 pr-3 font-medium text-muted-foreground">가율×전환율</th>
            </tr>
          </thead>
          <tbody>
            {tableData.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground text-sm">
                  해당 지역의 데이터가 없습니다
                </td>
              </tr>
            ) : (
              tableData.map((row) => {
                const combined =
                  row.jeonseRate !== undefined && row.conversionRate !== undefined
                    ? (row.jeonseRate * row.conversionRate) / 100
                    : undefined;
                return (
                  <tr key={row.month} className="border-b hover:bg-muted/30">
                    <td className="text-left p-2 pl-3 font-mono text-xs text-muted-foreground">
                      {row.month}
                    </td>
                    <td className="text-right p-2">{row.maemae?.toFixed(1) ?? "-"}</td>
                    <td className="text-right p-2">{row.jeonse?.toFixed(1) ?? "-"}</td>
                    <td className="text-right p-2">{row.jeonseRate?.toFixed(2) ?? "-"}</td>
                    <td className="text-right p-2">{row.conversionRate?.toFixed(2) ?? "-"}</td>
                    <td className="text-right p-2 pr-3">{combined?.toFixed(2) ?? "-"}</td>
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
