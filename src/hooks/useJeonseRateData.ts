"use client";

import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/lib/store/filter-store";
import { REGION_CODES } from "@/lib/data/regions";
import { calculateDateRange } from "@/lib/transforms/date-utils";
import type { PriceRow, PriceType } from "@/types/price-data";

export interface JeonseRateRow {
  date: string;
  regionName: string;
  rate: number;
}

async function fetchOne(
  priceType: PriceType,
  startWeek: string,
  endWeek: string,
  regionCode: string
): Promise<PriceRow[]> {
  const res = await fetch("/api/price-index", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceType, startWeek, endWeek, regionCode }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
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

      // 항상 매매+전세 모두 fetch (priceType 필터 무관)
      const promises = regions.flatMap((regionName) => {
        const regionCode = REGION_CODES[regionName];
        if (!regionCode) return [];
        return (["매매", "전세"] as PriceType[]).map((pt) =>
          fetchOne(pt, startWeek, endWeek, regionCode).catch(() => [] as PriceRow[])
        );
      });

      const flat = (await Promise.all(promises)).flat();

      // 매매/전세 룩업 테이블 구성
      const maemaeMap = new Map<string, number>();
      const jeonseMap = new Map<string, number>();
      for (const row of flat) {
        const k = `${row.regionName}__${row.date}`;
        if (row.priceType === "매매") maemaeMap.set(k, row.value);
        else jeonseMap.set(k, row.value);
      }

      // 전세가율 계산
      const rows: JeonseRateRow[] = [];
      for (const [k, jeonseVal] of jeonseMap) {
        const maemaeVal = maemaeMap.get(k);
        if (maemaeVal && maemaeVal !== 0) {
          const sep = k.indexOf("__");
          rows.push({
            regionName: k.slice(0, sep),
            date: k.slice(sep + 2),
            rate: (jeonseVal / maemaeVal) * 100,
          });
        }
      }

      return rows.sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}
