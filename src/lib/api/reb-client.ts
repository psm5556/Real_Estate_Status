import { unstable_cache } from "next/cache";
import { STATBL_IDS, CYCLE_CODE, REB_API_URL, CACHE_TTL_SECONDS } from "@/lib/data/constants";
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
  url.searchParams.set("pIndex", "1");
  url.searchParams.set("pSize", "1000");
  url.searchParams.set("CLS_ID", regionCode);

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(9000),
  });

  if (!res.ok) {
    throw new Error(`REB API HTTP 오류: ${res.status}`);
  }

  const json = (await res.json()) as RebApiResponse;
  const head = json.SttsApiTblData[0].head;
  const resultCode = head[1].RESULT.CODE;

  if (resultCode !== "INFO-000") {
    throw new Error(`REB API 오류 코드: ${resultCode} - ${head[1].RESULT.MESSAGE}`);
  }

  const rawRows = json.SttsApiTblData[1].row;
  const rows = Array.isArray(rawRows) ? rawRows : [rawRows];

  const data: PriceApiResponse["data"] = [];
  for (const row of rows) {
    // 날짜: WRTTIME_DESC 우선, 없으면 WRTTIME_IDTFR_ID
    let date = row.WRTTIME_DESC;
    if (!date && row.WRTTIME_IDTFR_ID) {
      const d = String(row.WRTTIME_IDTFR_ID);
      date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    }
    if (!date) continue;

    const value = parseFloat(String(row.DTA_VAL));
    if (isNaN(value)) continue;

    data.push({
      date,
      value,
      regionCode: String(row.CLS_ID),
      regionName: row.CLS_NM,
      priceType: priceType as PriceType,
    });
  }

  data.sort((a, b) => a.date.localeCompare(b.date));

  return { data };
}

// 1시간 서버 캐싱
export const getCachedRebData = unstable_cache(
  async (params: RebApiRequest) => fetchRebData(params),
  ["reb-price-index"],
  { revalidate: CACHE_TTL_SECONDS }
);
