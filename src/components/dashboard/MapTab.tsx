"use client";

import { useState, useMemo, useCallback } from "react";
import { RegionMapKorea, calcWow } from "@/components/charts/RegionMapKorea";
import { PlaybackControl } from "@/components/charts/PlaybackControl";
import { useMapData } from "@/hooks/useMapData";
import { Skeleton } from "@/components/ui/skeleton";
import type { PriceRow } from "@/types/price-data";

interface RankEntry {
  code: string;
  name: string;
  wow: number;
}

function rank(
  wowMap: Map<string, number>,
  data: PriceRow[]
): { top10: RankEntry[]; bottom10: RankEntry[] } {
  const nameByCode = new Map<string, string>();
  for (const r of data) nameByCode.set(r.regionCode, r.regionName);

  const entries: RankEntry[] = [];
  for (const [code, wow] of wowMap) {
    entries.push({ code, name: nameByCode.get(code) ?? code, wow });
  }
  entries.sort((a, b) => b.wow - a.wow);
  return {
    top10: entries.slice(0, 10),
    bottom10: entries.slice(-10).reverse(),
  };
}

function RankList({
  title,
  items,
  positive,
}: {
  title: string;
  items: RankEntry[];
  positive: boolean;
}) {
  return (
    <div className="rounded-lg border p-3 text-xs">
      <div className="font-semibold mb-2 text-sm">{title}</div>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-2">데이터 없음</p>
      ) : (
        items.map((r, i) => (
          <div
            key={r.code}
            className="flex justify-between py-0.5 border-b last:border-0"
          >
            <span className="text-muted-foreground truncate mr-2">
              {i + 1}위 {r.name}
            </span>
            <span
              className={`font-mono shrink-0 ${
                positive ? "text-red-600" : "text-blue-600"
              }`}
            >
              {r.wow > 0 ? "+" : ""}
              {r.wow.toFixed(3)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

export function MapTab() {
  const { data = [], isLoading } = useMapData();

  const maemaeData = useMemo(
    () => data.filter((r) => r.priceType === "매매"),
    [data]
  );
  const jeonseData = useMemo(
    () => data.filter((r) => r.priceType === "전세"),
    [data]
  );

  const dates = useMemo(() => {
    const set = new Set<string>();
    for (const r of maemaeData) set.add(r.date);
    return Array.from(set).sort();
  }, [maemaeData]);

  const [dateIndex, setDateIndex] = useState(() => Math.max(0, dates.length - 1));
  const safeIndex = Math.min(dateIndex, Math.max(0, dates.length - 1));
  const selectedDate = dates[safeIndex] ?? "";

  const handleIndexChange = useCallback((i: number) => setDateIndex(i), []);

  const maemaeWow = useMemo(
    () => calcWow(maemaeData, selectedDate),
    [maemaeData, selectedDate]
  );
  const { top10: maemaeTop10, bottom10: maemaeBottom10 } = useMemo(
    () => rank(maemaeWow, maemaeData),
    [maemaeWow, maemaeData]
  );

  const jeonseWow = useMemo(
    () => calcWow(jeonseData, selectedDate),
    [jeonseData, selectedDate]
  );
  const { top10: jeonseTop10, bottom10: jeonseBottom10 } = useMemo(
    () => rank(jeonseWow, jeonseData),
    [jeonseWow, jeonseData]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="w-full h-[600px] rounded-lg" />
        <Skeleton className="w-full h-[600px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 날짜 + PlaybackControl (매매·전세 공유) */}
      <div className="flex items-center justify-end">
        <span className="font-mono text-xs text-muted-foreground">{selectedDate}</span>
      </div>
      <PlaybackControl
        dates={dates}
        currentIndex={safeIndex}
        onIndexChange={handleIndexChange}
      />

      {/* 매매 섹션 */}
      <section className="flex flex-col gap-3">
        <div className="text-sm font-medium text-muted-foreground">
          아파트 주간 매매가격지수 전주대비 증감률
        </div>
        <RegionMapKorea data={maemaeData} date={selectedDate} />
        <div className="grid grid-cols-2 gap-4">
          <RankList title="상승률 Top 10" items={maemaeTop10} positive={true} />
          <RankList title="하락률 Top 10" items={maemaeBottom10} positive={false} />
        </div>
      </section>

      {/* 전세 섹션 */}
      <section className="flex flex-col gap-3">
        <div className="text-sm font-medium text-muted-foreground">
          아파트 주간 전세가격지수 전주대비 증감률
        </div>
        <RegionMapKorea data={jeonseData} date={selectedDate} />
        <div className="grid grid-cols-2 gap-4">
          <RankList title="상승률 Top 10" items={jeonseTop10} positive={true} />
          <RankList title="하락률 Top 10" items={jeonseBottom10} positive={false} />
        </div>
      </section>
    </div>
  );
}
