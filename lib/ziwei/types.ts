import type { InputTier } from "@/lib/astrology/shared/input-normalization"
import type {
  ZiweiBoardRequest,
  ZiweiPlugin,
  ZiweiRuntimeOverlayRequest,
  ZiweiSchool,
  ZiweiShichen,
} from "@/lib/schemas/ziwei"

export type ZiweiCalendar = "SOLAR" | "LUNAR"
export type ZiweiEngineId = "iztro"

export interface ZiweiQualityFlags {
  houses_computed: boolean
  time_is_assumed: boolean
  location_is_assumed: boolean
}

export interface ZiweiMeta {
  policy_version: string
  engine: ZiweiEngineId
  engine_version: string
  school: ZiweiSchool
  plugins: ZiweiPlugin[]
  calendar: ZiweiCalendar
}

export interface ZiweiShichenCandidate {
  key: ZiweiShichen
  label: string
  time_index: number
  time_range: string
}

export interface ZiweiStarValue {
  name: string
  type: string
  scope: string
  brightness?: string
  mutagen?: string
}

export interface ZiweiPalaceValue {
  index: number
  name: string
  is_body_palace: boolean
  is_original_palace: boolean
  heavenly_stem: string
  earthly_branch: string
  major_stars: ZiweiStarValue[]
  minor_stars: ZiweiStarValue[]
  adjective_stars: ZiweiStarValue[]
  changsheng12: string
  boshi12: string
  jiangqian12: string
  suiqian12: string
  decadal: {
    range: [number, number]
    heavenly_stem: string
    earthly_branch: string
  }
  ages: number[]
}

export interface ZiweiBoardValue {
  solar_date: string
  lunar_date: string
  chinese_date: string
  time: string
  time_range: string
  sign: string
  zodiac: string
  soul: string
  body: string
  five_elements_class: string
  earthly_branch_of_soul_palace: string
  earthly_branch_of_body_palace: string
  palaces: ZiweiPalaceValue[]
}

export interface ZiweiHoroscopeItem {
  index: number
  name: string
  heavenly_stem: string
  earthly_branch: string
  palace_names: string[]
  mutagen: string[]
  stars: ZiweiStarValue[][]
}

export interface ZiweiRuntimeTimingValue {
  target_date: string
  target_time: string
  target_time_index: number
  target_timezone: string
  decadal: ZiweiHoroscopeItem
  age: ZiweiHoroscopeItem & { nominal_age: number }
  yearly: ZiweiHoroscopeItem & {
    yearly_dec_star?: {
      jiangqian12: string[]
      suiqian12: string[]
    }
  }
  monthly: ZiweiHoroscopeItem
  daily: ZiweiHoroscopeItem
  hourly: ZiweiHoroscopeItem
}

export interface ZiweiBoardResponse {
  meta: ZiweiMeta
  assumptions: string[]
  input_tier: InputTier
  quality_flags: ZiweiQualityFlags
  shichen_candidates: ZiweiShichenCandidate[]
  board: ZiweiBoardValue
}

export interface ZiweiRuntimeOverlayResponse {
  meta: ZiweiMeta
  assumptions: string[]
  input_tier: InputTier
  quality_flags: ZiweiQualityFlags
  shichen_candidates: ZiweiShichenCandidate[]
  board_ref: Pick<
    ZiweiBoardValue,
    | "solar_date"
    | "lunar_date"
    | "time"
    | "time_range"
    | "soul"
    | "body"
    | "earthly_branch_of_soul_palace"
    | "earthly_branch_of_body_palace"
  >
  timing: ZiweiRuntimeTimingValue
}

export interface NormalizedZiweiInput {
  source: ZiweiBoardRequest | ZiweiRuntimeOverlayRequest
  calendar: ZiweiCalendar
  school: ZiweiSchool
  plugins: ZiweiPlugin[]
  language: "ko-KR" | "en-US" | "zh-CN" | "zh-TW" | "ja-JP" | "vi-VN"
  fix_leap: boolean
  is_leap_month: boolean
  gender_for_iztro: "남성" | "여자"
  input_tier: InputTier
  quality_flags: ZiweiQualityFlags
  assumptions: string[]
  birth_date: string
  birth_time: string
  birth_time_index: number
  birth_timezone: string
  shichen_candidates: ZiweiShichenCandidate[]
}
