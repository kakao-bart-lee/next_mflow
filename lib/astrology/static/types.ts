import type { BirthInfo } from "@/lib/schemas/birth-info"

export type PlanetId =
  | "SUN"
  | "MOON"
  | "MERCURY"
  | "VENUS"
  | "MARS"
  | "JUPITER"
  | "SATURN"

export type ZodiacSign =
  | "ARIES"
  | "TAURUS"
  | "GEMINI"
  | "CANCER"
  | "LEO"
  | "VIRGO"
  | "LIBRA"
  | "SCORPIO"
  | "SAGITTARIUS"
  | "CAPRICORN"
  | "AQUARIUS"
  | "PISCES"

export interface AstrologyAssumptions {
  calculationMode: "STATIC_V1" | "HORIZONS_V1"
  timeAccuracy: "minute" | "hour" | "day" | "unknown"
  assumedTimeLocal: string
  housesComputed: boolean
  inputGrade: "L0" | "L1" | "L2" | "L3"
}

export interface AstrologyPosition {
  planet: PlanetId
  lonDeg: number
  sign: ZodiacSign
  signLabel: string
  degreeInSign: number
  house: number | null
}

export interface EssentialDignityBreakdown {
  domicile: number
  exaltation: number
  triplicity: number
  term: number
  face: number
  detriment: number
  fall: number
  peregrine: number
  total: number
}

export interface AstrologyInfluence {
  planet: PlanetId
  naisargikaVirupa: number
  naturalScore: number
  essentialScore: number
  positionalScore: number
  finalScore: number
  dignity: EssentialDignityBreakdown
  interpretation: string
}

export interface TodayInsight {
  date: string
  dominantPlanet: PlanetId
  headline: string
  summary: string
  tags: string[]
  actions: string[]
  caution: string
}

export interface FutureDayInsight {
  date: string
  dominantPlanet: PlanetId
  theme: string
  focus: string
  intensity: "low" | "medium" | "high"
}

export interface FutureInsight {
  rangeLabel: string
  days: FutureDayInsight[]
}

export interface AstrologyStaticResult {
  version: "static-v1"
  generatedAt: string
  observationTimeUtc?: string
  isDayChart: boolean
  assumptions: AstrologyAssumptions
  input: BirthInfo
  positions: Record<PlanetId, AstrologyPosition>
  influences: Record<PlanetId, AstrologyInfluence>
  ranking: PlanetId[]
  today: TodayInsight
  future: FutureInsight
}
