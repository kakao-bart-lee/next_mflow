import { describe, it, expect } from "vitest"
import { FortuneTellerService } from "@/lib/saju-core/facade"
import {
  buildLegacyBasicCompatibilityInsight,
  buildLegacyDetailedCompatibilityInsight,
  buildLegacyZodiacCompatibilityInsight,
  buildLegacyAnimalCompatibilityInsight,
  buildLegacySasangCompatibilityInsight,
  type SasangConstitution,
} from "@/lib/saju-core/saju/legacyCompatibility"

const service = new FortuneTellerService()

const primaryInfo = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  gender: "M" as const,
  timezone: "Asia/Seoul",
}
const partnerInfo = {
  birthDate: "1992-08-03",
  birthTime: "09:10",
  gender: "F" as const,
  timezone: "Asia/Seoul",
}

const fortuneA = service.calculateSaju(primaryInfo)
const fortuneB = service.calculateSaju(partnerInfo)

// ──────────────────────────────────────────────
// G003: buildLegacyBasicCompatibilityInsight
// ──────────────────────────────────────────────
describe("G003 buildLegacyBasicCompatibilityInsight", () => {
  const result = buildLegacyBasicCompatibilityInsight(primaryInfo, fortuneA)

  it("returns non-null result", () => {
    expect(result).not.toBeNull()
  })

  it("sourceTable is G003", () => {
    expect(result?.sourceTable).toBe("G003")
  })

  it("text is non-empty", () => {
    expect(result?.text.trim().length).toBeGreaterThan(0)
  })

  it("lookupKey is a two-digit string", () => {
    expect(result?.lookupKey).toMatch(/^\d{2}$/)
  })
})

// ──────────────────────────────────────────────
// G012: buildLegacyDetailedCompatibilityInsight
// ──────────────────────────────────────────────
describe("G012 buildLegacyDetailedCompatibilityInsight", () => {
  const result = buildLegacyDetailedCompatibilityInsight(fortuneA)

  it("returns non-null result", () => {
    expect(result).not.toBeNull()
  })

  it("sourceTable is G012", () => {
    expect(result?.sourceTable).toBe("G012")
  })

  it("lookupKey starts with '5'", () => {
    expect(result?.lookupKey).toMatch(/^5/)
  })

  it("text is non-empty", () => {
    expect(result?.text.trim().length).toBeGreaterThan(0)
  })
})

// ──────────────────────────────────────────────
// G019: buildLegacyZodiacCompatibilityInsight
// ──────────────────────────────────────────────
describe("G019 buildLegacyZodiacCompatibilityInsight", () => {
  const VALID_ZODIACS = [
    "양자리",
    "황소자리",
    "쌍둥이자리",
    "게자리",
    "사자자리",
    "처녀자리",
    "천칭자리",
    "전갈자리",
    "사수자리",
    "염소자리",
    "물병자리",
    "물고기자리",
  ]

  const result = buildLegacyZodiacCompatibilityInsight(primaryInfo)

  it("returns non-null result", () => {
    expect(result).not.toBeNull()
  })

  it("sourceTable is G019", () => {
    expect(result?.sourceTable).toBe("G019")
  })

  it("lookupKey is a valid zodiac name", () => {
    expect(VALID_ZODIACS).toContain(result?.lookupKey)
  })

  it("text is non-empty", () => {
    expect(result?.text.trim().length).toBeGreaterThan(0)
  })
})

// ──────────────────────────────────────────────
// G026: buildLegacyAnimalCompatibilityInsight
// ──────────────────────────────────────────────
describe("G026 buildLegacyAnimalCompatibilityInsight", () => {
  const result = buildLegacyAnimalCompatibilityInsight(fortuneA, fortuneB)

  it("returns non-null for different animals", () => {
    expect(result).not.toBeNull()
  })

  it("sourceTable is G026", () => {
    expect(result?.sourceTable).toBe("G026")
  })

  it("lookupKey is a numeric string", () => {
    expect(result?.lookupKey).toMatch(/^\d+$/)
  })

  it("text is non-empty", () => {
    expect(result?.text.trim().length).toBeGreaterThan(0)
  })

  it("same animal (same year) returns non-null", () => {
    const sameFortune = service.calculateSaju({
      birthDate: "1990-07-15",
      birthTime: "12:00",
      gender: "M",
      timezone: "Asia/Seoul",
    })
    const sameResult = buildLegacyAnimalCompatibilityInsight(fortuneA, sameFortune)
    expect(sameResult).not.toBeNull()
    expect(sameResult?.sourceTable).toBe("G026")
  })
})

// ──────────────────────────────────────────────
// G028: buildLegacySasangCompatibilityInsight
// ──────────────────────────────────────────────
describe("G028 buildLegacySasangCompatibilityInsight", () => {
  it("all 10 symmetric pairs return non-null", () => {
    const pairs: readonly [SasangConstitution, SasangConstitution][] = [
      ["ty", "ty"],
      ["ty", "sy"],
      ["ty", "tu"],
      ["ty", "su"],
      ["sy", "sy"],
      ["sy", "tu"],
      ["sy", "su"],
      ["tu", "tu"],
      ["tu", "su"],
      ["su", "su"],
    ]
    for (const [a, b] of pairs) {
      const result = buildLegacySasangCompatibilityInsight(a, b)
      expect(result).not.toBeNull()
      expect(result?.sourceTable).toBe("G028")
      expect(result?.text.trim().length).toBeGreaterThan(0)
    }
  })

  it("pair normalization is symmetric", () => {
    const r1 = buildLegacySasangCompatibilityInsight("su", "ty")
    const r2 = buildLegacySasangCompatibilityInsight("ty", "su")
    expect(r1?.lookupKey).toBe(r2?.lookupKey)
    expect(r1?.text).toBe(r2?.text)
  })

  it("all reverse-order pairs match their normalized counterpart", () => {
    const types: SasangConstitution[] = ["ty", "sy", "tu", "su"]
    for (const a of types) {
      for (const b of types) {
        const forward = buildLegacySasangCompatibilityInsight(a, b)
        const reverse = buildLegacySasangCompatibilityInsight(b, a)
        expect(forward?.lookupKey).toBe(reverse?.lookupKey)
      }
    }
  })

  it("returns null when input is missing", () => {
    expect(buildLegacySasangCompatibilityInsight(null, "ty")).toBeNull()
    expect(buildLegacySasangCompatibilityInsight("ty", null)).toBeNull()
    expect(buildLegacySasangCompatibilityInsight(null, null)).toBeNull()
    expect(buildLegacySasangCompatibilityInsight(undefined, "su")).toBeNull()
    expect(buildLegacySasangCompatibilityInsight("su", undefined)).toBeNull()
  })
})
