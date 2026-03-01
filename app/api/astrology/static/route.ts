import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { BirthInfoSchema } from "@/lib/schemas/birth-info"
import { analyzeAstrologyStatic } from "@/lib/use-cases/analyze-astrology-static"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 })
  }

  const parsed = BirthInfoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력 정보가 올바르지 않습니다", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const result = await analyzeAstrologyStatic(parsed.data)
  if (!result.success) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status })
  }

  if (session?.user?.id) {
    try {
      await prisma.analysis.create({
        data: {
          userId: session.user.id,
          expertId: "astrology-static",
          input: parsed.data as object,
          result: result.data as object,
        },
      })
    } catch (err) {
      console.warn("점성술 정적 분석 결과 저장 실패:", err)
    }
  }

  return NextResponse.json(result.data)
}
