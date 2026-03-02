import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isCreditEnabled, consumeCredit, CREDIT_COSTS } from "@/lib/credit-service"
import { getStringSystemSetting } from "@/lib/system-settings"
import { logLlmUsage } from "@/lib/llm-usage"
import { chatAgent } from "@/lib/mastra"

interface ChatRequestBody {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
  threadId?: string
  context?: {
    birthInfo?: Record<string, unknown>
    astrologyData?: Record<string, unknown>
    sajuData?: Record<string, unknown>
  }
}

const DEFAULT_ASTROLOGY_CHAT_PROMPT = `You are an astrology interpretation guide for a destiny decision product.

## Role
- Provide concise, practical, and empathetic guidance in Korean honorific style.
- Use deterministic astrology context when available.
- Be explicit about assumptions and confidence level.

## Output style
- 2-3 short paragraphs by default.
- Use concrete suggestions users can execute today.
- If future guidance is asked, separate "이번 주" and "장기" clearly.
`

function buildContextBlock(context: ChatRequestBody["context"]): string {
  if (!context?.birthInfo && !context?.astrologyData && !context?.sajuData) {
    return ""
  }

  const lines: string[] = ["\n## Current User Context"]
  if (context.birthInfo) {
    lines.push(`BIRTH_INFO_JSON: ${JSON.stringify(context.birthInfo)}`)
  }
  if (context.sajuData) {
    lines.push(`SAJU_ANALYSIS_JSON: ${JSON.stringify(context.sajuData)}`)
  }
  if (context.astrologyData) {
    lines.push(`ASTROLOGY_STATIC_JSON: ${JSON.stringify(context.astrologyData)}`)
  }
  return lines.join("\n")
}

export async function POST(req: NextRequest) {
  const session = await auth()

  let body: ChatRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 })
  }

  const { messages, threadId, context } = body
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages가 필요합니다" }, { status: 400 })
  }

  // 크레딧 차감
  if (isCreditEnabled() && session?.user?.id) {
    try {
      const result = await consumeCredit(session.user.id, CREDIT_COSTS.CHAT_MESSAGE, "AI 채팅")
      if (!result.success) {
        return NextResponse.json(
          { error: "크레딧이 부족합니다", code: "INSUFFICIENT_CREDITS" },
          { status: 402 }
        )
      }
    } catch (err) {
      console.warn("크레딧 차감 실패:", err)
    }
  }

  // DB에서 시스템 프롬프트 로드
  const chatPrompt = await getStringSystemSetting(
    "astrology_chat_prompt",
    DEFAULT_ASTROLOGY_CHAT_PROMPT
  )
  const reportGuide = await getStringSystemSetting(
    "astrology_report_prompt",
    "Use ASTROLOGY_STATIC_JSON for deterministic interpretation and practical weekly guidance."
  )

  // 컨텍스트 블록 구성
  const contextBlock = buildContextBlock(context)
  const instructions = [chatPrompt, reportGuide, contextBlock].filter(Boolean).join("\n")

  // 사용자의 마지막 메시지 추출 (Mastra agent.stream은 단일 string 입력)
  const lastUserMessage = messages.filter(m => m.role === "user").pop()
  if (!lastUserMessage) {
    return NextResponse.json({ error: "사용자 메시지가 필요합니다" }, { status: 400 })
  }

  const userId = session?.user?.id ?? "anonymous"
  const modelId = process.env.MASTRA_ASTROLOGY_MODEL || process.env.MASTRA_SAJU_MODEL || "gpt-4o-mini"
  const startTime = Date.now()

  try {
    const result = await chatAgent.stream(lastUserMessage.content, {
      maxSteps: 3,
      instructions,
      memory: {
        thread: threadId ?? `${userId}:chat:${Date.now()}`,
        resource: userId,
      },
    })

    // 스트림 변환: Mastra의 textStream → ReadableStream<Uint8Array>
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk))
          }

          // 스트림 완료 후 usage 로깅 (fire-and-forget)
          const usage = await result.usage
          const steps = await result.steps

          const totalInput = steps?.reduce(
            (sum: number, step: { usage?: { inputTokens?: number } }) =>
              sum + (step.usage?.inputTokens ?? 0), 0
          ) ?? usage?.inputTokens ?? 0
          const totalOutput = steps?.reduce(
            (sum: number, step: { usage?: { outputTokens?: number } }) =>
              sum + (step.usage?.outputTokens ?? 0), 0
          ) ?? usage?.outputTokens ?? 0

          void logLlmUsage({
            endpoint: "chat",
            modelId,
            userId: session?.user?.id,
            inputTokens: totalInput,
            outputTokens: totalOutput,
            latencyMs: Date.now() - startTime,
            method: "agent.stream",
          })
        } catch (err) {
          console.error("Chat stream error:", err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (err) {
    console.error("Chat agent stream failed:", err)
    return NextResponse.json(
      { error: "채팅 응답 생성 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
