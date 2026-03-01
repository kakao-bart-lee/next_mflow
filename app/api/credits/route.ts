import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBalance, getCreditHistory } from "@/lib/credit-service";

// GET /api/credits — 현재 잔액 + 최근 내역
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  const [balance, history] = await Promise.all([
    getBalance(session.user.id),
    getCreditHistory(session.user.id, { limit, offset }),
  ]);

  return NextResponse.json({ balance, ...history });
}
