import { describe, expect, it } from "vitest"
import { generateZiweiBoard, generateZiweiRuntimeOverlay } from "@/lib/ziwei/engine"
import type { ZiweiBoardRequest, ZiweiRuntimeOverlayRequest } from "@/lib/schemas/ziwei"

const BASE_INPUT: ZiweiBoardRequest = {
  birthDate: "1993-10-08",
  birthTime: "14:37",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "F",
  latitude: 37.5665,
  longitude: 126.978,
  calendar: "SOLAR",
  isLeapMonth: false,
  school: "DEFAULT",
  plugins: [],
  fixLeap: true,
  language: "ko-KR",
}

describe("ziwei engine", () => {
  it("board 응답에 메타/품질 필드와 12궁 데이터가 포함된다", () => {
    const result = generateZiweiBoard(BASE_INPUT)

    expect(result.meta.engine).toBe("iztro")
    expect(result.meta.policy_version).toBe("ziwei-v1.1.0")
    expect(result.meta.plugins).toEqual([])
    expect(result.input_tier).toBe("L3")
    expect(result.quality_flags.houses_computed).toBe(true)
    expect(result.board.palaces).toHaveLength(12)
    expect(result.board.solar_date).toBeTruthy()
    expect(result.board.soul).toBeTruthy()
  })

  it("runtime overlay는 decadal/yearly/monthly/daily/hourly 구조를 포함한다", () => {
    const request: ZiweiRuntimeOverlayRequest = {
      ...BASE_INPUT,
      targetDate: "2026-03-03",
      targetTime: "09:00",
      targetTimezone: "Asia/Seoul",
      targetShichen: undefined,
    }

    const result = generateZiweiRuntimeOverlay(request)
    expect(result.timing.target_date).toBe("2026-03-03")
    expect(result.timing.decadal.name).toBeTruthy()
    expect(result.timing.yearly.name).toBeTruthy()
    expect(result.timing.monthly.name).toBeTruthy()
    expect(result.timing.daily.name).toBeTruthy()
    expect(result.timing.hourly.name).toBeTruthy()
  })
})
