import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

// =============================================================================
// Types
// =============================================================================

export interface LlmUsageLogParams {
  endpoint: string
  modelId: string
  userId?: string | null
  inputTokens: number
  outputTokens: number
  latencyMs?: number
  method: "streamText" | "generateObject" | "orchestrator.generate" | "agent.stream"
  metadata?: Record<string, unknown>
}

interface ModelPricing {
  inputPricePer1M: number
  outputPricePer1M: number
  fetchedAt: number
}

// =============================================================================
// 인메모리 가격 캐시 (60초 TTL)
// =============================================================================

const CACHE_TTL_MS = 60_000
const pricingCache = new Map<string, ModelPricing>()

async function getModelPricing(modelId: string): Promise<ModelPricing | null> {
  const cached = pricingCache.get(modelId)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached
  }

  const model = await prisma.llmModel.findUnique({
    where: { modelId },
    select: { inputPricePer1M: true, outputPricePer1M: true },
  })

  if (!model) return null

  const pricing: ModelPricing = {
    inputPricePer1M: model.inputPricePer1M,
    outputPricePer1M: model.outputPricePer1M,
    fetchedAt: Date.now(),
  }
  pricingCache.set(modelId, pricing)
  return pricing
}

// =============================================================================
// 비용 계산
// =============================================================================

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  pricing: { inputPricePer1M: number; outputPricePer1M: number },
): number {
  return (
    (inputTokens * pricing.inputPricePer1M) / 1_000_000 +
    (outputTokens * pricing.outputPricePer1M) / 1_000_000
  )
}

// =============================================================================
// Fire-and-forget 로깅 — 절대 throw하지 않음
// =============================================================================

/**
 * LLM 토큰 사용량을 DB에 기록합니다.
 *
 * - Fire-and-forget: 에러가 발생해도 throw하지 않음
 * - 호출자는 `void logLlmUsage(...)` 로 사용
 * - 미등록 모델은 costUsd: 0으로 기록 + console.warn
 */
export async function logLlmUsage(params: LlmUsageLogParams): Promise<void> {
  try {
    const pricing = await getModelPricing(params.modelId)

    let costUsd = 0
    if (pricing) {
      costUsd = calculateCost(params.inputTokens, params.outputTokens, pricing)
    } else {
      console.warn(
        `[llm-usage] 미등록 모델 "${params.modelId}" — costUsd=0으로 기록`,
      )
    }

    await prisma.llmUsageLog.create({
      data: {
        endpoint: params.endpoint,
        modelId: params.modelId,
        userId: params.userId ?? null,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        costUsd,
        latencyMs: params.latencyMs ?? null,
        method: params.method,
        metadata: (params.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    })
  } catch (err) {
    // Fire-and-forget: 로깅 실패가 서비스를 죽이면 안 됨
    console.error("[llm-usage] 사용량 기록 실패:", err)
  }
}

// =============================================================================
// 캐시 초기화 (테스트 전용)
// =============================================================================

export function _clearPricingCache(): void {
  pricingCache.clear()
}
