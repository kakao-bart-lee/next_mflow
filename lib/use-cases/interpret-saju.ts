import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { FortuneResponse } from "@/lib/saju-core";
import { getStringSystemSetting } from "@/lib/system-settings";
import {
  isCreditEnabled,
  consumeCredit,
  CREDIT_COSTS,
} from "@/lib/credit-service";

// =============================================================================
// Schemas — LLM 응답 구조 정의
// =============================================================================

/** 오늘의 운세 응답 스키마 */
export const DailyFortuneSchema = z.object({
  summary: z.string().describe("오늘의 한줄 요약 (20자 내외)"),
  tags: z.array(z.string()).max(3).describe("핵심 키워드 태그 (최대 3개)"),
  body: z
    .string()
    .describe("오늘의 운세 본문 (3-5문장, 사주 데이터 기반 구체적 조언)"),
  actions: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().describe("오늘의 실천 항목"),
      })
    )
    .max(3)
    .describe("오늘 실천할 수 있는 구체적 행동 (최대 3개)"),
  avoid: z.string().describe("오늘 피해야 할 것 (1문장)"),
});

/** 주간 운세 개별 요일 스키마 */
const WeekDaySchema = z.object({
  day: z.string().describe("요일 (월/화/수/목/금/토/일)"),
  date: z.string().describe("날짜 (M/D 형식)"),
  keyword: z.string().describe("해당 일의 핵심 키워드 (2자)"),
  note: z.string().describe("해당 일의 짧은 조언 (15자 내외)"),
  highlight: z.boolean().describe("중요한 날이면 true"),
});

/** 주간 운세 응답 스키마 */
export const WeeklyFortuneSchema = z.object({
  theme: z
    .string()
    .describe("이번 주 전체 테마 (20자 내외)"),
  days: z
    .array(WeekDaySchema)
    .length(7)
    .describe("월요일부터 일요일까지 7일"),
  aiRecap: z.object({
    summary: z.string().describe("주간 요약 한줄"),
    keywords: z
      .array(z.string())
      .max(3)
      .describe("이번 주 핵심 키워드 (최대 3개)"),
    emotionPattern: z
      .string()
      .describe("감정 흐름 패턴 설명 (1-2문장)"),
    suggestion: z
      .string()
      .describe("주간 실천 제안 (1문장)"),
  }),
  prompt: z
    .string()
    .describe("이번 주 사용자에게 던지는 성찰 질문"),
});

export type DailyFortune = z.infer<typeof DailyFortuneSchema>;
export type WeeklyFortune = z.infer<typeof WeeklyFortuneSchema>;

// =============================================================================
// Default prompts (DB에 설정이 없을 때 사용)
// =============================================================================

const DEFAULT_TODAY_PROMPT = `당신은 사주명리학 전문가입니다. 사용자의 사주 데이터를 기반으로 오늘의 운세를 작성합니다.

규칙:
- 한국어 존댓말 사용
- 사주 데이터의 오행, 십신, 신약신강 정보를 반영하여 구체적으로 작성
- 추상적 표현 대신 실질적인 조언 제공
- 긍정적이되 현실적인 톤 유지`;

const DEFAULT_WEEKLY_PROMPT = `당신은 사주명리학 전문가입니다. 사용자의 사주 데이터를 기반으로 7일간의 주간 운세를 작성합니다.

규칙:
- 한국어 존댓말 사용
- 각 요일별로 차별화된 키워드와 조언 제공
- 사주의 오행 흐름에 기반한 에너지 변화를 반영
- highlight는 7일 중 가장 중요한 1-2일만 true
- 실천 가능한 구체적 제안 포함`;

// =============================================================================
// Interpretation functions
// =============================================================================

export type InterpretationType = "daily" | "weekly";

export type InterpretResult<T extends InterpretationType> =
  | { success: true; data: T extends "daily" ? DailyFortune : WeeklyFortune }
  | { success: false; error: string; code: string; status: number };

/**
 * 사주 해석 생성 — LLM을 이용하여 오늘의 운세 / 주간 운세 생성
 */
export async function interpretSaju<T extends InterpretationType>(
  type: T,
  sajuData: FortuneResponse,
  weekStartDate?: string,
  userId?: string
): Promise<InterpretResult<T>> {
  // 크레딧 차감 (활성화된 경우)
  if (isCreditEnabled() && userId) {
    try {
      const cost =
        type === "daily"
          ? CREDIT_COSTS.CHAT_MESSAGE
          : CREDIT_COSTS.CHAT_MESSAGE * 2;
      const result = await consumeCredit(
        userId,
        cost,
        type === "daily" ? "오늘의 운세" : "주간 운세"
      );
      if (!result.success) {
        return {
          success: false,
          error: "크레딧이 부족합니다",
          code: "INSUFFICIENT_CREDITS",
          status: 402,
        };
      }
    } catch (err) {
      console.warn("크레딧 차감 실패:", err);
    }
  }

  // DB에서 프롬프트 로드 (없으면 기본값)
  const settingKey =
    type === "daily" ? "saju_today_prompt" : "saju_weekly_prompt";
  const defaultPrompt =
    type === "daily" ? DEFAULT_TODAY_PROMPT : DEFAULT_WEEKLY_PROMPT;
  const systemPrompt = await getStringSystemSetting(settingKey, defaultPrompt);

  // 사주 컨텍스트 구성
  const sajuContext = buildSajuContext(sajuData, type, weekStartDate);

  // LLM 호출
  try {
    const schema =
      type === "daily" ? DailyFortuneSchema : WeeklyFortuneSchema;
    const model = openai(process.env.MASTRA_SAJU_MODEL || "gpt-4o-mini");

    const result = await generateObject({
      model,
      schema,
      system: systemPrompt,
      prompt: sajuContext,
    });

    return { success: true, data: result.object } as InterpretResult<T>;
  } catch (err) {
    console.error("LLM 해석 생성 실패:", err);
    return {
      success: false,
      error: "운세 생성 중 오류가 발생했습니다",
      code: "LLM_ERROR",
      status: 500,
    };
  }
}

// =============================================================================
// Context builder
// =============================================================================

function buildSajuContext(
  sajuData: FortuneResponse,
  type: InterpretationType,
  weekStartDate?: string
): string {
  const pillars = sajuData.sajuData.pillars;
  const lines: string[] = [];

  lines.push("## 사주 데이터");
  lines.push(`- 년주: ${pillars.년.천간} ${pillars.년.지지}`);
  lines.push(`- 월주: ${pillars.월.천간} ${pillars.월.지지}`);
  lines.push(`- 일주: ${pillars.일.천간} ${pillars.일.지지}`);
  lines.push(`- 시주: ${pillars.시.천간} ${pillars.시.지지}`);

  // 오행 정보
  lines.push(`\n## 오행 분포`);
  lines.push(
    `- 년: 천간=${pillars.년.오행.천간}, 지지=${pillars.년.오행.지지}`
  );
  lines.push(
    `- 월: 천간=${pillars.월.오행.천간}, 지지=${pillars.월.오행.지지}`
  );
  lines.push(
    `- 일: 천간=${pillars.일.오행.천간}, 지지=${pillars.일.오행.지지}`
  );
  lines.push(
    `- 시: 천간=${pillars.시.오행.천간}, 지지=${pillars.시.오행.지지}`
  );

  // 십이운성
  lines.push(`\n## 십이운성`);
  lines.push(
    `- 년: ${pillars.년.십이운성}, 월: ${pillars.월.십이운성}, 일: ${pillars.일.십이운성}, 시: ${pillars.시.십이운성}`
  );

  // 신살
  const allSinsal = [
    ...pillars.년.신살,
    ...pillars.월.신살,
    ...pillars.일.신살,
    ...pillars.시.신살,
  ];
  if (allSinsal.length > 0) {
    lines.push(`\n## 신살: ${allSinsal.join(", ")}`);
  }

  // 기본정보
  lines.push(`\n## 기본정보`);
  lines.push(`- 양력: ${sajuData.sajuData.basicInfo.solarDate}`);
  lines.push(`- 음력: ${sajuData.sajuData.basicInfo.lunarDate}`);

  // 타입별 추가 지시
  if (type === "daily") {
    const today = new Date().toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
    lines.push(`\n## 오늘 날짜: ${today}`);
    lines.push(
      "위 사주 데이터를 기반으로 오늘의 운세를 작성해주세요."
    );
  } else {
    const range = weekStartDate || new Date().toISOString().slice(0, 10);
    lines.push(`\n## 주간 시작일: ${range}`);
    lines.push(
      "위 사주 데이터를 기반으로 이번 주 7일간의 운세를 작성해주세요. 각 요일의 date는 M/D 형식으로 작성합니다."
    );
  }

  return lines.join("\n");
}
