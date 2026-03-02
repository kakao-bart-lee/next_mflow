"use client"

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
import { X, BookOpen, HelpCircle, Star } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSaju } from "@/lib/contexts/saju-context"
import type { FortuneResponse } from "@/lib/saju-core"
import type { AstrologyStaticResult } from "@/lib/astrology/static/types"

interface DeepDiveSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

/* ─── 오행 표시 데이터 빌더 ─── */

const ELEMENT_LABEL: Record<string, string> = {
  목: "Wood", 화: "Fire", 토: "Earth", 금: "Metal", 수: "Water",
}

const ELEMENT_COLOR: Record<string, { color: string; textColor: string }> = {
  목: { color: "bg-primary", textColor: "text-primary-foreground" },
  화: { color: "bg-accent", textColor: "text-accent-foreground" },
  토: { color: "bg-muted-foreground", textColor: "text-background" },
  금: { color: "bg-border", textColor: "text-foreground" },
  수: { color: "bg-primary/70", textColor: "text-primary-foreground" },
}

const FALLBACK_ELEMENTS = [
  { element: "목", label: "Wood", value: 2, color: "bg-primary", textColor: "text-primary-foreground" },
  { element: "화", label: "Fire", value: 1, color: "bg-accent", textColor: "text-accent-foreground" },
  { element: "토", label: "Earth", value: 3, color: "bg-muted-foreground", textColor: "text-background" },
  { element: "금", label: "Metal", value: 1, color: "bg-border", textColor: "text-foreground" },
  { element: "수", label: "Water", value: 1, color: "bg-primary/70", textColor: "text-primary-foreground" },
]

function buildFiveElements(sajuResult: FortuneResponse | null) {
  if (!sajuResult?.sinyakSingang) return FALLBACK_ELEMENTS

  const powers = (sajuResult.sinyakSingang as Record<string, unknown>).element_powers as Record<string, number> | undefined
  if (!powers) return FALLBACK_ELEMENTS

  const order = ["목", "화", "토", "금", "수"]
  return order.map((el) => ({
    element: el,
    label: ELEMENT_LABEL[el] ?? el,
    value: Math.round((powers[el] ?? 0) * 10) / 10,
    color: ELEMENT_COLOR[el]?.color ?? "bg-border",
    textColor: ELEMENT_COLOR[el]?.textColor ?? "text-foreground",
  }))
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

/* ─── 사주 데이터에서 주요 십신 추출 ─── */

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

/* ─── 대운/세운 데이터 추출 ─── */

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

/* ─── 점성술 요약 빌더 ─── */

function buildAstrologyNote(astrologyResult: AstrologyStaticResult | null): string | null {
  if (!astrologyResult) return null

  const sun = astrologyResult.positions.SUN
  const moon = astrologyResult.positions.MOON
  const saturn = astrologyResult.positions.SATURN

  const sunSign = sun?.signLabel ?? "?"
  const moonSign = moon?.signLabel ?? "?"
  const saturnSign = saturn?.signLabel ?? "?"
  const saturnHouse = saturn?.house

  return `태양 ${sunSign} + 달 ${moonSign} 에너지가 흐르고 있습니다. 토성은 ${saturnSign}${saturnHouse ? ` ${saturnHouse}하우스` : ""}에서 구조적 성찰을 이끕니다.`
}

/* ─── 메인 콘텐츠 ─── */

function DeepDiveContent() {
  const { sajuResult, astrologyResult } = useSaju()

  const fiveElements = buildFiveElements(sajuResult)
  const keyTerms = extractKeyTerms(sajuResult)
  const greatFortune = extractGreatFortune(sajuResult)
  const strengthType = extractStrength(sajuResult)
  const astrologyNote = buildAstrologyNote(astrologyResult)

  // 일주 정보
  const dayPillar = sajuResult?.sajuData?.pillars?.일
  const dayElement = dayPillar?.오행?.천간 ?? "토"
  const dayElementLabel = ELEMENT_LABEL[dayElement] ?? dayElement

  return (
    <div className="space-y-6 px-1">
      {/* Fused summary */}
      <section>
        <h3 className="text-sm font-semibold text-foreground">오늘의 근거 요약</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {sajuResult ? (
            <>
              오늘은 일주의 {dayElement}({dayElementLabel}) 기운이 중심이 되는 날입니다.
              {keyTerms[0] && (
                <>
                  {" "}사주의{" "}
                  <GlossaryTooltip term={keyTerms[0].term} definition={keyTerms[0].definition} />
                  {" "}기운이 강하게 작용합니다.
                </>
              )}
              {astrologyNote && ` 점성술로 보면 ${astrologyNote}`}
            </>
          ) : (
            <>
              사주 분석 데이터를 불러오면 오늘의 근거 요약이 표시됩니다.
              온보딩에서 생년월일시를 입력해주세요.
            </>
          )}
        </p>
      </section>

      {/* Five Elements summary */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">오행 흐름</h3>
        <div className="grid grid-cols-5 gap-2">
          {fiveElements.map((item) => (
            <div key={item.element} className="text-center">
              <div
                className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}
              >
                <span className={`font-serif text-sm font-bold ${item.textColor}`}>
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
        {sajuResult && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {(() => {
              const dominant = fiveElements.reduce((a, b) => a.value > b.value ? a : b)
              return `${dominant.element}(${dominant.label}) 기운이 가장 높으며, 일주의 기본 에너지를 형성합니다.`
            })()}
          </p>
        )}
      </section>

      {/* Key terms - dynamic from sipsin */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">핵심 용어</h3>
        <div className="space-y-3">
          {keyTerms.length > 0 ? (
            keyTerms.map((kt) => (
              <div key={kt.term} className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
                <div className="shrink-0 rounded-md bg-primary/10 p-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <GlossaryTooltip term={kt.term} definition={kt.definition} />
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {kt.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
                <div className="shrink-0 rounded-md bg-primary/10 p-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <GlossaryTooltip
                    term="식신 (食神)"
                    definition="일간이 생(生)하는 오행 중 음양이 같은 것. 표현, 재능, 식복을 의미합니다."
                  />
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    내면의 것을 밖으로 표현하는 에너지입니다.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* 점성술 관점 (always show if astrology data available) */}
          {astrologyResult && (
            <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
              <div className="shrink-0 rounded-md bg-accent/10 p-1.5">
                <Star className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <div className="text-xs font-medium text-accent">
                  점성술 관점
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {astrologyNote ?? "점성술 데이터를 분석 중입니다."}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Daewoon / Sewoon */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          대운/세운 포인트
        </h3>
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
                    <span className="text-sm font-medium text-foreground">
                      {greatFortune.sipsin}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">현재 대운</span>
                <span className="text-sm font-medium text-muted-foreground">
                  분석 데이터 없음
                </span>
              </div>
            )}
            {strengthType && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">신강/신약</span>
                <span className="text-sm font-medium text-foreground">
                  {strengthType}
                </span>
              </div>
            )}
            {astrologyResult && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">주요 트랜짓</span>
                <span className="text-sm font-medium text-foreground">
                  토성 {astrologyResult.positions.SATURN.signLabel}
                  {astrologyResult.positions.SATURN.house && ` ${astrologyResult.positions.SATURN.house}H`}
                </span>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {greatFortune
              ? `현재 ${greatFortune.heavenlyStem}${greatFortune.earthlyBranch} 대운의 에너지가 흐르고 있으며, ${strengthType ? `${strengthType} 상태에서 ` : ""}일주의 기운과 어떻게 조화를 이루는지 살펴보세요.`
              : "사주 분석 데이터를 불러오면 대운/세운 정보가 표시됩니다."}
          </p>
        </div>
      </section>
    </div>
  )
}

export function DeepDiveSheet({ open, onOpenChange }: DeepDiveSheetProps) {
  const isMobile = useIsMobile()

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
              사주와 점성술 관점에서 오늘의 해석 근거를 살펴보세요
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-8">
            <DeepDiveContent />
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
            사주와 점성술 관점에서 오늘의 해석 근거를 살펴보세요
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 px-1 pb-8">
          <DeepDiveContent />
        </div>
      </SheetContent>
    </Sheet>
  )
}
