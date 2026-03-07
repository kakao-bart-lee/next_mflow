// @vitest-environment node
import { describe, expect, it } from "vitest"
import { FortuneTellerService } from "@/lib/saju-core/facade"
import { CalculatorFactory } from "@/lib/saju-core/saju/calculatorFactory"
import { DatabaseResultRetriever } from "@/lib/saju-core/saju/fortuneInterpreter"
import { getDataLoader } from "@/lib/saju-core/saju/dataLoader"
import * as legacyCompatibility from "@/lib/saju-core/saju/legacyCompatibility"

const BASE_REQUEST = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  gender: "M" as const,
  timezone: "Asia/Seoul",
}

describe("S014 metadata exposure", () => {
  it("exposes findYong and secondary/tertiary role profiles", () => {
    const service = new FortuneTellerService()
    const saju = service.calculateSaju(BASE_REQUEST)
    const calculator = new CalculatorFactory(new DatabaseResultRetriever(getDataLoader().loadSTables())).createCalculator("S014")
    const calculationResult = calculator.calculate({
      yearStem: saju.sajuData.pillars.년.천간,
      yearBranch: saju.sajuData.pillars.년.지지,
      monthStem: saju.sajuData.pillars.월.천간,
      monthBranch: saju.sajuData.pillars.월.지지,
      dayStem: saju.sajuData.pillars.일.천간,
      dayBranch: saju.sajuData.pillars.일.지지,
      hourStem: saju.sajuData.pillars.시.천간,
      hourBranch: saju.sajuData.pillars.시.지지,
      gender: BASE_REQUEST.gender,
      additionalData: {
        birth_date: BASE_REQUEST.birthDate,
        birth_time: BASE_REQUEST.birthTime,
        timezone: BASE_REQUEST.timezone,
        jumno: saju.inputData["jumno"] ?? null,
      },
    })
    const metadata = calculationResult.metadata

    expect(metadata["findYong_source"]).toBe("auxiliary")
    expect(String(metadata["findYong_usefulCode"])).toMatch(/^\d+$/)
    expect(String(metadata["findYong_usefulElement"]).trim().length).toBeGreaterThan(0)

    const secondary = metadata["role_profile_secondary"] as Record<string, unknown>
    const tertiary = metadata["role_profile_tertiary"] as Record<string, unknown>
    const snapshotKeys = ["usefulElement", "favorableElement", "harmfulElement", "adverseElement", "reserveElement"] as const

    expect(secondary).toBeTruthy()
    expect(tertiary).toBeTruthy()
    for (const key of snapshotKeys) {
      expect(typeof secondary[key]).toBe("string")
      expect(String(secondary[key]).trim().length).toBeGreaterThan(0)
      expect(typeof tertiary[key]).toBe("string")
      expect(String(tertiary[key]).trim().length).toBeGreaterThan(0)
    }
  })
})

describe("legacyCompatibility barrel export smoke", () => {
  it("exports all 21 buildLegacy* builders across spouse, timing, zodiac, and basic families", () => {
    // Spouse/Intimacy Family (7 builders)
    expect(typeof legacyCompatibility.buildLegacyIntimacyInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyLoveStyleInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyBedroomInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacySpouseCoreInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyDestinyCoreInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyPartnerPersonalityInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyPartnerRoleInsight).toBe("function")

    // Timing Family (6 builders)
    expect(typeof legacyCompatibility.buildLegacyMarriageFlowInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyMarriageTimingTableInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyFutureSpouseInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyRelationshipTimingInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyYearlyLoveCycleInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyLoveWeakPointInsight).toBe("function")

    // Zodiac Family (3 builders)
    expect(typeof legacyCompatibility.buildLegacyZodiacCompatibilityInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyAnimalCompatibilityInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacySasangCompatibilityInsight).toBe("function")

    // Basic/Detail/Type/Outer/Traditional Family (5 builders)
    expect(typeof legacyCompatibility.buildLegacyTypeProfileInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyOuterCompatibilityInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyTraditionalCompatibilityInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyBasicCompatibilityInsight).toBe("function")
    expect(typeof legacyCompatibility.buildLegacyDetailedCompatibilityInsight).toBe("function")
  })
})
