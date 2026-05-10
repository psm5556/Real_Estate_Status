import type { PriceRow } from "@/types/price-data";
import { parseISO } from "date-fns";

export const DEFAULT_BASE_DATE = "2013-04-16";

export function normalizeTo100(data: PriceRow[], baseDateStr: string = DEFAULT_BASE_DATE): PriceRow[] {
  const baseDate = parseISO(baseDateStr);

  // 지역 + 가격유형 조합별로 그룹화
  const groups = new Map<string, PriceRow[]>();
  for (const row of data) {
    const key = `${row.regionName}__${row.priceType}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const normalized: PriceRow[] = [];
  for (const [, rows] of Array.from(groups)) {
    // 기준일에 가장 가까운 날짜의 값 찾기
    let closestRow = rows[0];
    let minDiff = Infinity;
    for (const row of rows) {
      const diff = Math.abs(parseISO(row.date).getTime() - baseDate.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestRow = row;
      }
    }
    const baseValue = closestRow.value;
    if (!baseValue || baseValue === 0) {
      normalized.push(...rows);
      continue;
    }

    for (const row of rows) {
      normalized.push({ ...row, value: (row.value / baseValue) * 100 });
    }
  }

  return normalized;
}
