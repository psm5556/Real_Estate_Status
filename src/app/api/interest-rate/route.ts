import { NextRequest, NextResponse } from "next/server";
import { getCachedMortgageRateData } from "@/lib/api/ecos-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { startMonth, endMonth } = body;

    if (!startMonth || !endMonth) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const data = await getCachedMortgageRateData({
      startMonth: String(startMonth),
      endMonth: String(endMonth),
    });

    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
