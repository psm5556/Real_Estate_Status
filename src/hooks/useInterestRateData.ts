"use client";

import { useQuery } from "@tanstack/react-query";
import { useFilterStore } from "@/lib/store/filter-store";
import { calculateDateRange, dateToMonthFormat } from "@/lib/transforms/date-utils";

export interface MortgageRateRow {
  date: string;
  rate: number;
}

async function fetchInterestRate(
  startMonth: string,
  endMonth: string
): Promise<Map<string, number>> {
  const res = await fetch("/api/interest-rate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startMonth, endMonth }),
  });
  if (!res.ok) return new Map();
  const json = await res.json();
  const rows: MortgageRateRow[] = json.data ?? [];
  return new Map(rows.map((r) => [r.date, r.rate]));
}

export function useInterestRateData() {
  const committedParams = useFilterStore((s) => s.committedParams);

  return useQuery({
    queryKey: [
      "interestRate",
      committedParams?.period,
      committedParams?.customStart,
      committedParams?.customEnd,
    ],
    enabled: !!committedParams,
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Map<string, number>> => {
      if (!committedParams) return new Map();
      const { period, customStart, customEnd } = committedParams;
      const { startDate, endDate } = calculateDateRange(period, customStart, customEnd);
      const startMonth = dateToMonthFormat(startDate);
      const endMonth = dateToMonthFormat(endDate);
      return fetchInterestRate(startMonth, endMonth).catch(() => new Map());
    },
  });
}
