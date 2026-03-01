import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))
vi.mock("@/lib/auth", () => ({ auth: mockAuth }))

const { mockAnalyzeAstrologyStatic } = vi.hoisted(() => ({
  mockAnalyzeAstrologyStatic: vi.fn(),
}))
vi.mock("@/lib/use-cases/analyze-astrology-static", () => ({
  analyzeAstrologyStatic: mockAnalyzeAstrologyStatic,
}))

const { mockAnalysisCreate } = vi.hoisted(() => ({
  mockAnalysisCreate: vi.fn(),
}))
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    analysis: {
      create: mockAnalysisCreate,
    },
  },
}))

import { POST } from "@/app/api/astrology/static/route"

const VALID_BODY = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M",
  latitude: 37.56,
  longitude: 126.97,
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/astrology/static", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/astrology/static", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(null)
    mockAnalyzeAstrologyStatic.mockResolvedValue({
      success: true,
      data: {
        version: "static-v1",
        ranking: ["SUN"],
      },
    })
    mockAnalysisCreate.mockResolvedValue({})
  })

  it("정상 요청 시 200과 결과 반환", async () => {
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.version).toBe("static-v1")
  })

  it("JSON 파싱 실패 시 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/astrology/static", {
      method: "POST",
      body: "bad",
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("스키마 에러 시 422", async () => {
    const res = await POST(makeRequest({ birthDate: "bad-date" }))
    expect(res.status).toBe(422)
  })

  it("로그인 사용자면 분석 결과 저장", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    await POST(makeRequest(VALID_BODY))
    expect(mockAnalysisCreate).toHaveBeenCalled()
  })

  it("use-case 실패 시 에러 코드/상태 전달", async () => {
    mockAnalyzeAstrologyStatic.mockResolvedValue({
      success: false,
      error: "invalid input",
      code: "HORIZONS_INVALID_REQUEST",
      status: 400,
    })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.code).toBe("HORIZONS_INVALID_REQUEST")
  })
})
