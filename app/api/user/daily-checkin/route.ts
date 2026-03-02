import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const VALID_MOODS = ["calm", "anxious", "happy", "tired", "focused", "scattered"]
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * GET /api/user/daily-checkin
 *
 * 쿼리 파라미터:
 * - date: 특정 날짜의 체크인 조회 (YYYY-MM-DD)
 * - days: 최근 N일간 체크인 조회 (스트릭 계산용)
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")
  const days = searchParams.get("days")

  if (date && !DATE_REGEX.test(date)) {
    return NextResponse.json({ error: "date 형식이 올바르지 않습니다" }, { status: 422 })
  }

  try {
    if (date) {
      const checkin = await prisma.dailyCheckIn.findUnique({
        where: { userId_date: { userId: session.user.id, date } },
        select: { date: true, mood: true, createdAt: true },
      })
      return NextResponse.json({ checkin })
    }

    // days 파라미터: 최근 N일간 조회
    const limit = Math.min(Math.max(parseInt(days ?? "7", 10) || 7, 1), 30)
    const dates: string[] = []
    const today = new Date()
    for (let i = 0; i < limit; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      dates.push(d.toISOString().slice(0, 10))
    }

    const checkins = await prisma.dailyCheckIn.findMany({
      where: { userId: session.user.id, date: { in: dates } },
      orderBy: { date: "desc" },
      select: { date: true, mood: true, createdAt: true },
    })

    return NextResponse.json({ checkins })
  } catch (err) {
    console.error("체크인 조회 실패:", err)
    return NextResponse.json({ error: "체크인 데이터를 불러오는 중 오류가 발생했습니다" }, { status: 500 })
  }
}

/**
 * POST /api/user/daily-checkin
 *
 * Body: { date: "YYYY-MM-DD", mood: "calm" | "anxious" | ... }
 * Upsert: 같은 날 중복 체크인 시 업데이트
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

  const { date, mood } = body as { date?: string; mood?: string }

  if (typeof date !== "string" || !DATE_REGEX.test(date)) {
    return NextResponse.json({ error: "date 형식이 올바르지 않습니다 (YYYY-MM-DD)" }, { status: 422 })
  }
  if (typeof mood !== "string" || !VALID_MOODS.includes(mood)) {
    return NextResponse.json({ error: `mood는 ${VALID_MOODS.join(", ")} 중 하나여야 합니다` }, { status: 422 })
  }

  try {
    const checkin = await prisma.dailyCheckIn.upsert({
      where: { userId_date: { userId: session.user.id, date } },
      create: { userId: session.user.id, date, mood },
      update: { mood },
      select: { date: true, mood: true, createdAt: true, updatedAt: true },
    })

    return NextResponse.json({ checkin })
  } catch (err) {
    console.error("체크인 저장 실패:", err)
    return NextResponse.json({ error: "체크인 저장 중 오류가 발생했습니다" }, { status: 500 })
  }
}
