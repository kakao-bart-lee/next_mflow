import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { BirthInfoSchema, type BirthInfo } from "@/lib/schemas/birth-info"
import { analyzeSaju } from "@/lib/use-cases/analyze-saju"
import { analyzeAstrologyStatic } from "@/lib/use-cases/analyze-astrology-static"
import { runDebate, loadDebateSettings } from "@/lib/use-cases/run-debate"
import { runDebateMock } from "@/lib/use-cases/run-debate-mock"
import { prisma } from "@/lib/db/prisma"
import {
  isCreditEnabled,
  consumeCredit,
} from "@/lib/credit-service"

export async function POST(req: NextRequest) {
  const session = await auth()

  // 인증 확인
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  // Request body 파싱
  let birthInfo: BirthInfo
  try {
    const body = await req.json()
    if (body.birthInfo) {
      const parsed = BirthInfoSchema.safeParse(body.birthInfo)
      if (!parsed.success) {
        return NextResponse.json(
          { error: "출생 정보가 올바르지 않습니다", details: parsed.error.flatten() },
          { status: 422 },
        )
      }
      birthInfo = parsed.data
    } else {
      // user.birthInfo에서 가져오기
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { birthInfo: true },
      })
      if (!user?.birthInfo) {
        return NextResponse.json(
          { error: "출생 정보가 필요합니다. 프로필에서 입력해주세요." },
          { status: 422 },
        )
      }
      const parsed = BirthInfoSchema.safeParse(user.birthInfo)
      if (!parsed.success) {
        return NextResponse.json(
          { error: "저장된 출생 정보가 올바르지 않습니다" },
          { status: 422 },
        )
      }
      birthInfo = parsed.data
    }
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 })
  }

  // 설정 로드 + 사주/점성술 계산 병렬 실행
  const [debateSettings, sajuApiResult, astrologyApiResult] = await Promise.all([
    loadDebateSettings(),
    analyzeSaju(birthInfo, session.user.id),
    analyzeAstrologyStatic(birthInfo),
  ])

  // 토론 비활성화 체크
  if (!debateSettings.enabled) {
    return NextResponse.json(
      { error: "토론 기능이 현재 비활성화되어 있습니다", code: "DEBATE_DISABLED" },
      { status: 503 },
    )
  }

  // 크레딧 확인 (DB 설정 비용 사용)
  const creditCost = debateSettings.creditCost
  if (isCreditEnabled()) {
    const credit = await prisma.credit.findUnique({
      where: { userId: session.user.id },
      select: { balance: true },
    })
    if ((credit?.balance ?? 0) < creditCost) {
      return NextResponse.json(
        { error: "크레딧이 부족합니다", code: "INSUFFICIENT_CREDITS" },
        { status: 402 },
      )
    }
  }

  if (!sajuApiResult.success) {
    return NextResponse.json(
      { error: sajuApiResult.error, code: sajuApiResult.code },
      { status: sajuApiResult.status },
    )
  }
  if (!astrologyApiResult.success) {
    return NextResponse.json(
      { error: astrologyApiResult.error, code: astrologyApiResult.code },
      { status: astrologyApiResult.status },
    )
  }

  // ChatSession 생성
  const chatSession = await prisma.chatSession.create({
    data: {
      userId: session.user.id,
      expertId: "debate",
      title: "사주 × 점성술 토론",
    },
  })

  // NDJSON 스트리밍 응답
  const { readable, writable } = new TransformStream<Uint8Array>()
  const writer = writable.getWriter()

  // 비동기로 토론 실행 (스트림은 즉시 반환)
  const userId = session.user.id
  const sessionId = chatSession.id
  const useMock = process.env.MOCK_DEBATE === "true" || debateSettings.mockMode

  void (async () => {
    try {
      const summary = useMock
        ? await runDebateMock(writer)
        : await runDebate(
            sajuApiResult.data,
            astrologyApiResult.data,
            writer,
            debateSettings,
          )

      // 크레딧 차감 (토론 완료 후, fail-closed)
      if (isCreditEnabled()) {
        try {
          await consumeCredit(userId, creditCost, "사주×점성술 토론")
        } catch (err) {
          console.error("토론 크레딧 차감 실패:", err)
        }
      }

      // DB에 요약 저장 (best-effort: 실패해도 토론 결과는 전달)
      try {
        await prisma.chatMessage.create({
          data: {
            sessionId,
            role: "assistant",
            content: JSON.stringify(summary),
            metadata: { agent: "synthesis", turn: 5, avatar: "sparkles" },
          },
        })
      } catch (dbErr) {
        console.warn("토론 요약 DB 저장 실패 (토론 결과는 정상 전달됨):", dbErr)
      }
    } catch (err) {
      const encoder = new TextEncoder()
      const errorMsg = err instanceof Error ? err.message : "토론 중 오류 발생"
      writer.write(
        encoder.encode(JSON.stringify({ type: "error", message: errorMsg }) + "\n"),
      )
    } finally {
      writer.close()
    }
  })()

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  })
}
