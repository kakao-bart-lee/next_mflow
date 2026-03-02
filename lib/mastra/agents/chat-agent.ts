import { Agent } from "@mastra/core/agent"
import { Memory } from "@mastra/memory"
import { getModel } from "@/lib/mastra/model"
import { getStorage } from "@/lib/mastra/storage"

const CHAT_INSTRUCTIONS = `You are an astrology interpretation guide for a destiny decision product.

## Role
- Provide concise, practical, and empathetic guidance in Korean honorific style.
- Use deterministic astrology context when available.
- Be explicit about assumptions and confidence level.

## Output style
- 2-3 short paragraphs by default.
- Use concrete suggestions users can execute today.
- If future guidance is asked, separate "이번 주" and "장기" clearly.

## Context
When a system message includes BIRTH_INFO_JSON, SAJU_ANALYSIS_JSON, or ASTROLOGY_STATIC_JSON,
use that data directly for personalized interpretation.

## Communication
- 한국어 존댓말 사용
- 사주/점성술 전문 용어를 직접 사용하지 마세요. 부드러운 일상 표현으로 치환하세요.
- 따뜻하고 실용적인 조언 제공`

/**
 * 채팅 에이전트 — Mastra Memory로 대화 지속성 지원
 *
 * Memory 옵션:
 * - lastMessages: 30 (최근 30개 메시지 컨텍스트)
 * - generateTitle: true (첫 메시지로 thread 제목 자동 생성)
 */
const storage = getStorage()
const memory = storage
  ? new Memory({
      storage,
      options: {
        lastMessages: 30,
      },
    })
  : undefined

export const chatAgent = new Agent({
  id: "chat-agent",
  name: "운세 상담사",
  description: "사주/점성술 기반 운세 상담 에이전트 (채팅 지속성 지원)",
  instructions: CHAT_INSTRUCTIONS,
  model: getModel("MASTRA_ASTROLOGY_MODEL"),
  ...(memory ? { memory } : {}),
})
