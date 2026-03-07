import { z } from "zod";

function isValidIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function isValidHourMinute(value: string): boolean {
  const [hh, mm] = value.split(":");
  const hour = Number(hh);
  const minute = Number(mm);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return false;
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

/**
 * 생년월일 + 위치 정보 스키마
 *
 * latitude/longitude는 optional이며 점성술 계산 및 정밀 시간대 보정에 사용됩니다.
 * mflow의 BirthInfoSchema를 확장해 위치 좌표를 추가했습니다.
 */
export const BirthInfoSchema = z
  .object({
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다"),
    // HH:mm (24h), 시간 모를 경우 null
    birthTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "HH:mm 형식이어야 합니다")
      .refine(isValidHourMinute, "유효한 시각이어야 합니다 (00:00~23:59)")
      .nullable()
      .optional(),
    isTimeUnknown: z.boolean(),
    timezone: z
      .string()
      .min(1)
      .refine(isValidIanaTimeZone, "유효한 IANA timezone이어야 합니다"),
    gender: z.enum(["M", "F"]),
    // 위치 정보 (선택, 점성술 및 정밀 사주에 활용)
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    locationName: z.string().optional(),
    // 사상체질: ty=태양인, sy=소양인, tu=태음인, su=소음인 (optional, G028 궁합용)
    sasangConstitution: z.enum(["ty", "sy", "tu", "su"]).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.isTimeUnknown) {
      if (val.birthTime !== null && val.birthTime !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "isTimeUnknown이 true이면 birthTime은 null이어야 합니다",
          path: ["birthTime"],
        });
      }
      return;
    }
    if (!val.birthTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "isTimeUnknown이 false이면 birthTime이 필요합니다",
        path: ["birthTime"],
      });
    }
  });

export type BirthInfo = z.infer<typeof BirthInfoSchema>;
