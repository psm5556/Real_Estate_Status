"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendTab } from "./TrendTab";
import { HeatmapTab } from "./HeatmapTab";
import { DataTab } from "./DataTab";
import { FilterPanel } from "@/components/layout/FilterPanel";
import { usePriceData } from "@/hooks/usePriceData";
import { useFilterStore } from "@/lib/store/filter-store";
import { LineChart, Grid3X3, Table2, AlertCircle } from "lucide-react";

export function DashboardPage() {
  const { data = [], isLoading, isError, error } = usePriceData();
  const committedParams = useFilterStore((s) => s.committedParams);

  return (
    <div className="flex flex-1 overflow-hidden">
      <FilterPanel />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* 에러 상태 */}
        {isError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              데이터 조회 중 오류가 발생했습니다:{" "}
              {error instanceof Error ? error.message : "알 수 없는 오류"}
            </span>
          </div>
        )}

        {/* 미조회 상태 */}
        {!committedParams && !isLoading && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-3">
            <LineChart className="h-12 w-12 text-muted-foreground/40" />
            <h2 className="text-lg font-medium text-muted-foreground">
              좌측에서 지역을 선택하고 조회하세요
            </h2>
            <p className="text-sm text-muted-foreground/70 max-w-sm">
              256개 지역의 주간 매매·전세 가격지수를 차트와 히트맵으로 분석할 수 있습니다.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-muted-foreground/60">
              <div className="flex flex-col items-center gap-1.5">
                <LineChart className="h-5 w-5" />
                <span>가격지수 추이</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Grid3X3 className="h-5 w-5" />
                <span>지역별 히트맵</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Table2 className="h-5 w-5" />
                <span>원본 데이터</span>
              </div>
            </div>
          </div>
        )}

        {/* 데이터 조회 후 */}
        {committedParams && (
          <Tabs defaultValue="trend" className="flex flex-col gap-4">
            <TabsList className="w-fit">
              <TabsTrigger value="trend" className="gap-1.5 text-xs sm:text-sm">
                <LineChart className="h-3.5 w-3.5" />
                추이
              </TabsTrigger>
              <TabsTrigger value="heatmap" className="gap-1.5 text-xs sm:text-sm">
                <Grid3X3 className="h-3.5 w-3.5" />
                히트맵
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-1.5 text-xs sm:text-sm">
                <Table2 className="h-3.5 w-3.5" />
                데이터
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trend" className="mt-0">
              <TrendTab data={data} loading={isLoading} />
            </TabsContent>

            <TabsContent value="heatmap" className="mt-0">
              <HeatmapTab data={data} loading={isLoading} />
            </TabsContent>

            <TabsContent value="data" className="mt-0">
              <DataTab data={data} loading={isLoading} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
