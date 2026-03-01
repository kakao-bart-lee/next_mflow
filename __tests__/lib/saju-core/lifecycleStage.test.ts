import { describe, expect, it } from "vitest"
import { LifecycleStageCalculator } from "@/lib/saju-core/saju/lifecycleStage"

describe("LifecycleStageCalculator", () => {
  const calculator = new LifecycleStageCalculator()

  it("일간(한자)과 지지(한자)로 십이운성을 반환한다", () => {
    const stage = calculator.getLifecycleStage("壬", "戌")
    expect(stage).toBe("관대(冠帶)")
  })

  it("일간과 지지를 모두 계산해 year/month/day/hour 구조로 반환한다", () => {
    const result = calculator.calculateAllLifecycleStages("壬", "申", "酉", "戌", "亥")

    expect(result).toEqual({
      year: "장생(長生)",
      month: "목욕(沐浴)",
      day: "관대(冠帶)",
      hour: "건록(建祿)",
    })
  })

  it("유효한 천간(甲乙丙丁戊己庚辛壬癸)을 검증한다", () => {
    const validStems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
    for (const stem of validStems) {
      expect(calculator.validateHeavenlyStem(stem)).toBe(true)
    }
  })

  it("유효한 지지(子丑寅卯辰巳午未申酉戌亥)를 검증한다", () => {
    const validBranches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
    for (const branch of validBranches) {
      expect(calculator.validateEarthlyBranch(branch)).toBe(true)
    }
  })

  it("운성 설명을 조회한다", () => {
    const description = calculator.getLifecycleStageDescription("장생(長生)")
    expect(description).toContain("Birth/Longevity")
  })

  it("잘못된 입력에서 null/false를 반환한다", () => {
    expect(calculator.getLifecycleStage("가", "戌")).toBeNull()
    expect(calculator.getLifecycleStage("壬", "멍")).toBeNull()
    expect(calculator.getLifecycleStage("", "戌")).toBeNull()

    expect(calculator.validateHeavenlyStem("A")).toBe(false)
    expect(calculator.validateEarthlyBranch("A")).toBe(false)
    expect(calculator.getLifecycleStageDescription("없는운성")).toBeNull()
  })
})
