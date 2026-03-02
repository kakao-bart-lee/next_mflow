"use client"

import { useState } from "react"
import { Compass, Heart, HelpCircle } from "lucide-react"
import { DecisionHelper } from "./decision-helper"
import { CompatibilityScreen } from "./compatibility-screen"
import { CommonQuestionsScreen } from "./common-questions-screen"

type HubView = "hub" | "decision" | "compatibility" | "questions"

const HUB_CARDS = [
  {
    id: "decision" as const,
    icon: Compass,
    title: "A vs B 결정",
    description: "두 갈래 길에서 방향을 찾아볼까요?",
    color: "bg-primary/10 text-primary",
  },
  {
    id: "compatibility" as const,
    icon: Heart,
    title: "궁합 분석",
    description: "두 사람의 에너지 조화를 살펴봅니다",
    color: "bg-accent/10 text-accent",
  },
  {
    id: "questions" as const,
    icon: HelpCircle,
    title: "자주 묻는 질문",
    description: "많은 분들이 궁금해하는 것들",
    color: "bg-secondary text-muted-foreground",
  },
] as const

export function DecisionHub() {
  const [view, setView] = useState<HubView>("hub")

  if (view === "decision") {
    return (
      <div>
        <BackButton onClick={() => setView("hub")} />
        <DecisionHelper />
      </div>
    )
  }

  if (view === "compatibility") {
    return (
      <div>
        <BackButton onClick={() => setView("hub")} />
        <CompatibilityScreen />
      </div>
    )
  }

  if (view === "questions") {
    return (
      <div>
        <BackButton onClick={() => setView("hub")} />
        <CommonQuestionsScreen />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-6">
      <header className="py-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          결정 도우미
        </p>
        <h1 className="mt-2 text-balance font-serif text-xl font-semibold leading-snug text-foreground lg:text-2xl">
          무엇이 궁금하세요?
        </h1>
      </header>

      <div className="mt-8 space-y-3">
        {HUB_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.id}
              onClick={() => setView(card.id)}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:bg-secondary/50"
              type="button"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{card.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{card.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-4">
      <button
        onClick={onClick}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        type="button"
      >
        <span>&larr;</span>
        <span>결정 도우미</span>
      </button>
    </div>
  )
}
