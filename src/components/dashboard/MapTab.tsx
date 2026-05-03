"use client";

import { useState, useMemo, useCallback } from "react";
import { RegionMapKorea, calcWow } from "@/components/charts/RegionMapKorea";
import { PlaybackControl } from "@/components/charts/PlaybackControl";
import { useMapData } from "@/hooks/useMapData";
import { Skeleton } from "@/components/ui/skeleton";

interface RankEntry {
  code: string;
  name: string;
  wow: number;
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

  const dates = useMemo(() => {
    const set = new Set<string>();
    for (const r of data) set.add(r.date);
    return Array.from(set).sort();
  }, [data]);

  const [dateIndex, setDateIndex] = useState(() => Math.max(0, dates.length - 1));
  const safeIndex = Math.min(dateIndex, Math.max(0, dates.length - 1));
  const selectedDate = dates[safeIndex] ?? "";

  const handleIndexChange = useCallback((i: number) => setDateIndex(i), []);

  const wowMap = useMemo(() => calcWow(data, selectedDate), [data, selectedDate]);

  const { top10, bottom10 } = useMemo(() => {
    // Build name map from data
    const nameByCode = new Map<string, string>();
    for (const r of data) nameByCode.set(r.regionCode, r.regionName);

    const entries: RankEntry[] = [];
    for (const [code, wow] of wowMap) {
      const name = nameByCode.get(code) ?? code;
      entries.push({ code, name, wow });
    }
    entries.sort((a, b) => b.wow - a.wow);
    return {
      top10: entries.slice(0, 10),
      bottom10: entries.slice(-10).reverse(),
    };
  }, [wowMap, data]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="w-full h-[600px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 지도 제목 */}
      <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
        <span>아파트 주간 매매가격지수 전주대비 증감률</span>
        <span className="font-mono text-xs">{selectedDate}</span>
      </div>

      {/* 타일맵 */}
      <RegionMapKorea data={data} date={selectedDate} />

      {/* 재생 컨트롤 */}
      <PlaybackControl
        dates={dates}
        currentIndex={safeIndex}
        onIndexChange={handleIndexChange}
      />

      {/* Top10 / Bottom10 */}
      <div className="grid grid-cols-2 gap-4 mt-1">
        <RankList title="상승률 Top 10" items={top10} positive={true} />
        <RankList title="하락률 Top 10" items={bottom10} positive={false} />
      </div>
    </div>
  );
}
