"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RegionTreeSelect } from "@/components/filters/RegionTreeSelect";
import { PeriodSelector } from "@/components/filters/PeriodSelector";
import { PriceTypeToggle } from "@/components/filters/PriceTypeToggle";
import { NormalizeToggle } from "@/components/filters/NormalizeToggle";
import { useFilterStore } from "@/lib/store/filter-store";

export function FilterPanel() {
  const {
    selectedRegions,
    period,
    customStart,
    customEnd,
    priceType,
    normalize,
    setSelectedRegions,
    setPeriod,
    setCustomStart,
    setCustomEnd,
    setPriceType,
    setNormalize,
    commit,
  } = useFilterStore();

  return (
    <aside className="w-64 shrink-0 border-r bg-background flex flex-col h-[calc(100vh-3.5rem)] sticky top-14">
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
        {/* 지역 선택 */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            지역
          </h3>
          <RegionTreeSelect
            selected={selectedRegions}
            onChange={setSelectedRegions}
          />
        </section>

        <Separator />

        {/* 기간 선택 */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            기간
          </h3>
          <PeriodSelector
            period={period}
            customStart={customStart}
            customEnd={customEnd}
            onPeriodChange={setPeriod}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />
        </section>

        <Separator />

        {/* 가격 유형 */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            가격 유형
          </h3>
          <PriceTypeToggle value={priceType} onChange={setPriceType} />
        </section>

        <Separator />

        {/* 차트 옵션 */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            옵션
          </h3>
          <NormalizeToggle checked={normalize} onChange={setNormalize} />
        </section>
      </div>

      {/* 조회 버튼 */}
      <div className="p-3 border-t">
        <Button
          className="w-full"
          onClick={commit}
          disabled={selectedRegions.length === 0}
        >
          <Search className="h-4 w-4 mr-2" />
          조회하기
        </Button>
        {selectedRegions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-1.5">
            지역을 선택해 주세요
          </p>
        )}
      </div>
    </aside>
  );
}
