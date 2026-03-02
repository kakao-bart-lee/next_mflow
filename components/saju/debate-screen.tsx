"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollText, Star, Sparkles, RotateCcw, MessageCircle } from "lucide-react"
import { useDebate } from "@/lib/hooks/use-debate"
import { useSaju } from "@/lib/contexts/saju-context"
import { DebateMessage } from "./debate-message"
import { DebateSummaryCard } from "./debate-summary"
import Link from "next/link"

export function DebateScreen() {
  const { birthInfo } = useSaju()
  const {
    messages,
    summary,
    status,
    currentTurn,
    totalTurns,
    startDebate,
    error,
  } = useDebate()

  const scrollRef = useRef<HTMLDivElement>(null)

  // 자동 스크롤: 새 메시지나 스트리밍 텍스트 변경 시
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, summary])

  const progressPercent = totalTurns > 0 ? (currentTurn / totalTurns) * 100 : 0

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              <ScrollText className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
              <Star className="h-3.5 w-3.5 text-violet-700 dark:text-violet-400" />
            </div>
          </div>
          <h1 className="text-base font-semibold">사주 × 점성술 토론</h1>
        </div>

        {/* 진행 바 */}
        {status === "running" && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {currentTurn <= 4
                  ? `턴 ${currentTurn} / ${totalTurns - 1}`
                  : "종합 분석 중..."}
              </span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} />
          </div>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {/* Idle 상태: 시작 안내 */}
        {status === "idle" && (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                <ScrollText className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
                <Star className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">동서양 운세 토론</h2>
              <p className="max-w-xs text-sm text-muted-foreground">
                사주 명리사와 점성술사가 당신의 운세를 각자의 관점에서 해석하고,
                서로 토론하여 종합 운세를 도출합니다.
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => startDebate(birthInfo ?? undefined)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              토론 시작하기
            </Button>
          </div>
        )}

        {/* 토론 진행 중 또는 완료 */}
        {(status === "running" || status === "done") && (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <DebateMessage key={`${msg.agent}-${msg.turn}-${i}`} message={msg} />
            ))}

            {/* 스트리밍 중 스켈레톤 (다음 턴 대기) */}
            {status === "running" && messages.length > 0 && !messages[messages.length - 1]?.isStreaming && currentTurn < 5 && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full max-w-[90%] rounded-xl" />
              </div>
            )}

            {/* 종합 분석 로딩 */}
            {status === "running" && currentTurn === 5 && !summary && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  종합 분석을 생성하고 있습니다...
                </div>
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            )}

            {/* 종합 요약 카드 */}
            {summary && (
              <div className="pt-4">
                <DebateSummaryCard summary={summary} />
              </div>
            )}

            {/* 완료 후 CTA */}
            {status === "done" && summary && (
              <div className="flex flex-wrap gap-2 pt-4 pb-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startDebate(birthInfo ?? undefined)}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  새 토론 시작
                </Button>
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <Link href="/today">
                    <MessageCircle className="h-3.5 w-3.5" />
                    오늘의 운세
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 에러 상태 */}
        {status === "error" && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startDebate(birthInfo ?? undefined)}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              다시 시도
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
