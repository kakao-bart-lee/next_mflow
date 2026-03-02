import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    )

    const [thisMonth, lastMonth] = await Promise.all([
      prisma.llmUsageLog.aggregate({
        where: { createdAt: { gte: thisMonthStart } },
        _sum: { costUsd: true, inputTokens: true, outputTokens: true },
        _count: true,
        _avg: { latencyMs: true },
      }),
      prisma.llmUsageLog.aggregate({
        where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { costUsd: true, inputTokens: true, outputTokens: true },
        _count: true,
        _avg: { latencyMs: true },
      }),
    ])

    // 탑 모델/엔드포인트 (이번 달)
    const [topModels, topEndpoints] = await Promise.all([
      prisma.llmUsageLog.groupBy({
        by: ["modelId"],
        where: { createdAt: { gte: thisMonthStart } },
        _sum: { costUsd: true },
        _count: true,
        orderBy: { _sum: { costUsd: "desc" } },
        take: 5,
      }),
      prisma.llmUsageLog.groupBy({
        by: ["endpoint"],
        where: { createdAt: { gte: thisMonthStart } },
        _sum: { costUsd: true },
        _count: true,
        orderBy: { _sum: { costUsd: "desc" } },
        take: 5,
      }),
    ])

    return NextResponse.json({
      thisMonth: {
        totalCostUsd: thisMonth._sum.costUsd ?? 0,
        totalTokens:
          (thisMonth._sum.inputTokens ?? 0) +
          (thisMonth._sum.outputTokens ?? 0),
        totalCalls: thisMonth._count,
        avgLatencyMs: thisMonth._avg.latencyMs ?? 0,
      },
      lastMonth: {
        totalCostUsd: lastMonth._sum.costUsd ?? 0,
        totalTokens:
          (lastMonth._sum.inputTokens ?? 0) +
          (lastMonth._sum.outputTokens ?? 0),
        totalCalls: lastMonth._count,
        avgLatencyMs: lastMonth._avg.latencyMs ?? 0,
      },
      topModels: topModels.map((m) => ({
        modelId: m.modelId,
        costUsd: m._sum.costUsd ?? 0,
        calls: m._count,
      })),
      topEndpoints: topEndpoints.map((e) => ({
        endpoint: e.endpoint,
        costUsd: e._sum.costUsd ?? 0,
        calls: e._count,
      })),
    })
  } catch {
    return NextResponse.json(
      { error: "월간 요약 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
