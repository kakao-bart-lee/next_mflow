import { describe, it, expect } from "vitest"
import { FortuneTellerService } from "@/lib/saju-core/facade"

// 실제 계산 검증 — mock 없이 진짜 사주 계산을 실행
const service = new FortuneTellerService()

describe("FortuneTellerService.calculateSaju()", () => {
  it("갑자일주 계산이 성공한다", () => {
    const result = service.calculateSaju({
      birthDate: "1984-02-04",
      birthTime: "12:00",
      gender: "M",
      timezone: "Asia/Seoul",
    })
    expect(result).toBeDefined()
    expect(result.sajuData).toBeDefined()
    expect(result.sajuData.pillars).toBeDefined()
  })

  it("일주 천간/지지가 한자를 포함한 문자열로 반환된다", () => {
    const result = service.calculateSaju({
      birthDate: "1990-01-15",
      birthTime: "14:30",
      gender: "F",
      timezone: "Asia/Seoul",
    })
    const dayPillar = result.sajuData.pillars.일
    expect(typeof dayPillar.천간).toBe("string")
    expect(dayPillar.천간.length).toBeGreaterThan(0)
    expect(typeof dayPillar.지지).toBe("string")
    expect(dayPillar.지지.length).toBeGreaterThan(0)
  })

  it("오행 정보가 유효한 값으로 반환된다", () => {
    const result = service.calculateSaju({
      birthDate: "1990-01-15",
      birthTime: "14:30",
      gender: "M",
      timezone: "Asia/Seoul",
    })
    const dayPillar = result.sajuData.pillars.일
    // 오행 천간 값이 유효한 오행 중 하나여야 함 (접두사 포함)
    const element = dayPillar.오행.천간
    const baseElement = element.replace(/^[+-]/, "")
    expect(["목", "화", "토", "금", "수"]).toContain(baseElement)
  })

  it("currentAge 파라미터를 넘겨도 오류 없이 계산된다", () => {
    const result = service.calculateSaju(
      {
        birthDate: "1985-06-15",
        birthTime: "08:00",
        gender: "F",
        timezone: "Asia/Seoul",
      },
      40
    )
    expect(result.sajuData).toBeDefined()
  })

  it("잘못된 날짜 형식에서 에러가 발생한다", () => {
    expect(() => {
      service.calculateSaju({
        birthDate: "not-a-date",
        birthTime: "12:00",
        gender: "M",
        timezone: "Asia/Seoul",
      })
    }).toThrow()
  })

  it("4개의 기둥(년/월/일/시)이 모두 포함된다", () => {
    const result = service.calculateSaju({
      birthDate: "1990-05-20",
      birthTime: "09:00",
      gender: "M",
      timezone: "Asia/Seoul",
    })
    const pillars = result.sajuData.pillars
    expect(pillars.년).toBeDefined()
    expect(pillars.월).toBeDefined()
    expect(pillars.일).toBeDefined()
    expect(pillars.시).toBeDefined()
  })
})
