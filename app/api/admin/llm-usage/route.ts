import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin"
import { prisma } from "@/lib/db/prisma"

const VALID_GROUP_BY = ["day", "endpoint", "model", "user"] as const
type GroupBy = (typeof VALID_GROUP_BY)[number]

// groupBy 값을 Prisma 필드명으로 매핑
const GROUP_BY_FIELD_MAP: Record<Exclude<GroupBy, "day">, "endpoint" | "modelId" | "userId"> = {
  endpoint: "endpoint",
  model: "modelId",
  user: "userId",
}

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = req.nextUrl

  // 쿼리 파라미터 파싱
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")
  const groupByParam = searchParams.get("groupBy") ?? "day"
  const endpointFilter = searchParams.get("endpoint")
  const modelIdFilter = searchParams.get("modelId")
  const limitParam = searchParams.get("limit")

  const from = fromParam ? new Date(fromParam) : thirtyDaysAgo
  const to = toParam ? new Date(toParam) : now
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 100, 1), 1000) : 100

  // groupBy 검증
  if (!VALID_GROUP_BY.includes(groupByParam as GroupBy)) {
    return NextResponse.json(
      { error: `groupBy는 ${VALID_GROUP_BY.join(", ")} 중 하나여야 합니다` },
      { status: 422 }
    )
  }
  const groupBy = groupByParam as GroupBy

  // where 조건 빌드
  const where: {
    createdAt: { gte: Date; lte: Date }
    endpoint?: string
    modelId?: string
  } = {
    createdAt: { gte: from, lte: to },
  }
  if (endpointFilter) where.endpoint = endpointFilter
  if (modelIdFilter) where.modelId = modelIdFilter

  try {
    if (groupBy === "day") {
      // 전체 로그를 가져와서 JS에서 날짜별 그룹핑
      const logs = await prisma.llmUsageLog.findMany({
        where,
        select: {
          createdAt: true,
          inputTokens: true,
          outputTokens: true,
          costUsd: true,
          latencyMs: true,
        },
        orderBy: { createdAt: "asc" },
      })

      const grouped = new Map<
        string,
        {
          calls: number
          inputTokens: number
          outputTokens: number
          costUsd: number
          latencyMs: number[]
        }
      >()

      for (const log of logs) {
        const key = log.createdAt.toISOString().slice(0, 10)
        const existing = grouped.get(key)
        if (existing) {
          existing.calls += 1
          existing.inputTokens += log.inputTokens
          existing.outputTokens += log.outputTokens
          existing.costUsd += log.costUsd
          if (log.latencyMs !== null) existing.latencyMs.push(log.latencyMs)
        } else {
          grouped.set(key, {
            calls: 1,
            inputTokens: log.inputTokens,
            outputTokens: log.outputTokens,
            costUsd: log.costUsd,
            latencyMs: log.latencyMs !== null ? [log.latencyMs] : [],
          })
        }
      }

      const aggregations = Array.from(grouped.entries())
        .slice(0, limit)
        .map(([key, data]) => ({
          key,
          calls: data.calls,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          costUsd: data.costUsd,
          avgLatencyMs:
            data.latencyMs.length > 0
              ? data.latencyMs.reduce((a, b) => a + b, 0) / data.latencyMs.length
              : null,
        }))

      const totals = {
        calls: logs.length,
        inputTokens: logs.reduce((sum, l) => sum + l.inputTokens, 0),
        outputTokens: logs.reduce((sum, l) => sum + l.outputTokens, 0),
        costUsd: logs.reduce((sum, l) => sum + l.costUsd, 0),
      }

      return NextResponse.json({ aggregations, totals })
    }

    // groupBy=endpoint|model|user
    const groupByField = GROUP_BY_FIELD_MAP[groupBy]

    const result = await prisma.llmUsageLog.groupBy({
      by: [groupByField],
      where,
      _sum: { inputTokens: true, outputTokens: true, costUsd: true },
      _count: true,
      _avg: { latencyMs: true },
      orderBy: { _sum: { costUsd: "desc" } },
      take: limit,
    })

    const aggregations = result.map((row) => ({
      key: row[groupByField] ?? "unknown",
      calls: row._count,
      inputTokens: row._sum.inputTokens ?? 0,
      outputTokens: row._sum.outputTokens ?? 0,
      costUsd: row._sum.costUsd ?? 0,
      avgLatencyMs: row._avg.latencyMs ?? null,
    }))

    // totals 계산
    const totals = aggregations.reduce(
      (acc, row) => ({
        calls: acc.calls + row.calls,
        inputTokens: acc.inputTokens + row.inputTokens,
        outputTokens: acc.outputTokens + row.outputTokens,
        costUsd: acc.costUsd + row.costUsd,
      }),
      { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 }
    )

    return NextResponse.json({ aggregations, totals })
  } catch {
    return NextResponse.json(
      { error: "사용량 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
