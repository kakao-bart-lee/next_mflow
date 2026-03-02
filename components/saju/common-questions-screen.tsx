"use client"

import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Sparkles, TrendingUp, Heart, Briefcase, Activity, Calendar, Users } from "lucide-react"
import { useSaju } from "@/lib/contexts/saju-context"
import { WhyThisResult } from "./why-this-result"
import { DeepDiveSheet } from "./deep-dive-sheet"
import { AIChatPanel } from "./ai-chat-panel"
import type { ElementType } from "react"

interface QuestionCard {
  id: string
  icon: ElementType<{ className?: string }>
  question: string
  shortLabel: string
  color: string
}

const QUESTIONS: QuestionCard[] = [
  { id: "wealth", icon: TrendingUp, question: "올해 재물운은 어떤가요?", shortLabel: "재물운", color: "bg-primary/10 text-primary" },
  { id: "love", icon: Heart, question: "연애운이 궁금해요", shortLabel: "연애운", color: "bg-accent/10 text-accent" },
  { id: "career", icon: Briefcase, question: "이직 시기가 맞을까요?", shortLabel: "직업운", color: "bg-primary/10 text-primary" },
  { id: "health", icon: Activity, question: "건강에 신경 써야 할 때가 있나요?", shortLabel: "건강운", color: "bg-accent/10 text-accent" },
  { id: "bestMonth", icon: Calendar, question: "올해 가장 좋은 달은 언제인가요?", shortLabel: "월별운", color: "bg-primary/10 text-primary" },
  { id: "relationships", icon: Users, question: "대인관계에서 주의할 점이 있나요?", shortLabel: "대인운", color: "bg-accent/10 text-accent" },
]

interface AnswerResult {
  questionId: string
  answer: string
}

export function CommonQuestionsScreen() {
  const { birthInfo } = useSaju()
  const [selectedQ, setSelectedQ] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, AnswerResult>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deepDiveOpen, setDeepDiveOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const handleQuestion = async (q: QuestionCard) => {
    if (answers[q.id]) {
      setSelectedQ(selectedQ === q.id ? null : q.id)
      return
    }

    if (!birthInfo) {
      setError("먼저 생년월일 정보를 입력해주세요")
      return
    }

    setSelectedQ(q.id)
    setLoading(q.id)
    setError(null)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: q.question }],
          context: { birthInfo },
        }),
      })

      if (!res.ok) throw new Error("답변을 가져올 수 없습니다")

      // 스트리밍 응답 수집
      const reader = res.body?.getReader()
      if (!reader) throw new Error("응답 스트림을 열 수 없습니다")

      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
      }

      // ai-sdk 텍스트 스트림에서 실제 텍스트 추출
      const textParts = fullText
        .split("\n")
        .filter((line) => line.startsWith("0:"))
        .map((line) => {
          try {
            return JSON.parse(line.slice(2)) as string
          } catch {
            return ""
          }
        })
        .join("")

      const answerText = textParts || fullText.slice(0, 500)

      setAnswers((prev) => ({
        ...prev,
        [q.id]: { questionId: q.id, answer: answerText },
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다")
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-6">
        <header className="py-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            자주 묻는 질문
          </p>
          <h1 className="mt-2 text-balance font-serif text-xl font-semibold leading-snug text-foreground lg:text-2xl">
            많은 분들이 궁금해하는 것들
          </h1>
        </header>

        <div className="mt-8 space-y-3">
          {QUESTIONS.map((q) => {
            const Icon = q.icon
            const isSelected = selectedQ === q.id
            const answer = answers[q.id]
            const isLoading = loading === q.id

            return (
              <div key={q.id}>
                <button
                  onClick={() => handleQuestion(q)}
                  disabled={isLoading}
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                    isSelected
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-card hover:bg-secondary/50"
                  }`}
                  type="button"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${q.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                  </div>
                  {answer && (
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
                  )}
                </button>

                {isSelected && isLoading && (
                  <div className="mt-2 ml-14 space-y-2 animate-in fade-in duration-200">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                  </div>
                )}

                {isSelected && answer && (
                  <div className="mt-2 ml-14 rounded-lg border border-border bg-secondary/30 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="h-3 w-3 text-accent" />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        AI 답변
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {answer.answer}
                    </p>
                    <WhyThisResult
                      onClick={() => setDeepDiveOpen(true)}
                      className="mt-3 py-2 text-xs"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>

      <DeepDiveSheet
        open={deepDiveOpen}
        onOpenChange={setDeepDiveOpen}
        onOpenChat={() => {
          setDeepDiveOpen(false)
          setChatOpen(true)
        }}
      />
      <AIChatPanel open={chatOpen} onOpenChange={setChatOpen} />
    </>
  )
}
