import type { BirthInfo } from "@/lib/schemas/birth-info"
import { fetchHorizonsEphemeris, HorizonsClientError } from "@/lib/astrology/horizons-client"
import { PLANET_ORDER } from "@/lib/astrology/static/constants"
import { calculateAstrologyWithOptions, calculateStaticAstrology } from "@/lib/astrology/static/calculator"
import type { AstrologyStaticResult } from "@/lib/astrology/static/types"

export type AnalyzeAstrologyStaticResult =
  | { success: true; data: AstrologyStaticResult }
  | { success: false; error: string; code: string; status: number }

export async function analyzeAstrologyStatic(
  input: BirthInfo
): Promise<AnalyzeAstrologyStaticResult> {
  const useHorizons = process.env.ASTROLOGY_USE_HORIZONS !== "false"
  const hasHorizonsBaseUrl = Boolean(process.env.HARUNA_HORIZONS_BASE_URL?.trim())

  if (useHorizons && hasHorizonsBaseUrl) {
    try {
      const ephemeris = await fetchHorizonsEphemeris(input)
      const longitudes = PLANET_ORDER.reduce<Partial<Record<(typeof PLANET_ORDER)[number], number>>>(
        (acc, planet) => {
          acc[planet] = ephemeris.results[planet]?.lon_deg
          return acc
        },
        {}
      )
      const data = calculateAstrologyWithOptions(input, {
        planetLongitudes: longitudes,
        observationTimeUtc: ephemeris.observation_time_utc,
        calculationMode: "HORIZONS_V1",
      })
      return { success: true, data }
    } catch (err) {
      if (err instanceof HorizonsClientError) {
        const failFastCodes = new Set([
          "HORIZONS_INVALID_REQUEST",
          "HORIZONS_UNSUPPORTED_OPTION",
        ])
        if (failFastCodes.has(err.code)) {
          return {
            success: false,
            error: err.message,
            code: err.code,
            status: err.status,
          }
        }
        console.warn(`Haruna Horizons 실패 (${err.code}) - 로컬 정적 계산으로 폴백`)
      } else {
        console.warn("Haruna Horizons 알 수 없는 오류 - 로컬 정적 계산으로 폴백")
      }
    }
  }

  try {
    const data = calculateStaticAstrology(input)
    return { success: true, data }
  } catch (err) {
    return {
      success: false,
      error: "점성술 정적 계산 중 오류가 발생했습니다",
      code: "ASTROLOGY_STATIC_CALCULATION_ERROR",
      status: 500,
    }
  }
}
