import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * GET /api/user/daily-actions?date=YYYY-MM-DD
 *
 * 특정 날짜에 완료된 액션 목록 조회
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")

  if (!date || !DATE_REGEX.test(date)) {
    return NextResponse.json({ error: "date 파라미터가 필요합니다 (YYYY-MM-DD)" }, { status: 422 })
  }

  try {
    const actions = await prisma.dailyAction.findMany({
      where: { userId: session.user.id, date },
      select: { actionId: true, actionText: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ actions })
  } catch (err) {
    console.error("액션 조회 실패:", err)
    return NextResponse.json({ error: "액션 데이터를 불러오는 중 오류가 발생했습니다" }, { status: 500 })
  }
}

/**
 * POST /api/user/daily-actions
 *
 * Body: { date: "YYYY-MM-DD", actionId: string, actionText: string }
 * Upsert: 같은 날 + 같은 actionId면 업데이트 (토글 지원은 DELETE로)
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 })
  }

  const { date, actionId, actionText } = body as {
    date?: string
    actionId?: string
    actionText?: string
  }

  if (typeof date !== "string" || !DATE_REGEX.test(date)) {
    return NextResponse.json({ error: "date 형식이 올바르지 않습니다 (YYYY-MM-DD)" }, { status: 422 })
  }
  if (typeof actionId !== "string" || actionId.trim().length === 0) {
    return NextResponse.json({ error: "actionId가 필요합니다" }, { status: 422 })
  }
  if (typeof actionText !== "string" || actionText.trim().length === 0) {
    return NextResponse.json({ error: "actionText가 필요합니다" }, { status: 422 })
  }

  try {
    const action = await prisma.dailyAction.upsert({
      where: {
        userId_date_actionId: { userId: session.user.id, date, actionId },
      },
      create: {
        userId: session.user.id,
        date,
        actionId,
        actionText: actionText.trim(),
      },
      update: { actionText: actionText.trim() },
      select: { actionId: true, actionText: true, createdAt: true },
    })

    return NextResponse.json({ action })
  } catch (err) {
    console.error("액션 저장 실패:", err)
    return NextResponse.json({ error: "액션 저장 중 오류가 발생했습니다" }, { status: 500 })
  }
}

/**
 * DELETE /api/user/daily-actions
 *
 * Body: { date: "YYYY-MM-DD", actionId: string }
 * 액션 체크 해제 (토글)
 */
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 })
  }

  const { date, actionId } = body as { date?: string; actionId?: string }

  if (typeof date !== "string" || !DATE_REGEX.test(date)) {
    return NextResponse.json({ error: "date 형식이 올바르지 않습니다" }, { status: 422 })
  }
  if (typeof actionId !== "string" || actionId.trim().length === 0) {
    return NextResponse.json({ error: "actionId가 필요합니다" }, { status: 422 })
  }

  try {
    await prisma.dailyAction.deleteMany({
      where: { userId: session.user.id, date, actionId },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("액션 삭제 실패:", err)
    return NextResponse.json({ error: "액션 삭제 중 오류가 발생했습니다" }, { status: 500 })
  }
}
