import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))
vi.mock("@/lib/auth", () => ({ auth: mockAuth }))

const { mockAnalyzeZiweiBoard } = vi.hoisted(() => ({
  mockAnalyzeZiweiBoard: vi.fn(),
}))
vi.mock("@/lib/use-cases/analyze-ziwei", () => ({
  analyzeZiweiBoard: mockAnalyzeZiweiBoard,
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

import { POST } from "@/app/api/ziwei/board/route"

const VALID_BODY = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M",
  latitude: 37.5665,
  longitude: 126.978,
  calendar: "SOLAR",
  school: "DEFAULT",
  plugins: [],
  fixLeap: true,
  isLeapMonth: false,
  language: "ko-KR",
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/ziwei/board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/ziwei/board", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(null)
    mockAnalyzeZiweiBoard.mockReturnValue({
      success: true,
      data: {
        meta: { engine: "iztro", engine_version: "2.5.8", school: "DEFAULT", calendar: "SOLAR" },
        assumptions: [],
        input_tier: "L3",
        quality_flags: {
          houses_computed: true,
          time_is_assumed: false,
          location_is_assumed: false,
        },
        shichen_candidates: [],
        board: {
          solar_date: "1990-01-15",
          lunar_date: "1989-12-19",
          chinese_date: "庚午年",
          time: "未",
          time_range: "13:00-14:59",
          sign: "염소",
          zodiac: "말",
          soul: "파군",
          body: "천상",
          five_elements_class: "목3국",
          earthly_branch_of_soul_palace: "자",
          earthly_branch_of_body_palace: "신",
          palaces: [],
        },
      },
    })
    mockAnalysisCreate.mockResolvedValue({})
  })

  it("정상 요청 시 200과 보드 결과를 반환한다", async () => {
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.meta.engine).toBe("iztro")
  })

  it("JSON 파싱 실패 시 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/ziwei/board", {
      method: "POST",
      body: "bad-json",
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("스키마 에러 시 422", async () => {
    const res = await POST(makeRequest({ birthDate: "bad-date" }))
    expect(res.status).toBe(422)
  })

  it("birthTime 범위가 유효하지 않으면 422", async () => {
    const res = await POST(
      makeRequest({
        ...VALID_BODY,
        birthTime: "99:00",
      })
    )
    expect(res.status).toBe(422)
  })

  it("use-case 실패 시 에러 상태를 전달한다", async () => {
    mockAnalyzeZiweiBoard.mockReturnValue({
      success: false,
      error: "unsupported option",
      code: "ZIWEI_CALCULATION_ERROR",
      status: 422,
    })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.code).toBe("ZIWEI_CALCULATION_ERROR")
  })

  it("로그인 사용자면 분석 결과를 저장한다", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    await POST(makeRequest(VALID_BODY))
    expect(mockAnalysisCreate).toHaveBeenCalled()
  })
})
