import type { PriceRow } from "@/types/price-data";
import type { PriceTypeOption } from "@/lib/store/filter-store";

export interface CorrelationKey {
  key: string;
  label: string;
}

export interface CorrelationResult {
  keys: CorrelationKey[];
  matrix: number[][];
}

function pearson(a: number[], b: number[]): number {
  const pairs: [number, number][] = [];
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (isFinite(a[i]) && isFinite(b[i])) pairs.push([a[i], b[i]]);
  }
  if (pairs.length < 3) return NaN;

  const meanA = pairs.reduce((s, [x]) => s + x, 0) / pairs.length;
  const meanB = pairs.reduce((s, [, y]) => s + y, 0) / pairs.length;

  let num = 0, denA = 0, denB = 0;
  for (const [x, y] of pairs) {
    const da = x - meanA, db = y - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const denom = Math.sqrt(denA * denB);
  return denom === 0 ? NaN : num / denom;
}

export function buildCorrelationMatrix(
  data: PriceRow[],
  priceTypeOption: PriceTypeOption
): CorrelationResult {
  const filtered =
    priceTypeOption === "both" ? data : data.filter((r) => r.priceType === priceTypeOption);
  if (filtered.length === 0) return { keys: [], matrix: [] };

  const allDates = [...new Set(filtered.map((r) => r.date))].sort();
  if (allDates.length < 3) return { keys: [], matrix: [] };

  // Build value lookup: (seriesKey, date) → value
  const byDate = new Map<string, Map<string, number>>();
  const labels = new Map<string, string>();

  for (const row of filtered) {
    const seriesKey =
      priceTypeOption === "both"
        ? `${row.regionName}__${row.priceType}`
        : row.regionName;
    const label =
      priceTypeOption === "both"
        ? `${row.regionName} ${row.priceType}`
        : row.regionName;
    if (!byDate.has(seriesKey)) {
      byDate.set(seriesKey, new Map());
      labels.set(seriesKey, label);
    }
    byDate.get(seriesKey)!.set(row.date, row.value);
  }

  // Compute WoW% series per group
  const wowSeries = new Map<string, number[]>();
  for (const [key, dateMap] of byDate) {
    const wows: number[] = [];
    for (let i = 1; i < allDates.length; i++) {
      const prev = dateMap.get(allDates[i - 1]);
      const curr = dateMap.get(allDates[i]);
      wows.push(prev && prev !== 0 && curr !== undefined ? (curr / prev - 1) * 100 : NaN);
    }
    wowSeries.set(key, wows);
  }

  const keys: CorrelationKey[] = [...byDate.keys()].map((k) => ({
    key: k,
    label: labels.get(k)!,
  }));
  const n = keys.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(NaN));

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      const corr = pearson(wowSeries.get(keys[i].key)!, wowSeries.get(keys[j].key)!);
      matrix[i][j] = corr;
      matrix[j][i] = corr;
    }
  }

  return { keys, matrix };
}
