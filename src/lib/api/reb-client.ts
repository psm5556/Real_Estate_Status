import { unstable_cache } from "next/cache";
import {
  STATBL_IDS,
  JEONSE_RATE_STATBL_ID,
  JEONSE_CONVERSION_RATE_STATBL_ID,
  CYCLE_CODE,
  REB_API_URL,
  CACHE_TTL_SECONDS,
} from "@/lib/data/constants";
import type { RebApiRequest, RebApiResponse, PriceApiResponse } from "./types";
import type { PriceType } from "@/types/price-data";

async function fetchRebData(params: RebApiRequest): Promise<PriceApiResponse> {
  const apiKey = process.env.REB_API_KEY;
  if (!apiKey) throw new Error("REB_API_KEY 환경변수가 설정되지 않았습니다.");

  const { priceType, startWeek, endWeek, regionCode } = params;
  const statblId = STATBL_IDS[priceType];

  const url = new URL(REB_API_URL);
  url.searchParams.set("STATBL_ID", statblId);
  url.searchParams.set("DTACYCLE_CD", CYCLE_CODE);
  url.searchParams.set("START_WRTTIME", startWeek);
  url.searchParams.set("END_WRTTIME", endWeek);
  url.searchParams.set("Type", "json");
  url.searchParams.set("Key", apiKey);
  url.searchParams.set("pSize", "1000");
  url.searchParams.set("CLS_ID", regionCode);

  const allData: PriceApiResponse["data"] = [];
  let pIndex = 1;

  while (true) {
    url.searchParams.set("pIndex", String(pIndex));
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(9000) });
    if (!res.ok) throw new Error(`REB API HTTP 오류: ${res.status}`);

    const json = (await res.json()) as RebApiResponse;
    const head = json.SttsApiTblData[0].head;
    const total = head[0].list_total_count ?? 0;
    const resultCode = head[1].RESULT.CODE;
    if (resultCode !== "INFO-000") {
      throw new Error(`REB API 오류 코드: ${resultCode} - ${head[1].RESULT.MESSAGE}`);
    }

    const rawRows = json.SttsApiTblData[1]?.row;
    if (!rawRows) break;
    const rows = Array.isArray(rawRows) ? rawRows : [rawRows];

    for (const row of rows) {
      let date = row.WRTTIME_DESC;
      if (!date && row.WRTTIME_IDTFR_ID) {
        const d = String(row.WRTTIME_IDTFR_ID);
        date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
      }
      if (!date) continue;
      const value = parseFloat(String(row.DTA_VAL));
      if (isNaN(value)) continue;
      allData.push({
        date,
        value,
        regionCode: String(row.CLS_ID),
        regionName: row.CLS_NM,
        priceType: priceType as PriceType,
      });
    }

    if (allData.length >= total || rows.length < 1000) break;
    pIndex++;
  }

  allData.sort((a, b) => a.date.localeCompare(b.date));
  return { data: allData };
}

// 1시간 서버 캐싱
export const getCachedRebData = unstable_cache(
  async (params: RebApiRequest) => fetchRebData(params),
  ["reb-price-index"],
  { revalidate: CACHE_TTL_SECONDS }
);

// ─── 월단위 통계 공통 fetch (전세가율, 전월세전환율 등) ────────────────────────

export interface JeonseRateApiRow {
  date: string;      // "YYYY-MM"
  value: number;
  regionCode: string;
  regionName: string;  // CLS_FULLNM (계층 경로, 예: "경기>경부1권")
}

function parseMonthlyStatRows(
  rawRows: RebApiResponse["SttsApiTblData"][1]["row"]
): JeonseRateApiRow[] {
  const rows = Array.isArray(rawRows) ? rawRows : [rawRows];
  const data: JeonseRateApiRow[] = [];
  for (const row of rows) {
    const raw = String(row.WRTTIME_IDTFR_ID ?? "");
    if (raw.length < 6) continue;
    const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}`;
    const value = parseFloat(String(row.DTA_VAL));
    if (isNaN(value)) continue;
    data.push({
      date,
      value,
      regionCode: String(row.CLS_ID),
      regionName: String(row.CLS_FULLNM ?? row.CLS_NM),
    });
  }
  return data;
}

async function fetchMonthlyStatPage(
  statblId: string,
  startMonth: string,
  endMonth: string,
  pIndex: number
): Promise<{ data: JeonseRateApiRow[]; total: number }> {
  const apiKey = process.env.REB_API_KEY;

  const url = new URL(REB_API_URL);
  url.searchParams.set("STATBL_ID", statblId);
  url.searchParams.set("DTACYCLE_CD", "MM");
  url.searchParams.set("START_WRTTIME", startMonth);
  url.searchParams.set("END_WRTTIME", endMonth);
  url.searchParams.set("Type", "json");
  if (apiKey) url.searchParams.set("Key", apiKey);
  url.searchParams.set("pIndex", String(pIndex));
  url.searchParams.set("pSize", "1000");

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`REB API HTTP 오류: ${res.status}`);

  const json = (await res.json()) as RebApiResponse;
  const head = json.SttsApiTblData[0].head;
  const total = head[0].list_total_count ?? 0;
  const resultCode = head[1].RESULT.CODE;
  if (resultCode !== "INFO-000") {
    throw new Error(`REB API 오류 코드: ${resultCode} - ${head[1].RESULT.MESSAGE}`);
  }

  const rawRows = json.SttsApiTblData[1]?.row;
  if (!rawRows) return { data: [], total };
  return { data: parseMonthlyStatRows(rawRows), total };
}

async function fetchAllMonthlyStat(
  statblId: string,
  startMonth: string,
  endMonth: string
): Promise<{ data: JeonseRateApiRow[] }> {
  const allData: JeonseRateApiRow[] = [];
  let pIndex = 1;

  while (true) {
    const { data, total } = await fetchMonthlyStatPage(statblId, startMonth, endMonth, pIndex);
    allData.push(...data);
    if (allData.length >= total || data.length < 1000) break;
    pIndex++;
  }

  allData.sort((a, b) => a.date.localeCompare(b.date));
  return { data: allData };
}

export const getCachedJeonseRateData = unstable_cache(
  async (params: { startMonth: string; endMonth: string }) =>
    fetchAllMonthlyStat(JEONSE_RATE_STATBL_ID, params.startMonth, params.endMonth),
  ["reb-jeonse-rate"],
  { revalidate: CACHE_TTL_SECONDS }
);

export const getCachedJeonseConversionRateData = unstable_cache(
  async (params: { startMonth: string; endMonth: string }) =>
    fetchAllMonthlyStat(JEONSE_CONVERSION_RATE_STATBL_ID, params.startMonth, params.endMonth),
  ["reb-jeonse-conversion-rate"],
  { revalidate: CACHE_TTL_SECONDS }
);
