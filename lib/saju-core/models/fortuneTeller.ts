/**
 * Fortune teller data models
 * 사주 데이터 모델 및 Zod 스키마
 */

import { z } from 'zod';
import type { HyungchungResult } from '../saju/hyungchung';

// =============================================================================
// Zod Schemas (Runtime validation)
// =============================================================================

/** FortuneRequest 스키마 */
export const FortuneRequestSchema = z.object({
  /** 생년월일 (YYYY-MM-DD 형식) */
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  /** 출생시간 (HH:MM 형식) */
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format. Use HH:MM'),
  /** 성별 (M/F 또는 m/f) */
  gender: z
    .string()
    .regex(/^[MFmf]$/, 'Gender must be M or F')
    .transform((v) => v.toUpperCase()),
  /** 타임존 */
  timezone: z.string().default('Asia/Seoul'),
});

/** BasicInfo 스키마 */
export const BasicInfoSchema = z.object({
  /** 이름 */
  name: z.string(),
  /** 양력 날짜 */
  solarDate: z.string(),
  /** 음력 날짜 */
  lunarDate: z.string(),
  /** 시간 */
  birthTime: z.string(),
});

/** FiveElements 스키마 */
export const FiveElementsSchema = z.object({
  /** 천간 오행 */
  천간: z.string(),
  /** 지지 오행 */
  지지: z.string(),
});

/** JijangganStem 스키마 */
export const JijangganStemSchema = z.object({
  /** 지장간 (천간) */
  간: z.string(),
  /** 십신 */
  십신: z.string(),
});

/** Pillar 스키마 */
export const PillarSchema = z.object({
  /** 천간 */
  천간: z.string(),
  /** 지지 */
  지지: z.string(),
  /** 오행 */
  오행: FiveElementsSchema,
  /** 십이운성 */
  십이운성: z.string(),
  /** 신살 */
  신살: z.array(z.string()).default([]),
  /** 지장간 정보 */
  지장간: z.array(JijangganStemSchema).default([]),
});

/** Pillars 스키마 */
export const PillarsSchema = z.object({
  /** 시주 */
  시: PillarSchema,
  /** 일주 */
  일: PillarSchema,
  /** 월주 */
  월: PillarSchema,
  /** 년주 */
  년: PillarSchema,
});

/** SajuData 스키마 */
export const SajuDataSchema = z.object({
  /** 기본 정보 */
  basicInfo: BasicInfoSchema,
  /** 사주 사기둥 */
  pillars: PillarsSchema,
});

/** SajuFortuneRequest 스키마 */
export const SajuFortuneRequestSchema = z.object({
  /** 생년월일 (YYYY-MM-DD 형식) */
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  /** 출생시간 (HH:MM 형식) */
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format. Use HH:MM'),
  /** 성별 (M/F 또는 m/f) */
  gender: z
    .string()
    .regex(/^[MFmf]$/, 'Gender must be M or F')
    .transform((v) => v.toUpperCase()),
  /** 운세 타입 (예: saju_4, saju_5, basic) */
  fortuneType: z.string(),
  /** 구조화 프로필 ID (예: life_overview, daily_fortune) */
  profileId: z.string().optional(),
  /** 타임존 */
  timezone: z.string().default('Asia/Seoul'),
});

/** 운세 프로필 메타데이터 스키마 */
export const FortuneProfileInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

/** 구조화 해설 엔트리 스키마 */
export const FortuneProfileEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  fullText: z.string(),
  briefText: z.string(),
  oneLineSummary: z.string(),
  score: z.number().nullable().optional(),
});

/** 구조화 해설 섹션 스키마 */
export const FortuneProfileSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  entries: z.array(FortuneProfileEntrySchema).default([]),
});

/** 테마 요약 스키마 */
export const ThemeInterpretationSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  oneLineSummary: z.string(),
  briefAnalysis: z.string(),
  detailedAnalysis: z.string(),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  advice: z.array(z.string()).default([]),
  luckyElements: z.array(z.string()).default([]),
  unluckyElements: z.array(z.string()).default([]),
  score: z.number(),
  grade: z.string(),
});

/** 구조화 운세 프로필 응답 스키마 */
export const FortuneProfileResultSchema = z.object({
  profile: FortuneProfileInfoSchema,
  sections: z.array(FortuneProfileSectionSchema).default([]),
  theme: ThemeInterpretationSummarySchema.optional(),
});

/** FortuneResponse 스키마 */
export const FortuneResponseSchema = z.object({
  /** 성공 여부 */
  success: z.boolean().default(true),
  /** 사주 데이터 */
  sajuData: SajuDataSchema,
  /** 십신 분석 결과 */
  sipsin: z.record(z.unknown()).optional(),
  /** 신약신강 분석 결과 */
  sinyakSingang: z.record(z.unknown()).optional(),
  /** 대운십신 분석 결과 */
  greatFortune: z.record(z.unknown()).optional(),
  /** 형충파해 분석 결과 */
  hyungchung: z.record(z.unknown()).optional(),
  /** 구조화 운세 프로필 결과 */
  fortuneProfileResult: FortuneProfileResultSchema.optional(),
  /** 계산 시간 */
  timestamp: z.string().or(z.date()).default(() => new Date().toISOString()),
  /** 입력 데이터 */
  inputData: z.record(z.unknown()).default({}),
});

// =============================================================================
// TypeScript Types (Compile-time type checking)
// =============================================================================

/** FortuneRequest 타입 */
export type FortuneRequest = z.infer<typeof FortuneRequestSchema>;

/** BasicInfo 타입 */
export type BasicInfo = z.infer<typeof BasicInfoSchema>;

/** FiveElements 타입 */
export type FiveElements = z.infer<typeof FiveElementsSchema>;

/** JijangganStem 타입 */
export type JijangganStem = z.infer<typeof JijangganStemSchema>;

/** Pillar 타입 */
export type Pillar = z.infer<typeof PillarSchema>;

/** Pillars 타입 */
export type Pillars = z.infer<typeof PillarsSchema>;

/** SajuData 타입 */
export type SajuData = z.infer<typeof SajuDataSchema>;

/** SajuFortuneRequest 타입 */
export type SajuFortuneRequest = z.infer<typeof SajuFortuneRequestSchema>;

/** FortuneProfileInfo 타입 */
export type FortuneProfileInfo = z.infer<typeof FortuneProfileInfoSchema>;

/** FortuneProfileEntry 타입 */
export type FortuneProfileEntry = z.infer<typeof FortuneProfileEntrySchema>;

/** FortuneProfileSection 타입 */
export type FortuneProfileSection = z.infer<typeof FortuneProfileSectionSchema>;

/** ThemeInterpretationSummary 타입 */
export type ThemeInterpretationSummary = z.infer<typeof ThemeInterpretationSummarySchema>;

/** FortuneProfileResult 타입 */
export type FortuneProfileResult = z.infer<typeof FortuneProfileResultSchema>;

/** FortuneResponse 타입 */
export interface FortuneResponse {
  success: boolean;
  sajuData: SajuData;
  sipsin?: Record<string, unknown> | undefined;
  sinyakSingang?: Record<string, unknown> | undefined;
  greatFortune?: Record<string, unknown> | undefined;
  hyungchung?: HyungchungResult | undefined;
  fortuneProfileResult?: FortuneProfileResult | undefined;
  timestamp: string | Date;
  inputData: Record<string, unknown>;
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * FortuneRequest 유효성 검증
 * @param data - 검증할 데이터
 * @returns 검증된 FortuneRequest
 * @throws ZodError - 검증 실패 시
 */
export function validateFortuneRequest(data: unknown): FortuneRequest {
  return FortuneRequestSchema.parse(data);
}

/**
 * SajuFortuneRequest 유효성 검증
 * @param data - 검증할 데이터
 * @returns 검증된 SajuFortuneRequest
 * @throws ZodError - 검증 실패 시
 */
export function validateSajuFortuneRequest(data: unknown): SajuFortuneRequest {
  return SajuFortuneRequestSchema.parse(data);
}

/**
 * FortuneResponse 유효성 검증
 * @param data - 검증할 데이터
 * @returns 검증된 FortuneResponse
 * @throws ZodError - 검증 실패 시
 */
export function validateFortuneResponse(data: unknown): FortuneResponse {
  return FortuneResponseSchema.parse(data);
}
