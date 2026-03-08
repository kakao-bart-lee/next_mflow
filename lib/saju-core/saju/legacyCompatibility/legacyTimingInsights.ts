/**
 * Legacy timing family insights module.
 *
 * Extracts timing-related builders from _legacy.ts:
 * - G001: Marriage Flow (결혼 후 사랑 흐름)
 * - G033: Marriage Timing Table (혼인·연애 시기표)
 * - G004-G007: Future Spouse (배우자 해설)
 * - G034: Relationship Timing (인연 시기와 흐름)
 * - Y004: Yearly Love Cycle (섹스 토정비결)
 * - Y001: Love Weak Point (연애 취약점과 요령)
 *
 * These builders focus on timing and lifecycle aspects of relationships,
 * distinct from intimacy (G016/Y003/G020) and spouse role analysis (G030/G031/G032).
 */

import type { FortuneResponse } from "../../models/fortuneTeller"
import { extractHanja } from "../../utils"
import {
  getYearBranchIndex,
  getDayBranchIndex,
  getCurrentMonthInTimezone,
  getCurrentMonthStemCode,
  getCurrentDayInTimezone,
  getSexagenarySerial,
  getStemElementLabel,
  getBranchElementLabel,
  normalizeElementLabel,
  resolveSpouseStarElement,
  resolveLunarYearGanji,
  resolveLegacyRelationshipTimingTarget,
  SERIAL_TABLE_TITLES,
  STEMS_BY_ELEMENT,
  BRANCHES_BY_ELEMENT,
  STEM_HAP_PARTNER,
  BRANCH_HAP_PARTNER,
  BRANCH_CHUNG_PARTNER,
} from "./legacyUtilities"
import {
  readLegacyG001Record,
  readLegacySerialRecord,
  readLegacyG034Record,
  readLegacyY004Record,
  readLegacyY001Record,
} from "./legacyDataReaders"
import { getElementRoleProfile } from "../elementRoleProfiles"
import type { LegacyCompatibilityBirthInfo } from "./legacySpouseInsights"

export interface LegacyMarriageFlowInsight {
  readonly sourceTable: "G001"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
  readonly score: number | null
  readonly currentMonth: number
}

export interface LegacyMarriageTimingTableInsight {
  readonly sourceTable: "G033"
  readonly title: string
  readonly scoreLabel: string
  readonly focusElement: string
  readonly text: string
  readonly entries: readonly {
    readonly year: number
    readonly age: number
    readonly ganji: string
    readonly score: number
    readonly percent: number
  }[]
}

export interface LegacyFutureSpouseInsight {
  readonly sourceTable: "G004" | "G005" | "G006" | "G007"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
  readonly currentMonthStem: string
  readonly currentDay: number
}

export interface LegacyRelationshipTimingInsight {
  readonly sourceTable: "G034"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
  readonly currentYear: number
  readonly matchedYear: number
  readonly matchedGanji: string
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

export function buildLegacyMarriageTimingTableInsight(
  primaryInfo: LegacyCompatibilityBirthInfo,
  primaryFortune: FortuneResponse,
): LegacyMarriageTimingTableInsight | null {
  const birthYear = Number.parseInt(primaryInfo.birthDate.slice(0, 4), 10)
  const dayStemHanja = extractHanja(primaryFortune.sajuData.pillars.일.천간)
  const dayBranchHanja = extractHanja(primaryFortune.sajuData.pillars.일.지지)
  const monthBranchHanja = extractHanja(primaryFortune.sajuData.pillars.월.지지)
  if (!Number.isFinite(birthYear)) {
    return null
  }

  const roleProfile = getElementRoleProfile(`${dayStemHanja}${monthBranchHanja}`)
  const usefulElement = normalizeElementLabel(roleProfile.primary.usefulElement)
  const favorableElement = normalizeElementLabel(roleProfile.primary.favorableElement)
  const focusElement = resolveSpouseStarElement(dayStemHanja, primaryInfo.gender)
  if (!focusElement) {
    return null
  }

  const normalizedFocusElement = normalizeElementLabel(focusElement)
  const candidateStems = new Set(STEMS_BY_ELEMENT[normalizedFocusElement] ?? [])
  const candidateBranches = new Set(BRANCHES_BY_ELEMENT[normalizedFocusElement] ?? [])
  const entries: Array<{ year: number; age: number; ganji: string; score: number; percent: number }> = []

  for (let year = birthYear + 18; year < birthYear + 50; year += 1) {
    const ganji = resolveLunarYearGanji(year)
    if (!ganji) {
      continue
    }
    const stemHanja = ganji.hanjaKey.slice(0, 1)
    const branchHanja = ganji.hanjaKey.slice(1)
    if (!candidateStems.has(stemHanja) && !candidateBranches.has(branchHanja)) {
      continue
    }

    const stemElement = getStemElementLabel(stemHanja)
    const branchElement = getBranchElementLabel(branchHanja)

    let total = 0
    if (stemElement === normalizedFocusElement || branchElement === normalizedFocusElement) {
      total +=
        stemElement === normalizedFocusElement && branchElement === normalizedFocusElement
          ? 150
          : stemElement === normalizedFocusElement
            ? 100
            : 120
    }
    if (STEM_HAP_PARTNER[dayStemHanja] === stemHanja) {
      total += 50
    }
    if (BRANCH_HAP_PARTNER[dayBranchHanja] === branchHanja) {
      total += 70
    }
    if (BRANCH_CHUNG_PARTNER[dayBranchHanja] === branchHanja) {
      total -= 40
    }
    if (getStemElementLabel(stemHanja) === usefulElement) {
      total += 22
    }
    if (getBranchElementLabel(branchHanja) === usefulElement) {
      total += 18
    }
    if (getStemElementLabel(stemHanja) === favorableElement) {
      total += 17
    }
    if (getBranchElementLabel(branchHanja) === favorableElement) {
      total += 13
    }

    if (primaryInfo.gender === "F" && total === 0) {
      total = 8
    }

    const percent = Math.round(Math.abs((total / 340) * 100))
    entries.push({
      year,
      age: year - birthYear + 1,
      ganji: ganji.koreanKey,
      score: total,
      percent,
    })
  }

  if (entries.length === 0) {
    return null
  }

  return {
    sourceTable: "G033",
    title: "혼인·연애 시기표",
    scoreLabel: "혼인시기",
    focusElement: normalizeElementLabel(focusElement),
    text: `귀하는 ${normalizedFocusElement} 운에서 혼인·연애 가능성이 크게 올라가는 흐름으로 봅니다.`,
    entries,
  }
}

export function buildLegacyFutureSpouseInsight(
  tableName: LegacyFutureSpouseInsight["sourceTable"],
  primaryInfo: LegacyCompatibilityBirthInfo,
  primaryFortune: FortuneResponse,
): LegacyFutureSpouseInsight | null {
  const currentMonthStem = getCurrentMonthStemCode(primaryInfo.timezone)
  const yearBranchIndex = getYearBranchIndex(primaryFortune)
  const dayBranchIndex = getDayBranchIndex(primaryFortune)
  if (!currentMonthStem || yearBranchIndex < 1 || dayBranchIndex < 1) {
    return null
  }

  const currentDay = getCurrentDayInTimezone(primaryInfo.timezone)
  const requestDay = Number.parseInt(primaryInfo.birthDate.slice(-2), 10)
  let serial = getSexagenarySerial(currentMonthStem, yearBranchIndex)

  if (currentDay === requestDay) {
    let werewf1 = 2
    if (yearBranchIndex === 1 || yearBranchIndex === 3 || yearBranchIndex === 5) {
      werewf1 = 1
    } else if (yearBranchIndex === 6 || yearBranchIndex === 7 || yearBranchIndex === 11) {
      werewf1 = 2
    } else if (yearBranchIndex === 2 || yearBranchIndex === 4 || yearBranchIndex === 9) {
      werewf1 = 1
    }
    serial += dayBranchIndex * werewf1
  }

  if (serial <= 0) {
    serial = 1
  }
  if (primaryInfo.gender === "F") {
    serial += 80
  }
  while (serial > 160) {
    serial -= 160
  }

  const lookupKey = String(serial)
  const record = readLegacySerialRecord(tableName, lookupKey)
  if (!record?.data || typeof record.data !== "string" || !record.data.trim()) {
    return null
  }

  return {
    sourceTable: tableName,
    title: SERIAL_TABLE_TITLES[tableName],
    scoreLabel: "배우자 해설",
    lookupKey,
    text: record.data,
    currentMonthStem,
    currentDay,
  }
}

export function buildLegacyRelationshipTimingInsight(
  primaryInfo: LegacyCompatibilityBirthInfo,
  primaryFortune: FortuneResponse,
): LegacyRelationshipTimingInsight | null {
  const timing = resolveLegacyRelationshipTimingTarget(primaryInfo, primaryFortune)
  if (!timing) {
    return null
  }

  const record = readLegacyG034Record(timing.lookupKey) ?? readLegacyG034Record(timing.fallbackLookupKey)
  if (!record?.data || typeof record.data !== "string" || !record.data.trim()) {
    return null
  }

  return {
    sourceTable: "G034",
    title: "인연 시기와 흐름",
    scoreLabel: "인연궁합",
    lookupKey: timing.lookupKey,
    text: record.data,
    currentYear: timing.currentYear,
    matchedYear: timing.matchedYear,
    matchedGanji: timing.matchedGanji,
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
