"use client";

import { useState, useMemo, useCallback } from "react";
import { RegionMapD3 } from "@/components/charts/RegionMapD3";
import { PlaybackControl } from "@/components/charts/PlaybackControl";
import { useFilterStore } from "@/lib/store/filter-store";
import type { PriceRow } from "@/types/price-data";
import type { PriceTypeOption } from "@/lib/store/filter-store";

interface MapTabProps {
  data: PriceRow[];
  loading?: boolean;
}

function RankList({
  title,
  items,
  color,
}: {
  title: string;
  items: PriceRow[];
  color: "red" | "blue";
}) {
  return (
    <div className="rounded-lg border p-3 text-xs">
      <div className="font-semibold mb-2 text-sm">{title}</div>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-2">데이터 없음</p>
      ) : (
        items.map((r, i) => (
          <div
            key={`${r.regionCode}-${i}`}
            className="flex justify-between py-0.5 border-b last:border-0"
          >
            <span className="text-muted-foreground truncate mr-2">{r.regionName}</span>
            <span
              className={`font-mono shrink-0 ${
                color === "red" ? "text-red-600" : "text-blue-600"
              }`}
            >
              {r.value?.toFixed(2)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

export function MapTab({ data, loading }: MapTabProps) {
  const committedParams = useFilterStore((s) => s.committedParams);
  const priceType = (committedParams?.priceType ?? "매매") as PriceTypeOption;

  const dates = useMemo(() => {
    const pt = priceType === "both" ? "매매" : priceType;
    const set = new Set<string>();
    for (const r of data) {
      if (r.priceType === pt) set.add(r.date);
    }
    return Array.from(set).sort();
  }, [data, priceType]);

  const [dateIndex, setDateIndex] = useState(() => Math.max(0, dates.length - 1));
  const safeIndex = Math.min(dateIndex, Math.max(0, dates.length - 1));
  const selectedDate = dates[safeIndex] ?? "";

  const handleIndexChange = useCallback((i: number) => setDateIndex(i), []);

  const ranked = useMemo(() => {
    const pt = priceType === "both" ? "매매" : priceType;
    return data
      .filter(
        (r) => r.date === selectedDate && r.priceType === pt && r.value !== undefined
      )
      .sort((a, b) => b.value - a.value);
  }, [data, selectedDate, priceType]);

  const top10 = ranked.slice(0, 10);
  const bottom10 = [...ranked].slice(-10).reverse();

  if (loading) {
    return <div className="h-[500px] animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <RegionMapD3 data={data} date={selectedDate} priceType={priceType} />

      <PlaybackControl
        dates={dates}
        currentIndex={safeIndex}
        onIndexChange={handleIndexChange}
      />

      <div className="grid grid-cols-2 gap-4 mt-1">
        <RankList title="상위 10" items={top10} color="red" />
        <RankList title="하위 10" items={bottom10} color="blue" />
      </div>
    </div>
  );
}
