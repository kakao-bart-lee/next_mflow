"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollText, Star, Sparkles } from "lucide-react"
import type { DebateSummary } from "@/lib/use-cases/run-debate"

const TONE_LABEL = {
  positive: { text: "긍정적", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cautious: { text: "신중함", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  mixed: { text: "혼합", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
} as const

interface DebateSummaryCardProps {
  summary: DebateSummary
}

export function DebateSummaryCard({ summary }: DebateSummaryCardProps) {
  const tone = TONE_LABEL[summary.overallTone]

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-amber-50/50 via-card to-violet-50/50 dark:from-amber-950/20 dark:via-card dark:to-violet-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">종합 분석</CardTitle>
          <Badge variant="outline" className={tone.className}>{tone.text}</Badge>
        </div>
        <p className="text-lg font-semibold">{summary.headline}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 합의 영역 */}
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            두 전문가의 합의
          </h4>
          <p className="text-sm leading-relaxed">{summary.agreement}</p>
        </div>

        {/* 전문가별 하이라이트 */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800/40 dark:bg-amber-950/20">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              <ScrollText className="h-3 w-3" />
              사주 명리사
            </div>
            <p className="text-sm leading-relaxed">{summary.sajuHighlight}</p>
          </div>
          <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-800/40 dark:bg-violet-950/20">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-400">
              <Star className="h-3 w-3" />
              점성술사
            </div>
            <p className="text-sm leading-relaxed">{summary.astroHighlight}</p>
          </div>
        </div>

        {/* 종합 조언 */}
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            실천 조언
          </h4>
          <p className="text-sm leading-relaxed">{summary.advice}</p>
        </div>

        {/* 키워드 */}
        {summary.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {summary.keywords.map((kw) => (
              <Badge key={kw} variant="secondary" className="text-xs">
                {kw}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
