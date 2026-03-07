"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ArrowRight, Heart, Sparkles } from "lucide-react"
import { useFortune } from "@/lib/contexts/fortune-context"
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
  legacy_intimacy?: {
    sourceTable: "G016"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
    score: number | null
  } | null
  legacy_bedroom?: {
    sourceTable: "G020"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
    score: number | null
  } | null
  legacy_love_style?: {
    sourceTable: "Y003"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
    score: number | null
  } | null
  legacy_yearly_love_cycle?: {
    sourceTable: "Y004"
    title: string
    scoreLabel: string
    lookupKey: string
    intro: string
    months: { month: number; text: string }[]
  } | null
  legacy_love_weak_point?: {
    sourceTable: "Y001"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
  } | null
  legacy_future_spouse_face?: {
    sourceTable: "G004"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
    currentMonthStem: string
    currentDay: number
  } | null
  legacy_future_spouse_personality?: {
    sourceTable: "G005"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
    currentMonthStem: string
    currentDay: number
  } | null
  legacy_future_spouse_career?: {
    sourceTable: "G006"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
    currentMonthStem: string
    currentDay: number
  } | null
  legacy_future_spouse_romance?: {
    sourceTable: "G007"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
    currentMonthStem: string
    currentDay: number
  } | null
  legacy_marriage_timing_table?: {
    sourceTable: "G033"
    title: string
    scoreLabel: string
    focusElement: string
    text: string
    entries: {
      year: number
      age: number
      ganji: string
      score: number
      percent: number
    }[]
  } | null
  legacy_relationship_timing?: {
    sourceTable: "G034"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
    currentYear: number
    matchedYear: number
    matchedGanji: string
  } | null
  legacy_partner_role?: {
    sourceTable: "G031"
    title: string
    scoreLabel: string
    lookupKey: string
    spouseRole: string
    palaceRole: string
    text: string
  } | null
  legacy_marriage_flow?: {
    sourceTable: "G001"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
    score: number | null
    currentMonth: number
  } | null
  legacy_spouse_core?: {
    sourceTable: "G030"
    title: string
    scoreLabel: string
    spouseStarLabel: string
    palaceLabel: string
    visiblePrimaryCount: number
    visibleSecondaryCount: number
    hiddenPrimaryCount: number
    hiddenSecondaryCount: number
    text: string
  } | null
  legacy_type_profile?: {
    sourceTable: "T010"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
  } | null
  legacy_outer_compatibility?: {
    sourceTable: "G023"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
  } | null
  legacy_traditional_compatibility?: {
    sourceTable: "G022"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
  } | null
  legacy_destiny_core?: {
    sourceTable: "G024"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
  } | null
  legacy_partner_personality?: {
    sourceTable: "G032"
    title: string
    scoreLabel: string
    lookupKey: string
    text: string
  } | null
  overall_interpretation: string
  recommendations: string[]
}

type Step = "input" | "result"

export function CompatibilityScreen() {
  const { birthInfo } = useFortune()
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

                {result.legacy_intimacy ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_intimacy.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 상세 해설 · {result.legacy_intimacy.sourceTable} · key {result.legacy_intimacy.lookupKey}
                        </p>
                      </div>
                      {typeof result.legacy_intimacy.score === "number" ? (
                        <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                          {result.legacy_intimacy.scoreLabel} {result.legacy_intimacy.score}
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_intimacy.text}
                    </p>
                  </div>
                ) : null}

                {result.legacy_bedroom ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_bedroom.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 상세 해설 · {result.legacy_bedroom.sourceTable} · key {result.legacy_bedroom.lookupKey}
                        </p>
                      </div>
                      {typeof result.legacy_bedroom.score === "number" ? (
                        <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                          {result.legacy_bedroom.scoreLabel} {result.legacy_bedroom.score}
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_bedroom.text}
                    </p>
                  </div>
                ) : null}

                {result.legacy_love_style ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_love_style.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 상세 해설 · {result.legacy_love_style.sourceTable} · key {result.legacy_love_style.lookupKey}
                        </p>
                      </div>
                      {typeof result.legacy_love_style.score === "number" ? (
                        <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                          {result.legacy_love_style.scoreLabel} {result.legacy_love_style.score}
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_love_style.text}
                    </p>
                  </div>
                ) : null}

                {result.legacy_yearly_love_cycle ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_yearly_love_cycle.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 월별 해설 · {result.legacy_yearly_love_cycle.sourceTable} · key {result.legacy_yearly_love_cycle.lookupKey}
                        </p>
                      </div>
                      <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                        {result.legacy_yearly_love_cycle.scoreLabel}
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_yearly_love_cycle.intro}
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {result.legacy_yearly_love_cycle.months.map((entry) => (
                        <div key={entry.month} className="rounded-lg border border-border/80 bg-background/60 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {entry.month}월
                          </p>
                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                            {entry.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {result.legacy_love_weak_point ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_love_weak_point.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 상세 해설 · {result.legacy_love_weak_point.sourceTable} · key {result.legacy_love_weak_point.lookupKey}
                        </p>
                      </div>
                      <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                        {result.legacy_love_weak_point.scoreLabel}
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_love_weak_point.text}
                    </p>
                  </div>
                ) : null}

                {([
                  result.legacy_future_spouse_face,
                  result.legacy_future_spouse_personality,
                  result.legacy_future_spouse_career,
                  result.legacy_future_spouse_romance,
                ] as const).map((entry) =>
                  entry ? (
                    <div key={`${entry.sourceTable}-${entry.lookupKey}`} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{entry.title}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            PHP 레거시 상세 해설 · {entry.sourceTable} · key {entry.lookupKey} · month_h {entry.currentMonthStem}
                          </p>
                        </div>
                        <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                          {entry.scoreLabel}
                        </div>
                      </div>
                      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {entry.text}
                      </p>
                    </div>
                  ) : null
                )}

                {result.legacy_marriage_timing_table ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_marriage_timing_table.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 synthetic 해설 · {result.legacy_marriage_timing_table.sourceTable} · {result.legacy_marriage_timing_table.focusElement} 배우자성 기준
                        </p>
                      </div>
                      <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                        {result.legacy_marriage_timing_table.scoreLabel}
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_marriage_timing_table.text}
                    </p>
                    <div className="mt-5 space-y-3">
                      {result.legacy_marriage_timing_table.entries.slice(0, 10).map((entry) => (
                        <div key={`${entry.year}-${entry.ganji}`} className="rounded-lg border border-border/80 bg-background/60 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {entry.year}년 · {entry.ganji}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                만 나이 기준 약 {entry.age}세 · raw {entry.score}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-accent">{entry.percent}%</p>
                            </div>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-accent transition-[width]"
                              style={{ width: `${Math.max(4, Math.min(entry.percent, 100))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {result.legacy_relationship_timing ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_relationship_timing.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 상세 해설 · {result.legacy_relationship_timing.sourceTable} · key {result.legacy_relationship_timing.lookupKey} · {result.legacy_relationship_timing.currentYear}년 기준
                        </p>
                      </div>
                      <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                        {result.legacy_relationship_timing.scoreLabel}
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      선택된 인연 해석: {result.legacy_relationship_timing.matchedYear}년생 {result.legacy_relationship_timing.matchedGanji}
                    </p>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_relationship_timing.text}
                    </p>
                  </div>
                ) : null}

                {result.legacy_partner_role ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_partner_role.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 상세 해설 · {result.legacy_partner_role.sourceTable} · key {result.legacy_partner_role.lookupKey}
                        </p>
                      </div>
                      <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                        {result.legacy_partner_role.scoreLabel}
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      배우자성 {result.legacy_partner_role.spouseRole} · 배우자궁 {result.legacy_partner_role.palaceRole}
                    </p>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_partner_role.text}
                    </p>
                  </div>
                ) : null}

                {result.legacy_marriage_flow ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_marriage_flow.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 상세 해설 · {result.legacy_marriage_flow.sourceTable} · key {result.legacy_marriage_flow.lookupKey} · {result.legacy_marriage_flow.currentMonth}월 기준
                        </p>
                      </div>
                      {typeof result.legacy_marriage_flow.score === "number" ? (
                        <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                          {result.legacy_marriage_flow.scoreLabel} {result.legacy_marriage_flow.score}
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_marriage_flow.text}
                    </p>
                  </div>
                ) : null}

                {result.legacy_spouse_core ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_spouse_core.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 synthetic 해설 · {result.legacy_spouse_core.sourceTable}
                        </p>
                      </div>
                      <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                        {result.legacy_spouse_core.scoreLabel}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-border/80 bg-background/60 p-4 text-sm text-muted-foreground">
                        보이는 {result.legacy_spouse_core.spouseStarLabel}: {result.legacy_spouse_core.visiblePrimaryCount} / {result.legacy_spouse_core.visibleSecondaryCount}
                      </div>
                      <div className="rounded-lg border border-border/80 bg-background/60 p-4 text-sm text-muted-foreground">
                        숨은 {result.legacy_spouse_core.spouseStarLabel}: {result.legacy_spouse_core.hiddenPrimaryCount} / {result.legacy_spouse_core.hiddenSecondaryCount}
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_spouse_core.text}
                    </p>
                  </div>
                ) : null}

                {result.legacy_type_profile ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_type_profile.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 상세 해설 · {result.legacy_type_profile.sourceTable} · key {result.legacy_type_profile.lookupKey}
                        </p>
                      </div>
                      <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                        {result.legacy_type_profile.scoreLabel}
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_type_profile.text}
                    </p>
                  </div>
                ) : null}

                {result.legacy_outer_compatibility ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_outer_compatibility.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 상세 해설 · {result.legacy_outer_compatibility.sourceTable} · key {result.legacy_outer_compatibility.lookupKey}
                        </p>
                      </div>
                      <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                        {result.legacy_outer_compatibility.scoreLabel}
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_outer_compatibility.text}
                    </p>
                  </div>
                ) : null}

                {result.legacy_traditional_compatibility ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_traditional_compatibility.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 상세 해설 · {result.legacy_traditional_compatibility.sourceTable} · key {result.legacy_traditional_compatibility.lookupKey}
                        </p>
                      </div>
                      <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                        {result.legacy_traditional_compatibility.scoreLabel}
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_traditional_compatibility.text}
                    </p>
                  </div>
                ) : null}

                {result.legacy_destiny_core ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_destiny_core.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 상세 해설 · {result.legacy_destiny_core.sourceTable} · key {result.legacy_destiny_core.lookupKey}
                        </p>
                      </div>
                      <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                        {result.legacy_destiny_core.scoreLabel}
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_destiny_core.text}
                    </p>
                  </div>
                ) : null}

                {result.legacy_partner_personality ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{result.legacy_partner_personality.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PHP 레거시 상세 해설 · {result.legacy_partner_personality.sourceTable} · key {result.legacy_partner_personality.lookupKey}
                        </p>
                      </div>
                      <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
                        {result.legacy_partner_personality.scoreLabel}
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {result.legacy_partner_personality.text}
                    </p>
                  </div>
                ) : null}

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
