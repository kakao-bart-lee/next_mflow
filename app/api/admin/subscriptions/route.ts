import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const SubscriptionActionSchema = z.object({
  userId: z.string().min(1),
  planName: z.string().min(1),
  // "months" 단위
  durationMonths: z.number().int().positive().default(1),
  action: z.enum(["grant", "cancel"]),
});

// POST /api/admin/subscriptions — 구독 수동 부여/취소
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }

  const parsed = SubscriptionActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력이 올바르지 않습니다" }, { status: 422 });
  }

  const { userId, planName, durationMonths, action } = parsed.data;

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { name: planName },
  });
  if (!plan) {
    return NextResponse.json({ error: `플랜 '${planName}'을 찾을 수 없습니다` }, { status: 404 });
  }

  if (action === "grant") {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + durationMonths);

    // 기존 활성 구독 취소 후 새로 발급
    await prisma.subscription.updateMany({
      where: { userId, status: "active" },
      data: { status: "cancelled" },
    });

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: { plan: { select: { displayName: true } } },
    });

    return NextResponse.json({ subscription });
  } else {
    // cancel
    const updated = await prisma.subscription.updateMany({
      where: { userId, status: "active" },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ cancelled: updated.count });
  }
}

// GET /api/admin/subscriptions?userId= — 특정 유저 구독 내역
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId가 필요합니다" }, { status: 400 });
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ subscriptions });
}
