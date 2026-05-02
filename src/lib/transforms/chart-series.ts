import type { PriceRow, ChartDataPoint, ChartSeries } from "@/types/price-data";
import type { PriceType } from "@/types/price-data";

// 차트 라인 색상 팔레트
const COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#d97706", // amber-600
  "#7c3aed", // violet-600
  "#0891b2", // cyan-600
  "#db2777", // pink-600
  "#65a30d", // lime-600
  "#ea580c", // orange-600
  "#0f766e", // teal-600
  "#4f46e5", // indigo-600
  "#be185d", // pink-800
];

export function buildChartData(
  data: PriceRow[],
  regions: string[],
  priceType: "매매" | "전세" | "both"
): { chartData: ChartDataPoint[]; series: ChartSeries[] } {
  const series: ChartSeries[] = [];
  const priceTypes: PriceType[] = priceType === "both" ? ["매매", "전세"] : [priceType];

  // 시리즈 키 생성
  let colorIndex = 0;
  for (const region of regions) {
    const color = COLORS[colorIndex % COLORS.length];
    colorIndex++;
    for (const pt of priceTypes) {
      const key = `${region}__${pt}`;
      series.push({
        key,
        regionName: region,
        priceType: pt,
        color,
        dash: pt === "전세" ? "5 5" : undefined,
      });
    }
  }

  // 날짜별로 집계
  const dateMap = new Map<string, ChartDataPoint>();
  for (const row of data) {
    if (priceType !== "both" && row.priceType !== priceType) continue;
    if (!regions.includes(row.regionName)) continue;

    if (!dateMap.has(row.date)) {
      dateMap.set(row.date, { date: row.date });
    }
    const key = `${row.regionName}__${row.priceType}`;
    dateMap.get(row.date)![key] = row.value;
  }

  const chartData = Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return { chartData, series };
}
