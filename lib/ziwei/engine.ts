import { astro } from "iztro"
import { version as IZTRO_VERSION } from "iztro/package.json"
import type { ZiweiBoardRequest, ZiweiRuntimeOverlayRequest } from "@/lib/schemas/ziwei"
import { normalizeZiweiInput, resolveRuntimeTarget } from "@/lib/ziwei/normalizer"
import type {
  ZiweiBoardResponse,
  ZiweiBoardValue,
  ZiweiHoroscopeItem,
  ZiweiMeta,
  ZiweiRuntimeOverlayResponse,
  ZiweiStarValue,
} from "@/lib/ziwei/types"

const POLICY_VERSION = "ziwei-v1.1.0"

export class ZiweiEngineError extends Error {
  status: number
  code: string

  constructor(message: string, status = 422, code = "ZIWEI_CALCULATION_ERROR") {
    super(message)
    this.name = "ZiweiEngineError"
    this.status = status
    this.code = code
  }
}

function asPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function serializeStars(rawStars: unknown): ZiweiStarValue[] {
  if (!Array.isArray(rawStars)) return []
  return rawStars.map((raw) => {
    const star = raw as {
      name?: unknown
      type?: unknown
      scope?: unknown
      brightness?: unknown
      mutagen?: unknown
    }
    return {
      name: String(star.name ?? ""),
      type: String(star.type ?? ""),
      scope: String(star.scope ?? ""),
      ...(star.brightness ? { brightness: String(star.brightness) } : {}),
      ...(star.mutagen ? { mutagen: String(star.mutagen) } : {}),
    }
  })
}

function serializeBoard(astrolabe: unknown): ZiweiBoardValue {
  const plain = asPlainObject(astrolabe) as {
    solarDate?: string
    lunarDate?: string
    chineseDate?: string
    time?: string
    timeRange?: string
    sign?: string
    zodiac?: string
    soul?: string
    body?: string
    fiveElementsClass?: string
    earthlyBranchOfSoulPalace?: string
    earthlyBranchOfBodyPalace?: string
    palaces?: unknown[]
  }

  return {
    solar_date: plain.solarDate ?? "",
    lunar_date: plain.lunarDate ?? "",
    chinese_date: plain.chineseDate ?? "",
    time: plain.time ?? "",
    time_range: plain.timeRange ?? "",
    sign: plain.sign ?? "",
    zodiac: plain.zodiac ?? "",
    soul: plain.soul ?? "",
    body: plain.body ?? "",
    five_elements_class: plain.fiveElementsClass ?? "",
    earthly_branch_of_soul_palace: plain.earthlyBranchOfSoulPalace ?? "",
    earthly_branch_of_body_palace: plain.earthlyBranchOfBodyPalace ?? "",
    palaces: (plain.palaces ?? []).map((raw) => {
      const palace = raw as {
        index?: number
        name?: string
        isBodyPalace?: boolean
        isOriginalPalace?: boolean
        heavenlyStem?: string
        earthlyBranch?: string
        majorStars?: unknown[]
        minorStars?: unknown[]
        adjectiveStars?: unknown[]
        changsheng12?: string
        boshi12?: string
        jiangqian12?: string
        suiqian12?: string
        decadal?: { range?: [number, number]; heavenlyStem?: string; earthlyBranch?: string }
        ages?: number[]
      }
      return {
        index: Number(palace.index ?? 0),
        name: String(palace.name ?? ""),
        is_body_palace: Boolean(palace.isBodyPalace),
        is_original_palace: Boolean(palace.isOriginalPalace),
        heavenly_stem: String(palace.heavenlyStem ?? ""),
        earthly_branch: String(palace.earthlyBranch ?? ""),
        major_stars: serializeStars(palace.majorStars),
        minor_stars: serializeStars(palace.minorStars),
        adjective_stars: serializeStars(palace.adjectiveStars),
        changsheng12: String(palace.changsheng12 ?? ""),
        boshi12: String(palace.boshi12 ?? ""),
        jiangqian12: String(palace.jiangqian12 ?? ""),
        suiqian12: String(palace.suiqian12 ?? ""),
        decadal: {
          range: palace.decadal?.range ?? [0, 0],
          heavenly_stem: String(palace.decadal?.heavenlyStem ?? ""),
          earthly_branch: String(palace.decadal?.earthlyBranch ?? ""),
        },
        ages: Array.isArray(palace.ages) ? palace.ages.map((age) => Number(age)) : [],
      }
    }),
  }
}

function serializeHoroscopeItem(raw: unknown): ZiweiHoroscopeItem {
  const item = raw as {
    index?: number
    name?: string
    heavenlyStem?: string
    earthlyBranch?: string
    palaceNames?: string[]
    mutagen?: string[]
    stars?: unknown[][]
  }
  return {
    index: Number(item.index ?? 0),
    name: String(item.name ?? ""),
    heavenly_stem: String(item.heavenlyStem ?? ""),
    earthly_branch: String(item.earthlyBranch ?? ""),
    palace_names: Array.isArray(item.palaceNames) ? item.palaceNames.map(String) : [],
    mutagen: Array.isArray(item.mutagen) ? item.mutagen.map(String) : [],
    stars: Array.isArray(item.stars)
      ? item.stars.map((group) => serializeStars(group))
      : [],
  }
}

function buildMeta(normalized: ReturnType<typeof normalizeZiweiInput>): ZiweiMeta {
  return {
    policy_version: POLICY_VERSION,
    engine: "iztro",
    engine_version: IZTRO_VERSION,
    school: normalized.school,
    plugins: normalized.plugins,
    calendar: normalized.calendar,
  }
}

function buildAstrolabe(normalized: ReturnType<typeof normalizeZiweiInput>) {
  try {
    return astro.withOptions({
      type: normalized.calendar === "SOLAR" ? "solar" : "lunar",
      dateStr: normalized.birth_date,
      timeIndex: normalized.birth_time_index,
      gender: normalized.gender_for_iztro,
      isLeapMonth: normalized.calendar === "LUNAR" ? normalized.is_leap_month : undefined,
      fixLeap: normalized.fix_leap,
      language: normalized.language,
      config: {
        algorithm: normalized.school === "ZHONGZHOU" ? "zhongzhou" : "default",
      },
    })
  } catch (err) {
    throw new ZiweiEngineError(
      err instanceof Error ? err.message : "자미두수 명반 계산 중 오류가 발생했습니다"
    )
  }
}

export function generateZiweiBoard(input: ZiweiBoardRequest): ZiweiBoardResponse {
  const normalized = normalizeZiweiInput(input)
  const astrolabe = buildAstrolabe(normalized)
  const board = serializeBoard(astrolabe)

  return {
    meta: buildMeta(normalized),
    assumptions: normalized.assumptions,
    input_tier: normalized.input_tier,
    quality_flags: normalized.quality_flags,
    shichen_candidates: normalized.shichen_candidates,
    board,
  }
}

export function generateZiweiRuntimeOverlay(
  input: ZiweiRuntimeOverlayRequest
): ZiweiRuntimeOverlayResponse {
  const normalized = normalizeZiweiInput(input)
  const astrolabe = buildAstrolabe(normalized)
  const board = serializeBoard(astrolabe)

  const target = resolveRuntimeTarget(input)
  let horoscopeRaw: {
    decadal?: unknown
    age?: unknown
    yearly?: unknown
    monthly?: unknown
    daily?: unknown
    hourly?: unknown
    yearlyDecStar?: unknown
    targetDate?: unknown
  }
  try {
    horoscopeRaw = asPlainObject(astrolabe.horoscope(target.targetDate, target.targetTimeIndex))
  } catch (err) {
    throw new ZiweiEngineError(
      err instanceof Error ? err.message : "자미두수 운한 계산 중 오류가 발생했습니다"
    )
  }

  const ageItemRaw = horoscopeRaw.age as { nominalAge?: number } | undefined
  const yearlyRaw = horoscopeRaw.yearly as {
    yearlyDecStar?: { jiangqian12?: string[]; suiqian12?: string[] }
  } | undefined

  return {
    meta: buildMeta(normalized),
    assumptions: normalized.assumptions,
    input_tier: normalized.input_tier,
    quality_flags: normalized.quality_flags,
    shichen_candidates: normalized.shichen_candidates,
    board_ref: {
      solar_date: board.solar_date,
      lunar_date: board.lunar_date,
      time: board.time,
      time_range: board.time_range,
      soul: board.soul,
      body: board.body,
      earthly_branch_of_soul_palace: board.earthly_branch_of_soul_palace,
      earthly_branch_of_body_palace: board.earthly_branch_of_body_palace,
    },
    timing: {
      target_date: target.targetDate,
      target_time: target.targetTime,
      target_time_index: target.targetTimeIndex,
      target_timezone: target.targetTimezone,
      decadal: serializeHoroscopeItem(horoscopeRaw.decadal),
      age: {
        ...serializeHoroscopeItem(horoscopeRaw.age),
        nominal_age: Number(ageItemRaw?.nominalAge ?? 0),
      },
      yearly: {
        ...serializeHoroscopeItem(horoscopeRaw.yearly),
        yearly_dec_star: yearlyRaw?.yearlyDecStar
          ? {
              jiangqian12: yearlyRaw.yearlyDecStar.jiangqian12?.map(String) ?? [],
              suiqian12: yearlyRaw.yearlyDecStar.suiqian12?.map(String) ?? [],
            }
          : undefined,
      },
      monthly: serializeHoroscopeItem(horoscopeRaw.monthly),
      daily: serializeHoroscopeItem(horoscopeRaw.daily),
      hourly: serializeHoroscopeItem(horoscopeRaw.hourly),
    },
  }
}
