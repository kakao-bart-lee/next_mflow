import { describe, expect, it } from "vitest"
import { ProgressDirection, SipsinCalculator } from "@/lib/saju-core/saju/sipsin"

describe("SipsinCalculator", () => {
  const calculator = new SipsinCalculator()

  it("getSipsin은 일간과 타천간 관계를 정확히 반환한다", () => {
    expect(calculator.getSipsin("甲", "甲")).toBe("비견")
    expect(calculator.getSipsin("甲", "乙")).toBe("겁재")
    expect(calculator.getSipsin("壬", "丁")).toBe("정재")
    expect(calculator.getSipsin("X", "甲")).toBeNull()
  })

  it("analyzeSipsin은 사주 8자 전체 십신 분석을 반환한다", () => {
    const result = calculator.analyzeSipsin("壬", "癸", "辛", "丁", "酉", "酉", "戌", "未")

    expect(result.positions.year_h).toBe("겁재")
    expect(result.positions.month_h).toBe("정인")
    expect(result.positions.hour_h).toBe("정재")
    expect(result.positions.year_e).toBe("정인")
    expect(result.positions.month_e).toBe("정인")
    expect(result.positions.day_e).toBe("편관")
    expect(result.positions.hour_e).toBe("정관")

    expect(result.counts["정인"]).toBe(3)
    expect(result.dominant_sipsin).toBe("정인")
  })

  it("determineDirection은 년간 음양과 성별로 순/역을 결정한다", () => {
    expect(calculator.determineDirection("갑", "남")).toBe(ProgressDirection.FORWARD)
    expect(calculator.determineDirection("갑", "여")).toBe(ProgressDirection.BACKWARD)
    expect(calculator.determineDirection("을", "남")).toBe(ProgressDirection.BACKWARD)
    expect(calculator.determineDirection("을", "여")).toBe(ProgressDirection.FORWARD)
  })

  it("calculateGreatFortune는 방향/현재대운/10개 대운 목록을 계산한다", () => {
    const result = calculator.calculateGreatFortune("계", "신", "유", "임", 35, "남")

    expect(result.direction).toBe(ProgressDirection.BACKWARD)
    expect(result.periods).toHaveLength(10)
    expect(result.current_period).not.toBeNull()
    expect(result.current_period?.start_age).toBe(31)
    expect(result.current_period?.end_age).toBe(40)

    for (const period of result.periods) {
      expect(period.start_age).toBeGreaterThan(0)
      expect(period.end_age).toBeGreaterThanOrEqual(period.start_age)
      expect(period.heavenly_stem.length).toBeGreaterThan(0)
      expect(period.earthly_branch.length).toBeGreaterThan(0)
      expect(period.sipsin.length).toBeGreaterThan(0)
      expect(period.period_number).toBeGreaterThanOrEqual(1)
      expect(period.period_number).toBeLessThanOrEqual(10)
    }
  })
})
