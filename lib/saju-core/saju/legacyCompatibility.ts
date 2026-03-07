/**
 * Legacy compatibility detail bridge.
 *
 * We keep the modern gunghap scoring engine intact and layer legacy
 * table-backed details like G016 on top when the original PHP flow is
 * well understood and reproducible.
 */

import type { FortuneResponse } from "../models/fortuneTeller"
import { getDataLoader } from "./dataLoader"
import { calculateWoon12Daygi } from "./yongsinFlows"
import { extractKorean } from "../utils"

interface LegacyCompatibilityBirthInfo {
  readonly birthDate: string
  readonly birthTime?: string | null
  readonly gender: "M" | "F"
  readonly timezone: string
}

interface LegacyCompatibilityCalculationInput {
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

export interface LegacyIntimacyInsight {
  readonly sourceTable: "G016"
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

export interface LegacyBedroomInsight {
  readonly sourceTable: "G020"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
  readonly score: number | null
}

export interface LegacyYearlyLoveCycleInsight {
  readonly sourceTable: "Y004"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly intro: string
  readonly months: readonly {
    readonly month: number
    readonly text: string
  }[]
}

export interface LegacyLoveWeakPointInsight {
  readonly sourceTable: "Y001"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
}

export interface LegacyMarriageFlowInsight {
  readonly sourceTable: "G001"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
  readonly score: number | null
  readonly currentMonth: number
}

const BRANCH_INDEX = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]

function toCalculationInput(fortune: FortuneResponse, gender: "M" | "F"): LegacyCompatibilityCalculationInput {
  const pillars = fortune.sajuData.pillars
  return {
    yearStem: pillars.년.천간,
    yearBranch: pillars.년.지지,
    monthStem: pillars.월.천간,
    monthBranch: pillars.월.지지,
    dayStem: pillars.일.천간,
    dayBranch: pillars.일.지지,
    hourStem: pillars.시.천간,
    hourBranch: pillars.시.지지,
    gender,
  }
}

function adjustPartnerLifecycleStage(baseStage: string, primaryGender: "M" | "F"): string {
  const numeric = Number.parseInt(baseStage, 10)
  if (!Number.isFinite(numeric) || numeric < 1 || numeric > 12) {
    return "01"
  }
  if (primaryGender === "M") {
    return String(numeric).padStart(2, "0")
  }
  return String((numeric % 12) + 1).padStart(2, "0")
}

function readLegacyG016Record(lookupKey: string): { readonly data?: string; readonly numerical?: number | string | null } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = gTables.G016?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string; readonly numerical?: number | string | null }
}

function readLegacyG020Record(lookupKey: string): { readonly data?: string; readonly numerical?: number | string | null } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = gTables.G020?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string; readonly numerical?: number | string | null }
}

function readLegacyG001Record(lookupKey: string): { readonly data?: string; readonly numerical?: number | string | null } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const table = gTables.G001
  const candidates = [lookupKey, lookupKey.trim(), `${Number.parseInt(lookupKey, 10)} `, String(Number.parseInt(lookupKey, 10))]
  for (const candidate of candidates) {
    const record = table?.[candidate]
    if (record && typeof record === "object") {
      return record as { readonly data?: string; readonly numerical?: number | string | null }
    }
  }
  return null
}

function readLegacyY003Record(lookupKey: string): { readonly DB_data_m?: string; readonly DB_data_w?: string; readonly numerical?: number | string | null } | null {
  const yTables = getDataLoader().loadYTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = yTables.Y003?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly DB_data_m?: string; readonly DB_data_w?: string; readonly numerical?: number | string | null }
}

function readLegacyY004Record(
  lookupKey: string,
): {
  readonly data?: string
  readonly [key: `DB_data_${number}`]: string | undefined
} | null {
  const yTables = getDataLoader().loadYTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = yTables.Y004?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as {
    readonly data?: string
    readonly [key: `DB_data_${number}`]: string | undefined
  }
}

function readLegacyY001Record(
  lookupKey: string,
): {
  readonly data?: string
} | null {
  const yTables = getDataLoader().loadYTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = yTables.Y001?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as {
    readonly data?: string
  }
}

function getCurrentMonthInTimezone(timezone: string): number {
  const monthPart = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "numeric",
  })
    .formatToParts(new Date())
    .find((part) => part.type === "month")?.value
  const numericMonth = Number.parseInt(monthPart ?? "", 10)
  return Number.isFinite(numericMonth) && numericMonth >= 1 && numericMonth <= 12 ? numericMonth : new Date().getMonth() + 1
}

function getYearBranchIndex(fortune: FortuneResponse): number {
  return BRANCH_INDEX.indexOf(extractKorean(fortune.sajuData.pillars.년.지지)) + 1
}

function getDayBranchIndex(fortune: FortuneResponse): number {
  return BRANCH_INDEX.indexOf(extractKorean(fortune.sajuData.pillars.일.지지)) + 1
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

export function buildLegacyMarriageFlowInsight(
  primaryInfo: LegacyCompatibilityBirthInfo,
  primaryFortune: FortuneResponse,
): LegacyMarriageFlowInsight | null {
  const yearBranchIndex = getYearBranchIndex(primaryFortune)
  if (yearBranchIndex < 1) {
    return null
  }
  const currentMonth = getCurrentMonthInTimezone(primaryInfo.timezone)
  const seed = 14 - yearBranchIndex
  const baseValue = seed > 12 ? seed - 12 : seed
  let lookupNumber = (baseValue + currentMonth) - 1 + 6
  if (lookupNumber > 12) {
    lookupNumber -= 12
  }
  const lookupKey = String(lookupNumber).padStart(2, "0")
  const record = readLegacyG001Record(lookupKey)

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
    sourceTable: "G001",
    title: "결혼 후 사랑 흐름",
    scoreLabel: "결혼궁합",
    lookupKey,
    text: record.data,
    score: Number.isFinite(numericalValue) ? numericalValue : null,
    currentMonth,
  }
}

export function buildLegacyYearlyLoveCycleInsight(
  primaryFortune: FortuneResponse,
): LegacyYearlyLoveCycleInsight | null {
  const lookupKey = String(getDayBranchIndex(primaryFortune)).padStart(2, "0")
  const record = readLegacyY004Record(lookupKey)

  if (!record?.data || typeof record.data !== "string" || !record.data.trim()) {
    return null
  }

  const months = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const text = record[`DB_data_${month}`]?.trim() ?? ""
    return {
      month,
      text,
    }
  }).filter((entry) => entry.text.length > 0)

  if (months.length === 0) {
    return null
  }

  return {
    sourceTable: "Y004",
    title: "섹스 토정비결",
    scoreLabel: "월별 섹스운",
    lookupKey,
    intro: record.data,
    months,
  }
}

export function buildLegacyLoveWeakPointInsight(
  primaryFortune: FortuneResponse,
): LegacyLoveWeakPointInsight | null {
  const lookupKey = String(getYearBranchIndex(primaryFortune)).padStart(2, "0")
  const record = readLegacyY001Record(lookupKey)

  if (!record?.data || typeof record.data !== "string" || !record.data.trim()) {
    return null
  }

  return {
    sourceTable: "Y001",
    title: "연애 취약점과 요령",
    scoreLabel: "연애 가이드",
    lookupKey,
    text: record.data,
  }
}
