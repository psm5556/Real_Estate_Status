import type { PriceType } from "@/types/price-data";

export interface RebApiRequest {
  priceType: PriceType;
  startWeek: string;
  endWeek: string;
  regionCode: string;
}

export interface RebDataRow {
  STATBL_ID: string;
  DTACYCLE_CD: string;
  WRTTIME_IDTFR_ID: string;
  CLS_ID: number | string;
  CLS_NM: string;
  DTA_VAL: number | string | null;
  WRTTIME_DESC: string;
  [key: string]: unknown;
}

export interface RebApiResponse {
  SttsApiTblData: [
    { head: [{ list_total_count: number }, { RESULT: { CODE: string; MESSAGE: string } }] },
    { row: RebDataRow[] | RebDataRow }
  ];
}

export interface PriceApiResponse {
  data: {
    date: string;
    value: number;
    regionCode: string;
    regionName: string;
    priceType: PriceType;
  }[];
}
