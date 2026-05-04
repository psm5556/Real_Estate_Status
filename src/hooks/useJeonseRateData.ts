"use client";

import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/lib/store/filter-store";
import { REGION_CODES } from "@/lib/data/regions";
import { calculateDateRange, dateToMonthFormat } from "@/lib/transforms/date-utils";

export interface JeonseRateRow {
  date: string;
  regionName: string;
  regionCode: string;
  rate: number;
}

async function fetchAll(startMonth: string, endMonth: string): Promise<JeonseRateRow[]> {
  const res = await fetch("/api/jeonse-rate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startMonth, endMonth }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []).map(
    (r: { date: string; value: number; regionName: string; regionCode: string }) => ({
      date: r.date,
      regionName: r.regionName,
      regionCode: r.regionCode,
      rate: r.value,
    })
  );
}

export function useJeonseRateData() {
  const committedParams = useFilterStore((s) => s.committedParams);

  return useQuery({
    queryKey: ["jeonseRate", committedParams],
    enabled: !!committedParams && committedParams.regions.length > 0,
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<JeonseRateRow[]> => {
      if (!committedParams) return [];
      const { regions, period, customStart, customEnd } = committedParams;
      const { startDate, endDate } = calculateDateRange(period, customStart, customEnd);
      const startMonth = dateToMonthFormat(startDate);
      const endMonth = dateToMonthFormat(endDate);

      const allRows = await fetchAll(startMonth, endMonth).catch(() => [] as JeonseRateRow[]);

      // CLS_NM은 필터 지역명과 다르므로 CLS_ID(regionCode)로 필터링
      const codeToName = new Map<string, string>(
        regions.flatMap((r) => {
          const code = REGION_CODES[r];
          return code ? [[code, r]] : [];
        })
      );
      return allRows
        .filter((r) => codeToName.has(r.regionCode))
        .map((r) => ({ ...r, regionName: codeToName.get(r.regionCode) ?? r.regionName }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}
