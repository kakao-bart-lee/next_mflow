import { describe, expect, it } from "vitest"
import { createJijangganCalculator } from "@/lib/saju-core/saju/jijanggan"

describe("JijangganCalculator", () => {
  const calculator = createJijangganCalculator()

  it("지지 display(한글)로 지장간 1~3개를 반환한다", () => {
    expect(calculator.getJijangganFromBranch("자")).toEqual(["계", "", ""])
    expect(calculator.getJijangganFromBranch("축")).toEqual(["기", "계", "신"])
    expect(calculator.getJijangganFromBranch("해")).toEqual(["임", "갑", ""])
  })

  it("알 수 없는 지지는 빈 기본값을 반환한다", () => {
    expect(calculator.getJijangganFromBranch("없는지지")).toEqual(["", "", ""])
  })

  it("사기둥 지장간/십신을 년월일시 구조로 계산한다", () => {
    const result = calculator.calculatePillarJijanggan("임", "유", "유", "술", "미")

    expect(result.year).toEqual({
      stem1: "신",
      stem1_sipsin: "정인",
      stem2: "",
      stem2_sipsin: "",
      stem3: "",
      stem3_sipsin: "",
    })

    expect(result.month).toEqual({
      stem1: "신",
      stem1_sipsin: "정인",
      stem2: "",
      stem2_sipsin: "",
      stem3: "",
      stem3_sipsin: "",
    })

    expect(result.day).toEqual({
      stem1: "무",
      stem1_sipsin: "편관",
      stem2: "신",
      stem2_sipsin: "정인",
      stem3: "정",
      stem3_sipsin: "정재",
    })

    expect(result.hour).toEqual({
      stem1: "기",
      stem1_sipsin: "정관",
      stem2: "정",
      stem2_sipsin: "정재",
      stem3: "을",
      stem3_sipsin: "상관",
    })
  })

  it("일간과 대상 천간(한글)으로 십신 관계를 반환한다", () => {
    expect(calculator.getSipsin("임", "갑")).toBe("식신")
    expect(calculator.getSipsin("임", "신")).toBe("정인")
  })

  it("일간/대상 천간이 한자여도 십신 관계를 반환한다", () => {
    expect(calculator.getSipsin("壬", "甲")).toBe("식신")
    expect(calculator.getSipsin("壬", "辛")).toBe("정인")
  })

  it("알 수 없는 입력은 기본값(빈 문자열)을 반환한다", () => {
    expect(calculator.getSipsin("임", "없는천간")).toBe("")
    expect(calculator.getSipsin("없는일간", "갑")).toBe("")
  })
})
