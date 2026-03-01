import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";

// GET /api/admin/stats — 대시보드 통계
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersThisMonth,
    totalAnalyses,
    analysesThisMonth,
    activeSubscriptions,
    creditIssuedThisMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.analysis.count(),
    prisma.analysis.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.creditLog.aggregate({
      where: { amount: { gt: 0 }, createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({
    users: { total: totalUsers, newThisMonth: newUsersThisMonth },
    analyses: { total: totalAnalyses, thisMonth: analysesThisMonth },
    subscriptions: { active: activeSubscriptions },
    credits: { issuedThisMonth: creditIssuedThisMonth._sum.amount ?? 0 },
  });
}
