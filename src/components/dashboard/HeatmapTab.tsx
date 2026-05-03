"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { HeatmapD3 } from "@/components/charts/HeatmapD3";
import { useFilterStore } from "@/lib/store/filter-store";
import { cn } from "@/lib/utils";
import type { PriceRow } from "@/types/price-data";
import type { HeatmapMode } from "@/lib/transforms/heatmap";

interface HeatmapTabProps {
  data: PriceRow[];
  loading?: boolean;
}

const MODES: { value: HeatmapMode; label: string; desc: string }[] = [
  { value: "cumulative", label: "누적 변화율", desc: "조회 기간 시작 대비 변화율" },
  { value: "wow", label: "전주 변동률", desc: "직전 주 대비 변화율" },
];

export function HeatmapTab({ data, loading }: HeatmapTabProps) {
  const committedParams = useFilterStore((s) => s.committedParams);
  const heatmapMode = useFilterStore((s) => s.heatmapMode);
  const setHeatmapMode = useFilterStore((s) => s.setHeatmapMode);

  const priceType = committedParams?.priceType ?? "매매";

  const selectedMode = MODES.find((m) => m.value === heatmapMode) ?? MODES[0];

  // data에서 실제 등장하는 지역명 추출 (API CLS_NM 기준)
  const activeRegions = useMemo(() => {
    const set = new Set<string>();
    for (const r of data) set.add(r.regionName);
    return Array.from(set).sort();
  }, [data]);

  const [hiddenRegions, setHiddenRegions] = useState<Set<string>>(new Set());

  const toggleRegion = useCallback((region: string) => {
    setHiddenRegions((prev) => {
      const next = new Set(prev);
      next.has(region) ? next.delete(region) : next.add(region);
      return next;
    });
  }, []);

  const allHidden =
    activeRegions.length > 0 && activeRegions.every((r) => hiddenRegions.has(r));

  const toggleAll = useCallback(() => {
    setHiddenRegions(allHidden ? new Set() : new Set(activeRegions));
  }, [allHidden, activeRegions]);

  const visibleRegions = activeRegions.filter((r) => !hiddenRegions.has(r));

  return (
    <div className="flex flex-col gap-4">
      {/* 모드 선택 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-2">모드:</span>
        {MODES.map((m) => (
          <Button
            key={m.value}
            variant={heatmapMode === m.value ? "default" : "outline"}
            size="sm"
            className={cn("h-7 text-xs", heatmapMode === m.value && "font-semibold")}
            onClick={() => setHeatmapMode(m.value)}
          >
            {m.label}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground ml-2">{selectedMode.desc}</span>
      </div>

      {/* 지역 토글 */}
      {activeRegions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={toggleAll}
            className="px-2 py-0.5 rounded border border-border text-muted-foreground hover:bg-muted transition-colors shrink-0"
          >
            {allHidden ? "전체 켜기" : "전체 끄기"}
          </button>
          {activeRegions.map((r) => {
            const hidden = hiddenRegions.has(r);
            return (
              <button
                key={r}
                onClick={() => toggleRegion(r)}
                className={cn(
                  "px-2 py-0.5 rounded border border-border hover:bg-muted transition-opacity",
                  hidden && "opacity-40"
                )}
              >
                {r}
              </button>
            );
          })}
        </div>
      )}

      <HeatmapD3
        data={data}
        regions={visibleRegions}
        priceType={priceType}
        mode={heatmapMode}
        loading={loading}
      />
    </div>
  );
}
