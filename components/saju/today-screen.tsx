"use client"

import { useState, useEffect, useMemo, type ElementType } from "react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChevronDown,
  AlertTriangle,
  Leaf,
  Heart,
  Flame,
  Droplets,
  Mountain,
  Wind,
  MessageCircle,
  Sparkles,
} from "lucide-react"
import { CheckInChips } from "./check-in-chips"
import { DeepDiveSheet } from "./deep-dive-sheet"
import { AIChatPanel } from "./ai-chat-panel"
import { useSaju } from "@/lib/contexts/saju-context"
import { useSajuInterpret } from "@/lib/hooks/use-saju-interpret"
import type { FortuneResponse } from "@/lib/saju-core"

/* ─── 오행 기반 오늘의 데이터 매핑 ─── */

interface TodayDisplay {
  date: string
  summary: string
  tags: string[]
  body: string
  actions: { id: string; text: string }[]
  avoid: string
}

const ELEMENT_DATA: Record<
  string,
  { tags: string[]; summary: string; body: string; avoid: string }
> = {
  목: {
    tags: ["성장", "시작"],
    summary: "새로운 시작과 성장의 기운이 흐릅니다",
    body: "오늘은 목(木)의 에너지가 강합니다. 새로운 것을 시작하거나 오래된 계획을 실행에 옮기기에 좋은 날이에요. 주변의 변화에 유연하게 반응하면서도, 내면의 방향성을 잃지 않도록 하세요. 저녁에는 내일을 위한 작은 준비 하나를 해두면 마음이 한결 가벼워집니다.",
    avoid: "무리한 욕심이나 조급함은 기운의 흐름을 방해할 수 있어요",
  },
  화: {
    tags: ["열정", "표현"],
    summary: "열정과 활력이 넘치는 하루입니다",
    body: "화(火)의 에너지가 활발합니다. 표현하고 싶었던 것을 꺼내놓기 좋은 날이에요. 관계에서 따뜻한 말 한마디가 큰 힘이 됩니다. 다만 에너지가 넘치는 만큼, 너무 빠르게 달리기보다 중간중간 여유를 갖는 것도 중요합니다.",
    avoid: "충동적인 결정이나 감정적 대응은 오늘은 잠시 미뤄두세요",
  },
  토: {
    tags: ["정리", "안정"],
    summary: "안정과 중심을 잡는 기운이 흐릅니다",
    body: "오늘은 토(土)의 에너지가 중심을 잡아줍니다. 오래 묵은 것을 정리하거나 주변을 돌아보는 데 에너지를 쓰면 좋아요. 너무 바쁘게 움직이기보다는, 충분히 느끼고 판단하는 시간을 가져보세요. 가까운 사람의 말에 귀 기울이는 것도 오늘의 기운과 잘 맞습니다.",
    avoid: "너무 많은 변화를 한꺼번에 시도하는 것은 오늘은 피하세요",
  },
  금: {
    tags: ["결단", "집중"],
    summary: "결단력이 빛나는 날입니다",
    body: "금(金)의 에너지가 강합니다. 미뤄두었던 결정을 내리기 좋은 날이에요. 불필요한 것은 과감히 내려놓고 핵심에 집중하면 큰 성과를 얻을 수 있습니다. 다만 너무 완고하게 되지 않도록, 작은 유연함도 함께 품어보세요.",
    avoid: "지나치게 비판적이거나 완벽주의적 태도는 관계를 힘들게 할 수 있어요",
  },
  수: {
    tags: ["지혜", "성찰"],
    summary: "지혜와 내면의 성찰을 위한 날입니다",
    body: "수(水)의 에너지가 흐릅니다. 오늘은 적극적으로 나서기보다, 조용히 관찰하고 생각하는 시간이 더 값집니다. 직감이 예민해지는 날이니, 마음속 울림에 귀 기울여 보세요. 혼자만의 시간이 내면을 깊게 채워줄 거예요.",
    avoid: "무리한 새 시작이나 서두름은 오늘의 흐름과 맞지 않아요",
  },
}

const DEFAULT_ACTIONS = [
  { id: "a1", text: "하루 한 가지만 온전히 집중해보세요" },
  { id: "a2", text: "감사한 것 하나를 마음속으로 떠올려보세요" },
]

function buildTodayDisplay(result: FortuneResponse): TodayDisplay {
  const dayPillar = result.sajuData.pillars.일
  // Format: "갑(甲)" — extract the Korean character before "("
  const stemKorean = dayPillar.천간.split("(")[0] ?? dayPillar.천간
  const branchKorean = dayPillar.지지.split("(")[0] ?? dayPillar.지지
  const element = dayPillar.오행.천간 // "목", "화", "토", "금", "수"

  const now = new Date()
  const date = now.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  })

  const elementInfo = ELEMENT_DATA[element] ?? ELEMENT_DATA.토
  const actions = [
    { id: "a1", text: `일주(${stemKorean}${branchKorean})의 기운을 느끼며 하루를 시작해보세요` },
    ...DEFAULT_ACTIONS.slice(1),
  ]

  return {
    date,
    summary: elementInfo.summary,
    tags: elementInfo.tags,
    body: elementInfo.body,
    actions,
    avoid: elementInfo.avoid,
  }
}

const TAG_ICONS: Record<string, ElementType<{ className?: string }>> = {
  성장: Leaf,
  시작: Sparkles,
  열정: Flame,
  표현: MessageCircle,
  정리: Leaf,
  안정: Mountain,
  관계: Heart,
  결단: Wind,
  집중: Wind,
  지혜: Droplets,
  성찰: Droplets,
}

/* ─── 로딩 스켈레톤 ─── */

function TodaySkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-7 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

/* ─── 최근 기록 (localStorage 기반) ─── */

function getRecentHistory(): string[] {
  const items: string[] = []
  const today = new Date()
  let streak = 0

  for (let i = 1; i <= 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayLabel = i === 1 ? "어제" : i === 2 ? "그제" : `${i}일 전`

    try {
      const checkin = localStorage.getItem(`saju_checkin_${dateStr}`)
      if (checkin) {
        const state = JSON.parse(checkin)
        if (state.saved) {
          if (i <= 2) items.push(`${dayLabel} 체크인 완료`)
          streak++
        } else {
          break
        }
      } else {
        break
      }
    } catch {
      break
    }
  }

  // 액션 완료 확인
  try {
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)
    const actions = localStorage.getItem(`saju_actions_${yesterdayStr}`)
    if (actions) {
      const parsed = JSON.parse(actions) as string[]
      if (parsed.length > 0) {
        items.unshift(`어제 실천 ${parsed.length}개 완료`)
      }
    }
  } catch {
    // ignore
  }

  if (streak >= 2) {
    items.push(`이번 주 ${streak}일 연속`)
  }

  return items.length > 0 ? items.slice(0, 3) : ["체크인을 시작해보세요", "매일 실천을 기록해보세요"]
}

function RecentHistory() {
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    setHistory(getRecentHistory())
  }, [])

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        최근 기록
      </h3>
      <ul className="mt-3 space-y-2.5">
        {history.map((item, i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── 메인 컴포넌트 ─── */

export function TodayScreen() {
  const { sajuResult, birthInfo, isLoading } = useSaju()
  const [checkedActions, setCheckedActions] = useState<Set<string>>(new Set())
  const [deepDiveOpen, setDeepDiveOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [aiActions, setAiActions] = useState<string[]>([])

  // localStorage에서 오늘의 완료된 액션 로드
  useEffect(() => {
    try {
      const dateStr = new Date().toISOString().slice(0, 10)
      const stored = localStorage.getItem(`saju_actions_${dateStr}`)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        if (Array.isArray(parsed)) {
          setCheckedActions(new Set(parsed))
        }
      }
    } catch {
      // 파싱 실패 — 무시
    }
  }, [])
  // LLM 동적 콘텐츠 fetch
  const { data: llmDaily, isLoading: llmLoading, error: llmError } = useSajuInterpret("daily", birthInfo)

  const todayData = useMemo(() => {
    if (!sajuResult) return null
    const staticData = buildTodayDisplay(sajuResult)
    
    // LLM 데이터가 있으면 오버라이드
    if (llmDaily) {
      return {
        ...staticData,
        summary: llmDaily.summary,
        tags: llmDaily.tags,
        body: llmDaily.body,
        actions: llmDaily.actions,
        avoid: llmDaily.avoid,
      }
    }
    
    return staticData
  }, [sajuResult, llmDaily])

  const toggleAction = (id: string) => {
    setCheckedActions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      // localStorage에 저장 (saju_actions_YYYY-MM-DD)
      const dateStr = new Date().toISOString().slice(0, 10)
      const checked = Array.from(next)
      try {
        localStorage.setItem(`saju_actions_${dateStr}`, JSON.stringify(checked))
      } catch {
        // storage full — 무시
      }
      return next
    })
  }

  const allActions = useMemo(
    () => [
      ...(todayData?.actions ?? DEFAULT_ACTIONS),
      ...aiActions.map((text, i) => ({ id: `ai-${i}`, text })),
    ],
    [todayData, aiActions],
  )

  const dateLabel = useMemo(() => {
    if (todayData?.date) return todayData.date
    return new Date().toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
    })
  }, [todayData?.date])

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-5 pt-6 lg:max-w-5xl lg:px-8">
        {/* Desktop layout: 2-column */}
        <div className="lg:flex lg:gap-10">
          {/* Main column */}
          <div className="lg:max-w-2xl lg:flex-1">
            {/* Top app bar */}
            <header className="py-2">
              <time className="text-sm font-medium text-muted-foreground">
                {dateLabel}
              </time>
            </header>

            {/* LLM 폴백 알림 — 정적 데이터로 표시 중일 때 */}
            {llmError && !llmLoading && sajuResult && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>네트워크 상태로 인해 간소화된 결과를 보여드립니다</span>
              </div>
            )}

            {/* Letter Card (Hero) */}
            <section className="mt-4" aria-label="오늘의 편지">
              {isLoading ? (
                <TodaySkeleton />
              ) : todayData ? (
                <div className="rounded-2xl border border-border bg-card p-6 lg:p-8">
                  {/* Theme chips */}
                  <div className="flex gap-2">
                    {todayData.tags.map((tag) => {
                      const Icon = TAG_ICONS[tag]
                      return (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="rounded-full border-0 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                        >
                          {Icon && <Icon className="mr-1 h-3 w-3" />}
                          {tag}
                        </Badge>
                      )
                    })}
                    {llmDaily && !llmLoading && (
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </Badge>
                    )}
                  </div>

                  {/* Summary line */}
                  <h1 className="mt-5 text-balance font-serif text-xl font-semibold leading-snug tracking-tight text-foreground lg:text-2xl">
                    {todayData.summary}
                  </h1>

                  {/* Body */}
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground lg:text-base">
                    {todayData.body}
                  </p>

                  {/* AI chat trigger - inline */}
                  <button
                    onClick={() => setChatOpen(true)}
                    className="mt-5 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                    type="button"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    이 내용에 대해 더 이야기하기
                  </button>

                  {/* Decorative seal */}
                  <div className="mt-5 flex justify-end">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent/30">
                      <span className="font-serif text-[10px] font-bold text-accent">
                        {"吉"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-8 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    사주 분석 결과를 불러오는 중입니다
                  </p>
                </div>
              )}
            </section>

            {/* Practice Block */}
            <section className="mt-6" aria-label="오늘의 실천">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  오늘의 실천
                </h2>
                {aiActions.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-accent">
                    <Sparkles className="h-3 w-3" />
                    AI 추천 포함
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {allActions.map((action) => {
                  const isAi = action.id.startsWith("ai-")
                  return (
                    <label
                      key={action.id}
                      className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-secondary/50 ${
                        checkedActions.has(action.id)
                          ? "border-primary/30 bg-primary/5"
                          : isAi
                            ? "border-accent/20 bg-accent/5"
                            : "border-border bg-card"
                      }`}
                    >
                      <Checkbox
                        checked={checkedActions.has(action.id)}
                        onCheckedChange={() => toggleAction(action.id)}
                        className="mt-0.5 h-5 w-5 rounded-md border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                        aria-label={action.text}
                      />
                      <div className="flex-1">
                        <span
                          className={`text-sm leading-relaxed ${
                            checkedActions.has(action.id)
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {action.text}
                        </span>
                        {isAi && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-accent">
                            <Sparkles className="h-2.5 w-2.5" />
                            AI
                          </span>
                        )}
                      </div>
                    </label>
                  )
                })}

                {/* Avoid row */}
                {(todayData || !isLoading) && (
                  <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="text-sm leading-relaxed text-foreground">
                      {todayData?.avoid ?? "차분하게 하루를 보내보세요"}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Evidence trigger */}
            <section className="mb-8 mt-6">
              <button
                onClick={() => setDeepDiveOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-3.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                <span>왜 이렇게 나왔나요?</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </section>
          </div>

          {/* Right sidebar (desktop only) */}
          <aside className="hidden lg:block lg:w-72 lg:shrink-0 lg:pt-14">
            <div className="sticky top-6 max-h-[calc(100vh-5rem)] overflow-y-auto space-y-6">
              {/* Check-in */}
              <CheckInChips />

              {/* AI conversation prompt */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    AI 대화
                  </h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  오늘의 기운에 대해 궁금한 게 있나요? AI와 대화하며 나만의 실천을 찾아보세요.
                </p>
                <button
                  onClick={() => setChatOpen(true)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                  type="button"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  대화 시작하기
                </button>
              </div>

            {/* Recent progress — localStorage 기반 */}
            <RecentHistory />
            </div>
          </aside>
        </div>

        {/* Check-in (mobile only) */}
        <div className="mb-8 mt-4 lg:hidden">
          <CheckInChips />
        </div>
      </div>

      {/* Panels */}
      <DeepDiveSheet open={deepDiveOpen} onOpenChange={setDeepDiveOpen} />
      <AIChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        context="today"
        onActionsGenerated={setAiActions}
      />
    </>
  )
}
