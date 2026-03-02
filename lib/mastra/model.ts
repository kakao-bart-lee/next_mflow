import { openai } from "@ai-sdk/openai"
import { createMockModel } from "./mock-model"

/**
 * LLM 모델 팩토리 — MOCK_LLM 분기를 한 곳에서 관리.
 *
 * @param envKey - 환경변수 키 (예: 'MASTRA_SAJU_MODEL'). 미지정 시 기본 모델 사용.
 */
export function getModel(envKey?: string) {
  if (process.env.MOCK_LLM === "true") return createMockModel()
  const modelId =
    (envKey && process.env[envKey]) ||
    process.env.MASTRA_SAJU_MODEL ||
    "gpt-4o-mini"
  return openai(modelId)
}

/**
 * 모델 ID를 직접 받아 LLM 모델 생성 — DB 설정 등 동적 모델 ID용.
 *
 * @param modelId - OpenAI 모델 ID 문자열 (예: 'gpt-4o-mini')
 */
export function getModelById(modelId: string) {
  if (process.env.MOCK_LLM === "true") return createMockModel()
  return openai(modelId)
}
