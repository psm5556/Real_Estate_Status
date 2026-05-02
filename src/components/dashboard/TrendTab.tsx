"use client";

import { KpiRow } from "@/components/kpi/KpiRow";
import { TrendChart } from "@/components/charts/TrendChart";
import { NormalizeToggle } from "@/components/filters/NormalizeToggle";
import { useFilterStore } from "@/lib/store/filter-store";
import type { PriceRow } from "@/types/price-data";

interface TrendTabProps {
  data: PriceRow[];
  loading?: boolean;
}

export function TrendTab({ data, loading }: TrendTabProps) {
  const committedParams = useFilterStore((s) => s.committedParams);
  const normalize = useFilterStore((s) => s.normalize);
  const setNormalize = useFilterStore((s) => s.setNormalize);

  const regions = committedParams?.regions ?? [];
  const priceType = committedParams?.priceType ?? "매매";

  return (
    <div className="flex flex-col gap-4">
      <KpiRow data={data} loading={loading} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          주간 가격지수 추이
        </h3>
        <NormalizeToggle checked={normalize} onChange={setNormalize} />
      </div>

      <TrendChart
        data={data}
        regions={regions}
        priceType={priceType}
        normalize={normalize}
        loading={loading}
      />
    </div>
  );
}
