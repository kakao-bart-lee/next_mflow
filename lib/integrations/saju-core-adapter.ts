import { FortuneTellerService } from "@/lib/saju-core/facade";
import type { FortuneRequest, FortuneResponse } from "@/lib/saju-core";
import type { BirthInfo } from "@/lib/schemas/birth-info";

/**
 * 기준 저장소 고정값.
 * 포팅 커밋은 반드시 이 SHA를 메시지에 남긴다.
 */
export const SAJU_CORE_BASELINE_SHA = "cdbd4c77147395d1fc757a6069635ae3633c8ed1";
export const SAJU_CORE_BASELINE_SHORT_SHA = SAJU_CORE_BASELINE_SHA.slice(0, 7);

export interface SajuCoreEngineMetadata {
  source: "saju-core-lib";
  baselineSha: string;
  adapter: "next_mflow/lib/integrations/saju-core-adapter";
}

let service: FortuneTellerService | null = null;

function getService(): FortuneTellerService {
  service ??= new FortuneTellerService();
  return service;
}

export function getSajuCoreEngineMetadata(): SajuCoreEngineMetadata {
  return {
    source: "saju-core-lib",
    baselineSha: SAJU_CORE_BASELINE_SHA,
    adapter: "next_mflow/lib/integrations/saju-core-adapter",
  };
}

export function toFortuneRequest(birthInfo: BirthInfo): FortuneRequest {
  return {
    birthDate: birthInfo.birthDate,
    birthTime: birthInfo.isTimeUnknown ? "12:00" : (birthInfo.birthTime ?? "12:00"),
    gender: birthInfo.gender,
    timezone: birthInfo.timezone,
  };
}

export function calculateSajuFromBirthInfo(
  birthInfo: BirthInfo,
  currentAge?: number
): FortuneResponse {
  return getService().calculateSaju(toFortuneRequest(birthInfo), currentAge);
}

export function getSajuFortuneFromBirthInfo(
  birthInfo: BirthInfo,
  fortuneTypeOrProfileId: string,
  currentAge?: number
): FortuneResponse {
  return getService().getSajuFortune(
    toFortuneRequest(birthInfo),
    fortuneTypeOrProfileId,
    currentAge
  );
}
