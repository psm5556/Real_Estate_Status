"use client";

import { useMemo } from "react";
import { KOREA_MAP_LAYOUT, AGGREGATE_CELLS } from "@/lib/data/map-layout";
import type { PriceRow } from "@/types/price-data";

interface RegionMapKoreaProps {
  data: PriceRow[];
  date: string;
}

/** WoW % change: (current / prev - 1) * 100 */
export function calcWow(data: PriceRow[], date: string): Map<string, number> {
  const dates = [...new Set(data.map((r) => r.date))].sort();
  const idx = dates.indexOf(date);
  if (idx < 1) return new Map();
  const prevDate = dates[idx - 1];
  const curr = new Map(
    data.filter((r) => r.date === date).map((r) => [r.regionCode, r.value])
  );
  const prev = new Map(
    data.filter((r) => r.date === prevDate).map((r) => [r.regionCode, r.value])
  );
  const result = new Map<string, number>();
  for (const [code, v] of curr) {
    const p = prev.get(code);
    if (p && p !== 0) result.set(code, (v / p - 1) * 100);
  }
  return result;
}

function wowToColor(wow: number | undefined): string {
  if (wow === undefined || isNaN(wow)) return "#f3f4f6";
  const abs = Math.abs(wow);
  if (abs < 0.003) return "#f9fafb";
  const intensity = Math.min(abs / 0.3, 1);
  if (wow > 0) {
    const g = Math.round(220 - intensity * 150);
    const b = Math.round(220 - intensity * 190);
    return `rgb(239,${g},${b})`;
  } else {
    const r = Math.round(220 - intensity * 170);
    const g = Math.round(220 - intensity * 100);
    return `rgb(${r},${g},246)`;
  }
}

function fmt(v: number | undefined): string {
  if (v === undefined || isNaN(v)) return "";
  return v > 0 ? `+${v.toFixed(3)}` : v.toFixed(3);
}

export function RegionMapKorea({ data, date }: RegionMapKoreaProps) {
  const wowMap = useMemo(() => calcWow(data, date), [data, date]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        데이터를 불러오는 중입니다…
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 900 }}>
        {/* 집계 행: 전국 / 수도권 / 지방 */}
        <div className="flex gap-1 mb-1">
          {AGGREGATE_CELLS.map((c) => {
            const wow = wowMap.get(c.code);
            return (
              <div
                key={c.code}
                className="flex flex-col items-center justify-center border border-gray-300 rounded px-3 py-1 text-[11px] font-bold"
                style={{ backgroundColor: wowToColor(wow), minWidth: 80 }}
              >
                <span>{c.name}</span>
                <span className="font-mono text-[10px]">{fmt(wow)}</span>
              </div>
            );
          })}
        </div>

        {/* 메인 타일맵 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(16, 1fr)",
            gridAutoRows: "minmax(14px, auto)",
            gap: "2px",
          }}
        >
          {KOREA_MAP_LAYOUT.map((province) => {
            const provWow = wowMap.get(province.code);
            return (
              <div
                key={province.code}
                style={{
                  gridArea: province.gridArea,
                  border: "2px solid #6b7280",
                  borderRadius: 3,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* 시도 헤더 */}
                <div
                  className="flex items-center justify-between px-1 py-0.5 shrink-0"
                  style={{
                    backgroundColor: wowToColor(provWow),
                    borderBottom: "1px solid #9ca3af",
                  }}
                >
                  <span className="text-[11px] font-bold leading-tight">{province.name}</span>
                  <span className="text-[9px] font-mono ml-1 opacity-90">{fmt(provWow)}</span>
                </div>

                {/* 시군구 내부 그리드 */}
                {province.districts.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${province.innerCols}, 1fr)`,
                      gap: "1px",
                      flex: 1,
                    }}
                  >
                    {province.districts.map((d) => {
                      const wow = wowMap.get(d.code);
                      return (
                        <div
                          key={d.code}
                          title={`${d.name}: ${fmt(wow)}`}
                          style={{
                            backgroundColor: wowToColor(wow),
                            gridColumn: d.colSpan ? `span ${d.colSpan}` : undefined,
                            padding: "1px 2px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          <div className="text-[9px] font-medium leading-tight truncate">
                            {d.name}
                          </div>
                          <div className="text-[8px] font-mono leading-tight opacity-80">
                            {fmt(wow)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
