import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))
vi.mock("@/lib/auth", () => ({ auth: mockAuth }))

const { mockAnalyzeZiweiRuntimeOverlay } = vi.hoisted(() => ({
  mockAnalyzeZiweiRuntimeOverlay: vi.fn(),
}))
vi.mock("@/lib/use-cases/analyze-ziwei", () => ({
  analyzeZiweiRuntimeOverlay: mockAnalyzeZiweiRuntimeOverlay,
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

import { POST } from "@/app/api/ziwei/runtime-overlay/route"

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
  targetDate: "2026-03-03",
  targetTime: "11:00",
  targetTimezone: "Asia/Seoul",
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/ziwei/runtime-overlay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/ziwei/runtime-overlay", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(null)
    mockAnalyzeZiweiRuntimeOverlay.mockReturnValue({
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
        board_ref: {
          solar_date: "1990-01-15",
          lunar_date: "1989-12-19",
          time: "未",
          time_range: "13:00-14:59",
          soul: "파군",
          body: "천상",
          earthly_branch_of_soul_palace: "자",
          earthly_branch_of_body_palace: "신",
        },
        timing: {
          target_date: "2026-03-03",
          target_time: "11:00",
          target_time_index: 6,
          target_timezone: "Asia/Seoul",
          decadal: {
            index: 3,
            name: "대한",
            heavenly_stem: "정",
            earthly_branch: "사",
            palace_names: [],
            mutagen: [],
            stars: [],
          },
          age: {
            index: 4,
            name: "소한",
            heavenly_stem: "무",
            earthly_branch: "오",
            palace_names: [],
            mutagen: [],
            stars: [],
            nominal_age: 34,
          },
          yearly: {
            index: 5,
            name: "유년",
            heavenly_stem: "병",
            earthly_branch: "오",
            palace_names: [],
            mutagen: [],
            stars: [],
          },
          monthly: {
            index: 6,
            name: "유월",
            heavenly_stem: "기",
            earthly_branch: "미",
            palace_names: [],
            mutagen: [],
            stars: [],
          },
          daily: {
            index: 7,
            name: "유일",
            heavenly_stem: "경",
            earthly_branch: "신",
            palace_names: [],
            mutagen: [],
            stars: [],
          },
          hourly: {
            index: 8,
            name: "유시",
            heavenly_stem: "신",
            earthly_branch: "유",
            palace_names: [],
            mutagen: [],
            stars: [],
          },
        },
      },
    })
    mockAnalysisCreate.mockResolvedValue({})
  })

  it("정상 요청 시 200과 runtime overlay를 반환한다", async () => {
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.timing.target_date).toBe("2026-03-03")
  })

  it("JSON 파싱 실패 시 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/ziwei/runtime-overlay", {
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

  it("targetTime 범위가 유효하지 않으면 422", async () => {
    const res = await POST(
      makeRequest({
        ...VALID_BODY,
        targetTime: "99:00",
      })
    )
    expect(res.status).toBe(422)
  })

  it("birthTime 범위가 유효하지 않으면 422", async () => {
    const res = await POST(
      makeRequest({
        ...VALID_BODY,
        birthTime: "24:00",
      })
    )
    expect(res.status).toBe(422)
  })

  it("use-case 실패 시 에러 상태를 전달한다", async () => {
    mockAnalyzeZiweiRuntimeOverlay.mockReturnValue({
      success: false,
      error: "runtime failed",
      code: "ZIWEI_RUNTIME_ERROR",
      status: 500,
    })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.code).toBe("ZIWEI_RUNTIME_ERROR")
  })

  it("로그인 사용자면 분석 결과를 저장한다", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    await POST(makeRequest(VALID_BODY))
    expect(mockAnalysisCreate).toHaveBeenCalled()
  })
})
