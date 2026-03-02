import { MockLanguageModelV3 } from "ai/test"
import { simulateReadableStream } from "ai"
import type {
  LanguageModelV3GenerateResult,
  LanguageModelV3StreamPart,
  LanguageModelV3Usage,
} from "@ai-sdk/provider"

const MOCK_USAGE: LanguageModelV3Usage = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
}

const MOCK_GENERATE_RESULT: LanguageModelV3GenerateResult = {
  content: [{ type: "text", text: "{}" }],
  finishReason: { unified: "stop", raw: undefined },
  usage: MOCK_USAGE,
  warnings: [],
}

const MOCK_STREAM_CHUNKS: LanguageModelV3StreamPart[] = [
  { type: "text-start", id: "mock-1" },
  { type: "text-delta", id: "mock-1", delta: "[MOCK] 개발 모드 응답" },
  { type: "text-end", id: "mock-1" },
  {
    type: "finish",
    finishReason: { unified: "stop", raw: undefined },
    usage: MOCK_USAGE,
  },
]

/**
 * MOCK_LLM=true 일 때 사용하는 Mock 모델 팩토리.
 * doGenerate (구조화 응답) + doStream (스트리밍) 모두 지원.
 */
export function createMockModel() {
  return new MockLanguageModelV3({
    doGenerate: MOCK_GENERATE_RESULT,
    doStream: {
      stream: simulateReadableStream({ chunks: MOCK_STREAM_CHUNKS }),
    },
  })
}
