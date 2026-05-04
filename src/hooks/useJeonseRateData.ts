"use client";

import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/lib/store/filter-store";
import { REGION_CODES } from "@/lib/data/regions";
import { calculateDateRange } from "@/lib/transforms/date-utils";

export interface JeonseRateRow {
  date: string;
  regionName: string;
  rate: number;
}

async function fetchOne(
  startWeek: string,
  endWeek: string,
  regionCode: string
): Promise<JeonseRateRow[]> {
  const res = await fetch("/api/jeonse-rate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startWeek, endWeek, regionCode }),
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

export function useJeonseRateData() {
  const committedParams = useFilterStore((s) => s.committedParams);

  return useQuery({
    queryKey: ["jeonseRate", committedParams],
    enabled: !!committedParams && committedParams.regions.length > 0,
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<JeonseRateRow[]> => {
      if (!committedParams) return [];
      const { regions, period, customStart, customEnd } = committedParams;
      const { startWeek, endWeek } = calculateDateRange(period, customStart, customEnd);

      const promises = regions.flatMap((regionName) => {
        const regionCode = REGION_CODES[regionName];
        if (!regionCode) return [];
        return fetchOne(startWeek, endWeek, regionCode).catch(() => [] as JeonseRateRow[]);
      });

      const results = await Promise.all(promises);
      return results.flat().sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}
