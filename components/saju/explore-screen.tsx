"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { ChatInterface } from "./chat-interface"
import { FiveElementsRadar } from "./five-elements-radar"
import { NatalChartWheel } from "./natal-chart-wheel"
import { SolarSystemView } from "./celestial/solar-system-view"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Moon,
  MessageCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  HelpCircle,
  BarChart3,
  Radar as RadarIcon,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSaju } from "@/lib/contexts/saju-context"
import type { FortuneResponse } from "@/lib/saju-core"
import { PLANET_ORDER, SIGN_LABEL_KO } from "@/lib/astrology/static/constants"
import { computeTransits, type TransitAspect } from "@/lib/astrology/static/transits"
import type { PlanetId } from "@/lib/astrology/static/types"
import { ELEMENT_HEX, ELEMENT_LABEL as ELEMENT_LABEL_SHARED } from "@/lib/constants/element-colors"

/* ─── 타입 정의 ─── */

type SelectedPeriod = "today" | "tomorrow" | "week"

interface SajuPillarDisplay {
  heavenlyStem: string
  earthlyBranch: string
  element: string
  meaning: string
}

interface FiveElementDisplay {
  element: string
  label: string
  value: number
  color: string
}

interface PlanetDisplay {
  id: PlanetId
  symbol: string
  name: string
  sign: string
  house: number | null
  sajuMap: string
  description: string
  finalScore: number
}

/* ─── 상수 ─── */

const PLANET_META: Record<PlanetId, { symbol: string; name: string; sajuMap: string }> = {
  SUN:     { symbol: "☉", name: "태양 (Sun)",     sajuMap: "식신 (食神)" },
  MOON:    { symbol: "☽", name: "달 (Moon)",       sajuMap: "편인 (偏印)" },
  MERCURY: { symbol: "☿", name: "수성 (Mercury)",  sajuMap: "편관 (偏官)" },
  VENUS:   { symbol: "♀", name: "금성 (Venus)",    sajuMap: "정재 (正財)" },
  MARS:    { symbol: "♂", name: "화성 (Mars)",     sajuMap: "상관 (傷官)" },
  JUPITER: { symbol: "♃", name: "목성 (Jupiter)",  sajuMap: "정인 (正印)" },
  SATURN:  { symbol: "♄", name: "토성 (Saturn)",   sajuMap: "비견 (比肩)" },
}

const ELEMENT_LABEL = ELEMENT_LABEL_SHARED

const ELEMENT_MEANINGS: Record<string, string> = {
  목: "성장과 시작의 기운이 강한 일주. 새로운 것을 개척하는 힘이 있습니다.",
  화: "열정과 활력이 넘치는 일주. 표현력과 추진력이 뛰어납니다.",
  토: "안정과 신뢰를 중시하는 일주. 조화와 균형을 이끄는 힘이 있습니다.",
  금: "결단력과 정의감이 강한 일주. 원칙과 질서를 중시합니다.",
  수: "지혜와 유연성이 돋보이는 일주. 직관과 통찰력이 깊습니다.",
}

// 폴백용 기본 행성 데이터 (astrologyResult 없을 때)
const DEFAULT_PLANET_POSITIONS: PlanetDisplay[] = [
  { id: "SUN",     symbol: "☉", name: "태양 (Sun)",     sign: "물고기자리(Pisces) 10°",    house: 12, sajuMap: "식신 (食神)", description: "감성과 직관이 강한 시기. 내면의 표현을 밖으로 드러내는 에너지입니다.",    finalScore: 0 },
  { id: "MOON",    symbol: "☽", name: "달 (Moon)",       sign: "게자리(Cancer) 5°",         house: 4,  sajuMap: "편인 (偏印)", description: "가정과 안식에 마음이 향합니다. 직감과 영감이 높아지는 시간.",               finalScore: 0 },
  { id: "MERCURY", symbol: "☿", name: "수성 (Mercury)",  sign: "물병자리(Aquarius) 22°",    house: 11, sajuMap: "편관 (偏官)", description: "독창적인 아이디어가 떠오르는 시기. 기존 틀을 벗어난 사고가 빛납니다.",   finalScore: 0 },
  { id: "VENUS",   symbol: "♀", name: "금성 (Venus)",    sign: "양자리(Aries) 15°",         house: 1,  sajuMap: "정재 (正財)", description: "관계에서 주도적인 에너지. 새로운 만남이나 시작에 좋은 기운.",             finalScore: 0 },
  { id: "MARS",    symbol: "♂", name: "화성 (Mars)",     sign: "쌍둥이자리(Gemini) 8°",     house: 3,  sajuMap: "상관 (傷官)", description: "소통과 이동에 활발한 에너지. 적극적 표현이 성과를 만듭니다.",            finalScore: 0 },
  { id: "JUPITER", symbol: "♃", name: "목성 (Jupiter)",  sign: "쌍둥이자리(Gemini) 2°",     house: 3,  sajuMap: "정인 (正印)", description: "배움과 교류가 확장되는 시기. 새로운 지식이 행운을 가져옵니다.",           finalScore: 0 },
  { id: "SATURN",  symbol: "♄", name: "토성 (Saturn)",   sign: "물고기자리(Pisces) 15°",    house: 12, sajuMap: "비견 (比肩)", description: "내면의 규율과 성찰이 필요한 시기. 조용한 노력이 결실을 맺습니다.",        finalScore: 0 },
]

const DEFAULT_TRANSITS: TransitAspect[] = [
  { id: "t1", type: "daily",   headline: "감정의 조화로운 흐름",  planets: "☽ 삼각(△) ♀", sajuResonance: "식신과 정재의 만남 — 표현이 결실로 이어지는 날",         body: "달과 금성의 삼각이 형성됩니다. 사주 관점에서 식신과 정재의 조화는 내면의 재능이 현실 성과로 연결되는 에너지예요.", significance: "high" },
  { id: "t2", type: "daily",   headline: "소통과 확장의 기회",    planets: "☿ 육각(⚹) ♃", sajuResonance: "편관과 정인의 교류 — 학습과 도전이 만나는 때",             body: "수성과 목성의 육각이 아이디어의 확장을 도와줍니다. 새로운 도전과 지적 성장이 함께하는 시간입니다.", significance: "medium" },
  { id: "t3", type: "weekly",  headline: "인내가 필요한 한 주",   planets: "♂ 사각(□) ♄", sajuResonance: "상관과 비견의 긴장 — 독단보다 협력이 유리한 시기",         body: "화성과 토성의 사각은 행동에 제약을 줄 수 있어요. 혼자 밀어붙이면 마찰이 커지지만, 함께하면 단단해지는 에너지입니다.", significance: "high" },
  { id: "t4", type: "special", headline: "꿈과 직관의 합",        planets: "♀ 합(☌) ♆",  sajuResonance: "정재와 편인의 합류 — 현실과 영감 사이의 균형점",           body: "금성-해왕성 합은 예술적 영감을 높입니다. 현실적 성과와 직관적 통찰이 만나는 특별한 에너지입니다.", significance: "medium" },
]

/* ─── 데이터 변환 ─── */

function buildSajuPillar(result: FortuneResponse): SajuPillarDisplay {
  const dayPillar = result.sajuData.pillars.일
  const stemKorean = dayPillar.천간.split("(")[0] ?? dayPillar.천간
  const branchKorean = dayPillar.지지.split("(")[0] ?? dayPillar.지지
  const element = dayPillar.오행.천간 ?? "토"
  return {
    heavenlyStem: stemKorean,
    earthlyBranch: branchKorean,
    element: `${element} (${ELEMENT_LABEL[element] ?? element})`,
    meaning: ELEMENT_MEANINGS[element] ?? ELEMENT_MEANINGS.토,
  }
}

function buildFiveElements(result: FortuneResponse): FiveElementDisplay[] {
  const powers = (result.sinyakSingang?.element_powers ?? {}) as Record<string, number>
  return ["목", "화", "토", "금", "수"].map((el) => ({
    element: el,
    label: ELEMENT_LABEL[el] ?? el,
    value: Math.round((powers[el] ?? 0) * 10) / 10,
    color: ELEMENT_HEX[el] ?? "#888",
  }))
}

function filterTransitsByPeriod(transits: TransitAspect[], period: SelectedPeriod): TransitAspect[] {
  if (period === "week") return transits
  return transits.filter((t) => t.type === "daily")
}

/* ─── 유틸 컴포넌트 ─── */

function TermTooltip({ term, definition }: { term: string; definition: string }) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center gap-0.5 border-b border-dashed border-primary/40 font-medium text-primary" type="button">
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

function getSignificanceDot(sig: "high" | "medium" | "low") {
  if (sig === "high") return "bg-accent"
  if (sig === "medium") return "bg-primary"
  return "bg-muted-foreground"
}

function getTransitTypeLabel(type: "daily" | "weekly" | "special") {
  if (type === "daily") return "오늘"
  if (type === "weekly") return "이번 주"
  return "특별"
}

/* ─── 메인 컴포넌트 ─── */

export function ExploreScreen() {
  const { sajuResult, astrologyResult, chartCore, vedicCore, isLoading } = useSaju()

  const [chatOpen, setChatOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<SelectedPeriod>("today")
  const [activePlanetId, setActivePlanetId] = useState<PlanetId | null>(null)
  const [expandedTransit, setExpandedTransit] = useState<string | null>(null)
  const [elementChartMode, setElementChartMode] = useState<"bar" | "radar">("bar")

  const sajuPillar = useMemo(
    () => (sajuResult ? buildSajuPillar(sajuResult) : null),
    [sajuResult],
  )
  const fiveElements = useMemo(
    () => (sajuResult ? buildFiveElements(sajuResult) : null),
    [sajuResult],
  )
  const greatFortune = sajuResult?.greatFortune as Record<string, Record<string, string>> | undefined
  const sinyakSingangData = sajuResult?.sinyakSingang as Record<string, string> | undefined

  const planetPositions = useMemo<PlanetDisplay[]>(() => {
    if (!astrologyResult) return DEFAULT_PLANET_POSITIONS
    return PLANET_ORDER.map((planet) => {
      const base = PLANET_META[planet]
      const position = astrologyResult.positions[planet]
      const influence = astrologyResult.influences[planet]
      const chartCoreHouse = chartCore?.planets[planet]?.house ?? null
      return {
        id: planet,
        symbol: base.symbol,
        name: base.name,
        sign: `${SIGN_LABEL_KO[position.sign] ?? position.signLabel}(${position.signLabel}) ${position.degreeInSign}°`,
        house: chartCoreHouse ?? position.house,
        sajuMap: base.sajuMap,
        description: influence.interpretation,
        finalScore: influence.finalScore,
      }
    })
  }, [astrologyResult, chartCore])

  const allTransits = useMemo(() => {
    if (!astrologyResult) return DEFAULT_TRANSITS
    return computeTransits(astrologyResult.positions)
  }, [astrologyResult])

  const filteredTransits = useMemo(
    () => filterTransitsByPeriod(allTransits, selectedPeriod),
    [allTransits, selectedPeriod],
  )

  const headlineTitle = astrologyResult?.today.headline ?? "감성의 물결 속에서 직관을 따라가는 시기"
  const headlineBody =
    astrologyResult?.today.summary ??
    "사주의 식신 기운과 태양의 물고기자리 에너지가 함께 흐르고 있습니다."

  const activePlanet = activePlanetId ? (planetPositions.find((p) => p.id === activePlanetId) ?? null) : null

  const activePlanetIdx = useMemo(
    () => (activePlanetId ? PLANET_ORDER.indexOf(activePlanetId) : null),
    [activePlanetId],
  )
  const handleSolarPlanetClick = (i: number) => {
    const id = PLANET_ORDER[i]
    if (id) setActivePlanetId((prev) => (prev === id ? null : id))
  }

  const planetDegrees = useMemo(
    () =>
      astrologyResult
        ? PLANET_ORDER.map((p) => astrologyResult.positions[p]?.lonDeg ?? 0)
        : undefined,
    [astrologyResult],
  )

  const maxPlanetScore = useMemo(
    () => Math.max(...planetPositions.map((p) => p.finalScore), 1),
    [planetPositions],
  )

  const PERIODS: { id: SelectedPeriod; label: string }[] = [
    { id: "today",    label: "오늘" },
    { id: "tomorrow", label: "내일" },
    { id: "week",     label: "이번 주" },
  ]

  const periodLabel = PERIODS.find((p) => p.id === selectedPeriod)?.label ?? "오늘"


  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-5 pb-8 pt-6">

        {/* 페이지 헤더 */}
        <div className="mb-4 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-1">
            <Moon className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground tracking-widest uppercase">탐색</p>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-1 leading-tight">
            나의 하늘과 사주
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            동양의 사주와 서양의 점성술을 하나의 시선으로 읽습니다
          </p>
        </div>

        {/* 시간 탭 */}
        <div className="mb-6 border-b border-border animate-fade-in-up" style={{ animationDelay: "40ms" }}>
          <div className="grid grid-cols-3 gap-0">
            {PERIODS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedPeriod(id)}
                className={`w-full py-3 text-sm transition-colors ${
                  selectedPeriod === id
                    ? "border-b-2 border-primary text-primary font-semibold"
                    : "border-b border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            LAYER 3 — 둘이 만나면 오늘 무슨 일?
        ══════════════════════════════════════════ */}
        <section className="animate-fade-in-up" style={{ animationDelay: "60ms" }} aria-label="융합 해석">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            오늘의 융합 해석
          </p>

          {/* 융합 리딩 Hero */}
          <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden mb-4">
            <div className="relative h-40 overflow-hidden">
              <Image src="/explore-hero.jpeg" alt="밤하늘 일러스트" fill className="object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex flex-wrap gap-1.5">
                {isLoading ? (
                  <><Skeleton className="h-6 w-28 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></>
                ) : (
                  <>
                    {sajuPillar && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-background/60 backdrop-blur-md text-foreground/80 border border-border/20">
                        {sajuPillar.heavenlyStem}{sajuPillar.earthlyBranch} / {sajuPillar.element}
                      </span>
                    )}
                    {activePlanet && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/20 backdrop-blur-md text-primary border border-primary/20">
                        {activePlanet.symbol} {activePlanet.sajuMap.split(" (")[0]}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="p-5">
              <span className="inline-block text-[11px] text-muted-foreground bg-secondary rounded-full px-2.5 py-0.5 mb-2">
                {periodLabel}
              </span>
              <h2 className="font-serif text-lg font-semibold text-foreground mb-2">{headlineTitle}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {astrologyResult ? headlineBody : (
                  <>
                    사주의{" "}
                    <TermTooltip term="식신" definition="일간이 생(生)하는 오행 중 음양이 같은 것. 표현, 재능, 식복을 의미합니다." />
                    {" "}기운과 태양의 물고기자리 에너지가 함께 흐르고 있습니다.
                  </>
                )}
              </p>
              <button
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                type="button"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                AI와 더 깊이 이야기하기
              </button>
            </div>
          </div>

          {/* 하늘의 변화 (트랜짓) + 사주 공명 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">하늘의 변화</h2>
              <Sparkles className="h-4 w-4 text-accent/60" />
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {selectedPeriod === "today" && "오늘의 주요 행성 흐름"}
              {selectedPeriod === "tomorrow" && "내일 예상되는 행성 흐름"}
              {selectedPeriod === "week" && "이번 주 전체 행성 변화"}
            </p>
            <div className="space-y-2">
              {filteredTransits.length === 0 ? (
                <div className="rounded-xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                  해당 기간의 주요 트랜짓이 없습니다
                </div>
              ) : (
                filteredTransits.map((transit) => {
                  const isExpanded = expandedTransit === transit.id
                  return (
                    <div
                      key={transit.id}
                      className={`rounded-xl border transition-colors ${isExpanded ? "border-primary/20 bg-card" : "border-border bg-card"}`}
                    >
                      <button
                        onClick={() => setExpandedTransit(isExpanded ? null : transit.id)}
                        className="flex w-full items-center gap-3 p-4 text-left"
                        type="button"
                        aria-expanded={isExpanded}
                      >
                        <div className={`h-2 w-2 shrink-0 rounded-full ${getSignificanceDot(transit.significance)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{transit.planets}</span>
                            <h3 className="text-sm font-medium text-foreground truncate">{transit.headline}</h3>
                          </div>
                          <p className="mt-0.5 text-[11px] text-accent/80 truncate">{transit.sajuResonance}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                            {getTransitTypeLabel(transit.type)}
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-border px-4 pb-4 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          <p className="text-sm leading-relaxed text-muted-foreground">{transit.body}</p>
                          <button
                            onClick={() => setChatOpen(true)}
                            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                            type="button"
                          >
                            <MessageCircle className="h-3 w-3" />
                            이 흐름에 대해 AI와 이야기하기
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        {/* ══════════════════════════════════════════
            LAYER 2 — 지금 하늘은 어떤가?
        ══════════════════════════════════════════ */}
        <section className="mb-6 animate-fade-in-up" style={{ animationDelay: "100ms" }} aria-label="하늘의 현재">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            지금 하늘
          </p>

          {/* 태양계 공전 궤도 뷰 — 100% */}
          <div className="rounded-2xl border border-border/40 bg-[#07070f] overflow-hidden mb-3" style={{ minHeight: "360px" }}>
            <SolarSystemView
              activePlanetIdx={activePlanetIdx}
              onPlanetClick={handleSolarPlanetClick}
              planetDegrees={planetDegrees}
              sizeMode="influence"
            />
          </div>

          {/* 사주 연동 패널 — 행성 선택 시 */}
          {activePlanet ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{activePlanet.symbol}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{activePlanet.name.split(" (")[0]}</p>
                      <p className="text-[11px] text-muted-foreground">{activePlanet.sign}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePlanetId(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="닫기"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 mt-3">
                    {/* 사주 십신 */}
                    <div className="rounded-xl bg-background/60 border border-border/40 px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <BookOpen className="h-3 w-3 text-accent" />
                        <span className="text-[10px] font-semibold text-accent uppercase tracking-wide">사주 십신</span>
                      </div>
                      <p className="text-sm font-bold text-foreground">{activePlanet.sajuMap}</p>
                    </div>

                    {/* 오행 */}
                    {fiveElements && (() => {
                      const elemKey = ["목", "화", "토", "금", "수"][
                        ["SUN","MOON","MARS","VENUS","MERCURY","JUPITER","SATURN"].indexOf(activePlanet.id) % 5
                      ]
                      const el = fiveElements.find((e) => e.element === elemKey)
                      return el ? (
                        <div className="rounded-xl bg-background/60 border border-border/40 px-3 py-2">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">오행</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                              style={{ backgroundColor: ELEMENT_HEX[el.element] ?? "var(--muted)" }}
                            >
                              {el.element}
                            </div>
                            <div className="flex-1">
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${(el.value / Math.max(...fiveElements.map((e) => e.value), 1)) * 100}%`,
                                    backgroundColor: ELEMENT_HEX[el.element] ?? "var(--primary)",
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground">{el.value}</span>
                          </div>
                        </div>
                      ) : null
                    })()}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{activePlanet.description}</p>
                  {activePlanet.house && (
                    <p className="mt-1 text-[11px] text-muted-foreground/60">House {activePlanet.house}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground/60">
              행성을 탭하면 사주 십신과 오행 연결을 볼 수 있습니다
            </p>
          )}
        </section>
        {/* ══════════════════════════════════════════
            LAYER 1 — 지금 나는 어떤 에너지인가?
        ══════════════════════════════════════════ */}
        <section className="mb-6 animate-fade-in-up" style={{ animationDelay: "140ms" }} aria-label="나의 에너지">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            나의 에너지
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 사주 일주 */}
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">사주 일주</h3>
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-32" /></div>
                </div>
              ) : sajuPillar ? (
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full animate-glow-pulse"
                    style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)" }}
                  >
                    <span className="font-serif text-base font-bold text-primary leading-none">{sajuPillar.heavenlyStem}</span>
                    <span className="font-serif text-sm text-primary/80 leading-none mt-0.5">{sajuPillar.earthlyBranch}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <p className="text-sm font-medium text-foreground">{sajuPillar.element}</p>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{sajuPillar.meaning}</p>
                    {/* 대운/세운 compact */}
                    {greatFortune?.current_period && (
                      <p className="mt-2 text-[11px] text-muted-foreground/70">
                        대운 {greatFortune.current_period.heavenly_stem}{greatFortune.current_period.earthly_branch}
                        {sinyakSingangData?.strength_type && ` · ${sinyakSingangData.strength_type}`}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">온보딩 후 표시됩니다</p>
              )}
            </div>

            {/* 오행 바 차트 */}
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">오행 분포</h3>
              {isLoading ? (
                <div className="space-y-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-2 flex-1 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : fiveElements ? (
                <div className="space-y-2.5">
                  {fiveElements.map((el) => {
                    const maxVal = Math.max(...fiveElements.map((e) => e.value), 1)
                    const pct = (el.value / maxVal) * 100
                    return (
                      <div key={el.element} className="flex items-center gap-2">
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: ELEMENT_HEX[el.element] ?? "var(--muted)" }}
                        >
                          {el.element}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: ELEMENT_HEX[el.element] ?? "var(--primary)" }}
                            />
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground w-6 text-right shrink-0">{el.value}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">온보딩 후 표시됩니다</p>
              )}
            </div>
          </div>
        </section>

        </section>
      </div>

      {/* AI 대화 (모달) */}
      <ChatInterface mode="modal" agents="single" open={chatOpen} onOpenChange={setChatOpen} context="default" />
    </>
  )
}
