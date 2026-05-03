"use client";

import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { MAP_REGION_CODES } from "@/lib/data/map-layout";
import { dateToWeekFormat } from "@/lib/transforms/date-utils";
import type { PriceRow } from "@/types/price-data";

async function fetchOne(
  startWeek: string,
  endWeek: string,
  regionCode: string
): Promise<PriceRow[]> {
  const res = await fetch("/api/price-index", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceType: "매매", startWeek, endWeek, regionCode }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export function useMapData() {
  return useQuery({
    queryKey: ["mapData"],
    staleTime: 6 * 60 * 60 * 1000,
    queryFn: async () => {
      const today = new Date();
      const start = subDays(today, 180); // ~26주
      const startWeek = dateToWeekFormat(start);
      const endWeek = dateToWeekFormat(today);

      const results = await Promise.all(
        MAP_REGION_CODES.map((code) =>
          fetchOne(startWeek, endWeek, code).catch(() => [] as PriceRow[])
        )
      );
      return results.flat();
    },
  });
}
