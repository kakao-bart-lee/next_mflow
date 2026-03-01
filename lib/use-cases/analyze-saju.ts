import { FortuneTellerService } from "@/lib/saju-core/facade";
import type { BirthInfo } from "@/lib/schemas/birth-info";
import {
  consumeCredit,
  isCreditEnabled,
  CREDIT_COSTS,
} from "@/lib/credit-service";

export type AnalyzeSajuResult =
  | { success: true; data: ReturnType<FortuneTellerService["calculateSaju"]> }
  | { success: false; error: string; code: string; status: number };

const service = new FortuneTellerService();

export async function analyzeSaju(
  birthInfo: BirthInfo,
  userId?: string,
  currentAge?: number
): Promise<AnalyzeSajuResult> {
  // 계산 먼저 — 실패 시 크레딧 차감 안 함
  let data: ReturnType<FortuneTellerService["calculateSaju"]>;
  try {
    // 시간 미상일 경우 정오(12:00)로 대체 — FortuneRequest는 string 타입 필수
    const birthTime = birthInfo.isTimeUnknown ? "12:00" : (birthInfo.birthTime ?? "12:00");
    data = service.calculateSaju(
      {
        birthDate: birthInfo.birthDate,
        birthTime,
        gender: birthInfo.gender,
        timezone: birthInfo.timezone,
      },
      currentAge
    );
  } catch (err) {
    return {
      success: false,
      error: "사주 계산 중 오류가 발생했습니다",
      code: "CALCULATION_ERROR",
      status: 500,
    };
  }

  // 크레딧 차감 (활성화된 경우에만)
  if (isCreditEnabled() && userId) {
    try {
      const result = await consumeCredit(userId, CREDIT_COSTS.SAJU_ANALYSIS, "사주 분석");
      if (!result.success) {
        return {
          success: false,
          error: "크레딧이 부족합니다",
          code: "INSUFFICIENT_CREDITS",
          status: 402,
        };
      }
    } catch (err) {
      console.warn("크레딧 차감 실패 (DB 미연결 가능):", err);
    }
  }

  return { success: true, data };
}
