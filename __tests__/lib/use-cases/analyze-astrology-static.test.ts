import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BirthInfo } from "@/lib/schemas/birth-info"
import { HorizonsClientError } from "@/lib/astrology/horizons-client"

const { mockFetchHorizonsEphemeris } = vi.hoisted(() => ({
  mockFetchHorizonsEphemeris: vi.fn(),
}))
vi.mock("@/lib/astrology/horizons-client", () => ({
  fetchHorizonsEphemeris: mockFetchHorizonsEphemeris,
  HorizonsClientError: class HorizonsClientError extends Error {
    status: number
    code: string
    constructor(message: string, status: number, code: string) {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

const { mockCalculateAstrologyWithOptions, mockCalculateStaticAstrology } = vi.hoisted(() => ({
  mockCalculateAstrologyWithOptions: vi.fn(),
  mockCalculateStaticAstrology: vi.fn(),
}))
vi.mock("@/lib/astrology/static/calculator", () => ({
  calculateAstrologyWithOptions: mockCalculateAstrologyWithOptions,
  calculateStaticAstrology: mockCalculateStaticAstrology,
}))

import { analyzeAstrologyStatic } from "@/lib/use-cases/analyze-astrology-static"

const BASE_INPUT: BirthInfo = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M",
  latitude: 37.5665,
  longitude: 126.978,
}

describe("analyzeAstrologyStatic", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    mockCalculateAstrologyWithOptions.mockReturnValue({ version: "static-v1" })
    mockCalculateStaticAstrology.mockReturnValue({ version: "static-v1" })
  })

  it("HARUNA_HORIZONS_BASE_URL이 있으면 외부 ephemeris 결과를 사용한다", async () => {
    vi.stubEnv("HARUNA_HORIZONS_BASE_URL", "https://horizons.example.com")
    mockFetchHorizonsEphemeris.mockResolvedValue({
      observation_time_utc: "2026-03-02T00:00:00Z",
      results: {
        SUN: { lon_deg: 10, lat_deg: 0 },
        MOON: { lon_deg: 20, lat_deg: 0 },
        MERCURY: { lon_deg: 30, lat_deg: 0 },
        VENUS: { lon_deg: 40, lat_deg: 0 },
        MARS: { lon_deg: 50, lat_deg: 0 },
        JUPITER: { lon_deg: 60, lat_deg: 0 },
        SATURN: { lon_deg: 70, lat_deg: 0 },
      },
    })

    const result = await analyzeAstrologyStatic(BASE_INPUT)
    expect(result.success).toBe(true)
    expect(mockFetchHorizonsEphemeris).toHaveBeenCalled()
    expect(mockCalculateAstrologyWithOptions).toHaveBeenCalled()
    expect(mockCalculateStaticAstrology).not.toHaveBeenCalled()
  })

  it("ASTROLOGY_USE_HORIZONS=false면 로컬 정적 계산으로 폴백", async () => {
    vi.stubEnv("HARUNA_HORIZONS_BASE_URL", "https://horizons.example.com")
    vi.stubEnv("ASTROLOGY_USE_HORIZONS", "false")

    const result = await analyzeAstrologyStatic(BASE_INPUT)
    expect(result.success).toBe(true)
    expect(mockFetchHorizonsEphemeris).not.toHaveBeenCalled()
    expect(mockCalculateStaticAstrology).toHaveBeenCalled()
  })

  it("외부 네트워크 오류면 로컬 정적 계산으로 폴백", async () => {
    vi.stubEnv("HARUNA_HORIZONS_BASE_URL", "https://horizons.example.com")
    mockFetchHorizonsEphemeris.mockRejectedValue(
      new HorizonsClientError("network failed", 503, "HORIZONS_NETWORK_ERROR")
    )

    const result = await analyzeAstrologyStatic(BASE_INPUT)
    expect(result.success).toBe(true)
    expect(mockCalculateStaticAstrology).toHaveBeenCalled()
  })

  it("위치 누락 오류면 로컬 정적 계산으로 폴백", async () => {
    vi.stubEnv("HARUNA_HORIZONS_BASE_URL", "https://horizons.example.com")
    mockFetchHorizonsEphemeris.mockRejectedValue(
      new HorizonsClientError("location required", 422, "ASTROLOGY_LOCATION_REQUIRED")
    )

    const result = await analyzeAstrologyStatic({
      ...BASE_INPUT,
      latitude: undefined,
      longitude: undefined,
    })
    expect(result.success).toBe(true)
    expect(mockCalculateStaticAstrology).toHaveBeenCalled()
  })

  it("입력/옵션 오류는 fail-fast로 실패 반환", async () => {
    vi.stubEnv("HARUNA_HORIZONS_BASE_URL", "https://horizons.example.com")
    mockFetchHorizonsEphemeris.mockRejectedValue(
      new HorizonsClientError("invalid request", 400, "HORIZONS_INVALID_REQUEST")
    )

    const result = await analyzeAstrologyStatic(BASE_INPUT)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe("HORIZONS_INVALID_REQUEST")
      expect(result.status).toBe(400)
    }
    expect(mockCalculateStaticAstrology).not.toHaveBeenCalled()
  })
})
