"use client";

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

  const regions = committedParams?.regions ?? [];
  const priceType = committedParams?.priceType ?? "매매";

  const selectedMode = MODES.find((m) => m.value === heatmapMode) ?? MODES[0];

  return (
    <div className="flex flex-col gap-4">
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

      <HeatmapD3
        data={data}
        regions={regions}
        priceType={priceType}
        mode={heatmapMode}
        loading={loading}
      />
    </div>
  );
}
