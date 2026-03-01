"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CalendarDays, Clock, Sparkles, AlertCircle, Loader2 } from "lucide-react"
import { LocationSearch, type LocationResult } from "./location-search"
import { ThemeToggle } from "./theme-toggle"
import type { BirthInfo } from "@/lib/schemas/birth-info"

interface OnboardingScreenProps {
  onComplete: (birthInfo: BirthInfo) => void | Promise<void>
}

const step0Schema = z.object({
  birthDate: z
    .string()
    .min(1, "날짜를 입력해주세요")
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "올바른 날짜를 입력해주세요")
    .refine((v) => new Date(v) <= new Date(), "미래 날짜는 입력할 수 없어요")
    .refine((v) => new Date(v).getFullYear() >= 1900, "1900년 이후 날짜를 입력해주세요"),
  birthTime: z.string().optional(),
  isTimeUnknown: z.boolean(),
})

type Step0Values = z.infer<typeof step0Schema>

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0)
  const [gender, setGender] = useState<"M" | "F" | "">("")
  const [location, setLocation] = useState<LocationResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    control,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<Step0Values>({
    resolver: zodResolver(step0Schema),
    defaultValues: { birthDate: "", birthTime: "", isTimeUnknown: false },
  })

  const isTimeUnknown = watch("isTimeUnknown")

  const handleStep0Next = async () => {
    const valid = await trigger("birthDate")
    if (valid) setStep(1)
  }

  const canProceedStep1 = location !== null && gender !== ""

  const handleComplete = async () => {
    if (!canProceedStep1 || !location || !gender) return
    const { birthDate, birthTime, isTimeUnknown } = getValues()
    const info: BirthInfo = {
      birthDate,
      birthTime: isTimeUnknown ? null : (birthTime || null),
      isTimeUnknown,
      timezone: location.timezone,
      gender,
      latitude: location.lat,
      longitude: location.lng,
      locationName: location.name,
    }
    setIsSubmitting(true)
    await onComplete(info)
    setIsSubmitting(false)
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12">
      {/* Theme toggle - top right */}
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <div className="mx-auto w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            사주 플레이북
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            오늘을 잘 쓰는 방법을 알려드릴게요
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-10 flex items-center justify-center gap-2">
          <div
            className={`h-1.5 w-12 rounded-full transition-colors ${
              step >= 0 ? "bg-primary" : "bg-border"
            }`}
          />
          <div
            className={`h-1.5 w-12 rounded-full transition-colors ${
              step >= 1 ? "bg-primary" : "bg-border"
            }`}
          />
        </div>

        {step === 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="font-serif text-lg font-medium text-foreground">
                언제 태어나셨나요?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                정확한 생년월일이 기운을 읽는 데 큰 도움이 됩니다
              </p>
            </div>

            {/* Birth date */}
            <div className="space-y-2">
              <Label
                htmlFor="birthdate"
                className="flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                생년월일
              </Label>
              <Input
                {...register("birthDate")}
                id="birthdate"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                min="1900-01-01"
                className={`h-12 rounded-lg border-border bg-card text-foreground ${
                  errors.birthDate ? "border-destructive" : ""
                }`}
              />
              {errors.birthDate && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.birthDate.message}
                </div>
              )}
            </div>

            {/* Birth time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="birthtime"
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  출생 시간
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {isTimeUnknown ? "모르겠어요" : "알고 있어요"}
                  </span>
                  <Controller
                    control={control}
                    name="isTimeUnknown"
                    render={({ field }) => (
                      <Switch
                        checked={!field.value}
                        onCheckedChange={(checked) => field.onChange(!checked)}
                        aria-label="출생 시간 알고 있음"
                      />
                    )}
                  />
                </div>
              </div>
              {!isTimeUnknown ? (
                <Input
                  {...register("birthTime")}
                  id="birthtime"
                  type="time"
                  className="h-12 rounded-lg border-border bg-card text-foreground"
                />
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-secondary/50 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    괜찮아요. 시간 없이도 읽을 수 있는 것들이 있어요.
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleStep0Next}
              disabled={!watch("birthDate")}
              className="h-12 w-full rounded-lg bg-primary font-medium text-primary-foreground"
            >
              다음
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="font-serif text-lg font-medium text-foreground">
                조금만 더 알려주세요
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                태어난 곳의 기운도 함께 읽습니다
              </p>
            </div>

            {/* Gender — mapped to BirthInfoSchema values */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">성별</Label>
              <div className="flex gap-3">
                {(
                  [
                    { value: "M" as const, label: "남성" },
                    { value: "F" as const, label: "여성" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setGender(option.value)}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                      gender === option.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-secondary"
                    }`}
                    type="button"
                    aria-pressed={gender === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location - global search */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                태어난 장소
              </Label>
              <LocationSearch value={location} onChange={setLocation} />
              {location && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  시간대: {location.timezone} (UTC{location.utcOffset})
                  {location.utcOffset !== "+09:00" && (
                    <span className="text-accent">
                      {" "}
                      / 서머타임 자동 반영
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(0)}
                className="h-12 flex-1 rounded-lg border-border text-foreground"
              >
                이전
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!canProceedStep1 || isSubmitting}
                className="h-12 flex-[2] rounded-lg bg-primary font-medium text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  "시작하기"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
