/**
 * Legacy basic/detail/type/outer/traditional compatibility builders.
 *
 * Extracted from _legacy.ts to isolate the basic family lookup builders
 * (G003, G012, T010, G023, G022) from other compatibility insights.
 */

import type { FortuneResponse } from "../../models/fortuneTeller"
import { calculateWoon12Daygi } from "../yongsinFlows"
import {
  getYearBranchIndex,
  getDayBranchIndex,
  getYearBranchCategory,
  toCalculationInput,
  resolveOuterCompatibilityElements,
} from "./legacyUtilities"
import {
  readLegacyG003Record,
  readLegacyG012Record,
  readLegacyT010Record,
  readLegacyG023Record,
  readLegacyG022Record,
} from "./legacyDataReaders"
import type { LegacyCompatibilityBirthInfo } from "./legacySpouseInsights"

// ============================================================================
// LegacyBasicCompatibilityInsight (G003)
// ============================================================================

export interface LegacyBasicCompatibilityInsight {
  readonly sourceTable: "G003"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
  readonly score: number | null
}

export function buildLegacyBasicCompatibilityInsight(
  primaryInfo: LegacyCompatibilityBirthInfo,
  primaryFortune: FortuneResponse,
): LegacyBasicCompatibilityInsight | null {
  // G003 PHP: F_woonsung(daygi, daygan) → serial_no 1-12
  // g_tables.json G003 keys are "01"-"12" (all 12 records).
  // PHP mod 7 was for old 7-record DB → TS uses all 12 directly.
  const woonStage = calculateWoon12Daygi(toCalculationInput(primaryFortune, primaryInfo.gender))
  const stageNumber = Number.parseInt(woonStage, 10)
  if (!Number.isFinite(stageNumber) || stageNumber < 1 || stageNumber > 12) {
    return null
  }

  const lookupKey = String(stageNumber).padStart(2, "0")
  const record = readLegacyG003Record(lookupKey)

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
    sourceTable: "G003",
    title: "궁합 기본 성향",
    scoreLabel: "기본 궁합",
    lookupKey,
    text: record.data,
    score: Number.isFinite(numericalValue) ? numericalValue : null,
  }
}

// ============================================================================
// LegacyDetailedCompatibilityInsight (G012)
// ============================================================================

export interface LegacyDetailedCompatibilityInsight {
  readonly sourceTable: "G012"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
  readonly score: number | null
}

export function buildLegacyDetailedCompatibilityInsight(
  primaryFortune: FortuneResponse,
): LegacyDetailedCompatibilityInsight | null {
  const dayBranchIndex = getDayBranchIndex(primaryFortune)
  if (dayBranchIndex < 1) {
    return null
  }

  let plusVar: number
  switch (dayBranchIndex) {
    case 1:
    case 2:
    case 3:
      plusVar = dayBranchIndex + 1
      break
    case 4:
    case 5:
    case 6:
      plusVar = dayBranchIndex - 1
      break
    case 7:
    case 8:
    case 9:
      plusVar = dayBranchIndex + 1
      break
    default:
      plusVar = dayBranchIndex
      break
  }

  if (plusVar === 0) {
    plusVar = 12
  }
  if (plusVar === 13) {
    plusVar = 1
  }

  const lookupKey = `5${plusVar}`
  const record = readLegacyG012Record(lookupKey)

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
    sourceTable: "G012",
    title: "세부 궁합 분석",
    scoreLabel: "세부 궁합",
    lookupKey,
    text: record.data,
    score: Number.isFinite(numericalValue) ? numericalValue : null,
  }
}

// ============================================================================
// LegacyTypeProfileInsight (T010)
// ============================================================================

export interface LegacyTypeProfileInsight {
  readonly sourceTable: "T010"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
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

// ============================================================================
// LegacyOuterCompatibilityInsight (G023)
// ============================================================================

export interface LegacyOuterCompatibilityInsight {
  readonly sourceTable: "G023"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
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

// ============================================================================
// LegacyTraditionalCompatibilityInsight (G022)
// ============================================================================

export interface LegacyTraditionalCompatibilityInsight {
  readonly sourceTable: "G022"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
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
