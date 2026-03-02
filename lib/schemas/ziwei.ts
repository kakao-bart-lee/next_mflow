import { z } from "zod"
import { BirthInfoSchema, isValidHourMinute } from "@/lib/schemas/birth-info"

function isValidIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value })
    return true
  } catch {
    return false
  }
}

export const ZiweiCalendarSchema = z.enum(["SOLAR", "LUNAR"])
export const ZiweiSchoolSchema = z.enum(["DEFAULT", "ZHONGZHOU"])
export const ZiweiPluginSchema = z.enum(["MUTAGEN", "BRIGHTNESS", "YEARLY_DECSTAR"])
export const ZiweiLanguageSchema = z.enum([
  "ko-KR",
  "en-US",
  "zh-CN",
  "zh-TW",
  "ja-JP",
  "vi-VN",
])

export const ZiweiShichenSchema = z.enum([
  "ZI_EARLY",
  "CHOU",
  "YIN",
  "MAO",
  "CHEN",
  "SI",
  "WU",
  "WEI",
  "SHEN",
  "YOU",
  "XU",
  "HAI",
  "ZI_LATE",
])

const ZiweiBoardExtraSchema = z.object({
  calendar: ZiweiCalendarSchema.default("SOLAR"),
  isLeapMonth: z.boolean().optional().default(false),
  school: ZiweiSchoolSchema.optional().default("DEFAULT"),
  plugins: z.array(ZiweiPluginSchema).optional().default([]),
  fixLeap: z.boolean().optional().default(true),
  shichen: ZiweiShichenSchema.optional(),
  language: ZiweiLanguageSchema.optional().default("ko-KR"),
})

const ZiweiRuntimeExtraSchema = z.object({
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다")
    .optional(),
  targetTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "HH:mm 형식이어야 합니다")
    .refine(isValidHourMinute, "유효한 시각이어야 합니다 (00:00~23:59)")
    .optional(),
  targetTimezone: z
    .string()
    .min(1)
    .refine(isValidIanaTimeZone, "유효한 IANA timezone이어야 합니다")
    .optional(),
  targetShichen: ZiweiShichenSchema.optional(),
})

export const ZiweiBoardRequestSchema = BirthInfoSchema.and(ZiweiBoardExtraSchema)
export const ZiweiRuntimeOverlayRequestSchema = ZiweiBoardRequestSchema.and(ZiweiRuntimeExtraSchema)

export type ZiweiBoardRequest = z.infer<typeof ZiweiBoardRequestSchema>
export type ZiweiRuntimeOverlayRequest = z.infer<typeof ZiweiRuntimeOverlayRequestSchema>
export type ZiweiShichen = z.infer<typeof ZiweiShichenSchema>
export type ZiweiSchool = z.infer<typeof ZiweiSchoolSchema>
export type ZiweiPlugin = z.infer<typeof ZiweiPluginSchema>
