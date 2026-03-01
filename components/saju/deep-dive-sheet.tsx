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

const FIVE_ELEMENTS = [
  { element: "목", label: "Wood", value: 2, color: "bg-primary", textColor: "text-primary-foreground" },
  { element: "화", label: "Fire", value: 1, color: "bg-accent", textColor: "text-accent-foreground" },
  { element: "토", label: "Earth", value: 3, color: "bg-muted-foreground", textColor: "text-background" },
  { element: "금", label: "Metal", value: 1, color: "bg-border", textColor: "text-foreground" },
  { element: "수", label: "Water", value: 1, color: "bg-primary/70", textColor: "text-primary-foreground" },
]

function DeepDiveContent() {
  return (
    <div className="space-y-6 px-1">
      {/* Fused summary */}
      <section>
        <h3 className="text-sm font-semibold text-foreground">오늘의 근거 요약</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          오늘은 사주의{" "}
          <GlossaryTooltip
            term="식신 (食神)"
            definition="일간이 생(生)하는 오행 중 음양이 같은 것. 표현, 재능, 식복을 의미합니다."
          />
          {" "}기운이 강하게 작용하는 날입니다. 점성술로 보면 태양이 물고기자리를
          지나며 감정적 깊이가 커지는 시간과 맞물려 있어요. 두 체계 모두 "내면을
          밖으로 표현하고 정리하는" 같은 방향을 가리킵니다.
        </p>
      </section>

      {/* Five Elements summary */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">오행 흐름</h3>
        <div className="grid grid-cols-5 gap-2">
          {FIVE_ELEMENTS.map((item) => (
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
      </section>

      {/* Key terms - fused */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">핵심 용어</h3>
        <div className="space-y-3">
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
                내면의 것을 밖으로 표현하는 에너지. 점성술의 12하우스 태양과
                비슷한 결의 에너지입니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
            <div className="shrink-0 rounded-md bg-primary/10 p-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <GlossaryTooltip
                term="편인 (偏印)"
                definition="일간을 생(生)해주는 오행 중 음양이 다른 것. 비전통적 학문, 직감, 영감을 상징합니다."
              />
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                직감과 영감의 기운. 달의 Cancer 위치가 주는 모성적 직관과
                공명합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
            <div className="shrink-0 rounded-md bg-accent/10 p-1.5">
              <Star className="h-3.5 w-3.5 text-accent" />
            </div>
            <div>
              <div className="text-xs font-medium text-accent">
                점성술 관점
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                태양 Pisces + 달 Cancer의 물(Water) 에너지는 사주의 수(水)
                기운과 대응합니다. 감정과 직관을 중시하는 하루.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Daewoon / Sewoon */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          대운/세운 포인트
        </h3>
        <div className="rounded-lg border border-border p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">현재 대운</span>
              <span className="text-sm font-medium text-foreground">
                경인 (庚寅) 대운
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">2026 세운</span>
              <span className="text-sm font-medium text-foreground">
                병오 (丙午) 년
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">주요 트랜짓</span>
              <span className="text-sm font-medium text-foreground">
                토성 Pisces 12H
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            대운의 변화와 성장 에너지가 토성의 12하우스 트랜짓과 만나,
            내면 성찰과 구조적 정리가 동시에 필요한 시기입니다.
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
