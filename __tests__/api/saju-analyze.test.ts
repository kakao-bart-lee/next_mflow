import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))
vi.mock("@/lib/auth", () => ({ auth: mockAuth }))

const { mockAnalyzeSaju } = vi.hoisted(() => ({ mockAnalyzeSaju: vi.fn() }))
vi.mock("@/lib/use-cases/analyze-saju", () => ({ analyzeSaju: mockAnalyzeSaju }))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    analysis: { create: vi.fn().mockResolvedValue({}) },
  },
}))

import { POST } from "@/app/api/saju/analyze/route"

const VALID_BODY = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M",
}

const SAMPLE_DATA = {
  sajuData: { pillars: { 일: { 천간: "갑(甲)", 지지: "자(子)", 오행: { 천간: "목" } } } },
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/saju/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/saju/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(null)
    mockAnalyzeSaju.mockResolvedValue({ success: true, data: SAMPLE_DATA })
  })

  it("정상 요청에 200과 사주 데이터 반환", async () => {
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual(SAMPLE_DATA)
  })

  it("JSON 파싱 실패 시 400 반환", async () => {
    const req = new NextRequest("http://localhost:3000/api/saju/analyze", {
      method: "POST",
      body: "invalid-json",
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("스키마 검증 실패 시 422 반환", async () => {
    const res = await POST(makeRequest({ birthDate: "bad-date", gender: "X" }))
    expect(res.status).toBe(422)
  })

  it("analyzeSaju 실패 시 해당 status 반환", async () => {
    mockAnalyzeSaju.mockResolvedValue({
      success: false,
      error: "크레딧이 부족합니다",
      code: "INSUFFICIENT_CREDITS",
      status: 402,
    })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(402)
    const json = await res.json()
    expect(json.code).toBe("INSUFFICIENT_CREDITS")
  })

  it("로그인 사용자 ID가 analyzeSaju에 전달된다", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } })
    await POST(makeRequest(VALID_BODY))
    expect(mockAnalyzeSaju).toHaveBeenCalledWith(
      expect.objectContaining({ birthDate: "1990-01-15" }),
      "user-123"
    )
  })
})
