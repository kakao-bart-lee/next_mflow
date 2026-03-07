import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { BirthInfoSchema } from "@/lib/schemas/birth-info"
import { FortuneTellerService } from "@/lib/saju-core/facade"
import {
  GunghapAnalyzer,
  CompatibilityType,
  type SajuData,
} from "@/lib/saju-core/saju/gunghap"
import { buildLegacyIntimacyInsight } from "@/lib/saju-core/saju/legacyCompatibility"
import type { FortuneResponse } from "@/lib/saju-core"

const CompatibilityRequestSchema = z.object({
  personA: BirthInfoSchema,
  personB: BirthInfoSchema,
  type: z.enum(["love", "marriage", "business", "friendship", "general"]).default("general"),
})

const TYPE_MAP: Record<string, CompatibilityType> = {
  love: CompatibilityType.LOVE,
  marriage: CompatibilityType.MARRIAGE,
  business: CompatibilityType.BUSINESS,
  friendship: CompatibilityType.FRIENDSHIP,
  general: CompatibilityType.GENERAL,
}

/** FortuneResponse.sajuData.pillars → GunghapAnalyzer.SajuData */
function toGunghapSajuData(fortune: FortuneResponse): SajuData {
  const p = fortune.sajuData.pillars
  return {
    four_pillars: {
      년주: { 천간: p.년.천간, 지지: p.년.지지 },
      월주: { 천간: p.월.천간, 지지: p.월.지지 },
      일주: { 천간: p.일.천간, 지지: p.일.지지 },
      시주: { 천간: p.시.천간, 지지: p.시.지지 },
    },
  }
}

const service = new FortuneTellerService()
const gunghap = new GunghapAnalyzer()

export async function POST(req: NextRequest) {
  const session = await auth()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 })
  }

  const parsed = CompatibilityRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력 정보가 올바르지 않습니다", details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { personA, personB, type } = parsed.data

  try {
    // 양쪽 사주 계산
    const fortuneA = service.calculateSaju({
      birthDate: personA.birthDate,
      birthTime: personA.isTimeUnknown ? "12:00" : (personA.birthTime ?? "12:00"),
      gender: personA.gender,
      timezone: personA.timezone,
    })

    const fortuneB = service.calculateSaju({
      birthDate: personB.birthDate,
      birthTime: personB.isTimeUnknown ? "12:00" : (personB.birthTime ?? "12:00"),
      gender: personB.gender,
      timezone: personB.timezone,
    })

    // 궁합 분석
    const sajuA = toGunghapSajuData(fortuneA)
    const sajuB = toGunghapSajuData(fortuneB)
    const compatType = TYPE_MAP[type] ?? CompatibilityType.GENERAL

    const result = gunghap.analyzeCompatibility(sajuA, sajuB, compatType)
    const legacyIntimacy = buildLegacyIntimacyInsight(personA, fortuneA, personB, fortuneB)

    return NextResponse.json({
      data: {
        total_score: result.total_score,
        personality_match: result.personality_match,
        fortune_match: result.fortune_match,
        health_match: result.health_match,
        wealth_match: result.wealth_match,
        career_match: result.career_match,
        legacy_intimacy: legacyIntimacy,
        overall_interpretation: result.overall_interpretation,
        recommendations: result.recommendations,
      },
      userId: session?.user?.id,
    })
  } catch (err) {
    console.error("궁합 분석 실패:", err)
    return NextResponse.json(
      { error: "궁합 분석 중 오류가 발생했습니다" },
      { status: 500 },
    )
  }
}
