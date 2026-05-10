"use client";

import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/lib/store/filter-store";
import { calculateDateRange, dateToMonthFormat } from "@/lib/transforms/date-utils";
import type { JeonseRateRow } from "@/hooks/useJeonseRateData";

async function fetchAll(startMonth: string, endMonth: string): Promise<JeonseRateRow[]> {
  const res = await fetch("/api/jeonse-conversion-rate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startMonth, endMonth }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []).map(
    (r: { date: string; value: number; regionName: string }) => ({
      date: r.date,
      regionName: r.regionName,
      rate: r.value,
    })
  );
}

export function useJeonseConversionRateData() {
  const committedParams = useFilterStore((s) => s.committedParams);

  return useQuery({
    queryKey: ["jeonseConversionRate", committedParams],
    enabled: !!committedParams && committedParams.regions.length > 0,
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<JeonseRateRow[]> => {
      if (!committedParams) return [];
      const { regions, period, customStart, customEnd } = committedParams;
      const { startDate, endDate } = calculateDateRange(period, customStart, customEnd);
      const startMonth = dateToMonthFormat(startDate);
      const endMonth = dateToMonthFormat(endDate);

      const allRows = await fetchAll(startMonth, endMonth).catch(() => [] as JeonseRateRow[]);

      const regionSet = new Set(regions);
      return allRows
        .filter((r) => regionSet.has(r.regionName))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}
