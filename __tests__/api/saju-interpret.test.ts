import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const { mockAuth, mockCalculateSaju, mockInterpretSaju } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCalculateSaju: vi.fn(),
  mockInterpretSaju: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}))

vi.mock("@/lib/saju-core/facade", () => {
  class FortuneTellerService {
    calculateSaju = mockCalculateSaju
  }

  return { FortuneTellerService }
})

vi.mock("@/lib/use-cases/interpret-saju", () => ({
  interpretSaju: mockInterpretSaju,
}))

vi.mock("@/lib/services/fortune-cache", () => ({
  getCachedFortune: vi.fn().mockResolvedValue(null),
  cacheFortune: vi.fn().mockResolvedValue(undefined),
  buildContextHash: vi.fn().mockReturnValue("mock-hash"),
}))

import { POST } from "@/app/api/saju/interpret/route"

const MOCK_FORTUNE_RESPONSE = {
  sajuData: {
    basicInfo: {
      name: "",
      solarDate: "1993-10-08",
      lunarDate: "1993-08-23",
      birthTime: "14:37",
    },
    pillars: {
      년: { 천간: "계(癸)", 지지: "유(酉)", 오행: { 천간: "-수", 지지: "-금" }, 십이운성: "사", 신살: [], 지장간: [] },
      월: { 천간: "신(辛)", 지지: "유(酉)", 오행: { 천간: "-금", 지지: "-금" }, 십이운성: "사", 신살: [], 지장간: [] },
      일: { 천간: "임(壬)", 지지: "술(戌)", 오행: { 천간: "+수", 지지: "+토" }, 십이운성: "관대", 신살: [], 지장간: [] },
      시: { 천간: "정(丁)", 지지: "미(未)", 오행: { 천간: "-화", 지지: "-토" }, 십이운성: "양", 신살: [], 지장간: [] },
    },
  },
}

const VALID_BIRTH_INFO = {
  birthDate: "1993-10-08",
  birthTime: "14:37",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M",
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/saju/interpret", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/saju/interpret", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: "test-user" } })
    mockCalculateSaju.mockReturnValue(MOCK_FORTUNE_RESPONSE)
  })

  it("POST with valid daily request returns 200 with daily data", async () => {
    const dailyData = {
      summary: "좋은 흐름",
      tags: ["집중", "실행"],
      body: "오늘은 침착하게 진행하시면 성과가 좋습니다.",
      actions: [{ id: "1", text: "중요 업무 먼저 처리" }],
      avoid: "무리한 야근은 피하세요",
    }
    mockInterpretSaju.mockResolvedValue({ success: true, data: dailyData })

    const response = await POST(
      makeRequest({
        type: "daily",
        birthInfo: VALID_BIRTH_INFO,
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ type: "daily", data: dailyData, cacheStatus: "miss" })
  })

  it("POST with valid weekly request returns 200 with weekly data", async () => {
    const weeklyData = {
      theme: "균형과 회복의 주",
      days: [
        { day: "월", date: "3/2", keyword: "정리", note: "우선순위를 세우세요", highlight: false },
        { day: "화", date: "3/3", keyword: "집중", note: "핵심 업무에 몰입", highlight: true },
        { day: "수", date: "3/4", keyword: "소통", note: "협업에 유리", highlight: false },
        { day: "목", date: "3/5", keyword: "점검", note: "중간 점검의 날", highlight: false },
        { day: "금", date: "3/6", keyword: "확장", note: "새 제안 시도", highlight: true },
        { day: "토", date: "3/7", keyword: "휴식", note: "충전이 필요", highlight: false },
        { day: "일", date: "3/8", keyword: "준비", note: "다음 주 계획", highlight: false },
      ],
      aiRecap: {
        summary: "중요한 변곡점이 있는 주간입니다",
        keywords: ["집중", "협업", "회복"],
        emotionPattern: "주중 상승 후 주말 안정",
        suggestion: "핵심 1가지만 끝까지 밀어보세요",
      },
      prompt: "이번 주 가장 큰 결정을 무엇으로 정하시겠어요?",
    }
    mockInterpretSaju.mockResolvedValue({ success: true, data: weeklyData })

    const response = await POST(
      makeRequest({
        type: "weekly",
        birthInfo: VALID_BIRTH_INFO,
        weekStartDate: "2026-03-02",
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ type: "weekly", data: weeklyData, cacheStatus: "miss" })
  })

  it("POST with invalid birthInfo returns 422", async () => {
    const response = await POST(
      makeRequest({
        type: "daily",
        birthInfo: {
          ...VALID_BIRTH_INFO,
          birthDate: "1993/10/08",
        },
      })
    )

    expect(response.status).toBe(422)
    const json = await response.json()
    expect(json.error).toBe("입력 정보가 올바르지 않습니다")
    expect(mockInterpretSaju).not.toHaveBeenCalled()
  })

  it("POST with malformed body returns 400", async () => {
    const request = new NextRequest("http://localhost:3000/api/saju/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid-json",
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "잘못된 요청 형식입니다" })
  })

  it("Returns error when interpretSaju fails", async () => {
    mockInterpretSaju.mockResolvedValue({
      success: false,
      error: "운세 생성 중 오류가 발생했습니다",
      code: "LLM_ERROR",
      status: 500,
    })

    const response = await POST(
      makeRequest({
        type: "daily",
        birthInfo: VALID_BIRTH_INFO,
      })
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: "운세 생성 중 오류가 발생했습니다",
      code: "LLM_ERROR",
    })
  })

  it("POST returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null)

    const response = await POST(
      makeRequest({
        type: "daily",
        birthInfo: VALID_BIRTH_INFO,
      })
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "로그인이 필요합니다" })
  })

  it("POST returns 422 when weekly request missing weekStartDate", async () => {
    const response = await POST(
      makeRequest({
        type: "weekly",
        birthInfo: VALID_BIRTH_INFO,
        // weekStartDate intentionally omitted
      })
    )

    expect(response.status).toBe(422)
    const json = await response.json()
    expect(json.error).toBe("입력 정보가 올바르지 않습니다")
    expect(mockInterpretSaju).not.toHaveBeenCalled()
  })
})
