import type { PlanetId, ZodiacSign } from "@/lib/astrology/static/types"

/* ─── chart-core (derived/chart-core) ─── */

export interface HouseData {
  house: number
  cuspDeg: number
  sign: ZodiacSign
  signLabel: string
  degreeInSign: number
}

export interface ChartCorePlanetPlacement {
  planet: PlanetId
  lonDeg: number
  sign: ZodiacSign
  signLabel: string
  degreeInSign: number
  house: number
}

export interface ChartCoreResponse {
  ascendant: {
    lonDeg: number
    sign: ZodiacSign
    signLabel: string
    degreeInSign: number
  }
  midheaven: {
    lonDeg: number
    sign: ZodiacSign
    signLabel: string
    degreeInSign: number
  }
  houses: HouseData[]
  planets: Record<PlanetId, ChartCorePlanetPlacement>
  observation_time_utc: string
}

/* ─── aspects (derived/aspects) ─── */

export type AspectType =
  | "conjunction"
  | "opposition"
  | "trine"
  | "square"
  | "sextile"

export interface AspectData {
  planet1: PlanetId
  planet2: PlanetId
  type: AspectType
  angleDeg: number
  orbDeg: number
  applying: boolean
}

export interface AspectsResponse {
  aspects: AspectData[]
  observation_time_utc: string
}

/* ─── vedic sidereal core ─── */

export interface NakshatraData {
  name: string
  pada: number
  lord: string
  degreesInNakshatra: number
  startDeg: number
  endDeg: number
}

export interface VedicPlanetPosition {
  planet: PlanetId
  siderealLonDeg: number
  sign: string
  signLabel: string
  degreeInSign: number
  nakshatra: NakshatraData
}

export interface VedicCoreResponse {
  ayanamsa: number
  ayanamsaType: string
  planets: Record<PlanetId, VedicPlanetPosition>
  moonNakshatra: NakshatraData
  observation_time_utc: string
}

/* ─── western essential/accidental scores ─── */

export interface EssentialScoreEntry {
  planet: PlanetId
  score: number
  dignities: string[]
  debilities: string[]
}

export interface EssentialScoreResponse {
  scores: Record<PlanetId, EssentialScoreEntry>
  observation_time_utc: string
}

export interface AccidentalScoreEntry {
  planet: PlanetId
  score: number
  factors: string[]
}

export interface AccidentalScoreResponse {
  scores: Record<PlanetId, AccidentalScoreEntry>
  observation_time_utc: string
}

/* ─── hellenistic core ─── */

export interface HellenisticSectScore {
  in_sect: boolean
  is_above_horizon: boolean | null
  score: number
  rationale: string
}

export interface HellenisticCoreResponse {
  sect: string | null
  sect_score_total: number | null
  sect_scores: Record<string, HellenisticSectScore> | null
  asc_deg: number | null
  mc_deg: number | null
  lot_of_fortune_deg: number | null
  lot_of_spirit_deg: number | null
  lot_of_fortune_sign: string | null
  lot_of_spirit_sign: string | null
  observation_time_utc: string
}

export interface HellenisticProfectionResponse {
  mode: string
  age_years: number
  profected_house: number
  profected_sign: string
  time_lord: string
  monthly_offset: number | null
  observation_time_utc: string
}

/* ─── vedic vimshottari dasha ─── */

export interface DashaPeriod {
  lord: string
  startDate: string
  endDate: string
  level: "maha" | "antar" | "pratyantar"
}

export interface VimshottariResponse {
  currentMahaDasha: DashaPeriod
  currentAntarDasha: DashaPeriod
  currentPratyantarDasha: DashaPeriod
  upcoming: DashaPeriod[]
  observation_time_utc: string
}
