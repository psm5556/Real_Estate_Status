import type { PriceType } from "@/types/price-data";

export const STATBL_IDS: Record<PriceType, string> = {
  "매매": "T244183132827305",
  "전세": "T247713133046872",
};

export const CYCLE_CODE = "WK";
export const BASE_DATE = "2022-01-31";
export const REB_API_URL = "https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do";
export const CACHE_TTL_SECONDS = 3600;
