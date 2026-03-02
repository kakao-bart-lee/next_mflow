import { describe, expect, it } from "vitest"
import { normalizeZiweiInput, resolveRuntimeTarget } from "@/lib/ziwei/normalizer"
import type { ZiweiBoardRequest, ZiweiRuntimeOverlayRequest } from "@/lib/schemas/ziwei"

const BASE_SOLAR: ZiweiBoardRequest = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M",
  latitude: 37.5665,
  longitude: 126.978,
  calendar: "SOLAR",
  isLeapMonth: false,
  school: "DEFAULT",
  plugins: [],
  fixLeap: true,
  language: "ko-KR",
}

describe("normalizeZiweiInput", () => {
  it("L3 입력은 단일 시진 후보를 만든다", () => {
    const normalized = normalizeZiweiInput(BASE_SOLAR)
    expect(normalized.input_tier).toBe("L3")
    expect(normalized.quality_flags.time_is_assumed).toBe(false)
    expect(normalized.quality_flags.location_is_assumed).toBe(false)
    expect(normalized.birth_time_index).toBe(7)
    expect(normalized.shichen_candidates).toHaveLength(1)
  })

  it("L0 입력은 가정 시간 + 13개 시진 후보를 제공한다", () => {
    const normalized = normalizeZiweiInput({
      ...BASE_SOLAR,
      birthTime: null,
      isTimeUnknown: true,
      latitude: undefined,
      longitude: undefined,
    })

    expect(normalized.input_tier).toBe("L0")
    expect(normalized.birth_time).toBe("12:00")
    expect(normalized.quality_flags.time_is_assumed).toBe(true)
    expect(normalized.quality_flags.location_is_assumed).toBe(true)
    expect(normalized.shichen_candidates).toHaveLength(13)
    expect(normalized.assumptions.some((item) => item.includes("shichen_fallback"))).toBe(true)
  })

  it("시진 override가 있으면 해당 시진을 우선 적용한다", () => {
    const normalized = normalizeZiweiInput({
      ...BASE_SOLAR,
      birthTime: null,
      isTimeUnknown: true,
      shichen: "WEI",
    })
    expect(normalized.birth_time_index).toBe(7)
    expect(normalized.shichen_candidates).toHaveLength(1)
    expect(normalized.shichen_candidates[0]?.key).toBe("WEI")
  })

  it("plugin 옵션이 있으면 assumptions와 normalized에 반영된다", () => {
    const normalized = normalizeZiweiInput({
      ...BASE_SOLAR,
      plugins: ["MUTAGEN", "YEARLY_DECSTAR"],
    })
    expect(normalized.plugins).toEqual(["MUTAGEN", "YEARLY_DECSTAR"])
    expect(normalized.assumptions.some((item) => item.includes("plugin_profile"))).toBe(true)
  })
})

describe("resolveRuntimeTarget", () => {
  it("target 파라미터가 없으면 birth 기준으로 계산한다", () => {
    const input: ZiweiRuntimeOverlayRequest = {
      ...BASE_SOLAR,
      targetDate: undefined,
      targetTime: undefined,
      targetTimezone: undefined,
      targetShichen: undefined,
    }

    const target = resolveRuntimeTarget(input)
    expect(target.targetDate).toBe("1990-01-15")
    expect(target.targetTime).toBe("14:30")
    expect(target.targetTimeIndex).toBe(7)
    expect(target.targetTimezone).toBe("Asia/Seoul")
  })

  it("targetShichen이 있으면 targetTime 대신 시진 인덱스를 사용한다", () => {
    const input: ZiweiRuntimeOverlayRequest = {
      ...BASE_SOLAR,
      targetDate: "2026-03-03",
      targetTime: "01:20",
      targetTimezone: "Asia/Seoul",
      targetShichen: "XU",
    }
    const target = resolveRuntimeTarget(input)
    expect(target.targetDate).toBe("2026-03-03")
    expect(target.targetTimeIndex).toBe(10)
  })
})
