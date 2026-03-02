"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  CalendarDays,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import { LocationSearch, type LocationResult } from "./location-search"
import { ThemeToggle } from "./theme-toggle"
import { LocaleToggle } from "./locale-toggle"
import { useLocale } from "@/lib/contexts/locale-context"
import { useSaju } from "@/lib/contexts/saju-context"
import type { BirthInfo } from "@/lib/schemas/birth-info"
import type { Locale } from "@/lib/i18n"

// 로케일별 날짜 입력 필드 순서 및 레이블
type DateFieldKey = "year" | "month" | "day"
interface DateFieldConfig {
  field: DateFieldKey
  label: string
  placeholder: string
  maxLength: number
  flex: string
}

const DATE_FIELDS: Record<Locale, DateFieldConfig[]> = {
  ko: [
    { field: "year",  label: "년도", placeholder: "YYYY", maxLength: 4, flex: "flex-[5]" },
    { field: "month", label: "월",   placeholder: "MM",   maxLength: 2, flex: "flex-[3]" },
    { field: "day",   label: "일",   placeholder: "DD",   maxLength: 2, flex: "flex-[3]" },
  ],
  ja: [
    { field: "year",  label: "年", placeholder: "YYYY", maxLength: 4, flex: "flex-[5]" },
    { field: "month", label: "月", placeholder: "MM",   maxLength: 2, flex: "flex-[3]" },
    { field: "day",   label: "日", placeholder: "DD",   maxLength: 2, flex: "flex-[3]" },
  ],
  en: [
    { field: "month", label: "Month", placeholder: "MM",   maxLength: 2, flex: "flex-[3]" },
    { field: "day",   label: "Day",   placeholder: "DD",   maxLength: 2, flex: "flex-[3]" },
    { field: "year",  label: "Year",  placeholder: "YYYY", maxLength: 4, flex: "flex-[5]" },
  ],
}

/* Stagger helper — returns inline animation style with delay */
function stagger(index: number, baseDelay = 0.1) {
  return {
    animation: `fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + index * 0.08}s both`,
  } as const
}

export function OnboardingScreen() {
  const router = useRouter()
  const { setBirthInfo } = useSaju()
  const { locale, t } = useLocale()
  const msg = t.onboarding
  const common = t.common

  const [step, setStep] = useState(0)
  const [gender, setGender] = useState<"M" | "F" | "">("")
  const [location, setLocation] = useState<LocationResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 분리 날짜 입력 상태
  const [dateParts, setDateParts] = useState({ year: "", month: "", day: "" })
  const fieldRefs: Record<DateFieldKey, React.RefObject<HTMLInputElement | null>> = {
    year:  useRef<HTMLInputElement>(null),
    month: useRef<HTMLInputElement>(null),
    day:   useRef<HTMLInputElement>(null),
  }

  const dateFields = DATE_FIELDS[locale]

  // 연/월/일 → YYYY-MM-DD 조합 (완성된 경우만 반환)
  function assembleDateValue(parts: typeof dateParts): string {
    const { year, month, day } = parts
    if (year.length === 4 && month.length >= 1 && day.length >= 1) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }
    return ""
  }

  const step0Schema = z.object({
    birthDate: z
      .string()
      .min(1, msg.dateRequired)
      .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), msg.dateInvalid)
      .refine((v) => new Date(v) <= new Date(), msg.dateFuture)
      .refine((v) => new Date(v).getFullYear() >= 1900, msg.dateTooOld),
    birthTime: z.string().optional(),
    isTimeUnknown: z.boolean(),
  })

  type Step0Values = z.infer<typeof step0Schema>

  const {
    register,
    control,
    watch,
    trigger,
    getValues,
    setValue,
    setError,
    formState: { errors },
  } = useForm<Step0Values>({
    resolver: zodResolver(step0Schema),
    defaultValues: { birthDate: "", birthTime: "", isTimeUnknown: false },
  })

  const isTimeUnknown = watch("isTimeUnknown")

  // 날짜 입력 핸들러 — 숫자만 허용, 완성 시 다음 필드로 포커스 이동
  function handleDatePartChange(field: DateFieldKey, raw: string) {
    const digits = raw.replace(/\D/g, "")
    const maxLen = field === "year" ? 4 : 2
    const value = digits.slice(0, maxLen)
    const next = { ...dateParts, [field]: value }
    setDateParts(next)
    setValue("birthDate", assembleDateValue(next), { shouldValidate: false })

    // 자동 포커스 이동: 현재 필드가 꽉 찼을 때 다음 필드로
    if (value.length === maxLen) {
      const currentIndex = dateFields.findIndex((f) => f.field === field)
      const nextField = dateFields[currentIndex + 1]
      if (nextField) fieldRefs[nextField.field].current?.focus()
    }
  }

  const handleStep0Next = async () => {
    const valid = await trigger("birthDate")
    if (!valid) return
    if (!isTimeUnknown && !getValues("birthTime")) {
      setError("birthTime", {
        message: "출생시간을 입력하거나 '모르겠어요'를 선택해주세요",
      })
      return
    }
    setStep(1)
  }

  const canProceedStep1 = location !== null && gender !== ""

  const handleComplete = async () => {
    if (!canProceedStep1 || !location || !gender) return
    const { birthDate, birthTime, isTimeUnknown: timeUnknown } = getValues()
    const info: BirthInfo = {
      birthDate,
      birthTime: timeUnknown ? null : birthTime || null,
      isTimeUnknown: timeUnknown,
      timezone: location.timezone,
      gender,
      latitude: location.lat,
      longitude: location.lng,
      locationName: location.name,
    }
    setIsSubmitting(true)
    await setBirthInfo(info)
    router.push("/today")
  }

  return (
    <main className="relative flex min-h-svh flex-col bg-background">
      {/* Ambient warm glow — adds depth without being decorative */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 50% at 50% 0%, var(--gradient-warm), transparent)",
        }}
      />

      {/* Top-right controls */}
      <div className="fixed right-5 top-5 z-40 flex items-center gap-2">
        <LocaleToggle />
        <ThemeToggle />
      </div>

      {/* Centered content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 sm:py-20">
        <div className="w-full max-w-[26rem]">
          {/* ─── Brand masthead ─── */}
          <header
            className="mb-16 text-center"
            style={{
              animation:
                "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
            }}
          >
            <div
              className="mx-auto mb-6 h-px w-10 origin-center bg-foreground/15"
              style={{
                animation:
                  "line-grow 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both",
              }}
            />
            <h1 className="font-serif text-[1.75rem] font-bold tracking-tight text-foreground sm:text-[2rem]">
              {msg.brand}
            </h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {msg.tagline}
            </p>
          </header>

          {/* ─── Progress bar ─── */}
          <div
            className="mb-12"
            style={{
              animation:
                "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both",
            }}
          >
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground/70">
                {step === 0 ? msg.step1Label : msg.step2Label}
              </span>
              <span className="text-[11px] font-medium tabular-nums text-muted-foreground/50">
                {step + 1} / 2
              </span>
            </div>
            <div className="h-[1.5px] w-full overflow-hidden rounded-full bg-border/50">
              <div
                className="h-full rounded-full bg-foreground/40 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: step === 0 ? "50%" : "100%" }}
              />
            </div>
          </div>

          {/* ─── Step 0: Birth date & time ─── */}
          {step === 0 && (
            <div className="space-y-8" key="step-0">
              {/* Heading */}
              <div style={stagger(0)}>
                <h2 className="font-serif text-xl font-medium leading-snug text-foreground">
                  {msg.whenBorn}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {msg.whenBornDesc}
                </p>
              </div>

              {/* Birth date — 로케일 순서로 렌더링되는 분리 입력 */}
              <div className="space-y-2.5" style={stagger(1)}>
                <Label className="flex items-center gap-2 text-[13px] font-medium text-foreground/80">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60" />
                  {msg.birthDate}
                </Label>
                <div className="flex gap-2">
                  {dateFields.map((cfg) => (
                    <div key={cfg.field} className={`${cfg.flex} space-y-1`}>
                      <span className="block text-[11px] text-muted-foreground/60">
                        {cfg.label}
                      </span>
                      <input
                        ref={fieldRefs[cfg.field]}
                        inputMode="numeric"
                        placeholder={cfg.placeholder}
                        maxLength={cfg.maxLength}
                        value={dateParts[cfg.field]}
                        onChange={(e) => handleDatePartChange(cfg.field, e.target.value)}
                        className={`h-14 w-full rounded-xl border bg-card px-3 text-center text-base font-medium tracking-widest text-foreground shadow-sm shadow-black/[0.03] outline-none transition-shadow focus:shadow-md focus:shadow-black/[0.06] focus:ring-1 focus:ring-foreground/20 ${
                          errors.birthDate ? "border-destructive" : "border-border/60"
                        }`}
                      />
                    </div>
                  ))}
                </div>
                {errors.birthDate && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.birthDate.message}
                  </div>
                )}
              </div>

              {/* Birth time */}
              <div className="space-y-2.5" style={stagger(2)}>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="birthtime"
                    className="flex items-center gap-2 text-[13px] font-medium text-foreground/80"
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                    {msg.birthTime}
                  </Label>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-muted-foreground/60">
                      {isTimeUnknown ? msg.timeUnknown : msg.timeKnown}
                    </span>
                    <Controller
                      control={control}
                      name="isTimeUnknown"
                      render={({ field }) => (
                        <Switch
                          checked={!field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(!checked)
                          }
                          aria-label={msg.timeKnown}
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
                    className="h-14 rounded-xl border-border/60 bg-card text-foreground shadow-sm shadow-black/[0.03] transition-shadow focus:shadow-md focus:shadow-black/[0.06]"
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-border/40 bg-secondary/20 px-5 py-4">
                    <p className="text-sm leading-relaxed text-muted-foreground/70">
                      {msg.timeUnknownMsg}
                    </p>
                  </div>
                )}
                {errors.birthTime && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.birthTime.message}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div style={stagger(3)}>
                <Button
                  onClick={handleStep0Next}
                  disabled={!watch("birthDate") || (!isTimeUnknown && !watch("birthTime"))}
                  className="h-14 w-full rounded-xl bg-foreground font-medium text-background transition-all hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground"
                >
                  {common.next}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── Step 1: Gender & Location ─── */}
          {step === 1 && (
            <div className="space-y-8" key="step-1">
              {/* Heading */}
              <div style={stagger(0)}>
                <h2 className="font-serif text-xl font-medium leading-snug text-foreground">
                  {msg.tellMore}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {msg.tellMoreDesc}
                </p>
              </div>

              {/* Gender */}
              <div className="space-y-3" style={stagger(1)}>
                <Label className="text-[13px] font-medium text-foreground/80">
                  {msg.gender}
                </Label>
                <div className="flex gap-3">
                  {(
                    [
                      { value: "M" as const, label: msg.male },
                      { value: "F" as const, label: msg.female },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGender(option.value)}
                      className={`flex-1 rounded-xl border-[1.5px] px-4 py-4 text-sm font-medium transition-all duration-200 ${
                        gender === option.value
                          ? "border-foreground/80 bg-foreground text-background shadow-sm"
                          : "border-border/60 bg-card text-foreground/70 shadow-sm shadow-black/[0.02] hover:border-border hover:text-foreground"
                      }`}
                      type="button"
                      aria-pressed={gender === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3" style={stagger(2)}>
                <Label className="text-[13px] font-medium text-foreground/80">
                  {msg.birthPlace}
                </Label>
                <LocationSearch value={location} onChange={setLocation} />
                {location && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                    <Clock className="h-3 w-3" />
                    {msg.timezone}: {location.timezone} (UTC
                    {location.utcOffset})
                    {location.utcOffset !== "+09:00" && (
                      <span className="text-accent/80">
                        {" "}
                        / {msg.dstNote}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* CTAs */}
              <div className="flex gap-3" style={stagger(3)}>
                <Button
                  variant="ghost"
                  onClick={() => setStep(0)}
                  disabled={isSubmitting}
                  className="h-14 flex-1 rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  {common.back}
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!canProceedStep1 || isSubmitting}
                  className="h-14 flex-[2.5] rounded-xl bg-foreground font-medium text-background transition-all hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {common.analyzing}
                    </>
                  ) : (
                    common.start
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
