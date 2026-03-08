/**
 * Legacy data reader functions for table lookups.
 *
 * Extracted from _legacy.ts to enable modular decomposition of legacy compatibility features.
 * Each reader function loads data from G/Y/T tables via getDataLoader() singleton.
 *
 * @module legacyDataReaders
 */

import { getDataLoader } from "../dataLoader"
import type { LegacyFutureSpouseInsight } from "./legacyTimingInsights"

/**
 * Read G016 record (속궁합 - Intimacy Compatibility)
 */
export function readLegacyG016Record(lookupKey: string): { readonly data?: string; readonly numerical?: number | string | null } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = gTables.G016?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string; readonly numerical?: number | string | null }
}

/**
 * Read G020 record (침실 섹스궁합 - Bedroom Compatibility)
 */
export function readLegacyG020Record(lookupKey: string): { readonly data?: string; readonly numerical?: number | string | null } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = gTables.G020?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string; readonly numerical?: number | string | null }
}

/**
 * Read G001 record (결혼 후 사랑 흐름 - Marriage Flow)
 * Tries multiple key candidates for fuzzy matching
 */
export function readLegacyG001Record(lookupKey: string): { readonly data?: string; readonly numerical?: number | string | null } | null {
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

/**
 * Read G023 record (겉궁합 - Outer Compatibility)
 */
export function readLegacyG023Record(lookupKey: string): { readonly data?: string } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = gTables.G023?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string }
}

/**
 * Read G022 record (정통궁합 - Traditional Compatibility)
 * Tries multiple key candidates for fuzzy matching
 */
export function readLegacyG022Record(lookupKey: string): { readonly data?: string } | null {
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

/**
 * Read G024 record (운명 핵심 포인트 - Destiny Core)
 */
export function readLegacyG024Record(
  lookupKey: string,
): { readonly DB_data_m?: string; readonly DB_data_w?: string; readonly DB_express_1?: string } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = gTables.G024?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly DB_data_m?: string; readonly DB_data_w?: string; readonly DB_express_1?: string }
}

/**
 * Read G032 record (이성의 성격 - Partner Personality)
 */
export function readLegacyG032Record(
  lookupKey: string,
): { readonly data?: string; readonly DB_data_w?: string } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = gTables.G032?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string; readonly DB_data_w?: string }
}

/**
 * Read G034 record (인연 시기와 흐름 - Relationship Timing)
 * Tries multiple key candidates for fuzzy matching
 */
export function readLegacyG034Record(lookupKey: string): { readonly data?: string } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const candidates = [lookupKey, lookupKey.trim()]
  for (const candidate of candidates) {
    const record = gTables.G034?.[candidate]
    if (record && typeof record === "object") {
      return record as { readonly data?: string }
    }
  }
  return null
}

/**
 * Read G031 record (배우자성·배우자궁 해설 - Partner Role)
 * Two-level lookup: spouseRole → palaceRole
 */
export function readLegacyG031Record(
  spouseRole: string,
  palaceRole: string,
): { readonly data?: string; readonly DB_data_w?: string } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const rolePayload = gTables.G031?.[spouseRole]
  if (!rolePayload || typeof rolePayload !== "object") {
    return null
  }
  const record = rolePayload[palaceRole]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string; readonly DB_data_w?: string }
}

/**
 * Read serial record (G004-G007: 배우자 해설 - Future Spouse)
 * Tries multiple key candidates and numeric fallback
 */
export function readLegacySerialRecord(
  tableName: LegacyFutureSpouseInsight["sourceTable"],
  lookupKey: string,
): { readonly data?: string } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const table = gTables[tableName]
  const candidates = [lookupKey, lookupKey.trim(), `${Number.parseInt(lookupKey, 10)} `, String(Number.parseInt(lookupKey, 10))]
  for (const candidate of candidates) {
    const record = table?.[candidate]
    if (record && typeof record === "object") {
      return record as { readonly data?: string }
    }
  }
  const numericLookup = Number.parseInt(lookupKey, 10)
  if (Number.isFinite(numericLookup) && table && typeof table === "object") {
    for (const record of Object.values(table)) {
      if (!record || typeof record !== "object") {
        continue
      }
      const numericId =
        typeof record.num === "number"
          ? record.num
          : typeof record.num === "string"
            ? Number.parseInt(record.num, 10)
            : Number.NaN
      if (numericId === numericLookup) {
        return record as { readonly data?: string }
      }
    }
  }
  return null
}

/**
 * Read T010 record (사주 타입 분석 - Type Profile)
 */
export function readLegacyT010Record(lookupKey: string): { readonly data?: string } | null {
  const tTables = getDataLoader().loadTTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = tTables.T010?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string }
}

/**
 * Read Y003 record (그이의 러브스타일 - Love Style)
 */
export function readLegacyY003Record(lookupKey: string): { readonly DB_data_m?: string; readonly DB_data_w?: string; readonly numerical?: number | string | null } | null {
  const yTables = getDataLoader().loadYTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = yTables.Y003?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly DB_data_m?: string; readonly DB_data_w?: string; readonly numerical?: number | string | null }
}

/**
 * Read Y004 record (섹스 토정비결 - Yearly Love Cycle)
 */
export function readLegacyY004Record(
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

/**
 * Read Y001 record (연애 취약점과 요령 - Love Weak Point)
 */
export function readLegacyY001Record(
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

/**
 * Read G003 record (궁합 기본 성향 - Basic Compatibility)
 */
export function readLegacyG003Record(lookupKey: string): { readonly data?: string; readonly numerical?: number | string | null } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = gTables.G003?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string; readonly numerical?: number | string | null }
}

/**
 * Read G012 record (세부 궁합 분석 - Detailed Compatibility)
 */
export function readLegacyG012Record(lookupKey: string): { readonly data?: string; readonly numerical?: number | string | null } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = gTables.G012?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string; readonly numerical?: number | string | null }
}

/**
 * Read G019 record (별자리 궁합 - Zodiac Compatibility)
 */
export function readLegacyG019Record(lookupKey: string): { readonly data?: string } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = gTables.G019?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string }
}

/**
 * Read G026 record (띠 궁합 - Animal Compatibility)
 * PROVENANCE: No PHP source file found. Key formula (primaryIndex-1)*12+partnerIndex
 * is reverse-engineered from the 12×12 animal compatibility data structure (144 records).
 */
export function readLegacyG026Record(lookupKey: string): { readonly data?: string; readonly numerical?: number | string | null } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = gTables.G026?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string; readonly numerical?: number | string | null }
}

/**
 * Read G028 record (사상체질 궁합 - Sasang Constitution Compatibility)
 */
export function readLegacyG028Record(lookupKey: string): { readonly data?: string } | null {
  const gTables = getDataLoader().loadGTables() as Record<string, Record<string, Record<string, unknown>>>
  const record = gTables.G028?.[lookupKey]
  if (!record || typeof record !== "object") {
    return null
  }
  return record as { readonly data?: string }
}
