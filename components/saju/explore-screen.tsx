"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { ChatInterface } from "./chat-interface"
import { FiveElementsRadar } from "./five-elements-radar"
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
  Radar,
} from "lucide-react"
import { SolarSystemView } from "./celestial/solar-system-view"
import { NatalChartWheel } from "./natal-chart-wheel"
import type { PlanetSizeMode } from "./celestial/scene"
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

/* ─── 실제 사주 데이터 파생 ─── */

interface SajuPillarDisplay {
  label: string
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
  textColor: string
}

interface PlanetDisplay {
  id: PlanetId
  symbol: string
  name: string
  sign: string
  house: number | null
  sajuMap: string
  description: string
}

const PLANET_META: Record<PlanetId, { symbol: string; name: string; sajuMap: string }> = {
  SUN: { symbol: "☉", name: "태양 (Sun)", sajuMap: "식신 (食神)" },
  MOON: { symbol: "☽", name: "달 (Moon)", sajuMap: "편인 (偏印)" },
  MERCURY: { symbol: "☿", name: "수성 (Mercury)", sajuMap: "편관 (偏官)" },
  VENUS: { symbol: "♀", name: "금성 (Venus)", sajuMap: "정재 (正財)" },
  MARS: { symbol: "♂", name: "화성 (Mars)", sajuMap: "상관 (傷官)" },
  JUPITER: { symbol: "♃", name: "목성 (Jupiter)", sajuMap: "정인 (正印)" },
  SATURN: { symbol: "♄", name: "토성 (Saturn)", sajuMap: "비견 (比肩)" },
}

const ELEMENT_LABEL: Record<string, string> = {
  목: "Wood",
  화: "Fire",
  토: "Earth",
  금: "Metal",
  수: "Water",
}

// 오행 전통 색상 (radar와 동일한 팔레트)
const ELEMENT_HEX: Record<string, string> = {
  목: "#22c55e", // 木 — 초록
  화: "#ef4444", // 火 — 빨강
  토: "#eab308", // 土 — 노랑
  금: "#94a3b8", // 金 — 은빛
  수: "#3b82f6", // 水 — 파랑
}

const ELEMENT_COLOR: Record<string, { color: string; textColor: string }> = {
  목: { color: "bg-green-500", textColor: "text-white" },
  화: { color: "bg-red-500", textColor: "text-white" },
  토: { color: "bg-yellow-500", textColor: "text-white" },
  금: { color: "bg-slate-400", textColor: "text-white" },
  수: { color: "bg-blue-500", textColor: "text-white" },
}

const ELEMENT_MEANINGS: Record<string, string> = {
  목: "성장과 시작의 기운이 강한 일주. 새로운 것을 개척하는 힘이 있습니다.",
  화: "열정과 활력이 넘치는 일주. 표현력과 추진력이 뛰어납니다.",
  토: "안정과 신뢰를 중시하는 일주. 조화와 균형을 이끄는 힘이 있습니다.",
  금: "결단력과 정의감이 강한 일주. 원칙과 질서를 중시합니다.",
  수: "지혜와 유연성이 돋보이는 일주. 직관과 통찰력이 깊습니다.",
}

function buildSajuPillar(result: FortuneResponse): SajuPillarDisplay {
  const dayPillar = result.sajuData.pillars.일
  const stemKorean = dayPillar.천간.split("(")[0] ?? dayPillar.천간
  const branchKorean = dayPillar.지지.split("(")[0] ?? dayPillar.지지
  const element = dayPillar.오행.천간 ?? "토"

  return {
    label: "사주 일주",
    heavenlyStem: stemKorean,
    earthlyBranch: branchKorean,
    element: `${element} (${ELEMENT_LABEL[element] ?? element})`,
    meaning: ELEMENT_MEANINGS[element] ?? ELEMENT_MEANINGS.토,
  }
}

function buildFiveElements(result: FortuneResponse): FiveElementDisplay[] {
  const powers = (result.sinyakSingang?.element_powers ?? {}) as Record<string, number>
  const elementOrder = ["목", "화", "토", "금", "수"]
  return elementOrder.map((el) => ({
    element: el,
    label: ELEMENT_LABEL[el] ?? el,
    value: Math.round((powers[el] ?? 0) * 10) / 10,
    color: ELEMENT_COLOR[el]?.color ?? "bg-border",
    textColor: ELEMENT_COLOR[el]?.textColor ?? "text-foreground",
  }))
}

/* ─── 하드코딩된 점성술 데이터 (추후 astrology API 연결 예정) ─── */

const PLANET_POSITIONS: PlanetDisplay[] = [
  {
    id: "SUN",
    symbol: "☉",
    name: "태양 (Sun)",
    sign: "물고기자리(Pisces) 10°",
    house: 12,
    sajuMap: "식신 (食神)",
    description: "감성과 직관이 강한 시기. 내면의 표현을 밖으로 드러내는 에너지입니다.",
  },
  {
    id: "MOON",
    symbol: "☽",
    name: "달 (Moon)",
    sign: "게자리(Cancer) 5°",
    house: 4,
    sajuMap: "편인 (偏印)",
    description: "가정과 안식에 마음이 향합니다. 직감과 영감이 높아지는 시간.",
  },
  {
    id: "MERCURY",
    symbol: "☿",
    name: "수성 (Mercury)",
    sign: "물병자리(Aquarius) 22°",
    house: 11,
    sajuMap: "편관 (偏官)",
    description: "독창적인 아이디어가 떠오르는 시기. 기존 틀을 벗어난 사고가 빛납니다.",
  },
  {
    id: "VENUS",
    symbol: "♀",
    name: "금성 (Venus)",
    sign: "양자리(Aries) 15°",
    house: 1,
    sajuMap: "정재 (正財)",
    description: "관계에서 주도적인 에너지. 새로운 만남이나 시작에 좋은 기운.",
  },
  {
    id: "MARS",
    symbol: "♂",
    name: "화성 (Mars)",
    sign: "쌍둥이자리(Gemini) 8°",
    house: 3,
    sajuMap: "상관 (傷官)",
    description: "소통과 이동에 활발한 에너지. 적극적 표현이 성과를 만듭니다.",
  },
  {
    id: "JUPITER",
    symbol: "♃",
    name: "목성 (Jupiter)",
    sign: "쌍둥이자리(Gemini) 2°",
    house: 3,
    sajuMap: "정인 (正印)",
    description: "배움과 교류가 확장되는 시기. 새로운 지식이 행운을 가져옵니다.",
  },
  {
    id: "SATURN",
    symbol: "♄",
    name: "토성 (Saturn)",
    sign: "물고기자리(Pisces) 15°",
    house: 12,
    sajuMap: "비견 (比肩)",
    description: "내면의 규율과 성찰이 필요한 시기. 조용한 노력이 결실을 맺습니다.",
  },
]


const TRANSITS: TransitAspect[] = [
  { id: "t1", type: "daily" as const, headline: "감정의 조화로운 흐름", planets: "☽ 삼각(△) ♀", sajuResonance: "식신과 정재의 만남 — 표현이 결실로 이어지는 날", body: "달과 금성의 삼각이 형성됩니다. 사주 관점에서 식신과 정재의 조화는 내면의 재능이 현실 성과로 연결되는 에너지예요.", significance: "high" as const },
  { id: "t2", type: "daily" as const, headline: "소통과 확장의 기회", planets: "☿ 육각(⚹) ♃", sajuResonance: "편관과 정인의 교류 — 학습과 도전이 만나는 때", body: "수성과 목성의 육각이 아이디어의 확장을 도와줍니다. 새로운 도전과 지적 성장이 함께하는 시간입니다.", significance: "medium" as const },
  { id: "t3", type: "weekly" as const, headline: "인내가 필요한 한 주", planets: "♂ 사각(□) ♄", sajuResonance: "상관과 비견의 긴장 — 독단보다 협력이 유리한 시기", body: "화성과 토성의 사각은 행동에 제약을 줄 수 있어요. 혼자 밀어붙이면 마찰이 커지지만, 함께하면 단단해지는 에너지입니다.", significance: "high" as const },
  { id: "t4", type: "special" as const, headline: "꿈과 직관의 합", planets: "♀ 합(☌) ♆", sajuResonance: "정재와 편인의 합류 — 현실과 영감 사이의 균형점", body: "금성-해왕성 합은 예술적 영감을 높입니다. 현실적 성과와 직관적 통찰이 만나는 특별한 에너지입니다.", significance: "medium" as const },
]

/* ─── 유틸 ─── */

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
  switch (sig) {
    case "high": return "bg-accent"
    case "medium": return "bg-primary"
    case "low": return "bg-muted-foreground"
  }
}

function getTypeLabel(type: "daily" | "weekly" | "special") {
  switch (type) {
    case "daily": return "오늘"
    case "weekly": return "이번 주"
    case "special": return "특별"
  }
}

/* ─── 메인 컴포넌트 ─── */

export function ExploreScreen() {
  const { sajuResult, astrologyResult, chartCore, vedicCore, isLoading } = useSaju()
  const [chatOpen, setChatOpen] = useState(false)
  const [activePlanetIdx, setActivePlanetIdx] = useState<number | null>(null)
  const [expandedTransit, setExpandedTransit] = useState<string | null>(null)
  const [transitFilter, setTransitFilter] = useState<"all" | "daily" | "weekly" | "special">("all")
  const [planetSizeMode, setPlanetSizeMode] = useState<PlanetSizeMode>("influence")
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
    if (!astrologyResult) return PLANET_POSITIONS

    return PLANET_ORDER.map((planet) => {
      const base = PLANET_META[planet]
      const position = astrologyResult.positions[planet]
      const influence = astrologyResult.influences[planet]
      // chartCore 하우스 데이터가 있으면 우선 사용
      const chartCoreHouse = chartCore?.planets[planet]?.house ?? null
      return {
        id: planet,
        symbol: base.symbol,
        name: base.name,
        sign: `${SIGN_LABEL_KO[position.sign] ?? position.signLabel}(${position.signLabel}) ${position.degreeInSign}°`,
        house: chartCoreHouse ?? position.house,
        sajuMap: base.sajuMap,
        description: influence.interpretation,
      }
    })
  }, [astrologyResult, chartCore])

  const transits = useMemo(() => {
    if (!astrologyResult) return TRANSITS
    return computeTransits(astrologyResult.positions)
  }, [astrologyResult])

  const headlineTitle = astrologyResult?.today.headline ?? "감성의 물결 속에서 직관을 따라가는 시기"
  const headlineBody =
    astrologyResult?.today.summary ??
    "사주의 식신 기운과 태양의 물고기자리 에너지가 함께 흐르고 있습니다. 이성적 판단보다 직관을 신뢰하되, 오행의 토(Earth) 에너지로 현실 감각을 유지하세요."

  const activePlanet = activePlanetIdx !== null ? planetPositions[activePlanetIdx] : null
  const filteredTransits = transitFilter === "all" ? transits : transits.filter((t) => t.type === transitFilter)

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-6 lg:max-w-5xl lg:px-8">
        {/* Hero header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-1">
            <Moon className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground tracking-widest uppercase">탐색</p>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-semibold text-foreground mb-2 text-balance leading-tight">
            나의 하늘과 사주
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
            동양의 사주와 서양의 점성술을 하나의 시선으로 읽습니다
          </p>
        </div>

        <div className="lg:flex lg:gap-10">
          {/* Main column */}
          <div className="lg:max-w-2xl lg:flex-1">
            {/* ─── 1. Headline: Fused reading ─── */}
            <section className="mb-8 animate-fade-in-up" style={{ animationDelay: "80ms" }} aria-label="오늘의 융합 해석">
              <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
                {/* Top image with gradient overlay and astro badge pills */}
                <div className="relative h-32 md:h-40 overflow-hidden">
                  <Image
                    src="/explore-hero.jpeg"
                    alt="밤하늘 일러스트"
                    fill
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                  {/* Astro badge pills float at bottom of image */}
                  <div className="absolute bottom-3 left-4 right-4 flex flex-wrap gap-1.5">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-6 w-28 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </>
                    ) : (
                      <>
                        {sajuPillar && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-background/60 backdrop-blur-md text-foreground/80 border border-border/20">
                            {sajuPillar.heavenlyStem}{sajuPillar.earthlyBranch} / {sajuPillar.element}
                          </span>
                        )}
                        {planetPositions.slice(0, 3).map((p) => (
                          <span key={p.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-background/60 backdrop-blur-md text-foreground/80 border border-border/20">
                            {p.symbol} {p.sign}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Card content area */}
                <div className="p-5 md:p-6">
                  <h2 className="font-serif text-lg font-semibold text-foreground mb-2">
                    {headlineTitle}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {astrologyResult ? (
                      headlineBody
                    ) : (
                      <>
                        사주의{" "}
                        <TermTooltip term="식신" definition="일간이 생(生)하는 오행 중 음양이 같은 것. 표현, 재능, 식복을 의미합니다." />
                        {" "}기운과 태양의 물고기자리 에너지가 함께 흐르고 있습니다.
                        이성적 판단보다 직관을 신뢰하되, 오행의{" "}
                        <TermTooltip term="토(Earth)" definition="오행 중 안정과 중심을 상징. 균형을 잡아주는 역할을 합니다." />
                        {" "}에너지로 현실 감각을 유지하세요.
                      </>
                    )}
                  </p>
                  <button
                    onClick={() => setChatOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                    type="button"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    이 해석에 대해 더 이야기하기
                  </button>
                </div>
              </div>
            </section>

            {/* ─── 2. Interactive Chart + Saju Mapping ─── */}
            <section className="mt-6" aria-label="네이탈 차트와 사주 매핑">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">차트와 사주 매핑</h2>
                <Sparkles className="h-4 w-4 text-accent/60" />
              </div>
              <div className="mt-3 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
                {/* Size mode toggle */}
                <div className="mb-3 flex justify-end">
                  <div className="inline-flex rounded-full border border-border p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setPlanetSizeMode("influence")}
                      className={`rounded-full px-3 py-1 transition-colors ${planetSizeMode === "influence" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      영향력
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanetSizeMode("physical")}
                      className={`rounded-full px-3 py-1 transition-colors ${planetSizeMode === "physical" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      실제 크기
                    </button>
                  </div>
                </div>
                <SolarSystemView activePlanetIdx={activePlanetIdx} onPlanetClick={(i: number) => setActivePlanetIdx(activePlanetIdx === i ? null : i)} sizeMode={planetSizeMode} />
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {planetPositions.map((p, i) => (
                    <button
                      key={p.name}
                      onClick={() => setActivePlanetIdx(activePlanetIdx === i ? null : i)}
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${activePlanetIdx === i ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                      type="button"
                      aria-label={`${p.symbol} ${p.name}`}
                      title={p.name.split(" (")[0]}
                    >
                      <span className="text-sm">{p.symbol}</span>
                      <span className="hidden sm:inline">{p.name.split(" (")[0]}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-center text-[11px] text-muted-foreground/70">
                  행성을 탭하면 점성술 위치와 사주 십신 매핑을 함께 볼 수 있습니다
                </p>
                {activePlanet && (
                  <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{activePlanet.symbol}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground">{activePlanet.name}</h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {activePlanet.sign}
                          {activePlanet.house ? ` / House ${activePlanet.house}` : ""}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <BookOpen className="h-3 w-3 text-accent" />
                          <span className="text-xs font-medium text-accent">사주 대응: {activePlanet.sajuMap}</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{activePlanet.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ─── 2.5 Natal Chart Wheel (Horizons 데이터) ─── */}
            {chartCore && (
              <section className="mt-6" aria-label="네이탈 차트 휠">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">네이탈 차트</h2>
                  <span className="text-[10px] text-muted-foreground/60">Horizons Engine</span>
                </div>
                <div className="mt-3 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
                  <NatalChartWheel chartCore={chartCore} />
                  <div className="mt-3 flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
                    <span>ASC: {chartCore.ascendant?.signLabel} {chartCore.ascendant?.degreeInSign?.toFixed(1)}°</span>
                    <span>MC: {chartCore.midheaven?.signLabel} {chartCore.midheaven?.degreeInSign?.toFixed(1)}°</span>
                  </div>
                </div>
              </section>
            )}

            {/* ─── 3. Five Elements (실제 데이터) ─── */}
            <section className="mt-6" aria-label="오행 에너지">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">오행 에너지 분포</h2>
                {fiveElements && (
                  <div className="inline-flex rounded-full border border-border p-0.5">
                    <button
                      type="button"
                      onClick={() => setElementChartMode("bar")}
                      className={`rounded-full p-1.5 transition-colors ${elementChartMode === "bar" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      aria-label="바 차트"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setElementChartMode("radar")}
                      className={`rounded-full p-1.5 transition-colors ${elementChartMode === "radar" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      aria-label="레이더 차트"
                    >
                      <Radar className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-3 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-1.5 w-full rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : fiveElements ? (
                  <>
                    {elementChartMode === "bar" ? (
                      <div className="space-y-3">
                        {fiveElements.map((el) => {
                          const maxVal = Math.max(...fiveElements.map((e) => e.value), 1)
                          const pct = (el.value / maxVal) * 100
                          return (
                            <div key={el.element} className="flex items-center gap-3">
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                style={{ backgroundColor: ELEMENT_HEX[el.element] ?? "var(--muted)" }}
                              >
                                <span className="font-serif text-xs font-bold text-white">{el.element}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-foreground">{el.label}</span>
                                  <span className="text-muted-foreground">{el.value}</span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%`, backgroundColor: ELEMENT_HEX[el.element] ?? "var(--primary)" }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <FiveElementsRadar data={fiveElements} />
                    )}
                    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                      {(() => {
                        const dominant = fiveElements.reduce((a, b) => a.value > b.value ? a : b)
                        return `${dominant.element}(${dominant.label}) 기운이 가장 높습니다.`
                      })()}
                    </p>
                  </>
                ) : (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    사주 분석 후 오행 분포가 표시됩니다
                  </div>
                )}
              </div>
            </section>

            {/* ─── 4. Transits ─── */}
            <section className="mb-8 mt-6" aria-label="트랜짓과 사주 공명">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">하늘의 변화</h2>
                <Sparkles className="h-4 w-4 text-accent/60" />
              </div>
              <div className="mt-3 flex gap-1.5">
                {([
                  { id: "all" as const, label: "전체" },
                  { id: "daily" as const, label: "오늘" },
                  { id: "weekly" as const, label: "이번 주" },
                  { id: "special" as const, label: "특별" },
                ]).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setTransitFilter(id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${transitFilter === id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-2.5">
                {filteredTransits.map((transit) => {
                  const isExpanded = expandedTransit === transit.id
                  return (
                    <div key={transit.id} className={`rounded-xl border transition-colors ${isExpanded ? "border-primary/20 bg-card" : "border-border bg-card"}`}>
                      <button onClick={() => setExpandedTransit(isExpanded ? null : transit.id)} className="flex w-full items-center gap-3 p-4 text-left" type="button" aria-expanded={isExpanded}>
                        <div className={`h-2 w-2 shrink-0 rounded-full ${getSignificanceDot(transit.significance)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{transit.planets}</span>
                            <h3 className="text-sm font-medium text-foreground truncate">{transit.headline}</h3>
                          </div>
                          <p className="mt-0.5 text-[11px] text-accent/80 truncate">{transit.sajuResonance}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">{getTypeLabel(transit.type)}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-border px-4 pb-4 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          <p className="text-sm leading-relaxed text-muted-foreground">{transit.body}</p>
                          <button onClick={() => setChatOpen(true)} className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80" type="button">
                            <MessageCircle className="h-3 w-3" />
                            이 하늘의 흐름에 대해 더 알아보기
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* ─── Desktop Sidebar ─── */}
          <aside className="hidden lg:block lg:w-80 lg:shrink-0">
            <div className="sticky top-6 space-y-6">
              {/* Saju pillar card — 원형 배지 디자인 */}
              <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">나의 사주 일주</h3>
                {isLoading ? (
                  <div className="mt-3 flex items-center gap-3">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ) : sajuPillar ? (
                  <div className="mt-3 flex items-center gap-4">
                    <div className="relative flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full animate-glow-pulse"
                      style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)" }}
                    >
                      <span className="font-serif text-base font-bold text-primary leading-none">
                        {sajuPillar.heavenlyStem}
                      </span>
                      <span className="font-serif text-sm text-primary/80 leading-none mt-0.5">
                        {sajuPillar.earthlyBranch}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <p className="text-sm font-medium text-foreground">{sajuPillar.element}</p>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{sajuPillar.meaning}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">온보딩 후 표시됩니다</p>
                )}
              </div>

              {/* Current Daewoon */}
              {sajuResult && (
                <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">대운 / 세운</h3>
                  <div className="mt-3 space-y-2">
                    {greatFortune?.current_period && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">현재 대운</span>
                        <span className="text-sm font-medium text-foreground">
                          {greatFortune.current_period.heavenly_stem}
                          {greatFortune.current_period.earthly_branch}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">신강/신약</span>
                      <span className="text-sm font-medium text-foreground">
                        {sinyakSingangData?.strength_type}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Moon Nakshatra (베딕) */}
              {vedicCore?.moonNakshatra && (
                <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">달의 낙샤트라</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15">
                      <span className="text-lg">☽</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{vedicCore.moonNakshatra.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        파다 {vedicCore.moonNakshatra.pada} · 주관 {vedicCore.moonNakshatra.lord}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI prompt */}
              <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI 통합 해석</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  사주와 점성술을 함께 짚어볼까요? 궁금한 점을 물어보세요.
                </p>
                <button onClick={() => setChatOpen(true)} className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80" type="button">
                  <MessageCircle className="h-3.5 w-3.5" />
                  대화 시작하기
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ChatInterface mode="modal" agents="single" open={chatOpen} onOpenChange={setChatOpen} context="default" />
    </>
  )
}
