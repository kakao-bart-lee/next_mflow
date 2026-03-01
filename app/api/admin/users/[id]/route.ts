import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

// GET /api/admin/users/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      credit: true,
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" } },
      preferences: true,
      _count: { select: { chatSessions: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
  }

  // 최근 분석 10건
  const recentAnalyses = await prisma.analysis.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, expertId: true, createdAt: true },
  });

  // 최근 크레딧 내역 20건
  const creditLogs = await prisma.creditLog.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, amount: true, reason: true, createdAt: true, adminId: true },
  });

  return NextResponse.json({ user, recentAnalyses, creditLogs });
}

const PatchUserSchema = z.object({
  isAdmin: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  name: z.string().min(1).optional(),
});

// PATCH /api/admin/users/[id] — 유저 정보 수정 (관리자 권한, 정지 상태 등)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: adminId, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }

  const parsed = PatchUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력이 올바르지 않습니다" }, { status: 422 });
  }

  // 자기 자신의 관리자 권한은 제거 불가
  if (id === adminId && parsed.data.isAdmin === false) {
    return NextResponse.json({ error: "자신의 관리자 권한은 제거할 수 없습니다" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, email: true, isAdmin: true, isSuspended: true },
  });

  return NextResponse.json({ user });
}
