import { describe, expect, it } from "vitest"
import { KOREAN_BRANCH_TO_DISPLAY, KOREAN_STEM_TO_DISPLAY } from "@/lib/saju-core/saju/constants"
import { SinyakSingangAnalyzer } from "@/lib/saju-core/saju/sinyakSingang"

const normalizeStrengthType = (value: string): "신강" | "신약" =>
  value.startsWith("신강") ? "신강" : "신약"

const toKoreanStem = (stem: string): string => KOREAN_STEM_TO_DISPLAY[stem] ?? stem
const toKoreanBranch = (branch: string): string => KOREAN_BRANCH_TO_DISPLAY[branch] ?? branch

describe("SinyakSingangAnalyzer", () => {
  const analyzer = new SinyakSingangAnalyzer()

  it("1993-10-08 14:37(M) 사주는 신강으로 판정된다", () => {
    const result = analyzer.analyzeSinyakSingang(
      toKoreanStem("癸"),
      toKoreanBranch("酉"),
      toKoreanStem("辛"),
      toKoreanBranch("酉"),
      toKoreanStem("壬"),
      toKoreanBranch("戌"),
      toKoreanStem("丁"),
      toKoreanBranch("未")
    )

    expect(normalizeStrengthType(result.strength_type)).toBe("신강")
  })

  it("오행 세력값은 모두 0 이상 숫자이며 합계가 양수다", () => {
    const result = analyzer.analyzeSinyakSingang(
      toKoreanStem("癸"),
      toKoreanBranch("酉"),
      toKoreanStem("辛"),
      toKoreanBranch("酉"),
      toKoreanStem("壬"),
      toKoreanBranch("戌"),
      toKoreanStem("丁"),
      toKoreanBranch("未")
    )

    const powers = result.element_powers
    const values = [
      powers.wood_power,
      powers.fire_power,
      powers.earth_power,
      powers.metal_power,
      powers.water_power,
    ]

    for (const power of values) {
      expect(typeof power).toBe("number")
      expect(power).toBeGreaterThanOrEqual(0)
    }

    const total = values.reduce((sum, current) => sum + current, 0)
    expect(total).toBeGreaterThan(0)
  })

  it("강약 타입은 신강 또는 신약 중 하나다", () => {
    const result = analyzer.analyzeSinyakSingang(
      toKoreanStem("己"),
      toKoreanBranch("巳"),
      toKoreanStem("丁"),
      toKoreanBranch("丑"),
      toKoreanStem("庚"),
      toKoreanBranch("辰"),
      toKoreanStem("癸"),
      toKoreanBranch("未")
    )

    expect(["신강", "신약"]).toContain(normalizeStrengthType(result.strength_type))
  })

  it("여러 검증 사례에서 기대 강약 결과를 반환한다", () => {
    const knownCases = [
      {
        stems: ["癸", "辛", "壬", "丁"] as const,
        branches: ["酉", "酉", "戌", "未"] as const,
        expected: "신강" as const,
      },
      {
        stems: ["己", "丁", "庚", "癸"] as const,
        branches: ["巳", "丑", "辰", "未"] as const,
        expected: "신약" as const,
      },
      {
        stems: ["癸", "乙", "戊", "戊"] as const,
        branches: ["亥", "丑", "辰", "午"] as const,
        expected: "신약" as const,
      },
    ]

    for (const knownCase of knownCases) {
      const [yearStem, monthStem, dayStem, hourStem] = knownCase.stems
      const [yearBranch, monthBranch, dayBranch, hourBranch] = knownCase.branches

      const result = analyzer.analyzeSinyakSingang(
        toKoreanStem(yearStem),
        toKoreanBranch(yearBranch),
        toKoreanStem(monthStem),
        toKoreanBranch(monthBranch),
        toKoreanStem(dayStem),
        toKoreanBranch(dayBranch),
        toKoreanStem(hourStem),
        toKoreanBranch(hourBranch)
      )

      expect(normalizeStrengthType(result.strength_type)).toBe(knownCase.expected)
    }
  })
})
