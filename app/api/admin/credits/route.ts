import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { addCredit, consumeCredit } from "@/lib/credit-service";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const CreditActionSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(),
  reason: z.string().min(1),
  action: z.enum(["add", "deduct"]),
});

// POST /api/admin/credits — 크레딧 수동 지급/차감
export async function POST(req: NextRequest) {
  const { userId: adminId, error } = await requireAdmin();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }

  const parsed = CreditActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력이 올바르지 않습니다" }, { status: 422 });
  }

  const { userId, amount, reason, action } = parsed.data;

  // 대상 유저 존재 확인
  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!targetUser) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
  }

  if (action === "add") {
    const result = await addCredit(userId, amount, `[관리자] ${reason}`, adminId ?? undefined);
    return NextResponse.json({ balance: result.balance, transactionId: result.transactionId });
  } else {
    const result = await consumeCredit(userId, amount, `[관리자] ${reason}`);
    if (!result.success) {
      return NextResponse.json({ error: "잔액이 부족합니다" }, { status: 400 });
    }
    return NextResponse.json({ balance: result.balance, transactionId: result.transactionId });
  }
}
