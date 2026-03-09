import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { BirthInfoSchema } from "@/lib/schemas/birth-info"
import {
  GunghapAnalyzer,
  CompatibilityType,
  type SajuData,
} from "@/lib/saju-core/saju/gunghap"
import {
  buildLegacyBedroomInsight,
  buildLegacyFutureSpouseInsight,
  buildLegacyIntimacyInsight,
  buildLegacyMarriageTimingTableInsight,
  buildLegacySpouseCoreInsight,
  buildLegacyPartnerRoleInsight,
  buildLegacyRelationshipTimingInsight,
  buildLegacyMarriageFlowInsight,
  buildLegacyLoveStyleInsight,
  buildLegacyLoveWeakPointInsight,
  buildLegacyDestinyCoreInsight,
  buildLegacyOuterCompatibilityInsight,
  buildLegacyPartnerPersonalityInsight,
  buildLegacyTraditionalCompatibilityInsight,
  buildLegacyTypeProfileInsight,
  buildLegacyYearlyLoveCycleInsight,
  buildLegacyBasicCompatibilityInsight,
  buildLegacyDetailedCompatibilityInsight,
  buildLegacyZodiacCompatibilityInsight,
  buildLegacyAnimalCompatibilityInsight,
  buildLegacySasangCompatibilityInsight,
} from "@/lib/saju-core/saju/legacyCompatibility"
import type { FortuneResponse } from "@/lib/saju-core"
import {
  calculateSajuFromBirthInfo,
  getSajuCoreEngineMetadata,
} from "@/lib/integrations/saju-core-adapter"

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

type LegacyInsightLike = {
  sourceTable?: string | null
  lookupKey?: string | null
} | null

type LegacyProvenanceStatus = "resolved" | "lookup_not_found" | "missing_input"

type LegacyProvenanceEntry = {
  status: LegacyProvenanceStatus
  sourceTable: string | null
  lookupKey: string | null
}

type LegacyProvenanceMap = Record<string, LegacyProvenanceEntry>

function toLegacyProvenanceEntry(
  insight: LegacyInsightLike,
  nullStatus: Exclude<LegacyProvenanceStatus, "resolved"> = "lookup_not_found",
): LegacyProvenanceEntry {
  if (!insight) {
    return {
      status: nullStatus,
      sourceTable: null,
      lookupKey: null,
    }
  }

  return {
    status: "resolved",
    sourceTable: insight.sourceTable ?? null,
    lookupKey: insight.lookupKey ?? null,
  }
}

function toLegacyProvenanceLog(entries: LegacyProvenanceMap): {
  totalEntries: number
  unresolvedCount: number
  unresolvedEntries: Array<{
    key: string
    status: Exclude<LegacyProvenanceStatus, "resolved">
    sourceTable: string | null
    lookupKey: string | null
  }>
} {
  const unresolvedEntries = Object.entries(entries)
    .filter(([, value]) => value.status !== "resolved")
    .map(([key, value]) => ({
      key,
      status: value.status as Exclude<LegacyProvenanceStatus, "resolved">,
      sourceTable: value.sourceTable,
      lookupKey: value.lookupKey,
    }))

  return {
    totalEntries: Object.keys(entries).length,
    unresolvedCount: unresolvedEntries.length,
    unresolvedEntries,
  }
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
    const fortuneA = calculateSajuFromBirthInfo(personA)
    const fortuneB = calculateSajuFromBirthInfo(personB)

    // 궁합 분석
    const sajuA = toGunghapSajuData(fortuneA)
    const sajuB = toGunghapSajuData(fortuneB)
    const compatType = TYPE_MAP[type] ?? CompatibilityType.GENERAL

    const result = gunghap.analyzeCompatibility(sajuA, sajuB, compatType)
    const legacyBedroom = buildLegacyBedroomInsight(fortuneA)
    const legacyIntimacy = buildLegacyIntimacyInsight(personA, fortuneA, personB, fortuneB)
    const legacyMarriageFlow = buildLegacyMarriageFlowInsight(personA, fortuneA)
    const legacySpouseCore = buildLegacySpouseCoreInsight(personA, fortuneA)
    const legacyLoveStyle = buildLegacyLoveStyleInsight(personB, fortuneB)
    const legacyLoveWeakPoint = buildLegacyLoveWeakPointInsight(fortuneA)
    const legacyFutureSpouseFace = buildLegacyFutureSpouseInsight("G004", personA, fortuneA)
    const legacyFutureSpousePersonality = buildLegacyFutureSpouseInsight("G005", personA, fortuneA)
    const legacyFutureSpouseCareer = buildLegacyFutureSpouseInsight("G006", personA, fortuneA)
    const legacyFutureSpouseRomance = buildLegacyFutureSpouseInsight("G007", personA, fortuneA)
    const legacyMarriageTimingTable = buildLegacyMarriageTimingTableInsight(personA, fortuneA)
    const legacyPartnerRole = buildLegacyPartnerRoleInsight(personA, fortuneA)
    const legacyRelationshipTiming = buildLegacyRelationshipTimingInsight(personA, fortuneA)
    const legacyDestinyCore = buildLegacyDestinyCoreInsight(personA, fortuneA, fortuneB)
    const legacyOuterCompatibility = buildLegacyOuterCompatibilityInsight(personA, fortuneA, fortuneB)
    const legacyPartnerPersonality = buildLegacyPartnerPersonalityInsight(personA, fortuneA, fortuneB)
    const legacyTraditionalCompatibility = buildLegacyTraditionalCompatibilityInsight(personA, fortuneA, fortuneB)
    const legacyTypeProfile = buildLegacyTypeProfileInsight(fortuneA)
    const legacyYearlyLoveCycle = buildLegacyYearlyLoveCycleInsight(fortuneA)
    const legacyBasicCompat = buildLegacyBasicCompatibilityInsight(personA, fortuneA)
    const legacyDetailedCompat = buildLegacyDetailedCompatibilityInsight(fortuneA)
    const legacyZodiacCompat = buildLegacyZodiacCompatibilityInsight(personA)
    const legacyAnimalCompat = buildLegacyAnimalCompatibilityInsight(fortuneA, fortuneB)
    const hasSasangInput = Boolean(personA.sasangConstitution && personB.sasangConstitution)
    const legacySasangCompat = hasSasangInput
      ? buildLegacySasangCompatibilityInsight(personA.sasangConstitution, personB.sasangConstitution)
      : null
    const engineMetadata = getSajuCoreEngineMetadata()

    const legacyProvenance = {
      source: engineMetadata.source,
      baselineSha: engineMetadata.baselineSha,
      adapter: engineMetadata.adapter,
      entries: {
        legacy_bedroom: toLegacyProvenanceEntry(legacyBedroom),
        legacy_intimacy: toLegacyProvenanceEntry(legacyIntimacy),
        legacy_marriage_flow: toLegacyProvenanceEntry(legacyMarriageFlow),
        legacy_spouse_core: toLegacyProvenanceEntry(legacySpouseCore),
        legacy_love_style: toLegacyProvenanceEntry(legacyLoveStyle),
        legacy_love_weak_point: toLegacyProvenanceEntry(legacyLoveWeakPoint),
        legacy_future_spouse_face: toLegacyProvenanceEntry(legacyFutureSpouseFace),
        legacy_future_spouse_personality: toLegacyProvenanceEntry(legacyFutureSpousePersonality),
        legacy_future_spouse_career: toLegacyProvenanceEntry(legacyFutureSpouseCareer),
        legacy_future_spouse_romance: toLegacyProvenanceEntry(legacyFutureSpouseRomance),
        legacy_marriage_timing_table: toLegacyProvenanceEntry(legacyMarriageTimingTable),
        legacy_partner_role: toLegacyProvenanceEntry(legacyPartnerRole),
        legacy_relationship_timing: toLegacyProvenanceEntry(legacyRelationshipTiming),
        legacy_destiny_core: toLegacyProvenanceEntry(legacyDestinyCore),
        legacy_outer_compatibility: toLegacyProvenanceEntry(legacyOuterCompatibility),
        legacy_partner_personality: toLegacyProvenanceEntry(legacyPartnerPersonality),
        legacy_traditional_compatibility: toLegacyProvenanceEntry(legacyTraditionalCompatibility),
        legacy_type_profile: toLegacyProvenanceEntry(legacyTypeProfile),
        legacy_yearly_love_cycle: toLegacyProvenanceEntry(legacyYearlyLoveCycle),
        legacy_basic_compat: toLegacyProvenanceEntry(legacyBasicCompat),
        legacy_detailed_compat: toLegacyProvenanceEntry(legacyDetailedCompat),
        legacy_zodiac_compat: toLegacyProvenanceEntry(legacyZodiacCompat),
        legacy_animal_compat: toLegacyProvenanceEntry(legacyAnimalCompat),
        legacy_sasang_compat: toLegacyProvenanceEntry(
          legacySasangCompat,
          hasSasangInput ? "lookup_not_found" : "missing_input",
        ),
      },
    }
    const legacyProvenanceLog = toLegacyProvenanceLog(legacyProvenance.entries)

    console.info("[saju-compatibility] legacy provenance", {
      route: "/api/saju/compatibility",
      type,
      userId: session?.user?.id ?? null,
      source: legacyProvenance.source,
      baselineSha: legacyProvenance.baselineSha,
      adapter: legacyProvenance.adapter,
      ...legacyProvenanceLog,
    })

    return NextResponse.json({
      data: {
        total_score: result.total_score,
        personality_match: result.personality_match,
        fortune_match: result.fortune_match,
        health_match: result.health_match,
        wealth_match: result.wealth_match,
        career_match: result.career_match,
        legacy_bedroom: legacyBedroom,
        legacy_intimacy: legacyIntimacy,
        legacy_marriage_flow: legacyMarriageFlow,
        legacy_spouse_core: legacySpouseCore,
        legacy_love_style: legacyLoveStyle,
        legacy_love_weak_point: legacyLoveWeakPoint,
        legacy_future_spouse_face: legacyFutureSpouseFace,
        legacy_future_spouse_personality: legacyFutureSpousePersonality,
        legacy_future_spouse_career: legacyFutureSpouseCareer,
        legacy_future_spouse_romance: legacyFutureSpouseRomance,
        legacy_marriage_timing_table: legacyMarriageTimingTable,
        legacy_partner_role: legacyPartnerRole,
        legacy_relationship_timing: legacyRelationshipTiming,
        legacy_destiny_core: legacyDestinyCore,
        legacy_outer_compatibility: legacyOuterCompatibility,
        legacy_partner_personality: legacyPartnerPersonality,
        legacy_traditional_compatibility: legacyTraditionalCompatibility,
         legacy_type_profile: legacyTypeProfile,
         legacy_yearly_love_cycle: legacyYearlyLoveCycle,
         legacy_basic_compat: legacyBasicCompat,
        legacy_detailed_compat: legacyDetailedCompat,
        legacy_zodiac_compat: legacyZodiacCompat,
        legacy_animal_compat: legacyAnimalCompat,
        legacy_sasang_compat: legacySasangCompat,
        legacy_provenance: legacyProvenance,
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
