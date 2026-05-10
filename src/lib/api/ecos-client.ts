import { unstable_cache } from "next/cache";
import { CACHE_TTL_SECONDS } from "@/lib/data/constants";

const ECOS_API_BASE = "https://ecos.bok.or.kr/api/StatisticSearch";
const MORTGAGE_STAT_CODE = "121Y006";
const MORTGAGE_ITEM_CODE = "BECBLA0302";

export interface MortgageRateRow {
  date: string;  // "YYYY-MM"
  rate: number;  // 연리%
}

async function fetchMortgageRate(
  startMonth: string,
  endMonth: string
): Promise<MortgageRateRow[]> {
  const apiKey = process.env.ECOS_API_KEY;
  if (!apiKey) throw new Error("ECOS_API_KEY 환경변수가 설정되지 않았습니다.");

  const start = startMonth.replace("-", "");
  const end = endMonth.replace("-", "");
  const url = `${ECOS_API_BASE}/${apiKey}/json/kr/1/1000/${MORTGAGE_STAT_CODE}/M/${start}/${end}/${MORTGAGE_ITEM_CODE}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`ECOS API HTTP 오류: ${res.status}`);

  const json = await res.json();
  if (json.RESULT) throw new Error(`ECOS API 오류: ${json.RESULT.MESSAGE}`);

  const rows: { TIME: string; DATA_VALUE: string }[] = json.StatisticSearch?.row ?? [];
  return rows
    .map((r) => ({
      date: `${r.TIME.slice(0, 4)}-${r.TIME.slice(4, 6)}`,
      rate: parseFloat(r.DATA_VALUE),
    }))
    .filter((r) => !isNaN(r.rate));
}

export const getCachedMortgageRateData = unstable_cache(
  async (params: { startMonth: string; endMonth: string }) =>
    fetchMortgageRate(params.startMonth, params.endMonth),
  ["ecos-mortgage-rate"],
  { revalidate: CACHE_TTL_SECONDS }
);
