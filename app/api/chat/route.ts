import { NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { auth } from "@/lib/auth"
import { isCreditEnabled, consumeCredit, CREDIT_COSTS } from "@/lib/credit-service"
import { getStringSystemSetting } from "@/lib/system-settings"

interface ChatRequestBody {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
  context?: {
    birthInfo?: Record<string, unknown>
    astrologyData?: Record<string, unknown>
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

function buildAstrologySystemPrompt(
  context: ChatRequestBody["context"],
  chatPrompt: string,
  reportGuide: string
): string {
  const lines: string[] = [chatPrompt]

  if (reportGuide.trim()) {
    lines.push(`ASTROLOGY_REPORT_GUIDE: ${reportGuide}`)
  }

  if (context?.birthInfo || context?.astrologyData) {
    lines.push("\n## Current User Context")
    if (context.birthInfo) {
      lines.push(`BIRTH_INFO_JSON: ${JSON.stringify(context.birthInfo)}`)
    }
    if (context.astrologyData) {
      lines.push(`ASTROLOGY_STATIC_JSON: ${JSON.stringify(context.astrologyData)}`)
    }
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

  const { messages, context } = body
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages가 필요합니다" }, { status: 400 })
  }

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

  const chatPrompt = await getStringSystemSetting(
    "astrology_chat_prompt",
    DEFAULT_ASTROLOGY_CHAT_PROMPT
  )
  const reportGuide = await getStringSystemSetting(
    "astrology_report_prompt",
    "Use ASTROLOGY_STATIC_JSON for deterministic interpretation and practical weekly guidance."
  )
  const systemPrompt = buildAstrologySystemPrompt(context ?? {}, chatPrompt, reportGuide)

  const result = streamText({
    model: openai(process.env.MASTRA_ASTROLOGY_MODEL || process.env.MASTRA_SAJU_MODEL || "gpt-4o-mini"),
    system: systemPrompt,
    messages,
  })

  return result.toTextStreamResponse()
}
