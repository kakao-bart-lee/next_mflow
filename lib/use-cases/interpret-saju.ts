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
import { logLlmUsage } from "@/lib/llm-usage";

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

export const DecisionFortuneSchema = z.object({
  recommendation: z.enum(["A", "B"]).describe("추천하는 선택지"),
  headline: z.string().describe("결정 가이드 한줄 요약 (20자 내외)"),
  body: z
    .string()
    .describe("사주 기반 결정 조언 (3-5문장, 오행과 십신 흐름 반영)"),
  reasoning: z
    .string()
    .describe("사주 관점에서 이 선택을 추천하는 이유 (2-3문장)"),
  caution: z.string().describe("선택 시 주의할 점 (1문장)"),
  keywords: z.array(z.string()).max(3).describe("핵심 키워드"),
});

export type DailyFortune = z.infer<typeof DailyFortuneSchema>;
export type WeeklyFortune = z.infer<typeof WeeklyFortuneSchema>;
export type DecisionFortune = z.infer<typeof DecisionFortuneSchema>;

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

const DEFAULT_DECISION_PROMPT = `당신은 사주명리학 전문가입니다. 사용자가 두 가지 선택지 사이에서 고민하고 있습니다.
사주 데이터의 오행 균형, 십신 관계, 현재 대운을 분석하여 어떤 선택이 지금 기운과 더 맞는지 조언해주세요.

규칙:
- 한국어 존댓말 사용
- 사주 데이터를 구체적으로 인용하여 설명
- 단정적이기보다 방향성 제시
- 선택지 A와 B 모두의 장단점을 언급하되, 하나를 추천`;

// =============================================================================
// Interpretation functions
// =============================================================================

export type InterpretationType = "daily" | "weekly" | "decision";

type DecisionContext = {
  optionA: string;
  optionB: string;
  answers: Record<string, string>;
};

export type InterpretResult<T extends InterpretationType> =
  | {
      success: true;
      data: T extends "daily"
        ? DailyFortune
        : T extends "weekly"
          ? WeeklyFortune
          : DecisionFortune;
    }
  | { success: false; error: string; code: string; status: number };

/**
 * 사주 해석 생성 — LLM을 이용하여 오늘의 운세 / 주간 운세 생성
 */
export async function interpretSaju<T extends InterpretationType>(
  type: T,
  sajuData: FortuneResponse,
  weekStartDate?: string,
  userId?: string,
  decisionContext?: DecisionContext
): Promise<InterpretResult<T>> {
  // 크레딧 잔액 확인 (활성화된 경우, 실제 차감은 LLM 성공 후)
  const creditCost =
    type === "weekly" ? CREDIT_COSTS.CHAT_MESSAGE * 2 : CREDIT_COSTS.CHAT_MESSAGE;
  const creditLabel =
    type === "daily" ? "오늘의 운세" : type === "weekly" ? "주간 운세" : "결정 운세";

  // DB에서 프롬프트 로드 (없으면 기본값)
  const settingKey =
    type === "daily"
      ? "saju_today_prompt"
      : type === "weekly"
        ? "saju_weekly_prompt"
        : "saju_decision_prompt";
  const defaultPrompt =
    type === "daily"
      ? DEFAULT_TODAY_PROMPT
      : type === "weekly"
        ? DEFAULT_WEEKLY_PROMPT
        : DEFAULT_DECISION_PROMPT;
  const systemPrompt = await getStringSystemSetting(settingKey, defaultPrompt);

  // 사주 컨텍스트 구성
  const sajuContext = buildSajuContext(
    sajuData,
    type,
    weekStartDate,
    decisionContext
  );

  // LLM 호출
  try {
    const schema =
      type === "daily"
        ? DailyFortuneSchema
        : type === "weekly"
          ? WeeklyFortuneSchema
          : DecisionFortuneSchema;
    const model = openai(process.env.MASTRA_SAJU_MODEL || "gpt-4o-mini");

    const startTime = Date.now();
    const result = await generateObject({
      model,
      schema,
      system: systemPrompt,
      prompt: sajuContext,
    });

    void logLlmUsage({
      endpoint: `interpret-${type}`,
      modelId: process.env.MASTRA_SAJU_MODEL || "gpt-4o-mini",
      userId,
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
      latencyMs: Date.now() - startTime,
      method: "generateObject",
    });

    // LLM 성공 후 크레딧 차감
    if (isCreditEnabled() && userId) {
      try {
        const creditResult = await consumeCredit(userId, creditCost, creditLabel);
        if (!creditResult.success) {
          return {
            success: false,
            error: "크레딧이 부족합니다",
            code: "INSUFFICIENT_CREDITS",
            status: 402,
          };
        }
      } catch (err) {
        console.error("크레딧 차감 실패 (LLM 결과 폐기):", err);
        return {
          success: false,
          error: "크레딧 처리 중 오류가 발생했습니다",
          code: "CREDIT_ERROR",
          status: 503,
        };
      }
    }

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
  weekStartDate?: string,
  decisionContext?: DecisionContext
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
  } else if (type === "weekly") {
    const range = weekStartDate || new Date().toISOString().slice(0, 10);
    lines.push(`\n## 주간 시작일: ${range}`);
    lines.push(
      "위 사주 데이터를 기반으로 이번 주 7일간의 운세를 작성해주세요. 각 요일의 date는 M/D 형식으로 작성합니다."
    );
  } else {
    lines.push("\n## 선택지");
    lines.push(`- A: ${decisionContext?.optionA || ""}`);
    lines.push(`- B: ${decisionContext?.optionB || ""}`);

    lines.push("\n## 사용자 답변");
    const answerEntries = Object.entries(decisionContext?.answers || {});
    if (answerEntries.length === 0) {
      lines.push("- (없음)");
    } else {
      for (const [question, answer] of answerEntries) {
        lines.push(`- ${question}: ${answer}`);
      }
    }

    lines.push(
      "위 사주 데이터와 선택지/답변을 기반으로 어떤 선택이 지금의 기운에 더 적합한지 결정 조언을 작성해주세요."
    );
  }

  return lines.join("\n");
}
