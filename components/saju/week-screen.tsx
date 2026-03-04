"use client"

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Star,
  Droplets,
  Wind,
  Sun,
  Flame,
  TreePine,
  Moon,
  Send,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react"
import { toast } from "sonner"
import { DeepDiveSheet } from "./deep-dive-sheet"
import { WhyThisResult } from "./why-this-result"
import { useSaju } from "@/lib/contexts/saju-context"
import { useSajuInterpret } from "@/lib/hooks/use-saju-interpret"
import type { PlanetId } from "@/lib/astrology/static/types"
import type { WeeklyFortune } from "@/lib/use-cases/interpret-saju"

// =============================================================================
// 티어 설정 — 추후 구독 정보 연동 시 이 값만 교체
// =============================================================================
const FREE_PAST_WEEKS = 4   // 무료: 최근 4주 기록 열람
const FREE_FUTURE_WEEKS = 1 // 무료: 다음 1주 예보
const MAX_NAV_PAST = 8      // 네비게이션 절대 하한 (더 이상 의미 없음)
const MAX_NAV_FUTURE = 4    // 네비게이션 절대 상한

type WeekMode = "past" | "past-locked" | "forecast" | "future-locked"

function getWeekMode(offset: number): WeekMode {
  if (offset < -FREE_PAST_WEEKS) return "past-locked"
  if (offset < 0) return "past"
  if (offset > FREE_FUTURE_WEEKS) return "future-locked"
  return "forecast"
}

// =============================================================================
// 타입 & 상수
// =============================================================================

interface WeekDay {
  day: string
  date: string
  icon: ElementType<{ className?: string }>
  keyword: string
  note: string
  highlight: boolean
}

interface WeekData {
  theme: string
  range: string
  days: WeekDay[]
  aiRecap: {
    summary: string
    keywords: string[]
    emotionPattern: string
    suggestion: string
  }
  prompt: string
}

const WEEK_DATA: WeekData = {
  theme: "이번 주는 내면의 힘을 키우는 시간입니다",
  range: "3/1 - 3/7",
  days: [
    { day: "월", date: "3/1", icon: Sun, keyword: "정리", note: "비우고 정돈하기 좋은 날", highlight: false },
    { day: "화", date: "3/2", icon: Flame, keyword: "표현", note: "숨겨온 마음을 꺼내보세요", highlight: true },
    { day: "수", date: "3/3", icon: Droplets, keyword: "휴식", note: "무리하지 말고 쉬어가세요", highlight: false },
    { day: "목", date: "3/4", icon: TreePine, keyword: "성장", note: "작은 배움이 큰 변화가 됩니다", highlight: false },
    { day: "금", date: "3/5", icon: Star, keyword: "만남", note: "좋은 인연이 찾아올 수 있어요", highlight: true },
    { day: "토", date: "3/6", icon: Wind, keyword: "이동", note: "가볍게 움직이며 리프레시", highlight: false },
    { day: "일", date: "3/7", icon: Moon, keyword: "마무리", note: "한 주를 돌아보며 감사하기", highlight: false },
  ],
  aiRecap: {
    summary: "이번 주 대화에서 반복된 키워드",
    keywords: ["관계 정리", "새로운 시작", "자기 돌봄"],
    emotionPattern: "주 초반에 불안감이 있었지만 중반 이후 안정감으로 전환되는 흐름이 보여요.",
    suggestion: "금요일의 만남 에너지를 활용해 미뤄둔 약속을 잡아보세요.",
  },
  prompt: "이번 주, 내가 가장 보호하고 싶은 것은 무엇인가요?",
}

const ICON_MAP: Record<string, ElementType<{ className?: string }>> = {
  정리: Wind, 표현: Flame, 휴식: Droplets, 성장: TreePine,
  만남: Star, 이동: Wind, 마무리: Moon, 시작: Sun,
  소통: Wind, 관계: Star, 실행: Flame, 확장: TreePine, 구조: Droplets,
  정렬: Sun, 돌봄: Moon,
}

const PLANET_ICON: Record<PlanetId, ElementType<{ className?: string }>> = {
  SUN: Sun, MOON: Moon, MERCURY: Wind, VENUS: Star,
  MARS: Flame, JUPITER: TreePine, SATURN: Droplets,
}

const PLANET_KEYWORD: Record<PlanetId, string> = {
  SUN: "정렬", MOON: "돌봄", MERCURY: "소통", VENUS: "관계",
  MARS: "실행", JUPITER: "확장", SATURN: "구조",
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"]

// =============================================================================
// 헬퍼
// =============================================================================

function getWeekdayLabel(dateIso: string): string {
  const [yyyy, mm, dd] = dateIso.split("-").map((v) => Number(v))
  const date = new Date(Date.UTC(yyyy, (mm || 1) - 1, dd || 1))
  return WEEKDAY_KO[date.getUTCDay()] ?? "?"
}

function getShortDateLabel(dateIso: string): string {
  const [yyyy, mm, dd] = dateIso.split("-").map((v) => Number(v))
  if (!yyyy || !mm || !dd) return dateIso
  return `${mm}/${dd}`
}

function getWeekRangeLabel(startDate: string): string {
  const start = new Date(startDate + "T00:00:00")
  const end = new Date(startDate + "T00:00:00")
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAY_KO[d.getDay()]})`
  return `${fmt(start)} - ${fmt(end)}`
}

function getCurrentWeekMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

function mapLlmToWeekData(llm: WeeklyFortune, startDate: string): WeekData {
  return {
    theme: llm.theme,
    range: getWeekRangeLabel(startDate),
    days: llm.days.map((day) => ({
      day: day.day,
      date: day.date,
      icon: ICON_MAP[day.keyword] ?? Sun,
      keyword: day.keyword,
      note: day.note,
      highlight: day.highlight,
    })),
    aiRecap: llm.aiRecap,
    prompt: llm.prompt,
  }
}

// =============================================================================
// WeekScreen
// =============================================================================

export function WeekScreen() {
  const { astrologyResult, birthInfo } = useSaju()
  const [journalText, setJournalText] = useState("")
  const [journalSaved, setJournalSaved] = useState(false)
  const [journalLoading, setJournalLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [deepDiveOpen, setDeepDiveOpen] = useState(false)
  const [deepDiveDay, setDeepDiveDay] = useState<string | null>(null)

  const currentWeekMonday = useMemo(() => getCurrentWeekMonday(), [])

  const viewedWeekStartDate = useMemo(() => {
    const base = new Date(currentWeekMonday + "T00:00:00")
    base.setDate(base.getDate() + weekOffset * 7)
    return base.toISOString().slice(0, 10)
  }, [currentWeekMonday, weekOffset])

  const weekMode = useMemo(() => getWeekMode(weekOffset), [weekOffset])
  const isForecast = weekMode === "forecast"

  // 예보 모드에서만 LLM fetch
  const { data: llmWeekly, isLoading: weekLoading } = useSajuInterpret(
    "weekly",
    isForecast ? birthInfo : null,
    viewedWeekStartDate,
  )

  const weekData = useMemo<WeekData>(() => {
    if (llmWeekly) return mapLlmToWeekData(llmWeekly, viewedWeekStartDate)
    if (weekOffset === 0 && astrologyResult) {
      const dominantPlanet = astrologyResult.ranking[0] ?? "SUN"
      return {
        theme: astrologyResult.today.headline,
        range: astrologyResult.future.rangeLabel,
        days: astrologyResult.future.days.map((day) => ({
          day: getWeekdayLabel(day.date),
          date: getShortDateLabel(day.date),
          icon: PLANET_ICON[day.dominantPlanet],
          keyword: PLANET_KEYWORD[day.dominantPlanet],
          note: day.focus,
          highlight: day.intensity === "high",
        })),
        aiRecap: {
          summary: "데이터 기반 주간 리캡",
          keywords: astrologyResult.ranking.slice(0, 3).map((p) => PLANET_KEYWORD[p]),
          emotionPattern: astrologyResult.today.summary,
          suggestion: astrologyResult.today.actions[0] ?? "이번 주 핵심 과제 하나를 명확히 정해보세요.",
        },
        prompt: `${PLANET_KEYWORD[dominantPlanet]} 흐름을 살리기 위해 이번 주 어떤 선택을 하시겠어요?`,
      }
    }
    return WEEK_DATA
  }, [llmWeekly, astrologyResult, viewedWeekStartDate, weekOffset])

  // 주 변경 시 저널·선택 상태 초기화 + 해당 주 저널 로드
  useEffect(() => {
    setJournalText("")
    setJournalSaved(false)
    setSelectedDay(null)
    if (weekMode === "past-locked" || weekMode === "future-locked") return

    let cancelled = false
    setJournalLoading(true)
    fetch(`/api/user/journal?weekStart=${viewedWeekStartDate}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.entries?.length) return
        const entry = data.entries[0] as { text: string; prompt: string }
        setJournalText(entry.text)
        setJournalSaved(true)
      })
      .catch((err) => {
        console.error("저널 불러오기 실패:", err)
        toast.error("저널을 불러오지 못했습니다")
      })
      .finally(() => { if (!cancelled) setJournalLoading(false) })
    return () => { cancelled = true }
  }, [viewedWeekStartDate, weekMode])

  const handleJournalSave = useCallback(async () => {
    if (!journalText.trim()) return
    setJournalLoading(true)
    try {
      const res = await fetch("/api/user/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: weekData.prompt,
          text: journalText.trim(),
          weekStart: viewedWeekStartDate,
        }),
      })
      if (res.ok) setJournalSaved(true)
    } catch (err) {
      console.error("저널 저장 실패:", err)
      toast.error("저장에 실패했습니다. 다시 시도해주세요")
    } finally {
      setJournalLoading(false)
    }
  }, [journalText, viewedWeekStartDate, weekData.prompt])

  const weekRangeLabel = getWeekRangeLabel(viewedWeekStartDate)
  const weekOffsetLabel =
    weekOffset === 0 ? "이번 주" : weekOffset > 0 ? `+${weekOffset}주` : `${weekOffset}주`

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-6 lg:max-w-5xl lg:px-8">
        {/* 주 네비게이션 */}
        <div className="flex items-center justify-between py-2">
          <button
            type="button"
            onClick={() => setWeekOffset((o) => Math.max(o - 1, -MAX_NAV_PAST))}
            disabled={weekOffset <= -MAX_NAV_PAST}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
            aria-label="이전 주"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {weekRangeLabel}
              </span>
              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  이번 주로
                </button>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground/50">{weekOffsetLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => setWeekOffset((o) => Math.min(o + 1, MAX_NAV_FUTURE))}
            disabled={weekOffset >= MAX_NAV_FUTURE}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
            aria-label="다음 주"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 모드별 콘텐츠 */}
        {weekMode === "past-locked" && (
          <LockedView
            type="past"
            weekOffset={weekOffset}
            onUnlock={() => { /* TODO: 업그레이드 플로우 */ }}
          />
        )}

        {weekMode === "future-locked" && (
          <LockedView
            type="future"
            weekOffset={weekOffset}
            onUnlock={() => { /* TODO: 업그레이드 플로우 */ }}
          />
        )}

        {weekMode === "past" && (
          <PastWeekView
            journalText={journalText}
            journalSaved={journalSaved}
            journalLoading={journalLoading}
            weekOffset={weekOffset}
          />
        )}

        {weekMode === "forecast" && (
          <div className="lg:flex lg:gap-10">
            {/* Main column */}
            <div className="lg:max-w-2xl lg:flex-1">
              {/* 주간 테마 */}
              <header className="pt-2 pb-0">
                {weekLoading && !llmWeekly ? (
                  <div className="h-7 w-3/4 animate-pulse rounded-lg bg-secondary" />
                ) : (
                  <h1 className="text-balance font-serif text-xl font-semibold leading-snug text-foreground lg:text-2xl">
                    {weekData.theme}
                  </h1>
                )}
              </header>

              {/* 7일 예보 */}
              <section className="mt-6" aria-label="7일 예보">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {weekOffset === 0 ? "이번 주" : "다음 주"} 예보
                </h2>

                {weekLoading && !llmWeekly ? (
                  <div className="space-y-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {weekData.days.map((day) => {
                      const Icon = day.icon
                      const isSelected = selectedDay === day.date
                      return (
                        <div key={day.date}>
                          <button
                            onClick={() => setSelectedDay(isSelected ? null : day.date)}
                            className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                              day.highlight
                                ? "border-primary/30 bg-primary/5"
                                : isSelected
                                  ? "border-primary/20 bg-card"
                                  : "border-border bg-card"
                            }`}
                            type="button"
                            aria-expanded={isSelected}
                          >
                            <div className="flex w-12 shrink-0 flex-col items-center">
                              <span className="text-xs text-muted-foreground">{day.day}</span>
                              <span className="text-sm font-semibold text-foreground">
                                {day.date.split("/")[1]}
                              </span>
                            </div>
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                day.highlight ? "bg-primary/10" : "bg-secondary"
                              }`}
                            >
                              <Icon
                                className={`h-4 w-4 ${
                                  day.highlight ? "text-primary" : "text-muted-foreground"
                                }`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${day.highlight ? "text-primary" : "text-foreground"}`}>
                                  {day.keyword}
                                </span>
                                {day.highlight && (
                                  <span className="flex h-4 items-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                                    주목
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {day.note}
                              </p>
                            </div>
                          </button>

                          {isSelected && (
                            <div className="ml-16 mt-1 rounded-lg border border-border bg-secondary/30 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                              <p className="text-sm text-muted-foreground">{day.note}</p>
                              <WhyThisResult
                                onClick={() => {
                                  setDeepDiveOpen(true)
                                  setDeepDiveDay(day.date)
                                }}
                                className="mt-2 py-2 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* 주간 전체 "왜 이렇게 나왔나요?" */}
              <section className="mt-6">
                <WhyThisResult onClick={() => {
                  setDeepDiveOpen(true)
                  setDeepDiveDay(null)
                }} />
              </section>
            </div>

            {/* 데스크탑 사이드바 */}
            <aside className="hidden lg:block lg:w-72 lg:shrink-0 lg:pt-10">
              <div className="sticky top-6 space-y-6">
                <AIRecapCard recap={weekData.aiRecap} />
                <JournalPrompt
                  prompt={weekData.prompt}
                  text={journalText}
                  onTextChange={setJournalText}
                  saved={journalSaved}
                  loading={journalLoading}
                  onSave={handleJournalSave}
                  readOnly={false}
                />
              </div>
            </aside>
          </div>
        )}

        {/* 모바일: 예보 모드 하단 섹션 */}
        {weekMode === "forecast" && (
          <div className="mt-8 space-y-6 lg:hidden">
            <AIRecapCard recap={weekData.aiRecap} />
            <JournalPrompt
              prompt={weekData.prompt}
              text={journalText}
              onTextChange={setJournalText}
              saved={journalSaved}
              loading={journalLoading}
              onSave={handleJournalSave}
              readOnly={false}
            />
          </div>
        )}
      </div>

      <DeepDiveSheet
        open={deepDiveOpen}
        onOpenChange={setDeepDiveOpen}
        context="weekly"
        contextData={{ dayDate: deepDiveDay ?? undefined }}
      />
    </>
  )
}

// =============================================================================
// Mock — 추후 LLM weekly_recap API로 교체 예정
// =============================================================================

interface WeekRecap {
  theme: string
  keywords: string[]
  reflection: string
  insight: string
}

/** TODO: replace with real API call to /api/saju/interpret (type: "weekly_recap") */
const MOCK_WEEK_RECAPS: WeekRecap[] = [
  {
    theme: "흔들렸지만 중심을 잃지 않은 한 주",
    keywords: ["관계", "인내", "자기돌봄"],
    reflection:
      "이 주는 외부의 자극이 많았고, 그 안에서 자신의 감정을 다스리는 것이 주된 과제였어요. 감정의 파도가 높았지만 안정의 에너지가 서서히 균형을 잡아줬습니다.",
    insight: "흔들리는 것 자체가 살아있다는 증거예요. 이 주의 경험이 다음 주 결정의 토대가 됩니다.",
  },
  {
    theme: "새로운 방향을 조심스럽게 탐색한 한 주",
    keywords: ["시작", "탐색", "설렘"],
    reflection:
      "성장의 에너지가 활발해지면서 새로운 아이디어와 만남의 기회가 생겼던 주였어요. 다만 아직 결실보다는 씨앗을 심는 단계였기에, 서두르지 않는 것이 중요했습니다.",
    insight: "이 주에 심은 씨앗이 어떤 모습으로 자라고 있는지 지금 한 번 돌아보세요.",
  },
  {
    theme: "내면의 목소리에 귀 기울인 조용한 한 주",
    keywords: ["휴식", "성찰", "재충전"],
    reflection:
      "에너지의 충돌로 소모가 컸던 주였어요. 몸과 마음 모두 회복을 원하는 신호를 보내고 있었고, 그 신호를 잘 받아들인 것이 이 주의 가장 큰 성취입니다.",
    insight: "쉬는 것도 앞으로 나아가는 방법 중 하나임을 이 주가 증명해줬어요.",
  },
  {
    theme: "실행과 결단이 요구되었던 한 주",
    keywords: ["결정", "행동", "전환점"],
    reflection:
      "열정의 에너지가 강했던 이 주는 망설임보다는 행동이 더 큰 의미를 가졌어요. 미뤄왔던 결정들을 하나씩 처리하면서 결단의 에너지가 그 선택들을 단단하게 다져줬습니다.",
    insight: "이 주에 내린 결정들을 신뢰하세요. 그 선택은 지금의 흐름과 잘 맞닿아 있었습니다.",
  },
]

function getMockRecap(weekOffset: number): WeekRecap {
  // weekOffset은 음수 (-1 ~ -4). 인덱스로 변환해 순환 사용
  const idx = (Math.abs(weekOffset) - 1) % MOCK_WEEK_RECAPS.length
  return MOCK_WEEK_RECAPS[idx] ?? MOCK_WEEK_RECAPS[0]!
}

// =============================================================================
// PastWeekView — 과거 기록 뷰
// =============================================================================

function PastWeekView({
  journalText,
  journalSaved,
  journalLoading,
  weekOffset,
}: {
  journalText: string
  journalSaved: boolean
  journalLoading: boolean
  weekOffset: number
}) {
  const label = `${Math.abs(weekOffset)}주 전 기록`
  const recap = getMockRecap(weekOffset)

  return (
    <div className="mt-4 space-y-4">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>

      {/* 회고 요약 (mock) */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            이 주의 회고 요약
          </h3>
        </div>

        <p className="mt-3 font-serif text-base font-medium leading-snug text-foreground">
          {recap.theme}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {recap.keywords.map((kw) => (
            <span key={kw} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
              {kw}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {recap.reflection}
        </p>

        <div className="mt-4 rounded-lg bg-primary/5 p-3">
          <p className="text-xs leading-relaxed text-primary">{recap.insight}</p>
        </div>
      </section>

      {/* 저널 기록 (읽기 전용) */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          이 주의 기록
        </h3>
        {journalLoading ? (
          <div className="mt-3 h-16 animate-pulse rounded-lg bg-secondary" />
        ) : journalText ? (
          <div className="mt-3">
            <p className="rounded-lg bg-secondary/50 p-3 text-sm leading-relaxed text-muted-foreground">
              {journalText}
            </p>
            {journalSaved && (
              <p className="mt-2 text-xs text-muted-foreground/50">저장된 기록</p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground/40">
            이 주에 작성된 기록이 없어요.
          </p>
        )}
      </section>
    </div>
  )
}

// =============================================================================
// LockedView — 티어 초과 잠금 뷰
// =============================================================================

function LockedView({
  type,
  weekOffset,
  onUnlock,
}: {
  type: "past" | "future"
  weekOffset: number
  onUnlock: () => void
}) {
  const isPast = type === "past"
  const title = isPast ? "지난 기록" : "미래 예보"
  const description = isPast
    ? `${FREE_PAST_WEEKS}주 이전 기록은 프리미엄에서 열람할 수 있어요.`
    : `다음 주 이후 예보는 프리미엄에서 먼저 볼 수 있어요.`
  const sub = isPast
    ? `현재 ${Math.abs(weekOffset)}주 전 — 무료 플랜은 최근 ${FREE_PAST_WEEKS}주까지`
    : `현재 +${weekOffset}주 — 무료 플랜은 다음 ${FREE_FUTURE_WEEKS}주까지`

  return (
    <div className="mt-8 flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
        <p className="mt-2 text-[10px] text-muted-foreground/50">{sub}</p>
      </div>
      <Button
        size="sm"
        onClick={onUnlock}
        className="h-9 rounded-xl px-6 text-xs font-medium"
      >
        프리미엄 알아보기
      </Button>
    </div>
  )
}

// =============================================================================
// AIRecapCard
// =============================================================================

function AIRecapCard({ recap }: { recap: typeof WEEK_DATA.aiRecap }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5" aria-label="AI 주간 리캡">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI 주간 리캡
        </h3>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{recap.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {recap.keywords.map((kw) => (
          <span key={kw} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
            {kw}
          </span>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-secondary/50 p-3">
        <h4 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <BookOpen className="h-3 w-3" />
          감정 패턴
        </h4>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {recap.emotionPattern}
        </p>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-primary">{recap.suggestion}</p>
    </section>
  )
}

// =============================================================================
// JournalPrompt
// =============================================================================

function JournalPrompt({
  prompt,
  text,
  onTextChange,
  saved,
  loading,
  onSave,
  readOnly,
}: {
  prompt: string
  text: string
  onTextChange: (v: string) => void
  saved: boolean
  loading: boolean
  onSave: () => void
  readOnly: boolean
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5" aria-label="이번 주 저널">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        이번 주 질문
      </h3>
      <p className="mt-2 font-serif text-base leading-snug text-foreground">{prompt}</p>

      {saved || readOnly ? (
        <div className="mt-3 animate-in fade-in duration-300">
          <p className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
            {text || "기록 없음"}
          </p>
          {saved && <p className="mt-2 text-xs text-primary/70">저장되었어요</p>}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <Textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="30초만 적어보세요..."
            rows={3}
            className="resize-none rounded-lg border-border bg-secondary/30 text-sm text-foreground placeholder:text-muted-foreground/50"
          />
          <Button
            size="sm"
            onClick={onSave}
            disabled={!text.trim() || loading}
            className="h-8 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground"
          >
            <Send className="mr-1.5 h-3 w-3" />
            저장
          </Button>
        </div>
      )}
    </section>
  )
}
