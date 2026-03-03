import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { BirthInfoSchema } from "@/lib/schemas/birth-info"
import { fetchEssentialScore, HorizonsClientError } from "@/lib/astrology/horizons-client"

export async function POST(req: NextRequest) {
  await auth()

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

  try {
    const result = await fetchEssentialScore(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof HorizonsClientError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    return NextResponse.json({ error: "Essential dignity 점수 조회 실패" }, { status: 500 })
  }
}
