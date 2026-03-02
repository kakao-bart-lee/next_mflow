"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Aggregation {
  key: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  avgLatencyMs: number | null;
}

interface AggregationResponse {
  aggregations: Aggregation[];
  totals: {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
}

interface SummaryResponse {
  thisMonth: {
    totalCostUsd: number;
    totalTokens: number;
    totalCalls: number;
    avgLatencyMs: number;
  };
  lastMonth: {
    totalCostUsd: number;
    totalTokens: number;
    totalCalls: number;
    avgLatencyMs: number;
  };
  topModels: Array<{ modelId: string; costUsd: number; calls: number }>;
  topEndpoints: Array<{ endpoint: string; costUsd: number; calls: number }>;
}

// ---------------------------------------------------------------------------
// Chart configs
// ---------------------------------------------------------------------------

const dailyCostChartConfig: ChartConfig = {
  costUsd: {
    label: "비용 (USD)",
    color: "hsl(221, 83%, 53%)",
  },
};

const modelCostChartConfig: ChartConfig = {
  costUsd: {
    label: "비용 (USD)",
    color: "hsl(262, 83%, 58%)",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUsd(value: number): string {
  return `$${value.toFixed(4)}`;
}

function formatUsdShort(value: number): string {
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

function formatDate(dateStr: string): string {
  // YYYY-MM-DD -> MM/DD
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
  return dateStr;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LlmCostsPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [dailyData, setDailyData] = useState<Aggregation[]>([]);
  const [endpointData, setEndpointData] = useState<AggregationResponse | null>(
    null,
  );
  const [modelData, setModelData] = useState<Aggregation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const to = now.toISOString().split("T")[0];
      const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const [summaryRes, dailyRes, endpointRes, modelRes] = await Promise.all([
        fetch("/api/admin/llm-usage/summary"),
        fetch(
          `/api/admin/llm-usage?groupBy=day&from=${from}&to=${to}`,
        ),
        fetch("/api/admin/llm-usage?groupBy=endpoint"),
        fetch("/api/admin/llm-usage?groupBy=model"),
      ]);

      if (!summaryRes.ok) throw new Error(`요약 API 오류: ${summaryRes.status}`);
      if (!dailyRes.ok) throw new Error(`일별 API 오류: ${dailyRes.status}`);
      if (!endpointRes.ok)
        throw new Error(`엔드포인트 API 오류: ${endpointRes.status}`);
      if (!modelRes.ok) throw new Error(`모델 API 오류: ${modelRes.status}`);

      const [summaryJson, dailyJson, endpointJson, modelJson] =
        (await Promise.all([
          summaryRes.json(),
          dailyRes.json(),
          endpointRes.json(),
          modelRes.json(),
        ])) as [SummaryResponse, AggregationResponse, AggregationResponse, AggregationResponse];

      setSummary(summaryJson);
      setDailyData(dailyJson.aggregations);
      setEndpointData(endpointJson);
      setModelData(modelJson.aggregations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // -------------------------------------------------------------------------
  // Loading / Error states
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">LLM 비용 분석</h1>
          <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">LLM 비용 분석</h1>
          <p className="text-sm text-destructive">{error}</p>
        </div>
        <button
          onClick={fetchAll}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const costChange = summary
    ? pctChange(summary.thisMonth.totalCostUsd, summary.lastMonth.totalCostUsd)
    : null;

  const callsChange = summary
    ? pctChange(summary.thisMonth.totalCalls, summary.lastMonth.totalCalls)
    : null;

  const tokensChange = summary
    ? pctChange(summary.thisMonth.totalTokens, summary.lastMonth.totalTokens)
    : null;

  // Sort endpoints by costUsd descending
  const sortedEndpoints = endpointData
    ? [...endpointData.aggregations].sort((a, b) => b.costUsd - a.costUsd)
    : [];

  const totalEndpointCost = endpointData?.totals.costUsd ?? 0;

  // Sort models by costUsd descending for horizontal bar chart
  const sortedModels = [...modelData].sort((a, b) => b.costUsd - a.costUsd);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">LLM 비용 분석</h1>
        <p className="text-sm text-muted-foreground">
          LLM 사용 비용을 분석하고 최적화 포인트를 파악합니다
        </p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="이번 달 비용"
            value={formatUsdShort(summary.thisMonth.totalCostUsd)}
            change={costChange}
            icon={DollarSign}
          />
          <SummaryCard
            title="이번 달 호출 수"
            value={summary.thisMonth.totalCalls.toLocaleString()}
            change={callsChange}
            suffix="건"
          />
          <SummaryCard
            title="이번 달 토큰"
            value={summary.thisMonth.totalTokens.toLocaleString()}
            change={tokensChange}
          />
        </div>
      )}

      {/* Daily cost trend - AreaChart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            일별 비용 추이 (최근 90일)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              데이터가 없습니다
            </p>
          ) : (
            <ChartContainer config={dailyCostChartConfig} className="h-[300px] w-full">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-costUsd)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-costUsd)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="key"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatUsd(Number(value))}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="costUsd"
                  stroke="var(--color-costUsd)"
                  fill="url(#costGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Endpoint cost breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            엔드포인트별 비용 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedEndpoints.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              데이터가 없습니다
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">엔드포인트</th>
                    <th className="pb-3 pr-4 text-right font-medium">호출 수</th>
                    <th className="pb-3 pr-4 text-right font-medium">
                      평균 비용/건
                    </th>
                    <th className="pb-3 pr-4 text-right font-medium">총 비용</th>
                    <th className="pb-3 text-right font-medium">비중 (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEndpoints.map((row) => {
                    const pct =
                      totalEndpointCost > 0
                        ? (row.costUsd / totalEndpointCost) * 100
                        : 0;
                    const avgCost =
                      row.calls > 0 ? row.costUsd / row.calls : 0;

                    return (
                      <tr
                        key={row.key}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-3 pr-4 font-mono text-xs">
                          {row.key}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {row.calls.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {formatUsd(avgCost)}
                        </td>
                        <td className="py-3 pr-4 text-right font-medium tabular-nums">
                          {formatUsd(row.costUsd)}
                        </td>
                        <td className="py-3 text-right tabular-nums">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="w-12 text-right">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t border-border font-medium">
                    <td className="pt-3 pr-4">합계</td>
                    <td className="pt-3 pr-4 text-right tabular-nums">
                      {endpointData?.totals.calls.toLocaleString()}
                    </td>
                    <td className="pt-3 pr-4 text-right">-</td>
                    <td className="pt-3 pr-4 text-right tabular-nums">
                      {formatUsd(totalEndpointCost)}
                    </td>
                    <td className="pt-3 text-right">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model cost comparison - Horizontal BarChart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            모델별 비용 비교
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedModels.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              데이터가 없습니다
            </p>
          ) : (
            <ChartContainer
              config={modelCostChartConfig}
              className="w-full"
              style={{ height: Math.max(200, sortedModels.length * 44) }}
            >
              <BarChart data={sortedModels} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="key"
                  width={140}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatUsd(Number(value))}
                    />
                  }
                />
                <Bar
                  dataKey="costUsd"
                  fill="var(--color-costUsd)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary card sub-component
// ---------------------------------------------------------------------------

function SummaryCard({
  title,
  value,
  change,
  icon: Icon,
  suffix,
}: {
  title: string;
  value: string;
  change: number | null;
  icon?: React.ComponentType<{ className?: string }>;
  suffix?: string;
}) {
  const isPositive = change !== null && change > 0;
  const isNegative = change !== null && change < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {value}
          {suffix && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        {change !== null && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {isPositive && (
              <TrendingUp className="h-3 w-3 text-red-500" />
            )}
            {isNegative && (
              <TrendingDown className="h-3 w-3 text-green-500" />
            )}
            <span
              className={
                isPositive
                  ? "text-red-500"
                  : isNegative
                    ? "text-green-500"
                    : "text-muted-foreground"
              }
            >
              전월 대비 {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
