import { describe, it, expect } from "vitest"
import { calculateStaticAstrology } from "@/lib/astrology/static/calculator"
import type { BirthInfo } from "@/lib/schemas/birth-info"

const BASE_INPUT: BirthInfo = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M",
  latitude: 37.5665,
  longitude: 126.978,
  locationName: "Seoul",
}

describe("calculateStaticAstrology", () => {
  it("입력값이 같으면 동일한 정적 결과를 반환", () => {
    const a = calculateStaticAstrology(BASE_INPUT)
    const b = calculateStaticAstrology(BASE_INPUT)
    expect(a.positions).toEqual(b.positions)
    expect(a.influences).toEqual(b.influences)
    expect(a.ranking).toEqual(b.ranking)
  })

  it("시간 미상일 때 assumptions와 house 미계산 처리", () => {
    const result = calculateStaticAstrology({
      ...BASE_INPUT,
      isTimeUnknown: true,
      birthTime: null,
    })

    expect(result.assumptions.assumedTimeLocal).toBe("12:00")
    expect(result.assumptions.housesComputed).toBe(false)
    for (const pos of Object.values(result.positions)) {
      expect(pos.house).toBeNull()
    }
  })

  it("행성 영향력 점수는 0..100 범위", () => {
    const result = calculateStaticAstrology(BASE_INPUT)
    for (const influence of Object.values(result.influences)) {
      expect(influence.naturalScore).toBeGreaterThanOrEqual(0)
      expect(influence.naturalScore).toBeLessThanOrEqual(100)
      expect(influence.positionalScore).toBeGreaterThanOrEqual(0)
      expect(influence.positionalScore).toBeLessThanOrEqual(100)
      expect(influence.finalScore).toBeGreaterThanOrEqual(0)
      expect(influence.finalScore).toBeLessThanOrEqual(100)
    }
  })
})
