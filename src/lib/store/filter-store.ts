import { create } from "zustand";
import { DEFAULT_REGIONS } from "@/lib/data/regions";
import { DEFAULT_BASE_DATE } from "@/lib/transforms/normalize";

export type PeriodOption = "1년" | "3년" | "5년" | "10년" | "직접입력";
export type PriceTypeOption = "매매" | "전세" | "both";
export type HeatmapModeOption = "cumulative" | "wow";

interface FilterState {
  selectedRegions: string[];
  period: PeriodOption;
  customStart: string;
  customEnd: string;
  priceType: PriceTypeOption;
  normalize: boolean;
  baseDate: string;
  heatmapMode: HeatmapModeOption;
  // 실제 조회에 사용되는 확정된 파라미터 (조회 버튼 클릭 시 반영)
  committedParams: {
    regions: string[];
    period: PeriodOption;
    customStart: string;
    customEnd: string;
    priceType: PriceTypeOption;
    normalize: boolean;
    heatmapMode: HeatmapModeOption;
    timestamp: number;
  } | null;

  setSelectedRegions: (regions: string[]) => void;
  setPeriod: (period: PeriodOption) => void;
  setCustomStart: (date: string) => void;
  setCustomEnd: (date: string) => void;
  setPriceType: (priceType: PriceTypeOption) => void;
  setNormalize: (normalize: boolean) => void;
  setBaseDate: (date: string) => void;
  setHeatmapMode: (mode: HeatmapModeOption) => void;
  commit: () => void;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  selectedRegions: DEFAULT_REGIONS,
  period: "1년",
  customStart: "2013-08-05",
  customEnd: new Date().toISOString().slice(0, 10),
  priceType: "매매",
  normalize: false,
  baseDate: DEFAULT_BASE_DATE,
  heatmapMode: "cumulative",
  committedParams: null,

  setSelectedRegions: (regions) => set({ selectedRegions: regions }),
  setPeriod: (period) => set({ period }),
  setCustomStart: (date) => set({ customStart: date }),
  setCustomEnd: (date) => set({ customEnd: date }),
  setPriceType: (priceType) => set({ priceType }),
  setNormalize: (normalize) => set({ normalize }),
  setBaseDate: (date) => set({ baseDate: date }),
  setHeatmapMode: (mode) => set({ heatmapMode: mode }),

  commit: () => {
    const s = get();
    set({
      committedParams: {
        regions: s.selectedRegions,
        period: s.period,
        customStart: s.customStart,
        customEnd: s.customEnd,
        priceType: s.priceType,
        normalize: s.normalize,
        heatmapMode: s.heatmapMode,
        timestamp: Date.now(),
      },
    });
  },
}));
