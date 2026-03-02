import type { BirthInfo } from "@/lib/schemas/birth-info"

export type InputTier = "L0" | "L1" | "L2" | "L3"
export type TimeAccuracy = "minute" | "hour" | "day" | "unknown"

export interface HarunaBirthPayload {
  local_datetime: string
  timezone: string
  time_accuracy: TimeAccuracy
}

export interface HarunaLocationPayload {
  longitude_deg: number
  latitude_deg: number
  altitude_m: number
}

function hasTime(input: BirthInfo): boolean {
  return !input.isTimeUnknown && Boolean(input.birthTime)
}

export function hasLocation(input: BirthInfo): boolean {
  return typeof input.latitude === "number" && typeof input.longitude === "number"
}

export function inferInputTier(input: BirthInfo): InputTier {
  const hasDate = Boolean(input.birthDate)
  const hasBirthTime = hasTime(input)
  const hasBirthLocation = hasLocation(input)

  if (hasDate && hasBirthTime && hasBirthLocation) return "L3"
  if (hasDate && hasBirthLocation) return "L2"
  if (hasDate && hasBirthTime) return "L1"
  return "L0"
}

export function inferTimeAccuracy(input: BirthInfo): TimeAccuracy {
  if (input.isTimeUnknown) return "unknown"
  if (input.birthTime) return "minute"
  return "day"
}

export function resolveAssumedBirthTime(input: BirthInfo): string {
  return input.isTimeUnknown ? "12:00" : input.birthTime ?? "12:00"
}

export function toLocalDateTime(input: BirthInfo): string {
  return `${input.birthDate}T${resolveAssumedBirthTime(input)}:00`
}

export function toHarunaBirthPayload(input: BirthInfo): HarunaBirthPayload {
  return {
    local_datetime: toLocalDateTime(input),
    timezone: input.timezone,
    time_accuracy: inferTimeAccuracy(input),
  }
}

export function toHarunaLocationPayload(
  input: BirthInfo,
  altitude_m = 0
): HarunaLocationPayload | null {
  if (!hasLocation(input)) return null
  return {
    longitude_deg: input.longitude as number,
    latitude_deg: input.latitude as number,
    altitude_m,
  }
}
