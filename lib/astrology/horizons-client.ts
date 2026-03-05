import type { BirthInfo } from "@/lib/schemas/birth-info"
import { PLANET_ORDER } from "@/lib/astrology/static/constants"
import type { PlanetId } from "@/lib/astrology/static/types"
import type {
  ChartCoreResponse,
  AspectsResponse,
  DashaPeriod,
  VedicCoreResponse,
  NakshatraData,
  VedicPlanetPosition,
  EssentialScoreResponse,
  AccidentalScoreResponse,
  VimshottariResponse,
  HellenisticCoreResponse,
  HellenisticProfectionResponse,
} from "@/lib/astrology/types"
import {
  hasLocation,
  toHarunaBirthPayload,
  toHarunaLocationPayload,
} from "@/lib/astrology/shared/input-normalization"

interface HorizonsPosition {
  lon_deg: number
  lat_deg: number
  distance_km?: number
  speed_km_s?: number
}

export interface HorizonsEphemerisResponse {
  meta?: {
    kernel_profile?: string
    precision?: string
    abcorr?: string
    frame_mode?: string
    observer_mode?: string
  }
  observation_time_utc: string
  results: Record<PlanetId, HorizonsPosition>
}

export class HorizonsClientError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message)
    this.name = "HorizonsClientError"
    this.status = status
    this.code = code
    this.details = details
  }
}

function getBaseUrl(): string {
  const baseUrl = process.env.HARUNA_HORIZONS_BASE_URL?.trim()
  if (!baseUrl) {
    throw new HorizonsClientError(
      "HARUNA_HORIZONS_BASE_URL이 설정되지 않았습니다",
      503,
      "HORIZONS_NOT_CONFIGURED"
    )
  }
  return baseUrl.replace(/\/+$/, "")
}

function mapServiceError(status: number, payload: unknown): HorizonsClientError {
  const baseMessage = "Haruna Horizons 요청 중 오류가 발생했습니다"
  const err =
    payload && typeof payload === "object"
      ? ((payload as { error?: { code?: string; message?: string; details?: unknown } }).error ??
        (payload as { detail?: { error?: { code?: string; message?: string; details?: unknown } } }).detail
          ?.error)
      : undefined
  if (err) {
    if (err?.code === "invalid_request") {
      return new HorizonsClientError(err.message ?? baseMessage, 400, "HORIZONS_INVALID_REQUEST", err.details)
    }
    if (err?.code === "unsupported_option") {
      return new HorizonsClientError(
        err.message ?? baseMessage,
        422,
        "HORIZONS_UNSUPPORTED_OPTION",
        err.details
      )
    }
    if (err?.code === "kernel_unavailable") {
      return new HorizonsClientError(
        err.message ?? baseMessage,
        503,
        "HORIZONS_KERNEL_UNAVAILABLE",
        err.details
      )
    }
    return new HorizonsClientError(
      err?.message ?? baseMessage,
      status,
      "HORIZONS_SERVICE_ERROR",
      err?.details
    )
  }
  return new HorizonsClientError(baseMessage, status, "HORIZONS_SERVICE_ERROR", payload)
}

function validateResponseShape(payload: unknown): HorizonsEphemerisResponse {
  if (!payload || typeof payload !== "object") {
    throw new HorizonsClientError("Haruna Horizons 응답 형식이 올바르지 않습니다", 502, "HORIZONS_BAD_RESPONSE")
  }
  const observation = (payload as { observation_time_utc?: unknown }).observation_time_utc
  const results = (payload as { results?: unknown }).results
  if (typeof observation !== "string" || !results || typeof results !== "object") {
    throw new HorizonsClientError("Haruna Horizons 응답 필드가 누락되었습니다", 502, "HORIZONS_BAD_RESPONSE")
  }

  for (const planet of PLANET_ORDER) {
    const planetResult = (results as Record<string, unknown>)[planet]
    if (!planetResult || typeof planetResult !== "object") {
      throw new HorizonsClientError(
        `Haruna Horizons 응답에 ${planet} 데이터가 없습니다`,
        502,
        "HORIZONS_BAD_RESPONSE"
      )
    }
    const lon = (planetResult as { lon_deg?: unknown }).lon_deg
    if (typeof lon !== "number" || Number.isNaN(lon)) {
      throw new HorizonsClientError(
        `Haruna Horizons 응답의 ${planet}.lon_deg 값이 유효하지 않습니다`,
        502,
        "HORIZONS_BAD_RESPONSE"
      )
    }
  }

  return payload as HorizonsEphemerisResponse
}

function getTimeoutMs(): number {
  const raw = process.env.HARUNA_HORIZONS_TIMEOUT_MS?.trim()
  if (!raw) return 5000
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return 5000
  return Math.floor(parsed)
}

export async function fetchHorizonsEphemeris(
  input: BirthInfo,
  options?: { targetDate?: string }
): Promise<HorizonsEphemerisResponse> {
  if (!hasLocation(input)) {
    throw new HorizonsClientError(
      "점성술 계산에는 위치(latitude, longitude)가 필요합니다",
      422,
      "ASTROLOGY_LOCATION_REQUIRED"
    )
  }

  const baseUrl = getBaseUrl()
  const body = buildHorizonsPositionsRequestBody(input, options?.targetDate)

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  const apiKey = process.env.HARUNA_HORIZONS_API_KEY?.trim()
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  let response: Response
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs())
  try {
    response = await fetch(`${baseUrl}/v1/ephemeris/positions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new HorizonsClientError(
        "Haruna Horizons 요청이 시간 초과되었습니다",
        504,
        "HORIZONS_TIMEOUT"
      )
    }
    throw new HorizonsClientError(
      "Haruna Horizons 네트워크 요청에 실패했습니다",
      503,
      "HORIZONS_NETWORK_ERROR"
    )
  } finally {
    clearTimeout(timeout)
  }

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    if (!response.ok) {
      throw new HorizonsClientError(
        "Haruna Horizons 에러 응답을 해석할 수 없습니다",
        response.status,
        "HORIZONS_BAD_RESPONSE"
      )
    }
  }

  if (!response.ok) {
    throw mapServiceError(response.status, payload)
  }

  return validateResponseShape(payload)
}

export function buildHorizonsPositionsRequestBody(input: BirthInfo, targetDate?: string) {
  const location = toHarunaLocationPayload(input, 0.0)
  if (!location) {
    throw new HorizonsClientError(
      "점성술 계산에는 위치(latitude, longitude)가 필요합니다",
      422,
      "ASTROLOGY_LOCATION_REQUIRED"
    )
  }

  const birth = toHarunaBirthPayload(input)
  // targetDate가 있으면 관측 시점을 해당 날짜 정오로 오버라이드
  if (targetDate) {
    birth.local_datetime = `${targetDate}T12:00:00`
  }

  return {
    birth,
    location,
    bodies: PLANET_ORDER,
    options: {
      precision: "STANDARD",
      frame_mode: "TRUE_ECLIPTIC_OF_DATE",
      observer_mode: "GEOCENTRIC",
      with_velocity: false,
    },
  }
}

/* ─── Derived endpoints (즉시 반영) ─── */

function buildDerivedRequestBody(input: BirthInfo) {
  if (!hasLocation(input)) {
    throw new HorizonsClientError(
      "점성술 계산에는 위치(latitude, longitude)가 필요합니다",
      422,
      "ASTROLOGY_LOCATION_REQUIRED"
    )
  }
  return {
    birth: toHarunaBirthPayload(input),
    location: toHarunaLocationPayload(input, 0.0),
  }
}

async function fetchDerived<T>(endpoint: string, input: BirthInfo): Promise<T> {
  const baseUrl = getBaseUrl()
  const body = buildDerivedRequestBody(input)
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const apiKey = process.env.HARUNA_HORIZONS_API_KEY?.trim()
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs())
  let response: Response
  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new HorizonsClientError("Haruna Horizons 요청이 시간 초과되었습니다", 504, "HORIZONS_TIMEOUT")
    }
    throw new HorizonsClientError("Haruna Horizons 네트워크 요청에 실패했습니다", 503, "HORIZONS_NETWORK_ERROR")
  } finally {
    clearTimeout(timeout)
  }

  let payload: unknown = null
  try { payload = await response.json() } catch {
    if (!response.ok) {
      throw new HorizonsClientError("Haruna Horizons 에러 응답을 해석할 수 없습니다", response.status, "HORIZONS_BAD_RESPONSE")
    }
  }
  if (!response.ok) throw mapServiceError(response.status, payload)
  return payload as T
}

function readNumber(obj: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const v = obj[key]
    if (typeof v === "number" && Number.isFinite(v)) return v
  }
  return null
}

function readString(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = obj[key]
    if (typeof v === "string" && v.length > 0) return v
  }
  return null
}

function normalizeNakshatra(raw: unknown): NakshatraData | null {
  if (!raw || typeof raw !== "object") return null
  const obj = raw as Record<string, unknown>

  const name = readString(obj, "name")
  const pada = readNumber(obj, "pada")
  const lord = readString(obj, "lord")
  const degreesInNakshatra = readNumber(obj, "degreesInNakshatra", "degrees_in_nakshatra")
  const startDeg = readNumber(obj, "startDeg", "start_deg")
  const endDeg = readNumber(obj, "endDeg", "end_deg")

  if (
    !name ||
    pada === null ||
    !lord ||
    degreesInNakshatra === null ||
    startDeg === null ||
    endDeg === null
  ) {
    return null
  }

  return {
    name,
    pada,
    lord,
    degreesInNakshatra,
    startDeg,
    endDeg,
  }
}

function normalizeVedicPlanet(raw: unknown, planet: PlanetId): VedicPlanetPosition | null {
  if (!raw || typeof raw !== "object") return null
  const obj = raw as Record<string, unknown>

  const siderealLonDeg = readNumber(obj, "siderealLonDeg", "sidereal_lon_deg")
  const sign = readString(obj, "sign")
  const signLabel = readString(obj, "signLabel", "sign_label") ?? sign
  const degreeInSign = readNumber(obj, "degreeInSign", "degree_in_sign")
  const nakshatra = normalizeNakshatra(obj.nakshatra)

  if (
    siderealLonDeg === null ||
    !sign ||
    !signLabel ||
    degreeInSign === null ||
    !nakshatra
  ) {
    return null
  }

  return {
    planet,
    siderealLonDeg,
    sign,
    signLabel,
    degreeInSign,
    nakshatra,
  }
}

function normalizeVedicCoreResponse(payload: unknown): VedicCoreResponse {
  if (!payload || typeof payload !== "object") {
    throw new HorizonsClientError("베딕 코어 응답 형식이 올바르지 않습니다", 502, "HORIZONS_BAD_RESPONSE")
  }
  const obj = payload as Record<string, unknown>

  const ayanamsa = readNumber(obj, "ayanamsa")
  const ayanamsaType = readString(obj, "ayanamsaType", "ayanamsa_type")
  const observation = readString(obj, "observation_time_utc", "observationTimeUtc")
  const rawPlanets = obj.planets
  if (ayanamsa === null || !ayanamsaType || !observation || !rawPlanets || typeof rawPlanets !== "object") {
    throw new HorizonsClientError("베딕 코어 응답 필드가 누락되었습니다", 502, "HORIZONS_BAD_RESPONSE")
  }

  const planetsRecord = rawPlanets as Record<string, unknown>
  const planets = {} as Record<PlanetId, VedicPlanetPosition>
  for (const planet of PLANET_ORDER) {
    const normalized = normalizeVedicPlanet(planetsRecord[planet], planet)
    if (!normalized) {
      throw new HorizonsClientError(`베딕 코어 응답의 ${planet} 데이터가 유효하지 않습니다`, 502, "HORIZONS_BAD_RESPONSE")
    }
    planets[planet] = normalized
  }

  const moonNakshatra =
    normalizeNakshatra(obj.moonNakshatra) ??
    normalizeNakshatra(obj.moon_nakshatra) ??
    planets.MOON?.nakshatra ??
    null

  if (!moonNakshatra) {
    throw new HorizonsClientError("베딕 코어 응답에 moonNakshatra가 없습니다", 502, "HORIZONS_BAD_RESPONSE")
  }

  return {
    ayanamsa,
    ayanamsaType,
    planets,
    moonNakshatra,
    observation_time_utc: observation,
  }
}

function normalizeDashaLevel(raw: unknown): DashaPeriod["level"] | null {
  if (raw === "maha" || raw === "antar" || raw === "pratyantar") return raw
  if (raw === "MAHA") return "maha"
  if (raw === "ANTAR") return "antar"
  if (raw === "PRATYANTAR") return "pratyantar"
  return null
}

function normalizeDashaPeriod(raw: unknown, fallbackLevel?: DashaPeriod["level"]): DashaPeriod | null {
  if (!raw || typeof raw !== "object") return null
  const obj = raw as Record<string, unknown>
  const lord = readString(obj, "lord")
  const startDate = readString(obj, "startDate", "start_date")
  const endDate = readString(obj, "endDate", "end_date")
  const level = normalizeDashaLevel(obj.level) ?? fallbackLevel ?? null
  if (!lord || !startDate || !endDate || !level) return null
  return { lord, startDate, endDate, level }
}

function normalizeVimshottariResponse(payload: unknown): VimshottariResponse {
  if (!payload || typeof payload !== "object") {
    throw new HorizonsClientError("비묘타리 응답 형식이 올바르지 않습니다", 502, "HORIZONS_BAD_RESPONSE")
  }
  const obj = payload as Record<string, unknown>
  const observation = readString(obj, "observation_time_utc", "observationTimeUtc")

  const currentMahaDasha =
    normalizeDashaPeriod(obj.currentMahaDasha, "maha") ??
    normalizeDashaPeriod(obj.current_maha_dasha, "maha")
  const currentAntarDasha =
    normalizeDashaPeriod(obj.currentAntarDasha, "antar") ??
    normalizeDashaPeriod(obj.current_antar_dasha, "antar")
  const currentPratyantarDasha =
    normalizeDashaPeriod(obj.currentPratyantarDasha, "pratyantar") ??
    normalizeDashaPeriod(obj.current_pratyantar_dasha, "pratyantar")

  const rawUpcoming = obj.upcoming
  const upcoming = Array.isArray(rawUpcoming)
    ? rawUpcoming
        .map((item) => normalizeDashaPeriod(item))
        .filter((item): item is DashaPeriod => item !== null)
    : []

  if (!currentMahaDasha || !currentAntarDasha || !currentPratyantarDasha || !observation) {
    throw new HorizonsClientError("비묘타리 응답 필드가 누락되었습니다", 502, "HORIZONS_BAD_RESPONSE")
  }

  return {
    currentMahaDasha,
    currentAntarDasha,
    currentPratyantarDasha,
    upcoming,
    observation_time_utc: observation,
  }
}

/** 10-1. 네이탈 차트 핵심 데이터 (ASC/MC + 12 하우스 + 행성 배치) */
export async function fetchChartCore(input: BirthInfo): Promise<ChartCoreResponse> {
  return fetchDerived<ChartCoreResponse>("/v1/derived/chart-core", input)
}

/** 10-2. 행성간 각도 (애스펙트) */
export async function fetchAspects(input: BirthInfo): Promise<AspectsResponse> {
  return fetchDerived<AspectsResponse>("/v1/derived/aspects", input)
}

/** 10-3. 달의 낙샤트라 (베딕 사이드리얼) */
export async function fetchVedicCore(input: BirthInfo): Promise<VedicCoreResponse> {
  const payload = await fetchDerived<unknown>("/v1/vedic/sidereal-core", input)
  return normalizeVedicCoreResponse(payload)
}

/* ─── 준비만 (타입 + fetch 함수) ─── */

/** 10-4a. Western essential dignity score */
export async function fetchEssentialScore(input: BirthInfo): Promise<EssentialScoreResponse> {
  return fetchDerived<EssentialScoreResponse>("/v1/western/essential-score", input)
}

/** 10-4b. Western accidental dignity score */
export async function fetchAccidentalScore(input: BirthInfo): Promise<AccidentalScoreResponse> {
  return fetchDerived<AccidentalScoreResponse>("/v1/western/accidental-score", input)
}

/** 10-5. 비묘타리 다샤 */
export async function fetchVimshottari(input: BirthInfo): Promise<VimshottariResponse> {
  const payload = await fetchDerived<unknown>("/v1/vedic/vimshottari", input)
  return normalizeVimshottariResponse(payload)
}

/** 10-6. 헬레니스틱 핵심 (세크트, 로트, ASC/MC) */
export async function fetchHellenisticCore(input: BirthInfo): Promise<HellenisticCoreResponse> {
  return fetchDerived<HellenisticCoreResponse>("/v1/hellenistic/core", input)
}

/** 10-7. 헬레니스틱 프로펙션 (연간/월간) */
export async function fetchHellenisticProfection(
  input: BirthInfo,
  targetLocalDatetime: string,
  mode: "ANNUAL" | "MONTHLY" = "ANNUAL",
): Promise<HellenisticProfectionResponse> {
  const baseUrl = getBaseUrl()
  const body = {
    ...buildDerivedRequestBody(input),
    target_local_datetime: targetLocalDatetime,
    mode,
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const apiKey = process.env.HARUNA_HORIZONS_API_KEY?.trim()
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs())
  let response: Response
  try {
    response = await fetch(`${baseUrl}/v1/hellenistic/profection`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new HorizonsClientError("Haruna Horizons 요청이 시간 초과되었습니다", 504, "HORIZONS_TIMEOUT")
    }
    throw new HorizonsClientError("Haruna Horizons 네트워크 요청에 실패했습니다", 503, "HORIZONS_NETWORK_ERROR")
  } finally {
    clearTimeout(timeout)
  }

  let payload: unknown = null
  try { payload = await response.json() } catch {
    if (!response.ok) {
      throw new HorizonsClientError("Haruna Horizons 에러 응답을 해석할 수 없습니다", response.status, "HORIZONS_BAD_RESPONSE")
    }
  }
  if (!response.ok) throw mapServiceError(response.status, payload)
  return payload as HellenisticProfectionResponse
}
