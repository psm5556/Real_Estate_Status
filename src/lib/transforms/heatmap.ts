import type { PriceRow, HeatmapMatrix } from "@/types/price-data";

export type HeatmapMode = "cumulative" | "wow";

export function buildHeatmapMatrix(
  data: PriceRow[],
  _regions: string[],
  mode: HeatmapMode
): HeatmapMatrix {
  if (data.length === 0) return { regions: [], dates: [], values: [] };

  // 날짜·지역 목록을 데이터에서 직접 추출
  const dateSet = new Set<string>();
  const regionSet = new Set<string>();
  for (const row of data) {
    dateSet.add(row.date);
    regionSet.add(row.regionName);
  }
  const dates = Array.from(dateSet).sort();
  const regions = Array.from(regionSet);

  const result: number[][] = [];

  for (const regionName of regions) {
    const regionData = data
      .filter((r) => r.regionName === regionName)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (regionData.length === 0) {
      result.push(dates.map(() => 0));
      continue;
    }

    // 날짜별 값 맵
    const valueMap = new Map<string, number>();
    for (const row of regionData) valueMap.set(row.date, row.value);

    if (mode === "cumulative") {
      const firstValue = regionData[0].value;
      const row = dates.map((date) => {
        const val = valueMap.get(date);
        if (val === undefined || firstValue === 0) return 0;
        return ((val - firstValue) / firstValue) * 100;
      });
      result.push(row);
    } else {
      // 전주 변동률
      const values = dates.map((date) => valueMap.get(date) ?? null);
      const row = values.map((val, i) => {
        if (val === null) return 0;
        if (i === 0) return 0;
        const prev = values[i - 1];
        if (prev === null || prev === 0) return 0;
        return ((val - prev) / prev) * 100;
      });
      result.push(row);
    }
  }

  return { regions, dates, values: result };
}
