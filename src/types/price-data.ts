export type PriceType = "매매" | "전세";

export interface PriceRow {
  date: string;
  value: number;
  regionCode: string;
  regionName: string;
  priceType: PriceType;
}

export interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

export interface ChartSeries {
  key: string;
  regionName: string;
  priceType: PriceType;
  color: string;
  dash?: string;
}

export interface HeatmapMatrix {
  regions: string[];
  dates: string[];
  values: number[][];
}
