import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { auth } from "@/lib/auth";
import { buildSajuSystemPrompt, type SajuAgentContext } from "@/lib/mastra/agents/saju-agent";
import { isCreditEnabled, consumeCredit, CREDIT_COSTS } from "@/lib/credit-service";

interface ChatRequestBody {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  context?: SajuAgentContext;
}

export async function POST(req: NextRequest) {
  const session = await auth();

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }

  const { messages, context } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages가 필요합니다" }, { status: 400 });
  }

  // 크레딧 차감 (활성화된 경우)
  if (isCreditEnabled() && session?.user?.id) {
    try {
      const result = await consumeCredit(
        session.user.id,
        CREDIT_COSTS.CHAT_MESSAGE,
        "AI 채팅"
      );
      if (!result.success) {
        return NextResponse.json(
          { error: "크레딧이 부족합니다", code: "INSUFFICIENT_CREDITS" },
          { status: 402 }
        );
      }
    } catch (err) {
      console.warn("크레딧 차감 실패:", err);
    }
  }

  // 사주 컨텍스트를 system 메시지로 주입 (CopilotKit 없이 동일 효과)
  const systemPrompt = buildSajuSystemPrompt(context ?? {});

  const result = streamText({
    model: openai(process.env.MASTRA_SAJU_MODEL || "gpt-4o-mini"),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
