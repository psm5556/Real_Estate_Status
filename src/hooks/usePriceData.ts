"use client";

import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/lib/store/filter-store";
import { REGION_CODES } from "@/lib/data/regions";
import { calculateDateRange } from "@/lib/transforms/date-utils";
import type { PriceRow } from "@/types/price-data";
import type { PriceType } from "@/types/price-data";

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
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "알 수 없는 오류" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data ?? [];
}

export function usePriceData() {
  const committedParams = useFilterStore((s) => s.committedParams);

  return useQuery({
    queryKey: ["priceData", committedParams],
    enabled: !!committedParams && committedParams.regions.length > 0,
    staleTime: 60 * 60 * 1000, // 1시간 클라이언트 캐시
    queryFn: async () => {
      if (!committedParams) return [];

      const { regions, period, customStart, customEnd, priceType } = committedParams;
      const { startWeek, endWeek } = calculateDateRange(period, customStart, customEnd);
      const priceTypes: PriceType[] =
        priceType === "both" ? ["매매", "전세"] : [priceType];

      // 병렬 팬아웃: N지역 × M가격유형
      // API가 반환하는 CLS_NM은 짧은 이름(예: "강남지역")이므로
      // 필터에서 사용한 전체 이름(예: "서울>강남지역")으로 덮어씀
      const promises = regions.flatMap((regionName) => {
        const regionCode = REGION_CODES[regionName];
        if (!regionCode) return [];
        return priceTypes.map((pt) =>
          fetchOne(pt, startWeek, endWeek, regionCode)
            .then((rows) => rows.map((row) => ({ ...row, regionName })))
            .catch(() => [] as PriceRow[])
        );
      });

      const results = await Promise.all(promises);
      return results.flat();
    },
  });
}
