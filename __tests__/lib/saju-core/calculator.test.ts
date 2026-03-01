import { describe, expect, it } from "vitest"
import { FourPillarsCalculator } from "@/lib/saju-core/saju/calculator"

describe("FourPillarsCalculator", () => {
  const calculator = new FourPillarsCalculator()

  it("유효한 입력에서 년주/월주/일주/시주를 모두 반환한다", () => {
    const result = calculator.calculateFourPillars("1993-10-08", "14:37", "M")

    expect(result.four_pillars.년주).toBeDefined()
    expect(result.four_pillars.월주).toBeDefined()
    expect(result.four_pillars.일주).toBeDefined()
    expect(result.four_pillars.시주).toBeDefined()
  })

  it("각 기둥의 천간/지지가 한글(한자) 형식으로 반환된다", () => {
    const result = calculator.calculateFourPillars("1993-10-08", "14:37", "M")
    const pillars = Object.values(result.four_pillars)
    const displayPattern = /^[가-힣]+\([\u4E00-\u9FFF]+\)$/

    for (const pillar of pillars) {
      expect(pillar.천간).toMatch(displayPattern)
      expect(pillar.지지).toMatch(displayPattern)
    }
  })

  it("서로 다른 날짜는 서로 다른 사주 기둥을 만든다", () => {
    const first = calculator.calculateFourPillars("1993-10-08", "14:37", "M")
    const second = calculator.calculateFourPillars("1990-01-15", "14:30", "M")

    expect(first.four_pillars).not.toEqual(second.four_pillars)
  })

  it("성별은 사주 기둥 계산값에 영향을 주지 않는다", () => {
    const male = calculator.calculateFourPillars("1993-10-08", "14:37", "M")
    const female = calculator.calculateFourPillars("1993-10-08", "14:37", "F")

    expect(male.four_pillars).toEqual(female.four_pillars)
  })

  it("윤년/연초/연말 엣지 케이스 날짜를 처리한다", () => {
    const edgeCases = [
      ["2000-02-29", "12:00"],
      ["2000-01-01", "00:30"],
      ["2000-12-31", "23:30"],
    ] as const

    for (const [birthDate, birthTime] of edgeCases) {
      const result = calculator.calculateFourPillars(birthDate, birthTime, "M")
      expect(result.four_pillars.년주).toBeDefined()
      expect(result.four_pillars.월주).toBeDefined()
      expect(result.four_pillars.일주).toBeDefined()
      expect(result.four_pillars.시주).toBeDefined()
    }
  })

  it("잘못된 날짜 형식이면 에러를 던진다", () => {
    expect(() => {
      calculator.calculateFourPillars("not-a-date", "14:37", "M")
    }).toThrow()
  })

  it("검증된 날짜들의 년주 값이 기대값과 일치한다", () => {
    const knownCases = [
      {
        birthDate: "1993-10-08",
        birthTime: "14:37",
        gender: "M",
        expectedYearStem: "계(癸)",
        expectedYearBranch: "유(酉)",
      },
      {
        birthDate: "1990-01-15",
        birthTime: "14:30",
        gender: "F",
        expectedYearStem: "기(己)",
        expectedYearBranch: "사(巳)",
      },
      {
        birthDate: "1984-02-04",
        birthTime: "12:00",
        gender: "M",
        expectedYearStem: "계(癸)",
        expectedYearBranch: "해(亥)",
      },
    ] as const

    for (const knownCase of knownCases) {
      const result = calculator.calculateFourPillars(
        knownCase.birthDate,
        knownCase.birthTime,
        knownCase.gender
      )

      expect(result.four_pillars.년주.천간).toBe(knownCase.expectedYearStem)
      expect(result.four_pillars.년주.지지).toBe(knownCase.expectedYearBranch)
    }
  })
})
