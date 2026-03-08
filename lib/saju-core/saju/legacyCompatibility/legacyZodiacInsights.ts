/**
 * Legacy zodiac family compatibility insights.
 *
 * Extracts three zodiac-related builders from _legacy.ts:
 * - G019: 별자리 궁합 (Western Zodiac Compatibility)
 * - G026: 띠 궁합 (Animal/Chinese Zodiac Compatibility)
 * - G028: 사상체질 궁합 (Sasang Constitution Compatibility)
 *
 * These builders read from legacy PHP tables and return compatibility insights
 * with optional scoring. The Sasang Constitution type is also exported for use
 * in other modules.
 *
 * @module legacyZodiacInsights
 */

import type { FortuneResponse } from "../../models/fortuneTeller"
import type { LegacyCompatibilityBirthInfo } from "./legacySpouseInsights"
import {
  getYearBranchIndex,
  determineWesternZodiacName,
  normalizeSasangPair,
} from "./legacyUtilities"
import {
  readLegacyG019Record,
  readLegacyG026Record,
  readLegacyG028Record,
} from "./legacyDataReaders"

// ============================================================
// G019: 별자리 궁합 (Western Zodiac Compatibility)
// ============================================================

export interface LegacyZodiacCompatibilityInsight {
  readonly sourceTable: "G019"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
}

export function buildLegacyZodiacCompatibilityInsight(
  primaryInfo: LegacyCompatibilityBirthInfo,
): LegacyZodiacCompatibilityInsight | null {
  const zodiacName = determineWesternZodiacName(primaryInfo.birthDate)
  if (!zodiacName) {
    return null
  }

  const lookupKey = zodiacName
  const record = readLegacyG019Record(lookupKey)

  if (!record?.data || typeof record.data !== "string" || !record.data.trim()) {
    return null
  }

  const text = record.data.replace(/<[^>]*>/g, "")
  if (!text.trim()) {
    return null
  }

  return {
    sourceTable: "G019",
    title: "별자리 궁합",
    scoreLabel: "별자리 궁합",
    lookupKey,
    text,
  }
}

// ============================================================
// G026: 띠 궁합 (Animal/Chinese Zodiac Compatibility)
// ============================================================

export interface LegacyAnimalCompatibilityInsight {
  readonly sourceTable: "G026"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
  readonly score: number | null
}

export function buildLegacyAnimalCompatibilityInsight(
  primaryFortune: FortuneResponse,
  partnerFortune: FortuneResponse,
): LegacyAnimalCompatibilityInsight | null {
  const primaryIndex = getYearBranchIndex(primaryFortune)
  const partnerIndex = getYearBranchIndex(partnerFortune)
  if (primaryIndex < 1 || partnerIndex < 1) {
    return null
  }

  const lookupKey = String((primaryIndex - 1) * 12 + partnerIndex)
  const record = readLegacyG026Record(lookupKey)

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
    sourceTable: "G026",
    title: "띠 궁합",
    scoreLabel: "띠궁합 지수",
    lookupKey,
    text: record.data,
    score: Number.isFinite(numericalValue) ? numericalValue : null,
  }
}

// ============================================================
// G028: 사상체질 궁합 (Sasang Constitution Compatibility)
// ============================================================

/** 사상체질 타입: ty=태양인, sy=소양인, tu=태음인, su=소음인 */
export type SasangConstitution = "ty" | "sy" | "tu" | "su"

export interface LegacySasangCompatibilityInsight {
  readonly sourceTable: "G028"
  readonly title: string
  readonly scoreLabel: string
  readonly lookupKey: string
  readonly text: string
}

export function buildLegacySasangCompatibilityInsight(
  primarySasang: SasangConstitution | null | undefined,
  partnerSasang: SasangConstitution | null | undefined,
): LegacySasangCompatibilityInsight | null {
  if (!primarySasang || !partnerSasang) {
    return null
  }

  const lookupKey = normalizeSasangPair(primarySasang, partnerSasang)
  const record = readLegacyG028Record(lookupKey)

  if (!record?.data || typeof record.data !== "string") {
    return null
  }

  const text = record.data.replace(/<[^>]*>/g, "").trim()
  if (!text) {
    return null
  }

  return {
    sourceTable: "G028",
    title: "사상체질 궁합",
    scoreLabel: "사상체질 궁합",
    lookupKey,
    text,
  }
}
