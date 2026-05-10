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
  endMonth: string
): Promise<JeonseRateApiRow[]> {
  const apiKey = process.env.REB_API_KEY;

  const url = new URL(REB_API_URL);
  url.searchParams.set("STATBL_ID", statblId);
  url.searchParams.set("DTACYCLE_CD", "MM");
  url.searchParams.set("START_WRTTIME", startMonth);
  url.searchParams.set("END_WRTTIME", endMonth);
  url.searchParams.set("Type", "json");
  if (apiKey) url.searchParams.set("Key", apiKey);
  url.searchParams.set("pIndex", "1");
  url.searchParams.set("pSize", "1000");

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`REB API HTTP 오류: ${res.status}`);

  // 데이터 없는 기간은 {"RESULT":{"CODE":"INFO-200",...}} 최상위 응답 반환 (SttsApiTblData 없음)
  const json = await res.json();
  if (!("SttsApiTblData" in json)) return [];

  const typed = json as RebApiResponse;
  const head = typed.SttsApiTblData[0].head;
  const resultCode = head[1].RESULT.CODE;
  if (resultCode !== "INFO-000") return [];

  const total = typed.SttsApiTblData[0].head[0].list_total_count ?? 0;
  const rawRows = typed.SttsApiTblData[1]?.row;
  if (!rawRows) return [];
  const parsed = parseMonthlyStatRows(rawRows);
  if (total > 1000) {
    console.warn(
      `[fetchMonthlyStatPage] ${statblId} ${startMonth}~${endMonth}: ` +
      `total=${total} > 1000 — 데이터 잘림. 청크 크기를 더 줄이세요.`
    );
  }
  return parsed;
}

// ─── 두 월단위 API 모두 pIndex를 무시 → 날짜 범위 청크 분할 병렬 fetch ────────
// REGION_CODES 최대 256지역 기준으로 안전 마진 확보:
// 전세가율: chunkSize=3 (256×3=768 < 1000)
// 전환율:   chunkSize=4 (256×4=1024 ≈ 위험선, but 실제 전환율 지역 수 ~175 → 700 < 1000)

function addMonthsYYYYMM(yyyymm: string, n: number): string {
  const year = parseInt(yyyymm.slice(0, 4));
  const month = parseInt(yyyymm.slice(4, 6)) - 1;
  const d = new Date(Date.UTC(year, month + n, 1));
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthChunks(start: string, end: string, size: number): [string, string][] {
  const chunks: [string, string][] = [];
  let cur = start;
  while (cur <= end) {
    const chunkEnd = addMonthsYYYYMM(cur, size - 1);
    chunks.push([cur, chunkEnd <= end ? chunkEnd : end]);
    cur = addMonthsYYYYMM(cur, size);
  }
  return chunks;
}

async function fetchAllMonthlyStatChunked(
  statblId: string,
  startMonth: string,
  endMonth: string,
  chunkSize: number
): Promise<{ data: JeonseRateApiRow[] }> {
  const chunks = monthChunks(startMonth, endMonth, chunkSize);
  const settled = await Promise.allSettled(
    chunks.map(([s, e]) => fetchMonthlyStatPage(statblId, s, e))
  );
  const allData = settled
    .filter((r): r is PromiseFulfilledResult<JeonseRateApiRow[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);
  allData.sort((a, b) => a.date.localeCompare(b.date));
  return { data: allData };
}

export const getCachedJeonseRateData = unstable_cache(
  async (params: { startMonth: string; endMonth: string }) =>
    fetchAllMonthlyStatChunked(JEONSE_RATE_STATBL_ID, params.startMonth, params.endMonth, 3),
  ["reb-jeonse-rate"],
  { revalidate: CACHE_TTL_SECONDS }
);

export const getCachedJeonseConversionRateData = unstable_cache(
  async (params: { startMonth: string; endMonth: string }) =>
    fetchAllMonthlyStatChunked(
      JEONSE_CONVERSION_RATE_STATBL_ID,
      params.startMonth,
      params.endMonth,
      4
    ),
  ["reb-jeonse-conversion-rate"],
  { revalidate: CACHE_TTL_SECONDS }
);
