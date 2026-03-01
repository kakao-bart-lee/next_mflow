import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

/**
 * Admin 권한 검증 헬퍼
 * API Route에서 사용: const { userId, error } = await requireAdmin()
 */
export async function requireAdmin(): Promise<
  { userId: string; error: null } | { userId: null; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      userId: null,
      error: NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, isSuspended: true },
  });

  if (!user?.isAdmin || user.isSuspended) {
    return {
      userId: null,
      error: NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 }),
    };
  }

  return { userId: session.user.id, error: null };
}
