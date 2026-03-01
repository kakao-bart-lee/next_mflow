import { z } from "zod";

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
      .nullable()
      .optional(),
    isTimeUnknown: z.boolean(),
    timezone: z.string().min(1),
    gender: z.enum(["M", "F"]),
    // 위치 정보 (선택, 점성술 및 정밀 사주에 활용)
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    locationName: z.string().optional(),
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
