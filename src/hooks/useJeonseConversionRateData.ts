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

// 전환율 API는 권역 중간 단계 없이 "부산>기장군" 형태로 반환.
// REGION_CODES는 "부산>동부산권>기장군"처럼 권역 포함.
// "권"/"지역"으로 끝나는 세그먼트를 제거해 두 체계를 일치시킨다.
function simplify(name: string): string {
  return name
    .split(">")
    .filter((s) => !s.endsWith("권") && !s.endsWith("지역"))
    .join(">");
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

      // 권역 제거 후 selected region 풀네임으로 역매핑
      const simplifiedToFull = new Map<string, string>(
        regions.map((r) => [simplify(r), r])
      );

      return allRows
        .filter((r) => simplifiedToFull.has(r.regionName))
        .map((r) => ({ ...r, regionName: simplifiedToFull.get(r.regionName) ?? r.regionName }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}
