"use client";

import { useMemo } from "react";
import { CorrelationHeatmap } from "@/components/charts/CorrelationHeatmap";
import { buildCorrelationMatrix } from "@/lib/transforms/correlation";
import { useFilterStore } from "@/lib/store/filter-store";
import { Skeleton } from "@/components/ui/skeleton";
import type { PriceRow } from "@/types/price-data";

interface CorrelationTabProps {
  data: PriceRow[];
  loading?: boolean;
}

export function CorrelationTab({ data, loading }: CorrelationTabProps) {
  const committedParams = useFilterStore((s) => s.committedParams);
  const priceType = committedParams?.priceType ?? "매매";

  const { keys, matrix } = useMemo(
    () => buildCorrelationMatrix(data, priceType),
    [data, priceType]
  );

  if (loading) return <Skeleton className="w-full h-[500px] rounded-lg" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          지역 간 주간 변동률 상관관계
        </h3>
        <span className="text-xs text-muted-foreground">Pearson 상관계수 · WoW% 기준</span>
      </div>
      <CorrelationHeatmap keys={keys} matrix={matrix} />
    </div>
  );
}
