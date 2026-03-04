"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ArrowRight, Heart, Sparkles } from "lucide-react"
import { useSaju } from "@/lib/contexts/saju-context"
import { DeepDiveSheet } from "./deep-dive-sheet"
import { WhyThisResult } from "./why-this-result"

type CompatibilityType = "love" | "marriage" | "business" | "friendship"

const TYPE_LABELS: Record<CompatibilityType, string> = {
  love: "연애",
  marriage: "결혼",
  business: "비즈니스",
  friendship: "우정",
}

interface CompatibilityResult {
  total_score: { score: number; grade: string; description: string; strengths: string[]; weaknesses: string[]; advice: string[] }
  personality_match: { score: number; description: string }
  fortune_match: { score: number; description: string }
  health_match: { score: number; description: string }
  wealth_match: { score: number; description: string }
  career_match: { score: number; description: string }
  overall_interpretation: string
  recommendations: string[]
}

type Step = "input" | "result"

export function CompatibilityScreen() {
  const { birthInfo } = useSaju()
  const [step, setStep] = useState<Step>("input")
  const [partnerDate, setPartnerDate] = useState("")
  const [partnerTime, setPartnerTime] = useState("")
  const [partnerGender, setPartnerGender] = useState<"M" | "F">("F")
  const [compatType, setCompatType] = useState<CompatibilityType>("love")
  const [result, setResult] = useState<CompatibilityResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deepDiveOpen, setDeepDiveOpen] = useState(false)
  const canSubmit = partnerDate.length === 10 && birthInfo

  const handleAnalyze = async () => {
    if (!birthInfo || !partnerDate) return

    setStep("result")
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/saju/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personA: birthInfo,
          personB: {
            birthDate: partnerDate,
            birthTime: partnerTime || null,
            isTimeUnknown: !partnerTime,
            timezone: birthInfo.timezone,
            gender: partnerGender,
          },
          type: compatType,
        }),
      })

      if (!res.ok) throw new Error("궁합 분석에 실패했습니다")
      const json = await res.json()
      if (!json?.data) throw new Error("분석 결과를 가져올 수 없습니다")
      setResult(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-5 pb-8 pt-6">
        <header className="py-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            궁합 분석
          </p>
          <h1 className="mt-2 text-balance font-serif text-xl font-semibold leading-snug text-foreground lg:text-2xl">
            두 사람의 에너지 조화를 살펴봅니다
          </h1>
        </header>

        {step === "input" && (
          <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* 궁합 유형 선택 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">궁합 유형</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(TYPE_LABELS) as [CompatibilityType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setCompatType(key)}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                      compatType === key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 상대 정보 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partnerDate" className="text-sm font-medium text-foreground">
                  상대방 생년월일
                </Label>
                <Input
                  id="partnerDate"
                  type="date"
                  value={partnerDate}
                  onChange={(e) => setPartnerDate(e.target.value)}
                  className="h-12 rounded-lg border-border bg-card text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerTime" className="text-sm font-medium text-foreground">
                  상대방 태어난 시간 <span className="text-muted-foreground">(선택)</span>
                </Label>
                <Input
                  id="partnerTime"
                  type="time"
                  value={partnerTime}
                  onChange={(e) => setPartnerTime(e.target.value)}
                  className="h-12 rounded-lg border-border bg-card text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">상대방 성별</Label>
                <div className="flex gap-3">
                  {(["M", "F"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setPartnerGender(g)}
                      className={`flex-1 rounded-lg border p-3 text-sm font-medium transition-colors ${
                        partnerGender === g
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary"
                      }`}
                      type="button"
                    >
                      {g === "M" ? "남성" : "여성"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!canSubmit}
              className="h-12 w-full rounded-lg bg-primary font-medium text-primary-foreground"
            >
              궁합 분석하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === "result" && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-accent" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    궁합을 분석하고 있습니다
                  </span>
                </div>
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">분석에 실패했습니다</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* 종합 점수 */}
                <div className="rounded-2xl border border-primary/20 bg-card p-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {TYPE_LABELS[compatType]} 궁합 결과
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
                      <span className="text-2xl font-bold text-primary">{result.total_score.score}</span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{result.total_score.grade}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{result.total_score.description}</p>
                    </div>
                  </div>
                </div>

                {/* 카테고리별 점수 */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { label: "성격", score: result.personality_match.score },
                    { label: "운세", score: result.fortune_match.score },
                    { label: "건강", score: result.health_match.score },
                    { label: "재물", score: result.wealth_match.score },
                    { label: "직업", score: result.career_match.score },
                  ].map((cat) => (
                    <div key={cat.label} className="rounded-xl border border-border bg-card p-4 text-center">
                      <p className="text-xs text-muted-foreground">{cat.label}</p>
                      <p className="mt-1 text-xl font-bold text-foreground">{cat.score}</p>
                    </div>
                  ))}
                </div>

                {/* 강점/약점/조언 */}
                {result.total_score.strengths.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">강점</h3>
                    <ul className="mt-3 space-y-2">
                      {result.total_score.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.total_score.advice.length > 0 && (
                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">조언</h3>
                    <ul className="mt-3 space-y-2">
                      {result.total_score.advice.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 종합 해석 */}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {result.overall_interpretation}
                </p>

                {/* Seal */}
                <div className="flex justify-end">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent/30">
                    <Heart className="h-4 w-4 text-accent" />
                  </div>
                </div>
              </div>
            ) : null}

            {/* Evidence trigger */}
            {result && (
              <WhyThisResult onClick={() => setDeepDiveOpen(true)} className="mt-4" />
            )}

            {/* Reset */}
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("input")
                  setResult(null)
                  setError(null)
                }}
                disabled={loading}
                className="h-10 rounded-lg border-border text-foreground"
              >
                다시 분석하기
              </Button>
            </div>
          </div>
        )}
      </div>

      <DeepDiveSheet
        open={deepDiveOpen}
        onOpenChange={setDeepDiveOpen}
        context="decision"
      />
    </>
  )
}
