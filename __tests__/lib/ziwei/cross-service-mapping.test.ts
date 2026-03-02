import { describe, expect, it } from "vitest"
import { ZiweiBoardRequestSchema } from "@/lib/schemas/ziwei"
import {
  buildHorizonsPositionsRequestBody,
  HorizonsClientError,
} from "@/lib/astrology/horizons-client"

describe("ziwei <-> haruna-horizons mapping", () => {
  it("Ziwei 입력을 Haruna ephemeris 요청 계약으로 매핑한다", () => {
    const ziweiInput = ZiweiBoardRequestSchema.parse({
      birthDate: "1993-10-08",
      birthTime: "14:37",
      isTimeUnknown: false,
      timezone: "Asia/Seoul",
      gender: "F",
      latitude: 37.5665,
      longitude: 126.978,
      calendar: "SOLAR",
      school: "DEFAULT",
      fixLeap: true,
      isLeapMonth: false,
      language: "ko-KR",
    })

    const body = buildHorizonsPositionsRequestBody(ziweiInput)
    expect(body.birth.local_datetime).toBe("1993-10-08T14:37:00")
    expect(body.birth.timezone).toBe("Asia/Seoul")
    expect(body.birth.time_accuracy).toBe("minute")
    expect(body.location.longitude_deg).toBe(126.978)
    expect(body.location.latitude_deg).toBe(37.5665)
  })

  it("시간 미상 입력은 local 12:00 + unknown 정확도로 매핑된다", () => {
    const ziweiInput = ZiweiBoardRequestSchema.parse({
      birthDate: "1993-10-08",
      birthTime: null,
      isTimeUnknown: true,
      timezone: "Asia/Seoul",
      gender: "F",
      latitude: 37.5665,
      longitude: 126.978,
      calendar: "SOLAR",
      school: "DEFAULT",
      fixLeap: true,
      isLeapMonth: false,
      language: "ko-KR",
    })

    const body = buildHorizonsPositionsRequestBody(ziweiInput)
    expect(body.birth.local_datetime).toBe("1993-10-08T12:00:00")
    expect(body.birth.time_accuracy).toBe("unknown")
  })

  it("위치 누락 시 동일한 계약 에러를 발생시킨다", () => {
    const ziweiInput = ZiweiBoardRequestSchema.parse({
      birthDate: "1993-10-08",
      birthTime: "14:37",
      isTimeUnknown: false,
      timezone: "Asia/Seoul",
      gender: "F",
      calendar: "SOLAR",
      school: "DEFAULT",
      fixLeap: true,
      isLeapMonth: false,
      language: "ko-KR",
    })

    expect(() => buildHorizonsPositionsRequestBody(ziweiInput)).toThrowError(HorizonsClientError)
    expect(() => buildHorizonsPositionsRequestBody(ziweiInput)).toThrowError(
      /점성술 계산에는 위치\(latitude, longitude\)가 필요합니다/
    )
  })
})
