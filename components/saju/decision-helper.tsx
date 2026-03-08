"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ArrowRight, RotateCcw, Sparkles } from "lucide-react"
import { DeepDiveSheet } from "./deep-dive-sheet"
import { WhyThisResult } from "./why-this-result"
import { useFortune } from "@/lib/contexts/fortune-context"

const QUESTIONS = [
  {
    id: "q1",
    question: "지금 더 중요한 건 무엇인가요?",
    options: [
      { value: "speed", label: "속도 (빠른 결과)" },
      { value: "stability", label: "안정 (확실한 기반)" },
    ],
  },
  {
    id: "q2",
    question: "이 결정에서 가장 두려운 건?",
    options: [
      { value: "regret", label: "후회 (놓칠까봐)" },
      { value: "burden", label: "부담 (감당하기 어려울까봐)" },
    ],
  },
  {
    id: "q3",
    question: "1년 후 나에게 더 중요한 건?",
    options: [
      { value: "growth", label: "성장 (새로운 경험)" },
      { value: "peace", label: "평화 (마음의 안정)" },
    ],
  },
]

type Step = "input" | "questions" | "result"

export function DecisionHelper() {
  const { birthInfo } = useFortune()
  const [step, setStep] = useState<Step>("input")
  const [optionA, setOptionA] = useState("")
  const [optionB, setOptionB] = useState("")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [deepDiveOpen, setDeepDiveOpen] = useState(false)
  const [aiResult, setAiResult] = useState<{
    recommendation: "A" | "B"
    headline: string
    body: string
    reasoning: string
    caution: string
    keywords: string[]
  } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const fetchDecisionResult = async (allAnswers: Record<string, string>) => {
    setStep("result")

    if (!birthInfo) {
      setAiLoading(false)
      setAiError(null)
      setAiResult(null)
      return
    }

    setAiLoading(true)
    setAiError(null)
    setAiResult(null)

    try {
      const res = await fetch("/api/saju/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "decision",
          birthInfo,
          decisionContext: {
            optionA,
            optionB,
            answers: allAnswers,
          },
        }),
      })

      if (!res.ok) throw new Error("결정 도움 생성에 실패했습니다")

      const json = await res.json()
      if (!json?.data) throw new Error("결정 도움 생성에 실패했습니다")
      setAiResult(json.data)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "오류가 발생했습니다")
      setAiResult(null)
    } finally {
      setAiLoading(false)
    }
  }

  const handleAnswer = (questionId: string, value: string) => {
    const next = { ...answers, [questionId]: value }
    setAnswers(next)

    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ((prev) => prev + 1), 300)
    } else {
      fetchDecisionResult(next)
    }
  }

  const resetAll = () => {
    setStep("input")
    setOptionA("")
    setOptionB("")
    setAnswers({})
    setCurrentQ(0)
    setAiResult(null)
    setAiLoading(false)
    setAiError(null)
  }

  const getResult = () => {
    const values = Object.values(answers)
    const aLeaning = values.filter((v) =>
      ["speed", "regret", "growth"].includes(v)
    ).length
    return aLeaning >= 2 ? "A" : "B"
  }

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-6">
        {/* Header */}
        <header className="py-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            결정 도우미
          </p>
          <h1 className="mt-2 text-balance font-serif text-xl font-semibold leading-snug text-foreground lg:text-2xl">
            두 갈래 길에서 방향을 찾아볼까요?
          </h1>
        </header>

        {/* Step: Input */}
        {step === "input" && (
          <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="optionA"
                  className="text-sm font-medium text-foreground"
                >
                  선택지 A
                </Label>
                <Input
                  id="optionA"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  placeholder="예: 이직하기"
                  className="h-12 rounded-lg border-border bg-card text-foreground"
                />
              </div>

              <div className="flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">vs</span>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="optionB"
                  className="text-sm font-medium text-foreground"
                >
                  선택지 B
                </Label>
                <Input
                  id="optionB"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  placeholder="예: 현재 직장 유지"
                  className="h-12 rounded-lg border-border bg-card text-foreground"
                />
              </div>
            </div>

            <Button
              onClick={() => setStep("questions")}
              disabled={!optionA.trim() || !optionB.trim()}
              className="h-12 w-full rounded-lg bg-primary font-medium text-primary-foreground"
            >
              질문 시작
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step: Questions */}
        {step === "questions" && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Options summary */}
            <div className="mb-8 flex items-center justify-center gap-4">
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
                <span className="text-xs text-muted-foreground">A</span>
                <p className="text-sm font-medium text-foreground">{optionA}</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">vs</span>
              <div className="rounded-lg border border-border bg-card px-4 py-2">
                <span className="text-xs text-muted-foreground">B</span>
                <p className="text-sm font-medium text-foreground">{optionB}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6 flex items-center gap-2">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= currentQ ? "bg-primary" : "bg-border"
                  }`}
                />
              ))}
            </div>

            {/* Current question */}
            <div
              key={QUESTIONS[currentQ].id}
              className="animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <h2 className="font-serif text-lg font-medium text-foreground">
                {QUESTIONS[currentQ].question}
              </h2>
              <div className="mt-6 space-y-3">
                {QUESTIONS[currentQ].options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handleAnswer(QUESTIONS[currentQ].id, option.value)
                    }
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      answers[QUESTIONS[currentQ].id] === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-secondary/50"
                    }`}
                    type="button"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Result */}
        {step === "result" && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Result card */}
            <div className="rounded-2xl border border-primary/20 bg-card p-6 lg:p-8">
              {aiLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      AI가 맞춤 결정을 분석 중입니다
                    </span>
                  </div>
                  <Skeleton className="h-8 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ) : aiResult ? (
                <>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      AI
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      오늘의 결정 프레임
                    </span>
                  </div>

                  <h2 className="mt-4 font-serif text-xl font-semibold text-foreground lg:text-2xl">
                    {aiResult.recommendation === "A" ? (
                      <>
                        <span className="text-primary">{optionA}</span>
                        {"(이)가 지금 기운과 맞닿아 있어요"}
                      </>
                    ) : (
                      <>
                        <span className="text-primary">{optionB}</span>
                        {"(이)가 지금 기운과 맞닿아 있어요"}
                      </>
                    )}
                  </h2>

                  <h3 className="mt-3 text-base font-semibold text-foreground">{aiResult.headline}</h3>

                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{aiResult.body}</p>

                  <div className="mt-5 rounded-xl border border-border bg-secondary/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      추천 근거
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">{aiResult.reasoning}</p>
                  </div>

                  <div className="mt-4 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-foreground">
                    {aiResult.caution}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {aiResult.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      오늘의 결정 프레임
                    </span>
                  </div>

                  <h2 className="mt-4 font-serif text-xl font-semibold text-foreground lg:text-2xl">
                    {getResult() === "A" ? (
                      <>
                        <span className="text-primary">{optionA}</span>
                        {"(이)가 지금 기운과 맞닿아 있어요"}
                      </>
                    ) : (
                      <>
                        <span className="text-primary">{optionB}</span>
                        {"(이)가 지금 기운과 맞닿아 있어요"}
                      </>
                    )}
                  </h2>

                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {getResult() === "A"
                      ? "지금 당신의 기운은 변화와 도전을 향해 열려 있습니다. 새로운 시도가 장기적으로 더 큰 배움과 성장을 안겨줄 수 있어요. 다만 충분한 준비는 놓치지 마세요."
                      : "지금 당신의 기운은 안정과 깊이를 향해 모이고 있습니다. 현재의 자리에서 더 깊이 뿌리내리는 것이 장기적으로 단단한 기반이 됩니다. 변화는 그 위에서 자연스럽게 올 거예요."}
                  </p>

                  {/* Keywords */}
                  <div className="mt-5 flex gap-2">
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                      {getResult() === "A" ? "도전" : "안정"}
                    </span>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                      {getResult() === "A" ? "성장" : "깊이"}
                    </span>
                  </div>
                </>
              )}

              {aiError && !aiLoading && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">분석에 실패했습니다</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">잠시 후 다시 시도해주세요</p>
                  </div>
                </div>
              )}

              {/* Seal */}
              <div className="mt-5 flex justify-end">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent/30">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
              </div>
            </div>

            {/* Evidence trigger */}
            <WhyThisResult onClick={() => setDeepDiveOpen(true)} className="mt-4" />

            {/* Reset */}
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={resetAll}
                disabled={aiLoading}
                className="h-10 rounded-lg border-border text-foreground"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                다시 해보기
              </Button>
            </div>
          </div>
        )}
      </div>

      <DeepDiveSheet
        open={deepDiveOpen}
        onOpenChange={setDeepDiveOpen}
        context="decision"
        contextData={{ decisionResult: aiResult ?? undefined }}
      />
    </>
  )
}
