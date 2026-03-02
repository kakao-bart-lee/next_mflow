import type { BirthInfo } from "@/lib/schemas/birth-info"
import { PLANET_ORDER } from "@/lib/astrology/static/constants"
import type { PlanetId } from "@/lib/astrology/static/types"
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

export async function fetchHorizonsEphemeris(input: BirthInfo): Promise<HorizonsEphemerisResponse> {
  if (!hasLocation(input)) {
    throw new HorizonsClientError(
      "점성술 계산에는 위치(latitude, longitude)가 필요합니다",
      422,
      "ASTROLOGY_LOCATION_REQUIRED"
    )
  }

  const baseUrl = getBaseUrl()
  const body = buildHorizonsPositionsRequestBody(input)

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

export function buildHorizonsPositionsRequestBody(input: BirthInfo) {
  const location = toHarunaLocationPayload(input, 0.0)
  if (!location) {
    throw new HorizonsClientError(
      "점성술 계산에는 위치(latitude, longitude)가 필요합니다",
      422,
      "ASTROLOGY_LOCATION_REQUIRED"
    )
  }

  return {
    birth: toHarunaBirthPayload(input),
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
