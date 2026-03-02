import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

/**
 * GET /api/user/decisions?limit=10
 *
 * 사용자의 결정 운세 이력 조회
 * Analysis 테이블에서 expertId="decision" 필터링
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "10", 10) || 10, 1), 50)

  try {
    const analyses = await prisma.analysis.findMany({
      where: {
        userId: session.user.id,
        expertId: "decision",
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        input: true,
        result: true,
        createdAt: true,
      },
    })

    const decisions = analyses.map((a) => {
      const input = a.input as Prisma.JsonObject | null
      const result = a.result as Prisma.JsonObject | null
      return {
        id: a.id,
        dateKey: input?.dateKey ?? null,
        optionA: (input?.decisionContext as Prisma.JsonObject | undefined)?.optionA ?? null,
        optionB: (input?.decisionContext as Prisma.JsonObject | undefined)?.optionB ?? null,
        recommendation: result?.recommendation ?? null,
        headline: result?.headline ?? null,
        createdAt: a.createdAt,
      }
    })

    return NextResponse.json({ decisions })
  } catch (err) {
    console.error("결정 이력 조회 실패:", err)
    return NextResponse.json(
      { error: "결정 이력을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
