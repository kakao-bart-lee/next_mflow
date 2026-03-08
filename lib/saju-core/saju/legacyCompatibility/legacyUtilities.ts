/**
 * Legacy compatibility utilities: shared constants and helper functions.
 *
 * Extracted from _legacy.ts to enable modular decomposition.
 * Contains:
 * - Constants: branch/stem mappings, element groups, harmony/hap/chung partners
 * - Index helpers: year/day branch index resolution
 * - Timezone helpers: current month/year/day in timezone
 * - Sexagenary helpers: gregorian key, serial calculation
 * - Element/branch resolvers: element labels, stem/branch element mapping
 * - Spouse/timing resolvers: spouse star element, lunar year ganji, relationship timing
 */

import { getDataLoader } from "../dataLoader"
import { extractKorean } from "../../utils"
import type { FortuneResponse } from "../../models/fortuneTeller"

// ============================================================
// Constants: Branch/Stem Mappings
// ============================================================

export const BRANCH_INDEX = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]

export const STEM_CODE_BY_KOREAN: Record<string, string> = {
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

export const FIVE_ELEMENT_FALLBACK = ["금", "화", "목", "토", "수"] as const

export const YEAR_ELEMENT_GROUPS: Record<string, readonly string[]> = {
  금: ["A11", "B12", "I07", "J08", "G03", "H04", "A05", "B06", "I01", "J02", "G09", "H10"],
  화: ["C01", "D02", "A09", "B10", "E11", "F12", "C07", "D08", "A03", "B04", "E05", "F06"],
  목: ["E03", "F04", "I05", "J06", "G01", "H02", "E09", "F10", "I11", "J12", "G07", "H08"],
  토: ["G05", "H06", "E01", "F02", "C09", "D10", "G11", "H12", "E07", "F08", "C03", "D04"],
  수: ["C11", "D12", "A07", "B08", "I03", "J04", "C05", "D06", "A01", "B02", "I09", "J10"],
}

export const BRANCH_HARMONY_BY_KOREAN: Record<string, string> = {
  해: "인",
  인: "해",
  자: "축",
  축: "자",
  묘: "술",
  술: "묘",
  진: "유",
  유: "진",
  사: "신",
  신: "사",
  오: "미",
  미: "오",
}

export const HANJA_STEM_TO_KOREAN: Record<string, string> = {
  甲: "갑",
  乙: "을",
  丙: "병",
  丁: "정",
  戊: "무",
  己: "기",
  庚: "경",
  辛: "신",
  壬: "임",
  癸: "계",
}

export const HANJA_BRANCH_TO_KOREAN: Record<string, string> = {
  子: "자",
  丑: "축",
  寅: "인",
  卯: "묘",
  辰: "진",
  巳: "사",
  午: "오",
  未: "미",
  申: "신",
  酉: "유",
  戌: "술",
  亥: "해",
}

export const SEXAGENARY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const
export const SEXAGENARY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const

export const STEMS_BY_ELEMENT: Record<string, readonly string[]> = {
  목: ["甲", "乙"],
  화: ["丙", "丁"],
  토: ["戊", "己"],
  금: ["庚", "辛"],
  수: ["壬", "癸"],
}

export const BRANCHES_BY_ELEMENT: Record<string, readonly string[]> = {
  목: ["寅", "卯"],
  화: ["巳", "午"],
  토: ["辰", "戌", "丑", "未"],
  금: ["申", "酉"],
  수: ["亥", "子"],
}

export const STEM_HAP_PARTNER: Record<string, string> = {
  甲: "己",
  己: "甲",
  乙: "庚",
  庚: "乙",
  丙: "辛",
  辛: "丙",
  丁: "壬",
  壬: "丁",
  戊: "癸",
  癸: "戊",
}

export const BRANCH_HAP_PARTNER: Record<string, string> = {
  子: "丑",
  丑: "子",
  寅: "亥",
  亥: "寅",
  卯: "戌",
  戌: "卯",
  辰: "酉",
  酉: "辰",
  巳: "申",
  申: "巳",
  午: "未",
  未: "午",
}

export const BRANCH_CHUNG_PARTNER: Record<string, string> = {
  子: "午",
  午: "子",
  卯: "酉",
  酉: "卯",
  寅: "申",
  申: "寅",
  巳: "亥",
  亥: "巳",
  辰: "戌",
  戌: "辰",
  丑: "未",
  未: "丑",
}

export const SERIAL_TABLE_TITLES: Record<"G004" | "G005" | "G006" | "G007", string> = {
  G004: "미래 배우자 얼굴상",
  G005: "미래 배우자 성격상",
  G006: "미래 배우자 직업상",
  G007: "미래 배우자 연애타입",
}

export const SASANG_PRIORITY: Record<"ty" | "sy" | "tu" | "su", number> = {
  ty: 0,
  sy: 1,
  tu: 2,
  su: 3,
}

export function toCalculationInput(
  fortune: FortuneResponse,
  gender: "M" | "F",
): {
  readonly yearStem: string
  readonly yearBranch: string
  readonly monthStem: string
  readonly monthBranch: string
  readonly dayStem: string
  readonly dayBranch: string
  readonly hourStem: string
  readonly hourBranch: string
  readonly gender: string
} {
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

export function adjustPartnerLifecycleStage(baseStage: string, primaryGender: "M" | "F"): string {
  const numeric = Number.parseInt(baseStage, 10)
  if (!Number.isFinite(numeric) || numeric < 1 || numeric > 12) {
    return "01"
  }
  if (primaryGender === "M") {
    return String(numeric).padStart(2, "0")
  }
  return String((numeric % 12) + 1).padStart(2, "0")
}

export function determineWesternZodiacName(birthDate: string): string | null {
  const parts = birthDate.split("-")
  if (parts.length < 3) {
    return null
  }
  const month = Number.parseInt(parts[1] ?? "0", 10)
  const day = Number.parseInt(parts[2] ?? "0", 10)
  if (!Number.isFinite(month) || !Number.isFinite(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  if ((month === 12 && day > 23) || (month === 1 && day < 21)) return "염소자리"
  if ((month === 1 && day > 20) || (month === 2 && day < 20)) return "물병자리"
  if ((month === 2 && day > 19) || (month === 3 && day < 21)) return "물고기자리"
  if ((month === 3 && day > 20) || (month === 4 && day < 21)) return "양자리"
  if ((month === 4 && day > 20) || (month === 5 && day < 22)) return "황소자리"
  if ((month === 5 && day > 21) || (month === 6 && day < 22)) return "쌍둥이자리"
  if ((month === 6 && day > 21) || (month === 7 && day < 24)) return "게자리"
  if ((month === 7 && day > 23) || (month === 8 && day < 24)) return "사자자리"
  if ((month === 8 && day > 23) || (month === 9 && day < 24)) return "처녀자리"
  if ((month === 9 && day > 23) || (month === 10 && day < 24)) return "천칭자리"
  if ((month === 10 && day > 23) || (month === 11 && day < 23)) return "전갈자리"
  return "사수자리"
}

export function normalizeSasangPair(a: "ty" | "sy" | "tu" | "su", b: "ty" | "sy" | "tu" | "su"): string {
  return SASANG_PRIORITY[a] <= SASANG_PRIORITY[b] ? a + b : b + a
}

// ============================================================
// Index Helpers
// ============================================================

export function getYearBranchIndex(fortune: FortuneResponse): number {
  return BRANCH_INDEX.indexOf(extractKorean(fortune.sajuData.pillars.년.지지)) + 1
}

export function getDayBranchIndex(fortune: FortuneResponse): number {
  return BRANCH_INDEX.indexOf(extractKorean(fortune.sajuData.pillars.일.지지)) + 1
}

// ============================================================
// Timezone Helpers
// ============================================================

export function getCurrentMonthInTimezone(timezone: string): number {
  const monthPart = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "numeric",
  })
    .formatToParts(new Date())
    .find((part) => part.type === "month")?.value
  const numericMonth = Number.parseInt(monthPart ?? "", 10)
  return Number.isFinite(numericMonth) && numericMonth >= 1 && numericMonth <= 12 ? numericMonth : new Date().getMonth() + 1
}

export function getCurrentYearInTimezone(timezone: string): number {
  const yearPart = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
  })
    .formatToParts(new Date())
    .find((part) => part.type === "year")?.value
  const numericYear = Number.parseInt(yearPart ?? "", 10)
  return Number.isFinite(numericYear) && numericYear > 0 ? numericYear : new Date().getFullYear()
}

export function getCurrentDayInTimezone(timezone: string): number {
  const dayPart = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    day: "numeric",
  })
    .formatToParts(new Date())
    .find((part) => part.type === "day")?.value
  const numericDay = Number.parseInt(dayPart ?? "", 10)
  return Number.isFinite(numericDay) && numericDay >= 1 && numericDay <= 31 ? numericDay : new Date().getDate()
}

export function getCurrentMonthStemCode(timezone: string): string | null {
  const year = getCurrentYearInTimezone(timezone)
  const month = getCurrentMonthInTimezone(timezone)
  const day = getCurrentDayInTimezone(timezone)
  const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>
  const record = mansedata[`${year.toString().padStart(4, "0")}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`]
  const stemCode = typeof record?.month_h === "string" ? record.month_h : null
  return stemCode && stemCode.length === 1 ? stemCode : null
}

// ============================================================
// Sexagenary Helpers
// ============================================================

export function getGregorianSexagenaryKey(year: number): string {
  const offset = year - 1984
  const stem = SEXAGENARY_STEMS[((offset % 10) + 10) % 10] ?? "갑"
  const branch = SEXAGENARY_BRANCHES[((offset % 12) + 12) % 12] ?? "자"
  return `${stem}${branch}`
}

export function getSexagenarySerial(stemCode: string, branchIndex: number): number {
  for (let index = 0; index < 60; index += 1) {
    const cycleStem = String.fromCharCode("A".charCodeAt(0) + (index % 10))
    const cycleBranch = ((index % 12) + 1)
    if (cycleStem === stemCode && cycleBranch === branchIndex) {
      return index + 1
    }
  }
  return 60
}

// ============================================================
// Element/Branch Resolvers
// ============================================================

export function getStemElementLabel(stemHanja: string): string {
  if (stemHanja === "甲" || stemHanja === "乙") return "목"
  if (stemHanja === "丙" || stemHanja === "丁") return "화"
  if (stemHanja === "戊" || stemHanja === "己") return "토"
  if (stemHanja === "庚" || stemHanja === "辛") return "금"
  return "수"
}

export function getBranchElementLabel(branchHanja: string): string {
  if (branchHanja === "寅" || branchHanja === "卯") return "목"
  if (branchHanja === "巳" || branchHanja === "午") return "화"
  if (branchHanja === "申" || branchHanja === "酉") return "금"
  if (branchHanja === "亥" || branchHanja === "子") return "수"
  return "토"
}

export function normalizeElementLabel(element: string): string {
  if (element === "木" || element === "목") return "목"
  if (element === "火" || element === "화") return "화"
  if (element === "土" || element === "토") return "토"
  if (element === "金" || element === "金" || element === "금") return "금"
  if (element === "水" || element === "수") return "수"
  return element
}

export function resolveStemElement(stem: string): string | null {
  switch (stem) {
    case "갑":
    case "을":
      return "목"
    case "병":
    case "정":
      return "화"
    case "무":
    case "기":
      return "토"
    case "경":
    case "신":
      return "금"
    case "임":
    case "계":
      return "수"
    default:
      return null
  }
}

export function resolveSpouseStarElement(dayStemHanja: string, gender: "M" | "F"): string | null {
  if (gender === "M") {
    if (dayStemHanja === "甲" || dayStemHanja === "乙") return "土"
    if (dayStemHanja === "丙" || dayStemHanja === "丁") return "金"
    if (dayStemHanja === "戊" || dayStemHanja === "己") return "水"
    if (dayStemHanja === "庚" || dayStemHanja === "辛") return "木"
    if (dayStemHanja === "壬" || dayStemHanja === "癸") return "火"
    return null
  }

  if (dayStemHanja === "甲" || dayStemHanja === "乙") return "金"
  if (dayStemHanja === "丙" || dayStemHanja === "丁") return "水"
  if (dayStemHanja === "戊" || dayStemHanja === "己") return "木"
  if (dayStemHanja === "庚" || dayStemHanja === "辛") return "火"
  if (dayStemHanja === "壬" || dayStemHanja === "癸") return "土"
  return null
}

export function resolveFiveElementByYearCode(yearCodePair: string): string {
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

// ============================================================
// Spouse/Timing Resolvers
// ============================================================

export function resolveLunarYearGanji(
  year: number,
): { readonly hanjaKey: string; readonly koreanKey: string; readonly branch: string } | null {
  const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>
  const candidates = [`${year}0205`, `${year}0204`, `${year}0206`, `${year}0203`]

  for (const dateCode of candidates) {
    const record = mansedata[dateCode]
    const stemHanja = typeof record?.lunar_year_h === "string" ? record.lunar_year_h : null
    const branchHanja = typeof record?.lunar_year_e === "string" ? record.lunar_year_e : null
    if (!stemHanja || !branchHanja) {
      continue
    }
    const stemKorean = HANJA_STEM_TO_KOREAN[stemHanja]
    const branchKorean = HANJA_BRANCH_TO_KOREAN[branchHanja]
    if (!stemKorean || !branchKorean) {
      continue
    }
    return {
      hanjaKey: `${stemHanja}${branchHanja}`,
      koreanKey: `${stemKorean}${branchKorean}`,
      branch: branchKorean,
    }
  }

  const fallbackKey = getGregorianSexagenaryKey(year)
  return {
    hanjaKey: fallbackKey,
    koreanKey: fallbackKey,
    branch: fallbackKey.slice(1),
  }
}

export function resolveYearCodePair(fortune: FortuneResponse): string | null {
  const yearStemCode = STEM_CODE_BY_KOREAN[extractKorean(fortune.sajuData.pillars.년.천간)]
  const yearBranchIndex = getYearBranchIndex(fortune)
  if (!yearStemCode || yearBranchIndex < 1) {
    return null
  }
  return `${yearStemCode}${String(yearBranchIndex).padStart(2, "0")}`
}

export function resolveOuterCompatibilityElements(
  primaryInfo: { readonly gender: "M" | "F" },
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

export function getYearBranchCategory(fortune: FortuneResponse): number | null {
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

export function rotateBranchForSamePair(branch: string): string {
  const currentIndex = BRANCH_INDEX.indexOf(branch)
  if (currentIndex < 0) {
    return "해"
  }
  return BRANCH_INDEX[(currentIndex + 11) % 12] ?? "해"
}

export function resolveLegacyRelationshipTimingTarget(
  primaryInfo: { readonly gender: "M" | "F"; readonly birthDate: string; readonly timezone: string },
  primaryFortune: FortuneResponse,
): {
  readonly currentYear: number
  readonly matchedYear: number
  readonly matchedGanji: string
  readonly lookupKey: string
  readonly fallbackLookupKey: string
} | null {
  const currentYear = getCurrentYearInTimezone(primaryInfo.timezone)
  const sourceBranch =
    primaryInfo.gender === "M"
      ? extractKorean(primaryFortune.sajuData.pillars.일.지지)
      : extractKorean(primaryFortune.sajuData.pillars.월.지지)
  const targetBranch = BRANCH_HARMONY_BY_KOREAN[sourceBranch]
  if (!targetBranch) {
    return null
  }

  const startYear = primaryInfo.gender === "M" ? currentYear - 3 : currentYear - 10
  const endYear = primaryInfo.gender === "M" ? currentYear + 10 : currentYear + 3

  for (let year = endYear - 1; year >= startYear; year -= 1) {
    const ganji = resolveLunarYearGanji(year)
    if (!ganji || ganji.branch !== targetBranch) {
      continue
    }

    return {
      currentYear,
      matchedYear: year,
      matchedGanji: ganji.koreanKey,
      lookupKey: ganji.koreanKey,
      fallbackLookupKey: ganji.hanjaKey,
    }
  }

  return null
}
