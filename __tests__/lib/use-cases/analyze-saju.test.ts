import { describe, it, expect, vi, beforeEach } from "vitest"
import type { BirthInfo } from "@/lib/schemas/birth-info"

// vi.hoisted() 안에서 생성자 mock과 메서드 mock을 함께 만들어야
// mock factory 호이스팅 시점에 참조 가능
const { mockGetSajuFortuneFromBirthInfo } = vi.hoisted(() => ({
  mockGetSajuFortuneFromBirthInfo: vi.fn(),
}))

vi.mock("@/lib/integrations/saju-core-adapter", () => ({
  getSajuFortuneFromBirthInfo: mockGetSajuFortuneFromBirthInfo,
}))

const { mockConsumeCredit, mockIsCreditEnabled } = vi.hoisted(() => ({
  mockConsumeCredit: vi.fn(),
  mockIsCreditEnabled: vi.fn(),
}))

vi.mock("@/lib/credit-service", () => ({
  consumeCredit: mockConsumeCredit,
  isCreditEnabled: mockIsCreditEnabled,
  CREDIT_COSTS: { SAJU_ANALYSIS: 2, CHAT_MESSAGE: 1, COMPATIBILITY: 3 },
}))

import { analyzeSaju } from "@/lib/use-cases/analyze-saju"

const SAMPLE_BIRTH_INFO: BirthInfo = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M",
}

const SAMPLE_SAJU_RESULT = {
  sajuData: { pillars: { 일: { 천간: "갑(甲)", 지지: "자(子)", 오행: { 천간: "목" } } } },
  dayFortune: {},
}

describe("analyzeSaju use-case", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCreditEnabled.mockReturnValue(false)
    mockGetSajuFortuneFromBirthInfo.mockReturnValue(SAMPLE_SAJU_RESULT)
  })

  it("계산 성공 시 success=true와 데이터 반환", async () => {
    const result = await analyzeSaju(SAMPLE_BIRTH_INFO)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe(SAMPLE_SAJU_RESULT)
    }
  })

  it("isTimeUnknown=true이면 birthTime을 12:00으로 대체한다", async () => {
    const birthInfo: BirthInfo = {
      ...SAMPLE_BIRTH_INFO,
      birthTime: null,
      isTimeUnknown: true,
    }
    await analyzeSaju(birthInfo)
    expect(mockGetSajuFortuneFromBirthInfo).toHaveBeenCalledWith(
      expect.objectContaining({ isTimeUnknown: true }),
      "basic",
      undefined
    )
  })

  it("계산 실패 시 CALCULATION_ERROR 반환", async () => {
    mockGetSajuFortuneFromBirthInfo.mockImplementation(() => {
      throw new Error("계산 오류")
    })

    const result = await analyzeSaju(SAMPLE_BIRTH_INFO)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe("CALCULATION_ERROR")
      expect(result.status).toBe(500)
    }
  })

  it("크레딧 활성화 + userId 있을 때 크레딧 차감", async () => {
    mockIsCreditEnabled.mockReturnValue(true)
    mockConsumeCredit.mockResolvedValue({ success: true, balance: 8 })

    const result = await analyzeSaju(SAMPLE_BIRTH_INFO, "user-1")
    expect(result.success).toBe(true)
    expect(mockConsumeCredit).toHaveBeenCalledWith("user-1", 2, "사주 분석")
  })

  it("크레딧 부족 시 INSUFFICIENT_CREDITS 반환", async () => {
    mockIsCreditEnabled.mockReturnValue(true)
    mockConsumeCredit.mockResolvedValue({ success: false, balance: 0 })

    const result = await analyzeSaju(SAMPLE_BIRTH_INFO, "user-1")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe("INSUFFICIENT_CREDITS")
      expect(result.status).toBe(402)
    }
  })

  it("userId 없으면 크레딧 차감 없이 성공", async () => {
    mockIsCreditEnabled.mockReturnValue(true)

    const result = await analyzeSaju(SAMPLE_BIRTH_INFO)
    expect(result.success).toBe(true)
    expect(mockConsumeCredit).not.toHaveBeenCalled()
  })

  it("크레딧 차감 실패(DB 오류)해도 결과는 성공", async () => {
    mockIsCreditEnabled.mockReturnValue(true)
    mockConsumeCredit.mockRejectedValue(new Error("DB 연결 실패"))

    const result = await analyzeSaju(SAMPLE_BIRTH_INFO, "user-1")
    expect(result.success).toBe(true)
  })
})
