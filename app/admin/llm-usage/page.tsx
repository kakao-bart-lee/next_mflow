"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Activity, DollarSign, Hash, Timer } from "lucide-react"

// --- 타입 정의 ---

interface MonthStats {
  totalCostUsd: number
  totalTokens: number
  totalCalls: number
  avgLatencyMs: number
}

interface TopModel {
  modelId: string
  costUsd: number
  calls: number
}

interface TopEndpoint {
  endpoint: string
  costUsd: number
  calls: number
}

interface SummaryResponse {
  thisMonth: MonthStats
  lastMonth: MonthStats
  topModels: TopModel[]
  topEndpoints: TopEndpoint[]
}

interface AggregationRow {
  key: string
  calls: number
  inputTokens: number
  outputTokens: number
  costUsd: number
  avgLatencyMs: number | null
}

interface AggregationResponse {
  aggregations: AggregationRow[]
  totals: {
    calls: number
    inputTokens: number
    outputTokens: number
    costUsd: number
  }
}

// --- 유틸 ---

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%"
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(0)}%`
}

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`
}

function formatNumber(value: number): string {
  return value.toLocaleString()
}

// --- 차트 설정 ---

const barChartConfig: ChartConfig = {
  costUsd: { label: "비용 (USD)", color: "hsl(var(--chart-1))" },
}

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

// --- 컴포넌트 ---

export default function LlmUsageDashboard() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [dailyData, setDailyData] = useState<AggregationRow[]>([])
  const [endpointData, setEndpointData] = useState<AggregationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const from = thirtyDaysAgo.toISOString().slice(0, 10)
      const to = now.toISOString().slice(0, 10)

      const [summaryRes, dailyRes, endpointRes] = await Promise.all([
        fetch("/api/admin/llm-usage/summary"),
        fetch(
          `/api/admin/llm-usage?from=${from}&to=${to}&groupBy=day`
        ),
        fetch(
          `/api/admin/llm-usage?from=${from}&to=${to}&groupBy=endpoint`
        ),
      ])

      if (!summaryRes.ok || !dailyRes.ok || !endpointRes.ok) {
        throw new Error("API 요청에 실패했습니다")
      }

      const [summaryJson, dailyJson, endpointJson]: [
        SummaryResponse,
        AggregationResponse,
        AggregationResponse,
      ] = await Promise.all([
        summaryRes.json(),
        dailyRes.json(),
        endpointRes.json(),
      ])

      setSummary(summaryJson)
      setDailyData(dailyJson.aggregations)
      setEndpointData(endpointJson.aggregations)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "데이터를 불러오는 중 오류가 발생했습니다"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            LLM 사용량 대시보드
          </h1>
          <p className="text-sm text-muted-foreground">
            토큰 사용량과 비용을 모니터링합니다
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            LLM 사용량 대시보드
          </h1>
          <p className="text-sm text-muted-foreground">
            토큰 사용량과 비용을 모니터링합니다
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={fetchData}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              다시 시도
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const thisMonth = summary?.thisMonth ?? {
    totalCostUsd: 0,
    totalTokens: 0,
    totalCalls: 0,
    avgLatencyMs: 0,
  }
  const lastMonth = summary?.lastMonth ?? {
    totalCostUsd: 0,
    totalTokens: 0,
    totalCalls: 0,
    avgLatencyMs: 0,
  }

  const kpiCards = [
    {
      title: "총 호출 수",
      value: formatNumber(thisMonth.totalCalls),
      change: pctChange(thisMonth.totalCalls, lastMonth.totalCalls),
      icon: Hash,
    },
    {
      title: "총 토큰",
      value: formatNumber(thisMonth.totalTokens),
      change: pctChange(thisMonth.totalTokens, lastMonth.totalTokens),
      icon: Activity,
    },
    {
      title: "총 비용",
      value: formatUsd(thisMonth.totalCostUsd),
      change: pctChange(thisMonth.totalCostUsd, lastMonth.totalCostUsd),
      icon: DollarSign,
    },
    {
      title: "평균 지연시간",
      value: `${Math.round(thisMonth.avgLatencyMs)}ms`,
      change: pctChange(thisMonth.avgLatencyMs, lastMonth.avgLatencyMs),
      icon: Timer,
    },
  ]

  // PieChart용 데이터: endpoint key를 간결하게 표시
  const pieData = endpointData.map((row) => ({
    name: row.key.replace(/^\/api\//, ""),
    value: row.costUsd,
    fullName: row.key,
  }))

  // PieChart ChartConfig 동적 생성
  const pieChartConfig: ChartConfig = Object.fromEntries(
    pieData.map((item, idx) => [
      item.name,
      {
        label: item.name,
        color: PIE_COLORS[idx % PIE_COLORS.length],
      },
    ])
  )

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          LLM 사용량 대시보드
        </h1>
        <p className="text-sm text-muted-foreground">
          토큰 사용량과 비용을 모니터링합니다
        </p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {card.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.change} vs 지난 달
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 차트 영역: 일별 비용 + 엔드포인트별 비중 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 일별 비용 BarChart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              일별 비용 추이 (최근 30일)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  데이터가 없습니다
                </p>
              </div>
            ) : (
              <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="key"
                    tickFormatter={(value: string) => value.slice(5)}
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(value: number) => `$${value.toFixed(2)}`}
                    fontSize={12}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          typeof value === "number"
                            ? formatUsd(value)
                            : String(value)
                        }
                      />
                    }
                  />
                  <Bar dataKey="costUsd" fill="var(--color-costUsd)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* 엔드포인트별 비중 PieChart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              엔드포인트별 비용 비중
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  데이터가 없습니다
                </p>
              </div>
            ) : (
              <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          typeof value === "number"
                            ? formatUsd(value)
                            : String(value)
                        }
                        nameKey="name"
                      />
                    }
                  />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {pieData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 상세 테이블: 탑 모델 + 탑 엔드포인트 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 상위 모델 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              상위 모델 (이번 달)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!summary?.topModels || summary.topModels.length === 0) ? (
              <p className="text-sm text-muted-foreground">데이터가 없습니다</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">모델</th>
                      <th className="pb-2 text-right font-medium">호출 수</th>
                      <th className="pb-2 text-right font-medium">비용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topModels.map((model) => (
                      <tr
                        key={model.modelId}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2 font-mono text-xs">
                          {model.modelId}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatNumber(model.calls)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatUsd(model.costUsd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 상위 엔드포인트 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              상위 엔드포인트 (이번 달)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!summary?.topEndpoints || summary.topEndpoints.length === 0) ? (
              <p className="text-sm text-muted-foreground">데이터가 없습니다</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">엔드포인트</th>
                      <th className="pb-2 text-right font-medium">호출 수</th>
                      <th className="pb-2 text-right font-medium">비용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topEndpoints.map((ep) => (
                      <tr
                        key={ep.endpoint}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2 font-mono text-xs">
                          {ep.endpoint}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatNumber(ep.calls)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatUsd(ep.costUsd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
