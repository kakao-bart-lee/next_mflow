import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

// GET /api/user — 현재 로그인 사용자 프로필 조회
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isAdmin: true,
      createdAt: true,
      credit: { select: { balance: true } },
      preferences: { select: { language: true, emailNotifications: true } },
    },
  })

  return NextResponse.json({
    id: user?.id ?? session.user.id,
    name: user?.name ?? session.user.name ?? null,
    email: user?.email ?? session.user.email ?? null,
    image: user?.image ?? session.user.image ?? null,
    isAdmin: user?.isAdmin ?? false,
    creditBalance: user?.credit?.balance ?? 0,
    language: user?.preferences?.language ?? "ko",
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    joinedAt: user?.createdAt ?? null,
  })
}
