import { normalizeGender } from "@/lib/saju-core/utils"
import {
  hasLocation,
  inferInputTier,
  resolveAssumedBirthTime,
} from "@/lib/astrology/shared/input-normalization"
import type { ZiweiBoardRequest, ZiweiRuntimeOverlayRequest } from "@/lib/schemas/ziwei"
import type {
  NormalizedZiweiInput,
  ZiweiShichenCandidate,
} from "@/lib/ziwei/types"

const SHICHEN_CANDIDATES: ZiweiShichenCandidate[] = [
  { key: "ZI_EARLY", label: "자시(초)", time_index: 0, time_range: "23:00-23:59" },
  { key: "CHOU", label: "축시", time_index: 1, time_range: "01:00-02:59" },
  { key: "YIN", label: "인시", time_index: 2, time_range: "03:00-04:59" },
  { key: "MAO", label: "묘시", time_index: 3, time_range: "05:00-06:59" },
  { key: "CHEN", label: "진시", time_index: 4, time_range: "07:00-08:59" },
  { key: "SI", label: "사시", time_index: 5, time_range: "09:00-10:59" },
  { key: "WU", label: "오시", time_index: 6, time_range: "11:00-12:59" },
  { key: "WEI", label: "미시", time_index: 7, time_range: "13:00-14:59" },
  { key: "SHEN", label: "신시", time_index: 8, time_range: "15:00-16:59" },
  { key: "YOU", label: "유시", time_index: 9, time_range: "17:00-18:59" },
  { key: "XU", label: "술시", time_index: 10, time_range: "19:00-20:59" },
  { key: "HAI", label: "해시", time_index: 11, time_range: "21:00-22:59" },
  { key: "ZI_LATE", label: "자시(정)", time_index: 12, time_range: "00:00-00:59" },
]

const SHICHEN_INDEX_BY_KEY = SHICHEN_CANDIDATES.reduce<Record<string, number>>((acc, item) => {
  acc[item.key] = item.time_index
  return acc
}, {})

function parseHourMinute(time: string): { hour: number; minute: number } | null {
  const [hh, mm] = time.split(":")
  const hour = Number(hh)
  const minute = Number(mm)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

function shichenIndexFromTime(time: string): number {
  const parsed = parseHourMinute(time)
  if (!parsed) return 6
  if (parsed.hour === 23) return 0
  if (parsed.hour === 0) return 12
  return Math.floor((parsed.hour + 1) / 2)
}

function toIztroGender(gender: string): "남성" | "여자" {
  const normalized = normalizeGender(gender)
  return normalized === "F" ? "여자" : "남성"
}

function selectedShichenCandidate(timeIndex: number): ZiweiShichenCandidate[] {
  const hit = SHICHEN_CANDIDATES.find((item) => item.time_index === timeIndex)
  return hit ? [hit] : [{ key: "WU", label: "오시", time_index: 6, time_range: "11:00-12:59" }]
}

export function normalizeZiweiInput(
  input: ZiweiBoardRequest | ZiweiRuntimeOverlayRequest
): NormalizedZiweiInput {
  const assumptions: string[] = []
  const inputTier = inferInputTier(input)

  const qualityFlags = {
    houses_computed: !input.isTimeUnknown,
    time_is_assumed: input.isTimeUnknown,
    location_is_assumed: !hasLocation(input),
  }

  if (input.isTimeUnknown) {
    assumptions.push("birth_time_unknown: local 12:00으로 가정해 명반을 계산했습니다.")
  }
  if (!hasLocation(input)) {
    assumptions.push("location_missing: 위도/경도 없이 계산했습니다.")
  }

  const assumedBirthTime = resolveAssumedBirthTime(input)
  const explicitShichen = input.shichen
  const birthTimeIndex = explicitShichen
    ? SHICHEN_INDEX_BY_KEY[explicitShichen]
    : shichenIndexFromTime(assumedBirthTime)

  let shichenCandidates: ZiweiShichenCandidate[] = selectedShichenCandidate(birthTimeIndex)
  if (input.isTimeUnknown && !explicitShichen) {
    shichenCandidates = SHICHEN_CANDIDATES
    assumptions.push("shichen_fallback: 13개 시진 후보(자시 초/정 포함)를 함께 제공합니다.")
  }
  if (explicitShichen) {
    assumptions.push(`shichen_override: ${explicitShichen}가 우선 적용되었습니다.`)
  }

  if (input.calendar === "LUNAR" && input.isLeapMonth) {
    assumptions.push("lunar_leap_month: 윤달 입력으로 계산했습니다.")
  }
  if (input.school === "ZHONGZHOU") {
    assumptions.push("school_profile: Zhongzhou 알고리즘 설정을 적용했습니다.")
  }
  if (input.plugins.length > 0) {
    assumptions.push(`plugin_profile: ${input.plugins.join(",")} 옵션이 활성화되었습니다.`)
  }

  return {
    source: input,
    calendar: input.calendar,
    school: input.school,
    plugins: input.plugins,
    language: input.language,
    fix_leap: input.fixLeap,
    is_leap_month: input.isLeapMonth,
    gender_for_iztro: toIztroGender(input.gender),
    input_tier: inputTier,
    quality_flags: qualityFlags,
    assumptions,
    birth_date: input.birthDate,
    birth_time: assumedBirthTime,
    birth_time_index: birthTimeIndex,
    birth_timezone: input.timezone,
    shichen_candidates: shichenCandidates,
  }
}

export function resolveRuntimeTarget(
  input: ZiweiRuntimeOverlayRequest
): { targetDate: string; targetTime: string; targetTimeIndex: number; targetTimezone: string } {
  const targetDate = input.targetDate ?? input.birthDate
  const targetTime = input.targetTime ?? (input.targetShichen ? "12:00" : resolveAssumedBirthTime(input))
  const targetTimeIndex = input.targetShichen
    ? SHICHEN_INDEX_BY_KEY[input.targetShichen]
    : shichenIndexFromTime(targetTime)
  const targetTimezone = input.targetTimezone ?? input.timezone

  return { targetDate, targetTime, targetTimeIndex, targetTimezone }
}
