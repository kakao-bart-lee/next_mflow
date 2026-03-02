import type { BirthInfo } from "@/lib/schemas/birth-info"
import {
  inferInputTier,
  inferTimeAccuracy,
  resolveAssumedBirthTime,
} from "@/lib/astrology/shared/input-normalization"
import {
  BASE_LONGITUDE,
  CHALDEAN_FACES,
  DETRIMENT,
  DOMICILE,
  EGYPTIAN_TERMS,
  EXALTATION,
  FALL,
  NAISARGIKA_BALA,
  PLANET_LABEL,
  PLANET_ORDER,
  PLANET_THEME,
  SIGN_LABEL,
  TRIPLICITY_ELEMENT,
  TRIPLICITY_RULERS,
  ZODIAC_SIGNS,
} from "./constants"
import type {
  AstrologyInfluence,
  AstrologyPosition,
  AstrologyStaticResult,
  EssentialDignityBreakdown,
  PlanetId,
  ZodiacSign,
} from "./types"

function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function normalizeDegree(value: number): number {
  const mod = value % 360
  return mod < 0 ? mod + 360 : mod
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function signFromLongitude(lonDeg: number): ZodiacSign {
  const index = Math.floor(normalizeDegree(lonDeg) / 30)
  return ZODIAC_SIGNS[index] ?? "ARIES"
}

function degreeInSign(lonDeg: number): number {
  const signDeg = normalizeDegree(lonDeg) % 30
  return round2(signDeg)
}

function parseTimeToMinutes(time: string | null | undefined): number {
  if (!time) return 12 * 60
  const [hh, mm] = time.split(":").map((v) => Number(v))
  if (Number.isNaN(hh) || Number.isNaN(mm)) return 12 * 60
  return hh * 60 + mm
}

function isDayChart(input: BirthInfo): boolean {
  if (input.isTimeUnknown || !input.birthTime) return true
  const minutes = parseTimeToMinutes(input.birthTime)
  return minutes >= 6 * 60 && minutes < 18 * 60
}

function makeSeed(input: BirthInfo): string {
  return JSON.stringify({
    birthDate: input.birthDate,
    birthTime: input.isTimeUnknown ? "12:00" : input.birthTime ?? "12:00",
    timezone: input.timezone,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    gender: input.gender,
    locationName: input.locationName ?? null,
  })
}

function makePositionMap(input: BirthInfo, seed: string): Record<PlanetId, AstrologyPosition> {
  const ascLon = normalizeDegree((hashString(`${seed}:ASC`) % 36000) / 100)
  const housesComputed = !input.isTimeUnknown

  return PLANET_ORDER.reduce<Record<PlanetId, AstrologyPosition>>((acc, planet) => {
    const base = BASE_LONGITUDE[planet]
    const offsetSeed = hashString(`${seed}:${planet}`)
    const offset = ((offsetSeed % 2400) / 100) - 12
    const lonDeg = round2(normalizeDegree(base + offset))
    const sign = signFromLongitude(lonDeg)
    const degree = degreeInSign(lonDeg)
    const house = housesComputed
      ? Math.floor(normalizeDegree(lonDeg - ascLon) / 30) + 1
      : null

    acc[planet] = {
      planet,
      lonDeg,
      sign,
      signLabel: SIGN_LABEL[sign],
      degreeInSign: degree,
      house,
    }
    return acc
  }, {} as Record<PlanetId, AstrologyPosition>)
}

function makePositionMapFromLongitudes(
  input: BirthInfo,
  seed: string,
  longitudes: Partial<Record<PlanetId, number>>
): Record<PlanetId, AstrologyPosition> {
  const ascLon = normalizeDegree((hashString(`${seed}:ASC`) % 36000) / 100)
  const housesComputed = !input.isTimeUnknown
  const fallbackPositions = makePositionMap(input, seed)

  return PLANET_ORDER.reduce<Record<PlanetId, AstrologyPosition>>((acc, planet) => {
    const rawLon = longitudes[planet]
    const lonDeg =
      typeof rawLon === "number" && !Number.isNaN(rawLon)
        ? round2(normalizeDegree(rawLon))
        : fallbackPositions[planet].lonDeg
    const sign = signFromLongitude(lonDeg)
    const degree = degreeInSign(lonDeg)
    const house = housesComputed
      ? Math.floor(normalizeDegree(lonDeg - ascLon) / 30) + 1
      : null

    acc[planet] = {
      planet,
      lonDeg,
      sign,
      signLabel: SIGN_LABEL[sign],
      degreeInSign: degree,
      house,
    }
    return acc
  }, {} as Record<PlanetId, AstrologyPosition>)
}

function getTermRuler(sign: ZodiacSign, degree: number): PlanetId {
  const terms = EGYPTIAN_TERMS[sign]
  const hit = terms.find((t) => degree < t.end)
  return hit?.ruler ?? terms[terms.length - 1]!.ruler
}

function getFaceRuler(sign: ZodiacSign, degree: number): PlanetId {
  const decan = degree < 10 ? 0 : degree < 20 ? 1 : 2
  return CHALDEAN_FACES[sign][decan]
}

function buildEssentialBreakdown(
  planet: PlanetId,
  sign: ZodiacSign,
  degree: number,
  dayChart: boolean
): EssentialDignityBreakdown {
  const domicile = DOMICILE[planet].includes(sign) ? 5 : 0
  const exaltation = EXALTATION[planet] === sign ? 4 : 0

  const element = TRIPLICITY_ELEMENT[sign]
  const triplicityRuler = dayChart
    ? TRIPLICITY_RULERS[element].day
    : TRIPLICITY_RULERS[element].night
  const triplicity = triplicityRuler === planet ? 3 : 0

  const term = getTermRuler(sign, degree) === planet ? 2 : 0
  const face = getFaceRuler(sign, degree) === planet ? 1 : 0
  const detriment = DETRIMENT[planet].includes(sign) ? -5 : 0
  const fall = FALL[planet] === sign ? -4 : 0

  const subtotal = domicile + exaltation + triplicity + term + face + detriment + fall
  const peregrine = subtotal === 0 && detriment === 0 && fall === 0 ? -5 : 0
  const total = subtotal + peregrine

  return {
    domicile,
    exaltation,
    triplicity,
    term,
    face,
    detriment,
    fall,
    peregrine,
    total,
  }
}

function buildInfluences(
  positions: Record<PlanetId, AstrologyPosition>,
  dayChart: boolean
): Record<PlanetId, AstrologyInfluence> {
  return PLANET_ORDER.reduce<Record<PlanetId, AstrologyInfluence>>((acc, planet) => {
    const position = positions[planet]
    const dignity = buildEssentialBreakdown(
      planet,
      position.sign,
      position.degreeInSign,
      dayChart
    )

    const naisargikaVirupa = round2(NAISARGIKA_BALA[planet])
    const naturalScore = round2((naisargikaVirupa / 60) * 100)
    const essentialScore = dignity.total
    const positionalScore = round2(clamp(((essentialScore + 9) / 24) * 100, 0, 100))
    const finalScore = round2(clamp(naturalScore * 0.4 + positionalScore * 0.6, 0, 100))

    acc[planet] = {
      planet,
      naisargikaVirupa,
      naturalScore,
      essentialScore,
      positionalScore,
      finalScore,
      dignity,
      interpretation: `${PLANET_LABEL[planet]} ${position.signLabel} ${position.degreeInSign}° — ${
        PLANET_THEME[planet].summary
      }`,
    }

    return acc
  }, {} as Record<PlanetId, AstrologyInfluence>)
}

function getDatePartsInTimezone(
  value: Date,
  timezone: string
): { yyyy: number; mm: number; dd: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value)

  const yyyy = Number(parts.find((p) => p.type === "year")?.value ?? 1970)
  const mm = Number(parts.find((p) => p.type === "month")?.value ?? 1)
  const dd = Number(parts.find((p) => p.type === "day")?.value ?? 1)
  return { yyyy, mm, dd }
}

function formatIsoDateFromUtc(value: Date): string {
  const yyyy = value.getUTCFullYear()
  const mm = `${value.getUTCMonth() + 1}`.padStart(2, "0")
  const dd = `${value.getUTCDate()}`.padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function buildRangeLabelFromUtc(start: Date, end: Date): string {
  const startLabel = `${start.getUTCMonth() + 1}/${start.getUTCDate()}`
  const endLabel = `${end.getUTCMonth() + 1}/${end.getUTCDate()}`
  return `${startLabel} - ${endLabel}`
}

function intensityFromScore(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high"
  if (score >= 50) return "medium"
  return "low"
}

export function calculateStaticAstrology(input: BirthInfo): AstrologyStaticResult {
  return calculateAstrologyWithOptions(input)
}

export function calculateAstrologyWithOptions(
  input: BirthInfo,
  options?: {
    planetLongitudes?: Partial<Record<PlanetId, number>>
    observationTimeUtc?: string
    calculationMode?: "STATIC_V1" | "HORIZONS_V1"
  }
): AstrologyStaticResult {
  const seed = makeSeed(input)
  const dayChart = isDayChart(input)
  const hasExternalLongitudes = Boolean(options?.planetLongitudes)
  const positions = hasExternalLongitudes
    ? makePositionMapFromLongitudes(input, seed, options?.planetLongitudes ?? {})
    : makePositionMap(input, seed)
  const influences = buildInfluences(positions, dayChart)

  const ranking = PLANET_ORDER
    .slice()
    .sort((a, b) => influences[b].finalScore - influences[a].finalScore)

  const dominant = ranking[0] ?? "SUN"
  const now = new Date()
  const timezone = input.timezone || "UTC"
  const todayPart = getDatePartsInTimezone(now, timezone)
  const todayUtcDate = new Date(
    Date.UTC(todayPart.yyyy, Math.max(todayPart.mm - 1, 0), todayPart.dd)
  )

  const futureDays = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(
      Date.UTC(todayPart.yyyy, Math.max(todayPart.mm - 1, 0), todayPart.dd + idx)
    )
    const planet = ranking[idx % ranking.length] ?? dominant
    const score = influences[planet].finalScore
    return {
      date: formatIsoDateFromUtc(date),
      dominantPlanet: planet,
      theme: `${PLANET_LABEL[planet]} 중심의 흐름`,
      focus: PLANET_THEME[planet].summary,
      intensity: intensityFromScore(score),
    }
  })

  const futureStart = new Date(
    Date.UTC(todayPart.yyyy, Math.max(todayPart.mm - 1, 0), todayPart.dd)
  )
  const futureEnd = new Date(
    Date.UTC(todayPart.yyyy, Math.max(todayPart.mm - 1, 0), todayPart.dd + 6)
  )

  const grade = inferInputTier(input)
  const assumedTimeLocal = resolveAssumedBirthTime(input)
  const timeAccuracy = inferTimeAccuracy(input)

  return {
    version: "static-v1",
    generatedAt: new Date().toISOString(),
    isDayChart: dayChart,
    assumptions: {
      calculationMode: options?.calculationMode ?? "STATIC_V1",
      timeAccuracy,
      assumedTimeLocal,
      housesComputed: !input.isTimeUnknown,
      inputGrade: grade,
    },
    observationTimeUtc: options?.observationTimeUtc,
    input,
    positions,
    influences,
    ranking,
    today: {
      date: formatIsoDateFromUtc(todayUtcDate),
      dominantPlanet: dominant,
      headline: `${PLANET_LABEL[dominant]}의 영향이 강한 날`,
      summary: PLANET_THEME[dominant].summary,
      tags: [PLANET_LABEL[dominant], dayChart ? "Day Chart" : "Night Chart"],
      actions: PLANET_THEME[dominant].actions,
      caution: PLANET_THEME[dominant].caution,
    },
    future: {
      rangeLabel: buildRangeLabelFromUtc(futureStart, futureEnd),
      days: futureDays,
    },
  }
}
