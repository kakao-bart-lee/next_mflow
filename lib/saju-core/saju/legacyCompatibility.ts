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

export interface LegacyTypeProfileInsight {
  readonly sourceTable: "T010"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
}

export interface LegacyOuterCompatibilityInsight {
  readonly sourceTable: "G023"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
}

export interface LegacyTraditionalCompatibilityInsight {
  readonly sourceTable: "G022"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
}

const BRANCH_INDEX = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]
const STEM_CODE_BY_KOREAN: Record<string, string> = {
  갑: "A",
  을: "B",
  병: "C",
  정: "D",
  무: "E",
  기: "F",
  경: "G",
  신: "H",
  임: "I",
  계: "J",
}
const FIVE_ELEMENT_FALLBACK = ["금", "화", "목", "토", "수"] as const
const YEAR_ELEMENT_GROUPS: Record<string, readonly string[]> = {
  금: ["A11", "B12", "I07", "J08", "G03", "H04", "A05", "B06", "I01", "J02", "G09", "H10"],
  화: ["C01", "D02", "A09", "B10", "E11", "F12", "C07", "D08", "A03", "B04", "E05", "F06"],
  목: ["E03", "F04", "I05", "J06", "G01", "H02", "E09", "F10", "I11", "J12", "G07", "H08"],
  토: ["G05", "H06", "E01", "F02", "C09", "D10", "G11", "H12", "E07", "F08", "C03", "D04"],
  수: ["C11", "D12", "A07", "B08", "I03", "J04", "C05", "D06", "A01", "B02", "I09", "J10"],
}

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

function readLegacyG023Record(lookupKey: string): { readonly data?: string } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = gTables.G023?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string }
}

function readLegacyG022Record(lookupKey: string): { readonly data?: string } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const table = gTables.G022
  const candidates = [lookupKey, lookupKey.trim(), String(Number.parseInt(lookupKey, 10))]
  for (const candidate of candidates) {
    const record = table?.[candidate]
    if (record && typeof record === "object") {
      return record as { readonly data?: string }
    }
  }
  return null
}

function readLegacyT010Record(lookupKey: string): { readonly data?: string } | null {
  const tTables = getDataLoader().loadTTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = tTables.T010?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string }
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

function getYearBranchCategory(fortune: FortuneResponse): number | null {
  const yearBranchIndex = getYearBranchIndex(fortune)
  switch (String(yearBranchIndex).padStart(2, "0")) {
    case "01":
    case "03":
    case "05":
      return 1
    case "06":
    case "07":
    case "11":
      return 2
    case "02":
    case "04":
    case "09":
      return 3
    case "08":
    case "10":
    case "12":
      return 4
    default:
      return null
  }
}

function resolveYearCodePair(fortune: FortuneResponse): string | null {
  const yearStemCode = STEM_CODE_BY_KOREAN[extractKorean(fortune.sajuData.pillars.년.천간)]
  const yearBranchIndex = getYearBranchIndex(fortune)
  if (!yearStemCode || yearBranchIndex < 1) {
    return null
  }
  return `${yearStemCode}${String(yearBranchIndex).padStart(2, "0")}`
}

function resolveFiveElementByYearCode(yearCodePair: string): string {
  for (const [element, candidates] of Object.entries(YEAR_ELEMENT_GROUPS)) {
    if (candidates.includes(yearCodePair)) {
      return element
    }
  }

  const stemCode = yearCodePair.slice(0, 1)
  const branchIndex = Number.parseInt(yearCodePair.slice(1), 10)
  for (const candidateBranchIndex of [branchIndex + 1, branchIndex - 1]) {
    const candidatePair = `${stemCode}${String(((candidateBranchIndex - 1 + 12) % 12) + 1).padStart(2, "0")}`
    for (const [element, candidates] of Object.entries(YEAR_ELEMENT_GROUPS)) {
      if (candidates.includes(candidatePair)) {
        return element
      }
    }
  }

  const fallbackIndex = branchIndex % 5
  return FIVE_ELEMENT_FALLBACK[fallbackIndex] ?? "금"
}

function resolveOuterCompatibilityElements(
  primaryInfo: LegacyCompatibilityBirthInfo,
  primaryFortune: FortuneResponse,
  partnerFortune: FortuneResponse,
): { readonly primaryElement: string; readonly partnerElement: string } | null {
  const primaryYearCode = resolveYearCodePair(primaryFortune)
  const partnerYearCode = resolveYearCodePair(partnerFortune)
  if (!primaryYearCode || !partnerYearCode) {
    return null
  }

  const resolvedPrimary = resolveFiveElementByYearCode(primaryYearCode)
  const resolvedPartner = resolveFiveElementByYearCode(partnerYearCode)

  if (primaryInfo.gender === "M") {
    return { primaryElement: resolvedPrimary, partnerElement: resolvedPartner }
  }
  return { primaryElement: resolvedPartner, partnerElement: resolvedPrimary }
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

export function buildLegacyTypeProfileInsight(
  primaryFortune: FortuneResponse,
): LegacyTypeProfileInsight | null {
  const yearBranchIndex = getYearBranchIndex(primaryFortune)
  const category = getYearBranchCategory(primaryFortune)
  if (yearBranchIndex < 1 || category === null) {
    return null
  }

  const lookupKey = String(yearBranchIndex * category).padStart(2, "0")
  const record = readLegacyT010Record(lookupKey)
  if (!record?.data || typeof record.data !== "string" || !record.data.trim()) {
    return null
  }

  return {
    sourceTable: "T010",
    title: "사주 타입 분석",
    scoreLabel: "성향 분석",
    lookupKey,
    text: record.data,
  }
}

export function buildLegacyOuterCompatibilityInsight(
  primaryInfo: LegacyCompatibilityBirthInfo,
  primaryFortune: FortuneResponse,
  partnerFortune: FortuneResponse,
): LegacyOuterCompatibilityInsight | null {
  const elements = resolveOuterCompatibilityElements(primaryInfo, primaryFortune, partnerFortune)
  if (!elements) {
    return null
  }
  const lookupKey = `${elements.primaryElement}${elements.partnerElement}`
  const record = readLegacyG023Record(lookupKey)
  if (!record?.data || typeof record.data !== "string" || !record.data.trim()) {
    return null
  }

  return {
    sourceTable: "G023",
    title: "겉궁합",
    scoreLabel: "오행궁합",
    lookupKey,
    text: record.data,
  }
}

export function buildLegacyTraditionalCompatibilityInsight(
  primaryInfo: LegacyCompatibilityBirthInfo,
  primaryFortune: FortuneResponse,
  partnerFortune: FortuneResponse,
): LegacyTraditionalCompatibilityInsight | null {
  const elements = resolveOuterCompatibilityElements(primaryInfo, primaryFortune, partnerFortune)
  if (!elements) {
    return null
  }

  const elementOrder = ["목", "화", "토", "금", "수"]
  const primaryValue = elementOrder.indexOf(elements.primaryElement) + 1
  const partnerValue = elementOrder.indexOf(elements.partnerElement) + 1
  if (primaryValue < 1 || partnerValue < 1) {
    return null
  }

  const lookupKey = String(primaryValue * partnerValue || 25)
  const record = readLegacyG022Record(lookupKey)
  if (!record?.data || typeof record.data !== "string" || !record.data.trim()) {
    return null
  }

  return {
    sourceTable: "G022",
    title: "정통궁합",
    scoreLabel: "정통궁합",
    lookupKey,
    text: record.data,
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
