import { streamText, generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import type { FortuneResponse } from "@/lib/saju-core"
import type { AstrologyStaticResult } from "@/lib/astrology/static/types"
import { SAJU_MASTER_PERSONA, buildSajuMasterContext } from "@/lib/mastra/agents/saju-master-agent"
import { ASTROLOGER_PERSONA, buildAstrologerContext } from "@/lib/mastra/agents/astrologer-agent"
import { getSystemSettingsByKeys } from "@/lib/system-settings"

// =============================================================================
// Settings
// =============================================================================

export interface DebateSettings {
  model: string
  turnCount: number
  sajuPersona: string
  astrologerPersona: string
  synthesisPrompt: string
  mockMode: boolean
  creditCost: number
  enabled: boolean
}

const DEFAULT_SYNTHESIS_PROMPT = `당신은 동서양 운명학의 종합 분석가입니다. 사주 명리사와 점성술사의 토론 내용을 분석하여 구조화된 요약을 생성합니다.
한국어 존댓말로 작성하세요. 구체적이고 실용적인 내용을 포함하세요.`

const DEBATE_SETTING_KEYS = [
  "debate_enabled",
  "debate_mock_mode",
  "debate_model",
  "debate_turn_count",
  "debate_credit_cost",
  "debate_saju_persona",
  "debate_astrologer_persona",
  "debate_synthesis_prompt",
] as const

export async function loadDebateSettings(): Promise<DebateSettings> {
  const raw = await getSystemSettingsByKeys([...DEBATE_SETTING_KEYS])

  return {
    enabled: raw.debate_enabled !== "false",
    mockMode: raw.debate_mock_mode === "true",
    model: typeof raw.debate_model === "string" && raw.debate_model
      ? raw.debate_model
      : "gpt-4o-mini",
    turnCount: validTurnCount(raw.debate_turn_count),
    creditCost: typeof raw.debate_credit_cost === "number"
      ? raw.debate_credit_cost
      : 3,
    sajuPersona: typeof raw.debate_saju_persona === "string" && raw.debate_saju_persona
      ? raw.debate_saju_persona
      : SAJU_MASTER_PERSONA,
    astrologerPersona: typeof raw.debate_astrologer_persona === "string" && raw.debate_astrologer_persona
      ? raw.debate_astrologer_persona
      : ASTROLOGER_PERSONA,
    synthesisPrompt: typeof raw.debate_synthesis_prompt === "string" && raw.debate_synthesis_prompt
      ? raw.debate_synthesis_prompt
      : DEFAULT_SYNTHESIS_PROMPT,
  }
}

function validTurnCount(val: unknown): number {
  const n = typeof val === "number" ? val : 4
  if (n < 2 || n > 8 || n % 2 !== 0) return 4
  return n
}

// =============================================================================
// Types
// =============================================================================

export const DebateSummarySchema = z.object({
  headline: z.string().describe("20자 한줄 요약"),
  agreement: z.string().describe("두 전문가가 합의한 핵심 (2-3문장)"),
  sajuHighlight: z.string().describe("사주 관점 핵심 (1-2문장)"),
  astroHighlight: z.string().describe("점성술 관점 핵심 (1-2문장)"),
  advice: z.string().describe("종합 실천 조언 (2-3문장)"),
  keywords: z.array(z.string()).max(3).describe("최대 3개 키워드"),
  overallTone: z.enum(["positive", "cautious", "mixed"]).describe("전체 분위기"),
})

export type DebateSummary = z.infer<typeof DebateSummarySchema>

export type DebateAgent = "saju-master" | "astrologer"

interface TurnConfig {
  agent: DebateAgent
  turn: number
  name: string
  avatar: string
}

/** NDJSON 이벤트 타입 */
export type DebateEvent =
  | { type: "debate-start"; totalTurns: number }
  | { type: "turn-start"; agent: DebateAgent; turn: number; name: string; avatar: string }
  | { type: "text-delta"; agent: DebateAgent; delta: string }
  | { type: "turn-end"; agent: DebateAgent; turn: number }
  | { type: "synthesis-start" }
  | { type: "synthesis-result"; summary: DebateSummary }
  | { type: "debate-end" }
  | { type: "error"; message: string }

// =============================================================================
// Turn Protocol (동적 생성)
// =============================================================================

const DEFAULT_TURN_SEQUENCE: TurnConfig[] = [
  { agent: "saju-master", turn: 1, name: "사주 명리사", avatar: "scroll" },
  { agent: "astrologer", turn: 2, name: "점성술사", avatar: "star" },
  { agent: "saju-master", turn: 3, name: "사주 명리사", avatar: "scroll" },
  { agent: "astrologer", turn: 4, name: "점성술사", avatar: "star" },
]

function buildTurnSequence(turnCount: number): TurnConfig[] {
  const seq: TurnConfig[] = []
  for (let i = 1; i <= turnCount; i++) {
    const isSaju = i % 2 === 1
    seq.push({
      agent: isSaju ? "saju-master" : "astrologer",
      turn: i,
      name: isSaju ? "사주 명리사" : "점성술사",
      avatar: isSaju ? "scroll" : "star",
    })
  }
  return seq
}

// =============================================================================
// Orchestrator
// =============================================================================

/**
 * 사주 × 점성술 에이전트 토론 실행기
 *
 * 5턴 결정론적 프로토콜:
 * 1. 사주 명리사 초기 해석
 * 2. 점성술사 초기 해석
 * 3. 사주 명리사 반론/보완
 * 4. 점성술사 반론/보완
 * 5. 종합 요약 (generateObject)
 *
 * 각 턴을 NDJSON으로 실시간 스트리밍합니다.
 */
export async function runDebate(
  sajuResult: FortuneResponse,
  astrologyResult: AstrologyStaticResult,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  settings?: DebateSettings,
): Promise<DebateSummary> {
  const encoder = new TextEncoder()
  const turnTexts: Record<number, string> = {}

  const model = settings?.model || process.env.MASTRA_SAJU_MODEL || "gpt-4o-mini"
  const turnSequence = settings
    ? buildTurnSequence(settings.turnCount)
    : DEFAULT_TURN_SEQUENCE
  const sajuPersona = settings?.sajuPersona || SAJU_MASTER_PERSONA
  const astrologerPersona = settings?.astrologerPersona || ASTROLOGER_PERSONA
  const synthesisSystem = settings?.synthesisPrompt || DEFAULT_SYNTHESIS_PROMPT

  function emit(event: DebateEvent) {
    writer.write(encoder.encode(JSON.stringify(event) + "\n"))
  }

  emit({ type: "debate-start", totalTurns: turnSequence.length + 1 })

  // 에이전트 스트리밍 턴
  for (const config of turnSequence) {
    emit({
      type: "turn-start",
      agent: config.agent,
      turn: config.turn,
      name: config.name,
      avatar: config.avatar,
    })

    const prompt = buildTurnPrompt(config, sajuResult, astrologyResult, turnTexts)
    const system = config.agent === "saju-master"
      ? sajuPersona
      : astrologerPersona

    let fullText = ""

    const result = streamText({
      model: openai(model),
      system,
      prompt,
    })

    for await (const chunk of result.textStream) {
      fullText += chunk
      emit({ type: "text-delta", agent: config.agent, delta: chunk })
    }

    turnTexts[config.turn] = fullText
    emit({ type: "turn-end", agent: config.agent, turn: config.turn })
  }

  // 종합 요약 (structured output)
  emit({ type: "synthesis-start" })

  const synthesisPrompt = buildSynthesisPrompt(turnTexts)
  const summaryResult = await generateObject({
    model: openai(model),
    schema: DebateSummarySchema,
    system: synthesisSystem,
    prompt: synthesisPrompt,
  })

  const summary = summaryResult.object

  emit({ type: "synthesis-result", summary })
  emit({ type: "debate-end" })

  return summary
}

// =============================================================================
// Prompt builders
// =============================================================================

function buildTurnPrompt(
  config: TurnConfig,
  sajuResult: FortuneResponse,
  astrologyResult: AstrologyStaticResult,
  turnTexts: Record<number, string>,
): string {
  const { agent, turn } = config

  if (agent === "saju-master") {
    const phase = turn === 1 ? "initial" as const : "rebuttal" as const
    // 반론 시 직전 점성술사 텍스트 전달
    const opponentText = turn === 3 ? turnTexts[2] : undefined
    return buildSajuMasterContext(sajuResult, phase, opponentText)
  } else {
    const phase = turn === 2 ? "initial" as const : "rebuttal" as const
    // 반론 시 직전 사주 명리사 텍스트(턴 1 + 턴 3) 전달
    const opponentText = turn === 4
      ? `[턴 1 해석]\n${turnTexts[1]}\n\n[턴 3 반론]\n${turnTexts[3]}`
      : undefined
    return buildAstrologerContext(astrologyResult, phase, opponentText)
  }
}

function buildSynthesisPrompt(turnTexts: Record<number, string>): string {
  const lines: string[] = [
    "## 토론 내용",
    "",
    "### 턴 1: 사주 명리사 — 초기 해석",
    turnTexts[1] ?? "",
    "",
    "### 턴 2: 점성술사 — 초기 해석",
    turnTexts[2] ?? "",
    "",
    "### 턴 3: 사주 명리사 — 반론/보완",
    turnTexts[3] ?? "",
    "",
    "### 턴 4: 점성술사 — 반론/보완",
    turnTexts[4] ?? "",
    "",
    "위 4턴의 토론을 종합하여:",
    "- 두 전문가가 합의한 핵심 포인트",
    "- 각 관점의 고유한 인사이트",
    "- 사용자를 위한 실질적 조언",
    "을 구조화된 형태로 요약해주세요.",
  ]
  return lines.join("\n")
}
