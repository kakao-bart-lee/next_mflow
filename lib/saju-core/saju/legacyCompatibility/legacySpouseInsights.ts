/**
 * Legacy spouse/intimacy insights module.
 *
 * Extracts spouse-related fortune insights from legacy tables:
 * - G030: Spouse core structure (배우자성 요약)
 * - G031: Spouse role + palace role (배우자성·배우자궁 해설)
 * - G024: Destiny core point (운명 핵심 포인트)
 * - G032: Partner personality (이성의 성격)
 * - G016: Intimacy compatibility (속궁합)
 * - G020: Bedroom compatibility (침실 섹스궁합)
 * - Y003: Love style (그이의 러브스타일)
 */

import type { FortuneResponse } from "../../models/fortuneTeller"
import { calculateWoon12Daygi } from "../yongsinFlows"
import {
  classifyBranchRoleLabel,
  classifyElementRoleLabel,
  getElementRoleProfile,
} from "../elementRoleProfiles"
import { extractHanja, extractKorean } from "../../utils"
import {
  normalizeElementLabel,
  resolveStemElement,
  resolveSpouseStarElement,
  rotateBranchForSamePair,
  toCalculationInput,
  adjustPartnerLifecycleStage,
} from "./legacyUtilities"
import {
  readLegacyG016Record,
  readLegacyG020Record,
  readLegacyG024Record,
  readLegacyG031Record,
  readLegacyG032Record,
  readLegacyY003Record,
} from "./legacyDataReaders"

export interface LegacySpouseCoreInsight {
  readonly sourceTable: "G030"
  readonly title: string
  readonly scoreLabel: string
  readonly spouseStarLabel: string
  readonly palaceLabel: string
  readonly visiblePrimaryCount: number
  readonly visibleSecondaryCount: number
  readonly hiddenPrimaryCount: number
  readonly hiddenSecondaryCount: number
  readonly text: string
}

export interface LegacyDestinyCoreInsight {
  readonly sourceTable: "G024"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
}

export interface LegacyPartnerPersonalityInsight {
  readonly sourceTable: "G032"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
}

export interface LegacyPartnerRoleInsight {
  readonly sourceTable: "G031"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly spouseRole: string
  readonly palaceRole: string
  readonly text: string
}

export interface LegacyIntimacyInsight {
  readonly sourceTable: "G016"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
  readonly score: number | null
}

export interface LegacyBedroomInsight {
  readonly sourceTable: "G020"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
  readonly score: number | null
}

export interface LegacyLoveStyleInsight {
  readonly sourceTable: "Y003"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
  readonly score: number | null
}

export interface LegacyCompatibilityBirthInfo {
  readonly birthDate: string
  readonly birthTime?: string | null
  readonly gender: "M" | "F"
  readonly timezone: string
}

export interface LegacyCompatibilityCalculationInput {
  readonly yearStem: string
  readonly yearBranch: string
  readonly monthStem: string
  readonly monthBranch: string
  readonly dayStem: string
  readonly dayBranch: string
  readonly hourStem: string
  readonly hourBranch: string
  readonly gender: string
}

export function buildLegacySpouseCoreInsight(
  primaryInfo: LegacyCompatibilityBirthInfo,
  primaryFortune: FortuneResponse,
): LegacySpouseCoreInsight | null {
  const dayStemHanja = extractHanja(primaryFortune.sajuData.pillars.일.천간)
  const dayBranchHanja = extractHanja(primaryFortune.sajuData.pillars.일.지지)
  const monthBranchHanja = extractHanja(primaryFortune.sajuData.pillars.월.지지)
  const roleProfile = getElementRoleProfile(`${dayStemHanja}${monthBranchHanja}`)
  const spouseElement = resolveSpouseStarElement(dayStemHanja, primaryInfo.gender)
  if (!spouseElement) {
    return null
  }

  const isMale = primaryInfo.gender === "M"
  const primaryLabel = isMale ? "정재" : "정관"
  const secondaryLabel = isMale ? "편재" : "편관"
  const spouseStarLabel = isMale ? "처성(妻星)" : "부성(夫星)"
  const palaceLabel = isMale ? "처궁(妻宮)" : "부궁(夫宮)"
  const spouseRole = classifyElementRoleLabel(spouseElement, roleProfile.primary) ?? "미상"
  const palaceRole =
    (isMale
      ? classifyBranchRoleLabel(dayBranchHanja, roleProfile)
      : classifyBranchRoleLabel(monthBranchHanja, roleProfile)) ?? "미상"

  const visiblePositions = Object.values((primaryFortune.sipsin?.positions as Record<string, unknown> | undefined) ?? {})
    .filter((value): value is string => typeof value === "string")
  const hiddenPositions = Object.values(primaryFortune.sajuData.pillars)
    .flatMap((pillar) => pillar.지장간.map((entry) => entry.십신))
    .filter((value): value is string => typeof value === "string" && value.length > 0)

  const visiblePrimaryCount = visiblePositions.filter((value) => value === primaryLabel).length
  const visibleSecondaryCount = visiblePositions.filter((value) => value === secondaryLabel).length
  const hiddenPrimaryCount = hiddenPositions.filter((value) => value === primaryLabel).length
  const hiddenSecondaryCount = hiddenPositions.filter((value) => value === secondaryLabel).length

  const text = [
    isMale
      ? `보이는 ${spouseStarLabel}은 ${primaryLabel} ${visiblePrimaryCount}개, ${secondaryLabel} ${visibleSecondaryCount}개입니다.`
      : `보이는 ${spouseStarLabel}은 ${primaryLabel} ${visiblePrimaryCount}개, ${secondaryLabel} ${visibleSecondaryCount}개입니다.`,
    `지장간에 숨은 ${spouseStarLabel}은 ${primaryLabel} ${hiddenPrimaryCount}개, ${secondaryLabel} ${hiddenSecondaryCount}개입니다.`,
    `${spouseStarLabel} 오행은 ${normalizeElementLabel(spouseElement)}이며 사주에서는 ${spouseRole}으로 해석합니다.`,
    `${palaceLabel}은 ${isMale ? extractKorean(primaryFortune.sajuData.pillars.일.지지) : extractKorean(primaryFortune.sajuData.pillars.월.지지)}이고 ${palaceRole} 흐름으로 봅니다.`,
  ].join("\n")

  return {
    sourceTable: "G030",
    title: isMale ? "아내 운의 핵심 구조" : "남편 운의 핵심 구조",
    scoreLabel: "배우자성 요약",
    spouseStarLabel,
    palaceLabel,
    visiblePrimaryCount,
    visibleSecondaryCount,
    hiddenPrimaryCount,
    hiddenSecondaryCount,
    text,
  }
}

export function buildLegacyPartnerRoleInsight(
  primaryInfo: LegacyCompatibilityBirthInfo,
  primaryFortune: FortuneResponse,
): LegacyPartnerRoleInsight | null {
  const dayStemHanja = extractHanja(primaryFortune.sajuData.pillars.일.천간)
  const monthBranchHanja = extractHanja(primaryFortune.sajuData.pillars.월.지지)
  const dayBranchHanja = extractHanja(primaryFortune.sajuData.pillars.일.지지)
  const spouseStarElement = resolveSpouseStarElement(dayStemHanja, primaryInfo.gender)
  if (!spouseStarElement) {
    return null
  }

  const roleProfile = getElementRoleProfile(`${dayStemHanja}${monthBranchHanja}`)
  const spouseRole = classifyElementRoleLabel(spouseStarElement, roleProfile.primary)
  const palaceRole = classifyBranchRoleLabel(dayBranchHanja, roleProfile)
  if (!spouseRole || !palaceRole) {
    return null
  }

  const record = readLegacyG031Record(spouseRole, palaceRole)
  const text = primaryInfo.gender === "M" ? record?.data ?? "" : record?.DB_data_w ?? ""
  if (!text.trim()) {
    return null
  }

  return {
    sourceTable: "G031",
    title: "배우자성·배우자궁 해설",
    scoreLabel: "배우자궁합",
    lookupKey: `${spouseRole}|${palaceRole}`,
    spouseRole,
    palaceRole,
    text,
  }
}

export function buildLegacyPartnerPersonalityInsight(
  primaryInfo: LegacyCompatibilityBirthInfo,
  primaryFortune: FortuneResponse,
  partnerFortune: FortuneResponse,
): LegacyPartnerPersonalityInsight | null {
  const primaryElement = resolveStemElement(extractKorean(primaryFortune.sajuData.pillars.년.천간))
  const partnerElement = resolveStemElement(extractKorean(partnerFortune.sajuData.pillars.년.천간))
  if (!primaryElement || !partnerElement) {
    return null
  }

  const lookupKey = `${primaryElement}${partnerElement}`
  const record = readLegacyG032Record(lookupKey)
  const text = primaryInfo.gender === "M" ? record?.data ?? "" : record?.DB_data_w ?? ""
  if (!text.trim()) {
    return null
  }

  return {
    sourceTable: "G032",
    title: "이성의 성격",
    scoreLabel: "성격궁합",
    lookupKey,
    text,
  }
}

export function buildLegacyDestinyCoreInsight(
  primaryInfo: LegacyCompatibilityBirthInfo,
  primaryFortune: FortuneResponse,
  partnerFortune: FortuneResponse,
): LegacyDestinyCoreInsight | null {
  const primarySexLabel = primaryInfo.gender === "M" ? "남" : "여"
  const partnerSexLabel = primaryInfo.gender === "M" ? "여" : "남"
  const primaryDayBranch = extractKorean(primaryFortune.sajuData.pillars.일.지지)
  const partnerDayBranchRaw = extractKorean(partnerFortune.sajuData.pillars.일.지지)
  const partnerDayBranch = primaryDayBranch === partnerDayBranchRaw ? rotateBranchForSamePair(partnerDayBranchRaw) : partnerDayBranchRaw

  const primaryLookupKey = `${primaryDayBranch}${primarySexLabel}`
  const partnerLookupKey = `${partnerDayBranch}${partnerSexLabel}`
  const primaryRecord = readLegacyG024Record(primaryLookupKey)
  const partnerRecord = readLegacyG024Record(partnerLookupKey)

  const text =
    primaryInfo.gender === "M"
      ? primaryRecord?.DB_data_m ?? ""
      : partnerRecord?.DB_data_m ?? ""

  if (!text.trim()) {
    return null
  }

  return {
    sourceTable: "G024",
    title: "운명 핵심 포인트",
    scoreLabel: "운명궁합",
    lookupKey: `${primaryLookupKey}|${partnerLookupKey}`,
    text,
  }
}

export function buildLegacyIntimacyInsight(
  primaryInfo: LegacyCompatibilityBirthInfo,
  primaryFortune: FortuneResponse,
  partnerInfo: LegacyCompatibilityBirthInfo,
  partnerFortune: FortuneResponse,
): LegacyIntimacyInsight | null {
  const primaryStage = calculateWoon12Daygi(toCalculationInput(primaryFortune, primaryInfo.gender))
  const partnerBaseStage = calculateWoon12Daygi(toCalculationInput(partnerFortune, partnerInfo.gender))
  const partnerStage = adjustPartnerLifecycleStage(partnerBaseStage, primaryInfo.gender)
  const lookupKey = `${primaryStage}-${partnerStage}`
  const record = readLegacyG016Record(lookupKey)

  if (!record?.data || typeof record.data !== "string" || !record.data.trim()) {
    return null
  }

  const numericalValue =
    typeof record.numerical === "number"
      ? record.numerical
      : typeof record.numerical === "string"
        ? Number.parseInt(record.numerical, 10)
        : null

  return {
    sourceTable: "G016",
    title: "속궁합",
    scoreLabel: "섹스궁합",
    lookupKey,
    text: record.data,
    score: Number.isFinite(numericalValue) ? numericalValue : null,
  }
}

export function buildLegacyLoveStyleInsight(
  partnerInfo: LegacyCompatibilityBirthInfo,
  partnerFortune: FortuneResponse,
): LegacyLoveStyleInsight | null {
  const lookupKey = extractKorean(partnerFortune.sajuData.pillars.일.지지)
  const record = readLegacyY003Record(lookupKey)
  if (!record) {
    return null
  }
  const text = partnerInfo.gender === "M" ? record?.DB_data_m : record?.DB_data_w

  if (!text || !text.trim()) {
    return null
  }

  const numericalValue =
    typeof record.numerical === "number"
      ? record.numerical
      : typeof record.numerical === "string"
        ? Number.parseInt(record.numerical, 10)
        : null

  return {
    sourceTable: "Y003",
    title: "그이의 러브스타일",
    scoreLabel: "러브스타일",
    lookupKey,
    text,
    score: Number.isFinite(numericalValue) ? numericalValue : null,
  }
}

export function buildLegacyBedroomInsight(
  primaryFortune: FortuneResponse,
): LegacyBedroomInsight | null {
  const lookupKey = String(
    ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"].indexOf(extractKorean(primaryFortune.sajuData.pillars.일.천간)) + 1
  ).padStart(2, "0")
  const record = readLegacyG020Record(lookupKey)

  if (!record?.data || typeof record.data !== "string" || !record.data.trim()) {
    return null
  }

  const numericalValue =
    typeof record.numerical === "number"
      ? record.numerical
      : typeof record.numerical === "string"
        ? Number.parseInt(record.numerical, 10)
        : null

  return {
    sourceTable: "G020",
    title: "침실 섹스궁합",
    scoreLabel: "침실섹스궁합",
    lookupKey,
    text: record.data,
    score: Number.isFinite(numericalValue) ? numericalValue : null,
  }
}
