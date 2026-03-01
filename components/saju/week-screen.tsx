"use client"

import { useMemo, useState, type ElementType } from "react"
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
  MessageCircle,
  Sparkles,
  BookOpen,
} from "lucide-react"
import { AIChatPanel } from "./ai-chat-panel"
import { useSaju } from "@/lib/contexts/saju-context"
import type { PlanetId } from "@/lib/astrology/static/types"

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

const PLANET_ICON: Record<PlanetId, ElementType<{ className?: string }>> = {
  SUN: Sun,
  MOON: Moon,
  MERCURY: Wind,
  VENUS: Star,
  MARS: Flame,
  JUPITER: TreePine,
  SATURN: Droplets,
}

const PLANET_KEYWORD: Record<PlanetId, string> = {
  SUN: "정렬",
  MOON: "돌봄",
  MERCURY: "소통",
  VENUS: "관계",
  MARS: "실행",
  JUPITER: "확장",
  SATURN: "구조",
}

function getWeekdayLabel(dateIso: string): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"]
  const [yyyy, mm, dd] = dateIso.split("-").map((v) => Number(v))
  const date = new Date(Date.UTC(yyyy, (mm || 1) - 1, dd || 1))
  return days[date.getUTCDay()] ?? "?"
}

function getShortDateLabel(dateIso: string): string {
  const [yyyy, mm, dd] = dateIso.split("-").map((v) => Number(v))
  if (!yyyy || !mm || !dd) return dateIso
  return `${mm}/${dd}`
}

export function WeekScreen() {
  const { astrologyResult } = useSaju()
  const [journalText, setJournalText] = useState("")
  const [journalSaved, setJournalSaved] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const weekData = useMemo<WeekData>(() => {
    if (!astrologyResult) return WEEK_DATA

    const dominantPlanet = astrologyResult.ranking[0] ?? "SUN"
    const days = astrologyResult.future.days.map((day) => ({
      day: getWeekdayLabel(day.date),
      date: getShortDateLabel(day.date),
      icon: PLANET_ICON[day.dominantPlanet],
      keyword: PLANET_KEYWORD[day.dominantPlanet],
      note: day.focus,
      highlight: day.intensity === "high",
    }))

    return {
      theme: astrologyResult.today.headline,
      range: astrologyResult.future.rangeLabel,
      days,
      aiRecap: {
        summary: "점성 정적 분석 기반 주간 리캡",
        keywords: astrologyResult.ranking.slice(0, 3).map((planet) => PLANET_KEYWORD[planet]),
        emotionPattern: astrologyResult.today.summary,
        suggestion: astrologyResult.today.actions[0] ?? "이번 주 핵심 과제 하나를 명확히 정해보세요.",
      },
      prompt: `${PLANET_KEYWORD[dominantPlanet]} 흐름을 살리기 위해 이번 주 어떤 선택을 하시겠어요?`,
    }
  }, [astrologyResult])

  const handleJournalSave = () => {
    if (!journalText.trim()) return
    setJournalSaved(true)
  }

  const handleDayTap = (date: string) => {
    setSelectedDay(selectedDay === date ? null : date)
  }

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-6 lg:max-w-5xl lg:px-8">
        <div className="lg:flex lg:gap-10">
          {/* Main column */}
          <div className="lg:max-w-2xl lg:flex-1">
            {/* Week Header */}
            <header className="py-2">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {weekData.range}
              </p>
              <h1 className="mt-2 text-balance font-serif text-xl font-semibold leading-snug text-foreground lg:text-2xl">
                {weekData.theme}
              </h1>
            </header>

            {/* AI weekly chat trigger */}
            <button
              onClick={() => setChatOpen(true)}
              className="mt-4 flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
              type="button"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  이번 주 흐름에 대해 AI와 대화하기
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  궁금한 날을 더 깊이 탐색하거나, 주간 플랜을 함께 세워보세요
                </p>
              </div>
            </button>

            {/* 7-day forecast list */}
            <section className="mt-6" aria-label="7일 예보">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                이번 주 예보
              </h2>
              <div className="space-y-2">
                {weekData.days.map((day) => {
                  const Icon = day.icon
                  const isSelected = selectedDay === day.date
                  return (
                    <div key={day.date}>
                      <button
                        onClick={() => handleDayTap(day.date)}
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
                        {/* Day info */}
                        <div className="flex w-12 shrink-0 flex-col items-center">
                          <span className="text-xs text-muted-foreground">{day.day}</span>
                          <span className="text-sm font-semibold text-foreground">
                            {day.date.split("/")[1]}
                          </span>
                        </div>

                        {/* Icon */}
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

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                day.highlight ? "text-primary" : "text-foreground"
                              }`}
                            >
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

                      {/* Expanded day detail with AI chat option */}
                      {isSelected && (
                        <div className="ml-16 mt-1 rounded-lg border border-border bg-secondary/30 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          <p className="text-sm text-muted-foreground">{day.note}</p>
                          <button
                            onClick={() => setChatOpen(true)}
                            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                            type="button"
                          >
                            <MessageCircle className="h-3 w-3" />
                            이 날에 대해 더 알아보기
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* Right sidebar (desktop) */}
          <aside className="hidden lg:block lg:w-72 lg:shrink-0 lg:pt-14">
            <div className="sticky top-6 space-y-6">
              {/* AI Weekly Recap */}
              <AIRecapCard recap={weekData.aiRecap} />

              {/* Journal prompt */}
              <JournalPrompt
                prompt={weekData.prompt}
                text={journalText}
                onTextChange={setJournalText}
                saved={journalSaved}
                onSave={handleJournalSave}
              />
            </div>
          </aside>
        </div>

        {/* Mobile: AI recap + Journal below forecast */}
        <div className="mt-8 space-y-6 lg:hidden">
          <AIRecapCard recap={weekData.aiRecap} />
          <JournalPrompt
            prompt={weekData.prompt}
            text={journalText}
            onTextChange={setJournalText}
            saved={journalSaved}
            onSave={handleJournalSave}
          />
        </div>
      </div>

      <AIChatPanel open={chatOpen} onOpenChange={setChatOpen} context="week" />
    </>
  )
}

function AIRecapCard({ recap }: { recap: typeof WEEK_DATA.aiRecap }) {
  return (
    <section
      className="rounded-xl border border-border bg-card p-5"
      aria-label="AI 주간 리캡"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI 주간 리캡
        </h3>
      </div>

      <p className="mt-3 text-sm font-medium text-foreground">{recap.summary}</p>

      {/* Keywords */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {recap.keywords.map((kw) => (
          <span
            key={kw}
            className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
          >
            {kw}
          </span>
        ))}
      </div>

      {/* Emotion pattern */}
      <div className="mt-4 rounded-lg bg-secondary/50 p-3">
        <h4 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <BookOpen className="h-3 w-3" />
          감정 패턴
        </h4>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {recap.emotionPattern}
        </p>
      </div>

      {/* Suggestion */}
      <p className="mt-3 text-xs leading-relaxed text-primary">{recap.suggestion}</p>
    </section>
  )
}

function JournalPrompt({
  prompt,
  text,
  onTextChange,
  saved,
  onSave,
}: {
  prompt: string
  text: string
  onTextChange: (v: string) => void
  saved: boolean
  onSave: () => void
}) {
  return (
    <section
      className="rounded-xl border border-border bg-card p-5"
      aria-label="이번 주 저널"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        이번 주 질문
      </h3>
      <p className="mt-2 font-serif text-base leading-snug text-foreground">
        {prompt}
      </p>

      {saved ? (
        <div className="mt-3 animate-in fade-in duration-300">
          <p className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
            {text}
          </p>
          <p className="mt-2 text-xs text-primary/70">저장되었어요</p>
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
            disabled={!text.trim()}
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
