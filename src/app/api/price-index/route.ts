import { NextRequest, NextResponse } from "next/server";
import { getCachedRebData } from "@/lib/api/reb-client";
import type { RebApiRequest } from "@/lib/api/types";
import type { PriceType } from "@/types/price-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { priceType, startWeek, endWeek, regionCode } = body;

    if (!priceType || !startWeek || !endWeek || !regionCode) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    if (priceType !== "매매" && priceType !== "전세") {
      return NextResponse.json(
        { error: "priceType은 '매매' 또는 '전세'여야 합니다." },
        { status: 400 }
      );
    }

    const params: RebApiRequest = {
      priceType: priceType as PriceType,
      startWeek: String(startWeek),
      endWeek: String(endWeek),
      regionCode: String(regionCode),
    };

    const result = await getCachedRebData(params);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
