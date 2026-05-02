"use client";

import { useMemo } from "react";
import { MetricCard } from "./MetricCard";
import type { PriceRow } from "@/types/price-data";
import { useFilterStore } from "@/lib/store/filter-store";

interface KpiRowProps {
  data: PriceRow[];
  loading?: boolean;
}

export function KpiRow({ data, loading }: KpiRowProps) {
  const committedParams = useFilterStore((s) => s.committedParams);
  const priceType = committedParams?.priceType ?? "매매";

  const kpi = useMemo(() => {
    if (data.length === 0) return null;

    const filtered = priceType === "both"
      ? data.filter((r) => r.priceType === "매매")
      : data.filter((r) => r.priceType === priceType);

    if (filtered.length === 0) return null;

    // 가장 최근 날짜 데이터
    const latestDate = filtered.reduce((max, r) => r.date > max ? r.date : max, filtered[0].date);
    const latestRows = filtered.filter((r) => r.date === latestDate);
    const avgLatest = latestRows.reduce((sum, r) => sum + r.value, 0) / latestRows.length;

    // 최초 날짜
    const firstDate = filtered.reduce((min, r) => r.date < min ? r.date : min, filtered[0].date);
    const firstRows = filtered.filter((r) => r.date === firstDate);
    const avgFirst = firstRows.reduce((sum, r) => sum + r.value, 0) / firstRows.length;

    // 전주 데이터 (latestDate 직전)
    const datesDesc = Array.from(new Set(filtered.map((r) => r.date))).sort().reverse();
    const prevDate = datesDesc[1];
    const prevRows = prevDate ? filtered.filter((r) => r.date === prevDate) : [];
    const avgPrev = prevRows.length
      ? prevRows.reduce((sum, r) => sum + r.value, 0) / prevRows.length
      : null;

    const weekDelta = avgPrev !== null ? ((avgLatest - avgPrev) / avgPrev) * 100 : undefined;
    const periodDelta = avgFirst !== 0 ? ((avgLatest - avgFirst) / avgFirst) * 100 : undefined;

    // 고점 / 저점
    const peak = Math.max(...filtered.map((r) => r.value));
    const trough = Math.min(...filtered.map((r) => r.value));
    const peakDate = filtered.find((r) => r.value === peak)?.date ?? "";
    const troughDate = filtered.find((r) => r.value === trough)?.date ?? "";

    return {
      latestIndex: avgLatest.toFixed(2),
      latestDate,
      weekDelta,
      periodDelta,
      peak: peak.toFixed(2),
      peakDate,
      trough: trough.toFixed(2),
      troughDate,
    };
  }, [data, priceType]);

  if (!committedParams) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <MetricCard key={i} title="" value={null} />
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <MetricCard key={i} title="" value={null} loading />
        ))}
      </div>
    );
  }

  if (!kpi) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="최신 지수" value="—" />
        <MetricCard title="기간 변화율" value="—" />
        <MetricCard title="기간 고점" value="—" />
        <MetricCard title="기간 저점" value="—" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        title="최신 지수"
        value={kpi.latestIndex}
        subtitle={kpi.latestDate}
        delta={kpi.weekDelta}
        deltaLabel="전주 대비"
      />
      <MetricCard
        title="기간 변화율"
        value={`${kpi.periodDelta !== undefined ? (kpi.periodDelta > 0 ? "+" : "") + kpi.periodDelta.toFixed(2) : "—"}%`}
        subtitle="조회 기간 전체"
      />
      <MetricCard
        title="기간 고점"
        value={kpi.peak}
        subtitle={kpi.peakDate}
      />
      <MetricCard
        title="기간 저점"
        value={kpi.trough}
        subtitle={kpi.troughDate}
      />
    </div>
  );
}
