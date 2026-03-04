"use client"

import { useState } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { X, BookOpen, HelpCircle, Star, MessageCircle, AlertTriangle } from "lucide-react"
import { ChatInterface } from "./chat-interface"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSaju } from "@/lib/contexts/saju-context"
import type { FortuneResponse } from "@/lib/saju-core"
import type {
  AstrologyStaticResult,
  PlanetId,
  FutureDayInsight,
  TodayInsight,
} from "@/lib/astrology/static/types"
import type { DecisionFortune } from "@/lib/use-cases/interpret-saju"
import type { HyungchungResult } from "@/lib/saju-core/saju/hyungchung"
import { PLANET_LABEL, PLANET_THEME } from "@/lib/astrology/static/constants"
import { ELEMENT_HEX, ELEMENT_LABEL as ELEMENT_LABEL_SHARED } from "@/lib/constants/element-colors"

export type DeepDiveContext = "today" | "weekly" | "decision"

interface DeepDiveSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context?: DeepDiveContext
  contextData?: {
    dayDate?: string
    decisionResult?: DecisionFortune
  }
  onActionsGenerated?: (actions: string[]) => void
}

/* ═══════════════════════════════════════════════════════════════════════════
   상수
   ═══════════════════════════════════════════════════════════════════════════ */

// ELEMENT_LABEL, ELEMENT_HEX → @/lib/constants/element-colors 에서 import
const ELEMENT_LABEL = ELEMENT_LABEL_SHARED

const FALLBACK_ELEMENTS: FiveElementItem[] = [
  { element: "목", label: "Wood", value: 2, color: ELEMENT_HEX["목"], textColor: "text-white" },
  { element: "화", label: "Fire", value: 1, color: ELEMENT_HEX["화"], textColor: "text-white" },
  { element: "토", label: "Earth", value: 3, color: ELEMENT_HEX["토"], textColor: "text-white" },
  { element: "금", label: "Metal", value: 1, color: ELEMENT_HEX["금"], textColor: "text-white" },
  { element: "수", label: "Water", value: 1, color: ELEMENT_HEX["수"], textColor: "text-white" },
]

const PLANET_COLOR: Record<PlanetId, string> = {
  SUN: "text-amber-500",
  MOON: "text-blue-300",
  MERCURY: "text-emerald-500",
  VENUS: "text-pink-400",
  MARS: "text-red-500",
  JUPITER: "text-purple-500",
  SATURN: "text-slate-500",
}

const INTENSITY_LABEL: Record<string, { text: string; color: string }> = {
  high: { text: "강", color: "text-red-500" },
  medium: { text: "중", color: "text-amber-500" },
  low: { text: "약", color: "text-blue-400" },
}

/* ─── 십신 용어 사전 ─── */

const SIPSIN_GLOSSARY: Record<string, { term: string; definition: string; description: string }> = {
  비견: { term: "비견 (比肩)", definition: "일간과 같은 오행·같은 음양. 자립심, 경쟁심, 독립을 상징합니다.", description: "자기 주관이 뚜렷하고 독립적인 에너지입니다." },
  겁재: { term: "겁재 (劫財)", definition: "일간과 같은 오행·다른 음양. 승부욕, 사교성, 도전을 상징합니다.", description: "적극적으로 도전하고 사교적인 면이 강합니다." },
  식신: { term: "식신 (食神)", definition: "일간이 생(生)하는 오행 중 음양이 같은 것. 표현, 재능, 식복을 의미합니다.", description: "내면의 것을 밖으로 표현하는 에너지입니다." },
  상관: { term: "상관 (傷官)", definition: "일간이 생(生)하는 오행 중 음양이 다른 것. 창의성, 날카로운 감각을 의미합니다.", description: "기존 틀을 깨고 새로운 것을 만드는 힘입니다." },
  편재: { term: "편재 (偏財)", definition: "일간이 극(剋)하는 오행 중 음양이 같은 것. 유동재산, 사업수완을 의미합니다.", description: "투자와 사업에 대한 감각이 뛰어납니다." },
  정재: { term: "정재 (正財)", definition: "일간이 극(剋)하는 오행 중 음양이 다른 것. 안정적 재산, 근면성을 의미합니다.", description: "꾸준한 노력으로 안정을 쌓는 에너지입니다." },
  편관: { term: "편관 (偏官)", definition: "일간을 극(剋)하는 오행 중 음양이 같은 것. 권위, 도전, 변화를 상징합니다.", description: "변화와 도전을 이끄는 강한 에너지입니다." },
  정관: { term: "정관 (正官)", definition: "일간을 극(剋)하는 오행 중 음양이 다른 것. 명예, 질서, 책임감을 상징합니다.", description: "질서와 규범 속에서 성장하는 에너지입니다." },
  편인: { term: "편인 (偏印)", definition: "일간을 생(生)해주는 오행 중 음양이 다른 것. 비전통적 학문, 직감, 영감을 상징합니다.", description: "직감과 영감의 기운이 강합니다." },
  정인: { term: "정인 (正印)", definition: "일간을 생(生)해주는 오행 중 음양이 같은 것. 학문, 교육, 모성을 상징합니다.", description: "지식과 배움을 통해 성장하는 에너지입니다." },
}

/* ═══════════════════════════════════════════════════════════════════════════
   타입
   ═══════════════════════════════════════════════════════════════════════════ */

interface FiveElementItem {
  element: string
  label: string
  value: number
  color: string
  textColor: string
}

interface PlanetSummary {
  planet: PlanetId
  label: string
  sign: string
  score: number
  interpretation: string
}

interface SharedDeepDiveProps {
  sajuResult: FortuneResponse | null
  astrologyResult: AstrologyStaticResult | null
  fiveElements: FiveElementItem[]
  keyTerms: Array<{ term: string; definition: string; description: string }>
  greatFortune: { heavenlyStem: string; earthlyBranch: string; sipsin: string; ageRange: string } | null
  strengthType: string | null
  planetSummaries: PlanetSummary[]
  todayInsight: TodayInsight | null
  hyungchungItems: string[]
  onOpenChat?: () => void
}

/* ═══════════════════════════════════════════════════════════════════════════
   헬퍼 함수
   ═══════════════════════════════════════════════════════════════════════════ */

function buildFiveElements(sajuResult: FortuneResponse | null): FiveElementItem[] {
  if (!sajuResult?.sinyakSingang) return FALLBACK_ELEMENTS

  const powers = (sajuResult.sinyakSingang as Record<string, unknown>).element_powers as Record<string, number> | undefined
  if (!powers) return FALLBACK_ELEMENTS

  const order = ["목", "화", "토", "금", "수"]
  return order.map((el) => ({
    element: el,
    label: ELEMENT_LABEL[el] ?? el,
    value: Math.round((powers[el] ?? 0) * 10) / 10,
    color: ELEMENT_HEX[el] ?? "#888",
    textColor: "text-white",
  }))
}

function extractKeyTerms(sajuResult: FortuneResponse | null) {
  if (!sajuResult?.sipsin) return []

  const sipsin = sajuResult.sipsin as Record<string, unknown>
  const positions = sipsin.positions as Record<string, string> | undefined
  if (!positions) return []

  // 일주 기준 주요 십신 추출 (중복 제거, 최대 3개)
  const seen = new Set<string>()
  const terms: Array<{ term: string; definition: string; description: string }> = []

  for (const value of Object.values(positions)) {
    const name = value.replace(/\s*\(.*\)/, "").trim()
    if (seen.has(name)) continue
    seen.add(name)

    const glossary = SIPSIN_GLOSSARY[name]
    if (glossary) {
      terms.push(glossary)
    }
    if (terms.length >= 3) break
  }

  return terms
}

function extractGreatFortune(sajuResult: FortuneResponse | null) {
  if (!sajuResult?.greatFortune) return null

  const gf = sajuResult.greatFortune as Record<string, Record<string, string>>
  const currentPeriod = gf.current_period
  if (!currentPeriod) return null

  return {
    heavenlyStem: currentPeriod.heavenly_stem ?? "",
    earthlyBranch: currentPeriod.earthly_branch ?? "",
    sipsin: currentPeriod.sipsin ?? "",
    ageRange: currentPeriod.age_range ?? "",
  }
}

function extractStrength(sajuResult: FortuneResponse | null): string | null {
  if (!sajuResult?.sinyakSingang) return null
  const data = sajuResult.sinyakSingang as Record<string, string>
  return data.strength_type ?? null
}

/* ─── 새 헬퍼: 점성술 + 형충파해 데이터 추출 ─── */

function buildPlanetSummaries(astrologyResult: AstrologyStaticResult | null, count = 4): PlanetSummary[] {
  if (!astrologyResult) return []
  return astrologyResult.ranking.slice(0, count).map((planetId) => {
    const pos = astrologyResult.positions[planetId]
    const inf = astrologyResult.influences[planetId]
    return {
      planet: planetId,
      label: PLANET_LABEL[planetId],
      sign: pos.signLabel,
      score: Math.round(inf.finalScore),
      interpretation: inf.interpretation,
    }
  })
}

function extractTodayInsight(astrologyResult: AstrologyStaticResult | null): TodayInsight | null {
  if (!astrologyResult?.today) return null
  return astrologyResult.today
}

function extractFutureDays(astrologyResult: AstrologyStaticResult | null): FutureDayInsight[] {
  if (!astrologyResult?.future?.days) return []
  return astrologyResult.future.days
}

function extractHyungchungItems(sajuResult: FortuneResponse | null): string[] {
  if (!sajuResult?.hyungchung) return []
  const hc = sajuResult.hyungchung as HyungchungResult
  const items: string[] = []
  if (hc.samhap) items.push(hc.samhap)
  if (hc.ganhap) items.push(...hc.ganhap)
  if (hc.samhyung) items.push(hc.samhyung)
  if (hc.jahyung) items.push(...hc.jahyung)
  if (hc.chungsal) items.push(...hc.chungsal)
  if (hc.pasal) items.push(...hc.pasal)
  if (hc.haesal) items.push(...hc.haesal)
  return items
}

/* ═══════════════════════════════════════════════════════════════════════════
   공유 UI 컴포넌트
   ═══════════════════════════════════════════════════════════════════════════ */

function GlossaryTooltip({
  term,
  definition,
}: {
  term: string
  definition: string
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center gap-0.5 border-b border-dashed border-primary/40 font-medium text-primary"
            type="button"
          >
            {term}
            <HelpCircle className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px] rounded-lg bg-foreground px-3 py-2 text-xs leading-relaxed text-background">
          <p>{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function FiveElementsGrid({ elements, description }: { elements: FiveElementItem[]; description?: string }) {
  return (
    <>
      <div className="grid grid-cols-5 gap-2">
        {elements.map((item) => (
          <div key={item.element} className="text-center">
            <div
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: item.color }}
            >
              <span className="font-serif text-sm font-bold text-white">
                {item.element}
              </span>
            </div>
            <span className="mt-1.5 block text-[10px] text-muted-foreground">
              {item.label}
            </span>
            <span className="block text-xs font-medium text-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </div>
      {description && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{description}</p>
      )}
    </>
  )
}

function ChatCTA({ onOpenChat }: { onOpenChat?: () => void }) {
  if (!onOpenChat) return null
  return (
    <section className="pt-2">
      <button
        onClick={onOpenChat}
        className="flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
        type="button"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <MessageCircle className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            이 분석에 대해 AI와 대화하기
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            궁금한 점을 더 깊이 탐색해보세요
          </p>
        </div>
      </button>
    </section>
  )
}

/* ─── 행성 영향력 바 ─── */

function InfluenceBar({ score, maxScore = 100 }: { score: number; maxScore?: number }) {
  const pct = Math.min(Math.round((score / maxScore) * 100), 100)
  return (
    <div className="h-1.5 w-full rounded-full bg-secondary">
      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TODAY — "오늘의 근거"
   ═══════════════════════════════════════════════════════════════════════════ */

function TodayDeepDive({
  sajuResult,
  astrologyResult,
  fiveElements,
  keyTerms,
  greatFortune,
  strengthType,
  planetSummaries,
  todayInsight,
  hyungchungItems,
  onOpenChat,
}: SharedDeepDiveProps) {
  const dayPillar = sajuResult?.sajuData?.pillars?.일
  const dayElement = dayPillar?.오행?.천간 ?? "토"
  const dayElementLabel = ELEMENT_LABEL[dayElement] ?? dayElement

  const dominant = fiveElements.reduce((a, b) => (a.value > b.value ? a : b))

  return (
    <div className="space-y-6 px-1">
      {/* 섹션 1: 동양 관점 — 사주 */}
      <section>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          동양 관점: 사주
        </h3>

        {/* 오행 차트 */}
        <FiveElementsGrid
          elements={fiveElements}
          description={
            sajuResult
              ? `일주 ${dayElement}(${dayElementLabel}) 기운 중심. ${dominant.element}(${dominant.label})이 가장 높습니다.`
              : undefined
          }
        />

        {/* 신강/신약 */}
        {strengthType && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">신강/신약</span>
            <span className="text-xs font-medium text-foreground">{strengthType}</span>
          </div>
        )}

        {/* 핵심 십신 */}
        {keyTerms.length > 0 && (
          <div className="mt-3 space-y-2">
            {keyTerms.map((kt) => (
              <div key={kt.term} className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
                <div className="shrink-0 rounded-md bg-primary/10 p-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <GlossaryTooltip term={kt.term} definition={kt.definition} />
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{kt.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 형충파해 */}
        {hyungchungItems.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">형충파해</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {hyungchungItems.map((item) => (
                <span key={item} className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 섹션 2: 서양 관점 — 점성술 */}
      <section>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Star className="h-3.5 w-3.5 text-accent" />
          서양 관점: 점성술
        </h3>

        {todayInsight ? (
          <>
            {/* 지배 행성 카드 */}
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${PLANET_COLOR[todayInsight.dominantPlanet]}`}>
                  {PLANET_LABEL[todayInsight.dominantPlanet]}
                </span>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  오늘의 지배 행성
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-foreground">{todayInsight.headline}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{todayInsight.summary}</p>
            </div>

            {/* 상위 행성 테이블 */}
            {planetSummaries.length > 0 && (
              <div className="mt-3 space-y-2">
                {planetSummaries.map((ps) => (
                  <div key={ps.planet} className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2">
                    <span className={`w-8 text-xs font-bold ${PLANET_COLOR[ps.planet]}`}>{ps.label}</span>
                    <span className="w-16 text-xs text-muted-foreground">{ps.sign}</span>
                    <div className="flex-1">
                      <InfluenceBar score={ps.score} />
                    </div>
                    <span className="w-8 text-right text-[11px] font-medium text-foreground">{ps.score}</span>
                  </div>
                ))}
              </div>
            )}

            {/* actions / caution */}
            {todayInsight.actions.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {todayInsight.actions.map((action, i) => (
                  <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                    <span className="mr-1 text-accent">•</span>{action}
                  </p>
                ))}
              </div>
            )}
            {todayInsight.caution && (
              <p className="mt-2 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
                <AlertTriangle className="mr-1 inline h-3 w-3" />{todayInsight.caution}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            점성술 데이터를 불러오면 행성 위치와 영향력이 표시됩니다.
          </p>
        )}
      </section>

      {/* 섹션 3: 장기 흐름 */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">장기 흐름</h3>
        <div className="rounded-lg border border-border p-4">
          <div className="space-y-2">
            {greatFortune ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">현재 대운</span>
                  <span className="text-sm font-medium text-foreground">
                    {greatFortune.heavenlyStem}{greatFortune.earthlyBranch}
                    {greatFortune.ageRange && ` (${greatFortune.ageRange})`}
                  </span>
                </div>
                {greatFortune.sipsin && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">대운 십신</span>
                    <span className="text-sm font-medium text-foreground">{greatFortune.sipsin}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">현재 대운</span>
                <span className="text-sm font-medium text-muted-foreground">분석 데이터 없음</span>
              </div>
            )}
            {astrologyResult && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">토성 트랜짓</span>
                <span className="text-sm font-medium text-foreground">
                  {astrologyResult.positions.SATURN.signLabel}
                  {astrologyResult.positions.SATURN.house && ` ${astrologyResult.positions.SATURN.house}H`}
                </span>
              </div>
            )}
          </div>
          {astrologyResult && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {PLANET_THEME.SATURN.summary}
            </p>
          )}
        </div>
      </section>

      {/* 섹션 4: AI 대화 CTA */}
      <ChatCTA onOpenChat={onOpenChat} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   WEEKLY — "이번 주 근거"
   ═══════════════════════════════════════════════════════════════════════════ */

function WeeklyDeepDive({
  sajuResult,
  astrologyResult,
  fiveElements,
  greatFortune,
  strengthType,
  onOpenChat,
  dayDate,
  futureDays,
}: Omit<SharedDeepDiveProps, "todayInsight" | "keyTerms" | "planetSummaries"> & { dayDate?: string; futureDays: FutureDayInsight[] }) {
  const dominant = fiveElements.reduce((a, b) => (a.value > b.value ? a : b))
  const selectedDay = dayDate ? futureDays.find((d) => d.date === dayDate) : null

  return (
    <div className="space-y-6 px-1">
      {/* 섹션 1: 주간 에너지 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">주간 에너지</h3>
        <FiveElementsGrid
          elements={fiveElements}
          description={
            sajuResult
              ? `${dominant.element}(${dominant.label}) 기운이 우세합니다.${strengthType ? ` 현재 ${strengthType} 상태로, 이번 주 에너지 방향을 결정합니다.` : ""}`
              : undefined
          }
        />
      </section>

      {/* 섹션 2: 7일 행성 예보 */}
      {futureDays.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">7일 행성 예보</h3>
          <div className="space-y-1.5">
            {futureDays.map((day) => {
              const intensity = INTENSITY_LABEL[day.intensity]
              const isSelected = day.date === dayDate
              return (
                <div
                  key={day.date}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                    isSelected ? "border border-primary/30 bg-primary/5" : "bg-secondary/50"
                  }`}
                >
                  <span className="w-12 text-xs font-medium text-foreground">
                    {formatShortDate(day.date)}
                  </span>
                  <span className={`w-8 text-xs font-bold ${PLANET_COLOR[day.dominantPlanet]}`}>
                    {PLANET_LABEL[day.dominantPlanet]}
                  </span>
                  <span className="flex-1 truncate text-xs text-muted-foreground">{day.theme}</span>
                  {intensity && (
                    <span className={`text-[11px] font-bold ${intensity.color}`}>{intensity.text}</span>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 섹션 3: 선택 요일 상세 (조건부) */}
      {selectedDay && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            {formatShortDate(selectedDay.date)} 상세
          </h3>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${PLANET_COLOR[selectedDay.dominantPlanet]}`}>
                {PLANET_LABEL[selectedDay.dominantPlanet]}
              </span>
              <span className="text-xs text-muted-foreground">{selectedDay.theme}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{selectedDay.focus}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {PLANET_THEME[selectedDay.dominantPlanet].summary}
            </p>
          </div>
        </section>
      )}

      {/* 섹션 4: 장기 흐름 (간결 버전) */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">장기 흐름</h3>
        <div className="rounded-lg border border-border p-4">
          <div className="space-y-2">
            {greatFortune ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">현재 대운</span>
                <span className="text-sm font-medium text-foreground">
                  {greatFortune.heavenlyStem}{greatFortune.earthlyBranch}
                  {greatFortune.ageRange && ` (${greatFortune.ageRange})`}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">현재 대운</span>
                <span className="text-sm font-medium text-muted-foreground">분석 데이터 없음</span>
              </div>
            )}
            {astrologyResult && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">토성 트랜짓</span>
                <span className="text-sm font-medium text-foreground">
                  {astrologyResult.positions.SATURN.signLabel}
                  {astrologyResult.positions.SATURN.house && ` ${astrologyResult.positions.SATURN.house}H`}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 섹션 5: AI 대화 CTA */}
      <ChatCTA onOpenChat={onOpenChat} />
    </div>
  )
}

/* ─── 날짜 포맷 헬퍼 (YYYY-MM-DD → M/D 요일) ─── */

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"]

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  if (isNaN(d.getTime())) return dateStr
  return `${d.getMonth() + 1}/${d.getDate()}(${DAY_NAMES[d.getDay()]})`
}

/* ═══════════════════════════════════════════════════════════════════════════
   DECISION — "추천 근거"
   ═══════════════════════════════════════════════════════════════════════════ */

function DecisionDeepDive({
  sajuResult,
  astrologyResult,
  fiveElements,
  strengthType,
  todayInsight,
  hyungchungItems,
  onOpenChat,
  decisionResult,
}: Omit<SharedDeepDiveProps, "planetSummaries" | "keyTerms"> & { decisionResult?: DecisionFortune }) {
  const dominant = fiveElements.reduce((a, b) => (a.value > b.value ? a : b))

  // 결정 관련 행성 (수성=소통/분석, 화성=실행/결단)
  const decisionPlanets: PlanetId[] = ["MERCURY", "MARS"]
  const decisionInfluences = astrologyResult
    ? decisionPlanets.map((pid) => ({
        planet: pid,
        label: PLANET_LABEL[pid],
        sign: astrologyResult.positions[pid].signLabel,
        score: Math.round(astrologyResult.influences[pid].finalScore),
        interpretation: astrologyResult.influences[pid].interpretation,
      }))
    : []

  return (
    <div className="space-y-6 px-1">
      {/* 섹션 1: 결정 분석 */}
      {decisionResult && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">결정 분석</h3>
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                {decisionResult.recommendation}
              </span>
              <span className="text-sm font-medium text-foreground">{decisionResult.headline}</span>
            </div>
            {decisionResult.reasoning && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {decisionResult.reasoning}
              </p>
            )}
            {decisionResult.keywords && decisionResult.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {decisionResult.keywords.map((kw) => (
                  <span key={kw} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 섹션 2: 에너지 근거 */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">에너지 근거</h3>
        <FiveElementsGrid
          elements={fiveElements}
          description={
            sajuResult
              ? `${dominant.element}(${dominant.label})이 우세합니다.${strengthType ? ` ${strengthType} 상태에서` : ""} 이 에너지 흐름이 추천 방향에 반영되었습니다.`
              : undefined
          }
        />
      </section>

      {/* 섹션 3: 행성 관점 */}
      <section>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Star className="h-3.5 w-3.5 text-accent" />
          행성 관점
        </h3>

        {todayInsight ? (
          <div className="space-y-3">
            {/* 지배 행성 */}
            <div className="rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${PLANET_COLOR[todayInsight.dominantPlanet]}`}>
                  {PLANET_LABEL[todayInsight.dominantPlanet]}
                </span>
                <span className="text-[10px] text-muted-foreground">오늘의 지배 행성</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {todayInsight.summary}
              </p>
            </div>

            {/* 결정 관련 행성 (수성/화성) */}
            {decisionInfluences.map((inf) => (
              <div key={inf.planet} className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2">
                <span className={`w-8 text-xs font-bold ${PLANET_COLOR[inf.planet]}`}>{inf.label}</span>
                <span className="w-16 text-xs text-muted-foreground">{inf.sign}</span>
                <div className="flex-1">
                  <InfluenceBar score={inf.score} />
                </div>
                <span className="w-8 text-right text-[11px] font-medium text-foreground">{inf.score}</span>
              </div>
            ))}
            {decisionInfluences.length > 0 && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                수성은 분석·소통, 화성은 실행·결단의 에너지를 나타냅니다.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            점성술 데이터를 불러오면 행성 관점이 표시됩니다.
          </p>
        )}
      </section>

      {/* 섹션 4: 주의사항 */}
      {(decisionResult?.caution || hyungchungItems.length > 0) && (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            주의사항
          </h3>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
            {decisionResult?.caution && (
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                {decisionResult.caution}
              </p>
            )}
            {hyungchungItems.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">사주 충돌</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {hyungchungItems.map((item) => (
                    <span key={item} className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 섹션 5: AI 대화 CTA */}
      <ChatCTA onOpenChat={onOpenChat} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Dispatcher — DeepDiveContent
   ═══════════════════════════════════════════════════════════════════════════ */

function DeepDiveContent({
  context = "today",
  contextData,
  onActionsGenerated,
}: {
  context?: DeepDiveContext
  contextData?: DeepDiveSheetProps["contextData"]
  onActionsGenerated?: (actions: string[]) => void
}) {
  const { sajuResult, astrologyResult } = useSaju()
  const [chatOpen, setChatOpen] = useState(false)

  // Map DeepDiveContext → ChatInterface context
  const chatContext =
    context === "weekly" ? "week" : context === "decision" ? "decision" : "today"

  const shared: SharedDeepDiveProps = {
    sajuResult,
    astrologyResult,
    fiveElements: buildFiveElements(sajuResult),
    keyTerms: extractKeyTerms(sajuResult),
    greatFortune: extractGreatFortune(sajuResult),
    strengthType: extractStrength(sajuResult),
    planetSummaries: buildPlanetSummaries(astrologyResult),
    todayInsight: extractTodayInsight(astrologyResult),
    hyungchungItems: extractHyungchungItems(sajuResult),
    onOpenChat: () => setChatOpen(true),
  }

  const deepDiveView = (() => {
    switch (context) {
      case "weekly":
        return (
          <WeeklyDeepDive
            {...shared}
            dayDate={contextData?.dayDate}
            futureDays={extractFutureDays(astrologyResult)}
          />
        )
      case "decision":
        return (
          <DecisionDeepDive
            {...shared}
            decisionResult={contextData?.decisionResult}
          />
        )
      default:
        return <TodayDeepDive {...shared} />
    }
  })()

  return (
    <>
      {deepDiveView}
      <ChatInterface
        mode="sheet"
        agents="single"
        open={chatOpen}
        onOpenChange={setChatOpen}
        context={chatContext}
        onActionsGenerated={onActionsGenerated}
      />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   외부 셸 — DeepDiveSheet
   ═══════════════════════════════════════════════════════════════════════════ */

const CONTEXT_DESCRIPTION: Record<DeepDiveContext, string> = {
  today: "동양 사주와 서양 점성술, 두 가지 관점에서 오늘의 해석 근거를 살펴보세요",
  weekly: "행성 예보와 에너지 흐름으로 이번 주의 근거를 살펴보세요",
  decision: "사주 에너지와 행성 영향력이 추천에 어떻게 반영되었는지 확인하세요",
}

export function DeepDiveSheet({ open, onOpenChange, context = "today", contextData, onActionsGenerated }: DeepDiveSheetProps) {
  const isMobile = useIsMobile()
  const description = CONTEXT_DESCRIPTION[context]

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <div className="flex items-center justify-between">
              <DrawerTitle className="font-serif text-lg text-foreground">
                근거 살펴보기
              </DrawerTitle>
              <DrawerClose className="rounded-full p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
                <span className="sr-only">닫기</span>
              </DrawerClose>
            </div>
            <DrawerDescription className="text-sm text-muted-foreground">
              {description}
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-8">
            <DeepDiveContent context={context} contextData={contextData} onActionsGenerated={onActionsGenerated} />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md overflow-y-auto bg-card sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle className="font-serif text-lg text-foreground">
            근거 살펴보기
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {description}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 px-1 pb-8">
          <DeepDiveContent context={context} contextData={contextData} onActionsGenerated={onActionsGenerated} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
