import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fetchHorizonsEphemeris, fetchVimshottari, HorizonsClientError } from "@/lib/astrology/horizons-client"
import type { BirthInfo } from "@/lib/schemas/birth-info"

const BASE_INPUT: BirthInfo = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M",
  latitude: 37.5665,
  longitude: 126.978,
}

describe("fetchHorizonsEphemeris", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.stubEnv("HARUNA_HORIZONS_BASE_URL", "https://horizons.example.com")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("계약 응답을 파싱한다", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        observation_time_utc: "1990-01-15T05:30:00Z",
        results: {
          SUN: { lon_deg: 10.1, lat_deg: 0 },
          MOON: { lon_deg: 20.2, lat_deg: 1 },
          MERCURY: { lon_deg: 30.3, lat_deg: 0 },
          VENUS: { lon_deg: 40.4, lat_deg: 0 },
          MARS: { lon_deg: 50.5, lat_deg: 0 },
          JUPITER: { lon_deg: 60.6, lat_deg: 0 },
          SATURN: { lon_deg: 70.7, lat_deg: 0 },
        },
      }),
    } as Response)

    const res = await fetchHorizonsEphemeris(BASE_INPUT)
    expect(res.observation_time_utc).toBe("1990-01-15T05:30:00Z")
    expect(fetchMock).toHaveBeenCalled()
  })

  it("요청 body/headers가 계약 형태로 전송된다", async () => {
    vi.stubEnv("HARUNA_HORIZONS_API_KEY", "secret-token")

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        observation_time_utc: "1990-01-15T05:30:00Z",
        results: {
          SUN: { lon_deg: 10.1, lat_deg: 0 },
          MOON: { lon_deg: 20.2, lat_deg: 1 },
          MERCURY: { lon_deg: 30.3, lat_deg: 0 },
          VENUS: { lon_deg: 40.4, lat_deg: 0 },
          MARS: { lon_deg: 50.5, lat_deg: 0 },
          JUPITER: { lon_deg: 60.6, lat_deg: 0 },
          SATURN: { lon_deg: 70.7, lat_deg: 0 },
        },
      }),
    } as Response)

    await fetchHorizonsEphemeris(BASE_INPUT)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(String(options.body))
    const headers = options.headers as Record<string, string>

    expect(body.birth.local_datetime).toBe("1990-01-15T14:30:00")
    expect(body.birth.timezone).toBe("Asia/Seoul")
    expect(body.location.longitude_deg).toBe(126.978)
    expect(body.location.latitude_deg).toBe(37.5665)
    expect(body.bodies).toEqual([
      "SUN",
      "MOON",
      "MERCURY",
      "VENUS",
      "MARS",
      "JUPITER",
      "SATURN",
    ])
    expect(headers.Authorization).toBe("Bearer secret-token")
  })

  it("위치 누락 시 422 에러", async () => {
    await expect(
      fetchHorizonsEphemeris({ ...BASE_INPUT, latitude: undefined })
    ).rejects.toMatchObject({ code: "ASTROLOGY_LOCATION_REQUIRED", status: 422 })
  })

  it("서비스 invalid_request를 내부 코드로 매핑", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { code: "invalid_request", message: "bad input", details: [] },
      }),
    } as Response)

    await expect(fetchHorizonsEphemeris(BASE_INPUT)).rejects.toMatchObject({
      code: "HORIZONS_INVALID_REQUEST",
      status: 400,
    })
  })

  it("detail.error envelope도 내부 코드로 매핑", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        detail: { error: { code: "unsupported_option", message: "unsupported", details: [] } },
      }),
    } as Response)

    await expect(fetchHorizonsEphemeris(BASE_INPUT)).rejects.toMatchObject({
      code: "HORIZONS_UNSUPPORTED_OPTION",
      status: 422,
    })
  })

  it("base url 미설정 시 not configured 에러", async () => {
    vi.stubEnv("HARUNA_HORIZONS_BASE_URL", "")
    await expect(fetchHorizonsEphemeris(BASE_INPUT)).rejects.toBeInstanceOf(HorizonsClientError)
    await expect(fetchHorizonsEphemeris(BASE_INPUT)).rejects.toMatchObject({
      code: "HORIZONS_NOT_CONFIGURED",
    })
  })

  it("AbortError 발생 시 timeout 코드로 매핑", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      Object.assign(new Error("timeout"), { name: "AbortError" })
    )

    await expect(fetchHorizonsEphemeris(BASE_INPUT)).rejects.toMatchObject({
      code: "HORIZONS_TIMEOUT",
      status: 504,
    })
  })
})

describe("fetchVimshottari", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.stubEnv("HARUNA_HORIZONS_BASE_URL", "https://horizons.example.com")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("신규 periods/sub_periods 포맷을 파싱한다", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        observation_time_utc: "1992-08-17T05:35:00Z",
        periods: [
          {
            lord: "SATURN",
            start_utc: "1992-08-17T05:35:00Z",
            end_utc: "1998-08-05T10:59:44Z",
            sub_periods: [
              {
                lord: "SATURN",
                start_utc: "1992-08-17T05:35:00Z",
                end_utc: "1993-07-28T06:38:25Z",
              },
              {
                lord: "MERCURY",
                start_utc: "1993-07-28T06:38:25Z",
                end_utc: "1994-06-02T00:00:25Z",
              },
            ],
          },
          {
            lord: "MERCURY",
            start_utc: "1998-08-05T10:59:44Z",
            end_utc: "2015-08-05T13:56:08Z",
          },
        ],
      }),
    } as Response)

    const result = await fetchVimshottari(BASE_INPUT)
    expect(result.currentMahaDasha).toMatchObject({
      lord: "SATURN",
      level: "maha",
    })
    expect(result.currentAntarDasha).toMatchObject({
      lord: "SATURN",
      level: "antar",
    })
    expect(result.currentPratyantarDasha).toMatchObject({
      lord: "SATURN",
      level: "pratyantar",
    })
    expect(result.upcoming[0]).toMatchObject({
      lord: "MERCURY",
      level: "maha",
    })
  })

  it("기존 current/upcoming 포맷도 파싱한다", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        observation_time_utc: "1992-08-17T05:35:00Z",
        currentMahaDasha: {
          lord: "SATURN",
          startDate: "1992-08-17T05:35:00Z",
          endDate: "1998-08-05T10:59:44Z",
          level: "maha",
        },
        currentAntarDasha: {
          lord: "SATURN",
          startDate: "1992-08-17T05:35:00Z",
          endDate: "1993-07-28T06:38:25Z",
          level: "antar",
        },
        currentPratyantarDasha: {
          lord: "SATURN",
          startDate: "1992-08-17T05:35:00Z",
          endDate: "1992-09-01T00:00:00Z",
          level: "pratyantar",
        },
        upcoming: [
          {
            lord: "MERCURY",
            startDate: "1998-08-05T10:59:44Z",
            endDate: "2015-08-05T13:56:08Z",
            level: "maha",
          },
        ],
      }),
    } as Response)

    const result = await fetchVimshottari(BASE_INPUT)
    expect(result.currentMahaDasha.lord).toBe("SATURN")
    expect(result.currentAntarDasha.lord).toBe("SATURN")
    expect(result.currentPratyantarDasha.lord).toBe("SATURN")
    expect(result.upcoming).toHaveLength(1)
  })
})
