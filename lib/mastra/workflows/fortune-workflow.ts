import { calculateAstrologyWithOptions } from "@/lib/astrology/static/calculator"
import { analyzeZiweiBoard } from "@/lib/use-cases/analyze-ziwei"
import type { BirthInfo } from "@/lib/schemas/birth-info"
import { calculateSajuFromBirthInfo } from "@/lib/integrations/saju-core-adapter"
import {
  classifyIntentByKeywords,
  ContextBundleSchemas,
  type ContextBundleId,
} from "../context-bundles"
import { chatAgent } from "../agents/chat-agent"

export interface FortuneWorkflowInput {
  userMessage: string
  birthInfo: BirthInfo
  currentAge?: number
}

export interface FortuneWorkflowOutput {
  response: string
  bundleId: ContextBundleId
  usedData: {
    saju?: Record<string, unknown>
    astrology?: Record<string, unknown>
    ziwei?: Record<string, unknown>
  }
}

export async function runFortuneWorkflow(
  input: FortuneWorkflowInput
): Promise<FortuneWorkflowOutput> {
  const classification = classifyIntentByKeywords(input.userMessage)
  const bundle = ContextBundleSchemas[classification.bundleId]

  const sajuData = await fetchSajuData(input, classification.bundleId)
  const astrologyData = await fetchAstrologyData(input, classification.bundleId)
  const ziweiData = await fetchZiweiData(input, classification.bundleId)

  const contextSections = [
    "## 컨텍스트 데이터",
    "",
    "### 사주 데이터",
    JSON.stringify(sajuData, null, 2),
    "",
    "### 점성술 데이터",
    JSON.stringify(astrologyData, null, 2),
    "",
    "### 자미두수 데이터",
    JSON.stringify(ziweiData, null, 2),
  ]

  const prompt = `${bundle.persona}

${contextSections.join("\n")}

## 사용자 질문
${input.userMessage}

위 데이터를 바탕으로 질문에 답변해주세요.`

  const { text } = await chatAgent.generate(prompt)

  return {
    response: text,
    bundleId: classification.bundleId,
    usedData: {
      saju: sajuData,
      astrology: astrologyData,
      ziwei: ziweiData,
    },
  }
}

async function fetchSajuData(
  input: FortuneWorkflowInput,
  bundleId: ContextBundleId
): Promise<Record<string, unknown>> {
  const sajuResult = calculateSajuFromBirthInfo(input.birthInfo, input.currentAge)

  const bundle = ContextBundleSchemas[bundleId]
  const filteredData: Record<string, unknown> = {}

  for (const field of bundle.sajuFields) {
    if (field in sajuResult) {
      filteredData[field] = (sajuResult as unknown as Record<string, unknown>)[field]
    }
  }

  return filteredData
}

async function fetchAstrologyData(
  input: FortuneWorkflowInput,
  bundleId: ContextBundleId
): Promise<Record<string, unknown>> {
  const bundle = ContextBundleSchemas[bundleId]

  if (bundle.astrologyFields.length < 1) {
    return {}
  }

  const result = calculateAstrologyWithOptions(input.birthInfo)

  const filteredData: Record<string, unknown> = {}

  for (const field of bundle.astrologyFields) {
    if (field in result) {
      filteredData[field] = (result as unknown as Record<string, unknown>)[field]
    }
  }

  return filteredData
}

async function fetchZiweiData(
  input: FortuneWorkflowInput,
  bundleId: ContextBundleId
): Promise<Record<string, unknown>> {
  const bundle = ContextBundleSchemas[bundleId]

  if (bundle.ziweiFields.length < 1) {
    return {}
  }

  const result = analyzeZiweiBoard(input.birthInfo as import("@/lib/schemas/ziwei").ZiweiBoardRequest)

  if (!result.success) {
    console.warn("자미두수 계산 실패:", result.error)
    return {}
  }

  const filteredData: Record<string, unknown> = {}

  for (const field of bundle.ziweiFields) {
    if (field in result.data) {
      filteredData[field] = (result.data as unknown as Record<string, unknown>)[field]
    }
  }

  return filteredData
}
