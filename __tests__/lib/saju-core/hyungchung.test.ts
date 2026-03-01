import { describe, expect, it } from "vitest"
import { calculateHyungchung } from "@/lib/saju-core/saju/hyungchung"

describe("calculateHyungchung", () => {
  it("기본 호출 시 결과 객체를 반환한다", () => {
    const result = calculateHyungchung("癸", "辛", "壬", "丁", "酉", "酉", "戌", "未")

    expect(result).toBeDefined()
    expect(typeof result).toBe("object")
  })

  it("결과 구조에 기대 key들이 포함된다", () => {
    const result = calculateHyungchung("癸", "辛", "壬", "丁", "酉", "酉", "戌", "未")

    expect(result.jahyung).toContain("자형살(酉酉)")
    expect(result.pasal).toContain("육파(未戌)")
    expect(result.haesal).toContain("육해(酉戌)")
  })

  it("서로 다른 입력들에 대해 유효한 결과를 반환한다", () => {
    const resultA = calculateHyungchung("甲", "乙", "丙", "丁", "子", "丑", "寅", "卯")
    const resultB = calculateHyungchung("庚", "辛", "壬", "癸", "申", "酉", "戌", "亥")

    expect(resultA).toBeDefined()
    expect(resultB).toBeDefined()
    expect(resultA).not.toEqual(resultB)
  })

  it("대표 충 패턴(자-오, 인-신, 묘-유)을 감지한다", () => {
    const jaO = calculateHyungchung("甲", "乙", "丙", "丁", "子", "辰", "午", "亥")
    const inSin = calculateHyungchung("甲", "乙", "丙", "丁", "寅", "辰", "申", "亥")
    const myoYu = calculateHyungchung("甲", "乙", "丙", "丁", "卯", "辰", "酉", "亥")

    expect(jaO.chungsal).toContain("육충(子午)")
    expect(inSin.chungsal).toContain("육충(寅申)")
    expect(myoYu.chungsal).toContain("육충(卯酉)")
  })

  it("대표 합 패턴(삼합, 천간합)을 감지한다", () => {
    const samhap = calculateHyungchung("甲", "乙", "丙", "丁", "亥", "卯", "未", "子")
    const ganhap = calculateHyungchung("甲", "己", "丙", "丁", "子", "丑", "寅", "卯")

    expect(samhap.samhap).toBe("삼합(亥卯未)")
    expect(ganhap.ganhap).toContain("갑기합(甲己)")
  })

  it("알 수 없는 표기(한글) 입력 시에도 기본 객체를 반환한다", () => {
    const result = calculateHyungchung("계", "신", "임", "정", "유", "유", "술", "미")
    expect(result).toEqual({})
  })
})
