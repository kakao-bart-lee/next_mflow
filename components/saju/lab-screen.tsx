"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { useFortune } from "@/lib/contexts/fortune-context"
import type { FortuneResponse } from "@/lib/saju-core"
import type { AstrologyStaticResult } from "@/lib/astrology/static/types"
import type {
  AccidentalScoreResponse,
  AspectsResponse,
  ChartCoreResponse,
  EssentialScoreResponse,
  HellenisticCoreResponse,
  VedicCoreResponse,
  VimshottariResponse,
} from "@/lib/astrology/types"
import type {
  ZiweiBoardResponse,
  ZiweiRuntimeOverlayResponse,
} from "@/lib/ziwei/types"
import type { BirthInfo } from "@/lib/schemas/birth-info"
import { inferInputTier } from "@/lib/astrology/shared/input-normalization"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  LocationSearch,
  type LocationResult,
} from "@/components/saju/location-search"

type SectionStatus = "idle" | "loading" | "success" | "error"

interface SectionState<T> {
  status: SectionStatus
  data: T | null
  error: string | null
}

interface RequestDebugState {
  request: unknown
  response: unknown
  status: number
}

const sectionState = <T,>(): SectionState<T> => ({
  status: "idle",
  data: null,
  error: null,
})

interface BirthInfoDraft {
  birthDate: string
  birthTime: string
  isTimeUnknown: boolean
  gender: "M" | "F"
  locationName: string
  timezone: string
  latitude: string
  longitude: string
}

function draftFromBirthInfo(info: BirthInfo | null): BirthInfoDraft {
  return {
    birthDate: info?.birthDate ?? "",
    birthTime: info?.birthTime ?? "",
    isTimeUnknown: info?.isTimeUnknown ?? false,
    gender: info?.gender ?? "M",
    locationName: info?.locationName ?? "",
    timezone: info?.timezone ?? "Asia/Seoul",
    latitude:
      typeof info?.latitude === "number" ? String(info.latitude) : "",
    longitude:
      typeof info?.longitude === "number" ? String(info.longitude) : "",
  }
}

function locationFromBirthInfo(info: BirthInfo | null): LocationResult | null {
  if (
    !info?.locationName ||
    !info.timezone ||
    typeof info.latitude !== "number" ||
    typeof info.longitude !== "number"
  ) {
    return null
  }
  return {
    id: `lab-${info.timezone}-${info.latitude}-${info.longitude}`,
    name: info.locationName,
    region: info.locationName,
    country: "",
    timezone: info.timezone,
    utcOffset: "",
    lat: info.latitude,
    lng: info.longitude,
  }
}

function parseBirthInfoDraft(
  draft: BirthInfoDraft,
): { ok: true; value: BirthInfo } | { ok: false; error: string } {
  const birthDate = draft.birthDate.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return { ok: false, error: "생년월일은 YYYY-MM-DD 형식이어야 합니다." }
  }

  const timezone = draft.timezone.trim()
  if (!timezone) {
    return { ok: false, error: "시간대를 입력해 주세요. 예: Asia/Seoul" }
  }

  const birthTime = draft.birthTime.trim()
  if (!draft.isTimeUnknown && !/^\d{2}:\d{2}$/.test(birthTime)) {
    return { ok: false, error: "출생시간은 HH:mm 형식이어야 합니다." }
  }

  const latitudeRaw = draft.latitude.trim()
  const longitudeRaw = draft.longitude.trim()
  const latitude =
    latitudeRaw.length > 0 ? Number(latitudeRaw) : undefined
  const longitude =
    longitudeRaw.length > 0 ? Number(longitudeRaw) : undefined

  if (latitudeRaw.length > 0 && !Number.isFinite(latitude)) {
    return { ok: false, error: "위도는 숫자여야 합니다." }
  }
  if (longitudeRaw.length > 0 && !Number.isFinite(longitude)) {
    return { ok: false, error: "경도는 숫자여야 합니다." }
  }
  if (typeof latitude === "number" && (latitude < -90 || latitude > 90)) {
    return { ok: false, error: "위도 범위는 -90 ~ 90 입니다." }
  }
  if (
    typeof longitude === "number" &&
    (longitude < -180 || longitude > 180)
  ) {
    return { ok: false, error: "경도 범위는 -180 ~ 180 입니다." }
  }

  return {
    ok: true,
    value: {
      birthDate,
      birthTime: draft.isTimeUnknown ? null : birthTime,
      isTimeUnknown: draft.isTimeUnknown,
      timezone,
      gender: draft.gender,
      locationName: draft.locationName.trim() || undefined,
      latitude,
      longitude,
    },
  }
}

function getTopScoreLabel(
  scores?: Record<string, { score: number }>,
): string | null {
  if (!scores) return null
  const entries = Object.entries(scores)
  if (entries.length === 0) return null
  const [planet, info] = entries.reduce((prev, curr) =>
    curr[1].score > prev[1].score ? curr : prev,
  )
  return `${planet} (${Math.round(info.score * 10) / 10})`
}

function getCurrentGreatFortuneLabel(greatFortune: unknown): string {
  if (!greatFortune || typeof greatFortune !== "object") return "-"
  const current = (greatFortune as { current_period?: unknown }).current_period
  if (!current) return "-"
  if (typeof current === "string") return current
  if (typeof current !== "object") return "-"

  const period = current as {
    heavenly_stem?: unknown
    earthly_branch?: unknown
    sipsin?: unknown
    age_range?: unknown
    start_age?: unknown
    end_age?: unknown
  }

  const stem = typeof period.heavenly_stem === "string" ? period.heavenly_stem : ""
  const branch =
    typeof period.earthly_branch === "string" ? period.earthly_branch : ""
  const sipsin = typeof period.sipsin === "string" ? period.sipsin : ""
  const ageRange =
    typeof period.age_range === "string"
      ? period.age_range
      : typeof period.start_age === "number" && typeof period.end_age === "number"
        ? `${period.start_age}~${period.end_age}세`
        : ""

  const main = `${stem}${branch}`.trim()
  const tokens = [main, sipsin, ageRange].filter((v) => v.length > 0)
  return tokens.length > 0 ? tokens.join(" · ") : "-"
}

function formatErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback
  const err = (payload as { error?: unknown }).error
  if (typeof err === "string" && err.trim().length > 0) return err
  return fallback
}

function mapLabError(message: string, inputTier: string | null): string {
  if (message.includes("Western accidental score requires input tier L2 or L3")) {
    return `Accidental Score는 입력 티어 L2/L3가 필요합니다 (현재 ${inputTier ?? "L0"}). 장소(위도/경도)를 입력해 주세요.`
  }
  if (message.includes("비묘타리 응답 필드가 누락되었습니다")) {
    return "Vimshottari 응답 필드가 일부 누락되었습니다. 외부 API 스키마 변형 가능성이 있어 raw JSON을 확인해 주세요."
  }
  return message
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(formatErrorMessage(payload, `호출 실패 (${res.status})`))
  }

  return (await res.json()) as T
}

function StatusBadge({ status }: { status: SectionStatus }) {
  if (status === "success") return <Badge>Loaded</Badge>
  if (status === "loading") return <Badge variant="secondary">Loading</Badge>
  if (status === "error") return <Badge variant="destructive">Error</Badge>
  return <Badge variant="outline">Idle</Badge>
}

function SectionCard({
  title,
  description,
  detail,
  status,
  summary,
  error,
  jsonData,
  action,
}: {
  title: string
  description: string
  detail?: string
  status: SectionStatus
  summary: ReactNode
  error?: string | null
  jsonData?: unknown
  action?: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          {detail && <p className="mt-1 text-[11px] text-muted-foreground/80">{detail}</p>}
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-3 text-sm text-foreground/90">{summary}</div>

      {error && (
        <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {action && <div className="mt-3">{action}</div>}

      {Boolean(jsonData) && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-primary">
            Raw JSON 보기
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-border/30 bg-muted/30 p-3 text-[11px] leading-relaxed text-foreground/90">
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        </details>
      )}
    </section>
  )
}

function BirthInfoEditor({
  birthInfo,
  inputTier,
  onApply,
}: {
  birthInfo: BirthInfo | null
  inputTier: string | null
  onApply: (info: BirthInfo) => Promise<void>
}) {
  const [draft, setDraft] = useState<BirthInfoDraft>(() =>
    draftFromBirthInfo(birthInfo),
  )
  const [locationValue, setLocationValue] = useState<LocationResult | null>(() =>
    locationFromBirthInfo(birthInfo),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    setDraft(draftFromBirthInfo(birthInfo))
    setLocationValue(locationFromBirthInfo(birthInfo))
  }, [birthInfo])

  const updateDraft = useCallback(
    <K extends keyof BirthInfoDraft>(key: K, value: BirthInfoDraft[K]) => {
      setDraft((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const handleReset = useCallback(() => {
    setDraft(draftFromBirthInfo(birthInfo))
    setLocationValue(locationFromBirthInfo(birthInfo))
    setSaveError(null)
    setSaveMessage(null)
  }, [birthInfo])

  const handleLocationChange = useCallback((location: LocationResult) => {
    setLocationValue(location)
    setDraft((prev) => ({
      ...prev,
      locationName: location.name,
      timezone: location.timezone,
      latitude: String(location.lat),
      longitude: String(location.lng),
    }))
  }, [])

  const handleSave = useCallback(async () => {
    const parsed = parseBirthInfoDraft(draft)
    if (!parsed.ok) {
      setSaveError(parsed.error)
      setSaveMessage(null)
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveMessage(null)
    try {
      await onApply(parsed.value)
      setSaveMessage("기준 정보가 저장되었고 결과를 다시 계산했습니다.")
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.",
      )
    } finally {
      setIsSaving(false)
    }
  }, [draft, onApply])

  return (
    <section className="relative z-20 mb-4 rounded-2xl border border-border/40 bg-card/30 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">기준 출생정보</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Lab의 모든 호출은 이 값을 기준으로 실행됩니다. 성별은 사주 계산에 반영됩니다.
          </p>
        </div>
        <Badge variant="secondary">입력 티어: {inputTier ?? "L0"}</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border/40 bg-card/30 p-3">
          <p className="mb-3 text-xs font-medium text-muted-foreground">기본 출생정보</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lab-birth-date">생년월일</Label>
              <Input
                id="lab-birth-date"
                type="date"
                value={draft.birthDate}
                onChange={(e) => updateDraft("birthDate", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lab-birth-time">출생시간</Label>
              <Input
                id="lab-birth-time"
                type="time"
                value={draft.birthTime}
                onChange={(e) => updateDraft("birthTime", e.target.value)}
                disabled={draft.isTimeUnknown}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lab-time-unknown">시간 미상</Label>
              <div className="flex h-9 items-center gap-2 rounded-md border border-border/50 px-3">
                <Switch
                  id="lab-time-unknown"
                  checked={draft.isTimeUnknown}
                  onCheckedChange={(checked) => updateDraft("isTimeUnknown", checked)}
                />
                <span className="text-xs text-muted-foreground">모름</span>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>성별</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={draft.gender === "M" ? "default" : "outline"}
                  onClick={() => updateDraft("gender", "M")}
                >
                  남성
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={draft.gender === "F" ? "default" : "outline"}
                  onClick={() => updateDraft("gender", "F")}
                >
                  여성
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/30 p-3">
          <p className="mb-3 text-xs font-medium text-muted-foreground">태어난 장소 정보</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative z-[70] space-y-1.5 sm:col-span-2">
              <Label>태어난 장소</Label>
              <LocationSearch value={locationValue} onChange={handleLocationChange} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lab-timezone">시간대 (IANA)</Label>
              <Input
                id="lab-timezone"
                value={draft.timezone}
                onChange={(e) => updateDraft("timezone", e.target.value)}
                placeholder="Asia/Seoul"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lab-latitude">위도</Label>
              <Input
                id="lab-latitude"
                value={draft.latitude}
                onChange={(e) => updateDraft("latitude", e.target.value)}
                placeholder="37.5665"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lab-longitude">경도</Label>
              <Input
                id="lab-longitude"
                value={draft.longitude}
                onChange={(e) => updateDraft("longitude", e.target.value)}
                placeholder="126.9780"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            "저장하고 재분석"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleReset}
          disabled={isSaving}
        >
          되돌리기
        </Button>
      </div>

      {saveError && (
        <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
          {saveError}
        </p>
      )}
      {saveMessage && (
        <p className="mt-2 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-2 text-xs text-primary">
          {saveMessage}
        </p>
      )}
    </section>
  )
}

export function LabScreen() {
  const {
    birthInfo,
    setBirthInfo,
    error: fortuneError,
    isLoading,
    sajuResult,
    astrologyResult,
    chartCore,
    aspects,
    vedicCore,
  } = useFortune()

  const [essential, setEssential] = useState<SectionState<EssentialScoreResponse>>(
    sectionState(),
  )
  const [sajuManual, setSajuManual] = useState<SectionState<FortuneResponse>>(
    sectionState(),
  )
  const [astrologyManual, setAstrologyManual] = useState<
    SectionState<AstrologyStaticResult>
  >(sectionState())
  const [chartCoreManual, setChartCoreManual] = useState<
    SectionState<ChartCoreResponse>
  >(sectionState())
  const [aspectsManual, setAspectsManual] = useState<SectionState<AspectsResponse>>(
    sectionState(),
  )
  const [vedicCoreManual, setVedicCoreManual] = useState<
    SectionState<VedicCoreResponse>
  >(sectionState())
  const [accidental, setAccidental] = useState<
    SectionState<AccidentalScoreResponse>
  >(sectionState())
  const [hellenistic, setHellenistic] = useState<
    SectionState<HellenisticCoreResponse>
  >(sectionState())
  const [vimshottari, setVimshottari] = useState<SectionState<VimshottariResponse>>(
    sectionState(),
  )
  const [vimshottariDebug, setVimshottariDebug] = useState<RequestDebugState | null>(
    null,
  )
  const [ziweiBoard, setZiweiBoard] = useState<SectionState<ZiweiBoardResponse>>(
    sectionState(),
  )
  const [ziweiOverlay, setZiweiOverlay] = useState<
    SectionState<ZiweiRuntimeOverlayResponse>
  >(sectionState())
  const inputTier = useMemo(
    () => (birthInfo ? inferInputTier(birthInfo) : null),
    [birthInfo],
  )

  const setNoBirthInfoError = useCallback(
    <T,>(setter: (next: SectionState<T>) => void) => {
      setter({
        status: "error",
        data: null,
        error: "출생정보가 필요합니다. 먼저 온보딩을 완료해 주세요.",
      })
    },
    [],
  )

  const fetchEssential = useCallback(async () => {
    if (!birthInfo) return setNoBirthInfoError(setEssential)
    setEssential((prev) => ({ ...prev, status: "loading", error: null }))
    try {
      const data = await postJson<EssentialScoreResponse>(
        "/api/astrology/essential-score",
        birthInfo,
      )
      setEssential({ status: "success", data, error: null })
    } catch (err) {
      setEssential({
        status: "error",
        data: null,
        error: err instanceof Error ? err.message : "essential-score 호출 실패",
      })
    }
  }, [birthInfo, setNoBirthInfoError])

  const fetchSajuConnected = useCallback(async () => {
    if (!birthInfo) return setNoBirthInfoError(setSajuManual)
    setSajuManual((prev) => ({ ...prev, status: "loading", error: null }))
    try {
      const data = await postJson<FortuneResponse>("/api/saju/analyze", birthInfo)
      setSajuManual({ status: "success", data, error: null })
    } catch (err) {
      setSajuManual({
        status: "error",
        data: null,
        error: err instanceof Error ? err.message : "saju/analyze 호출 실패",
      })
    }
  }, [birthInfo, setNoBirthInfoError])

  const fetchAstrologyConnected = useCallback(async () => {
    if (!birthInfo) return setNoBirthInfoError(setAstrologyManual)
    setAstrologyManual((prev) => ({ ...prev, status: "loading", error: null }))
    try {
      const data = await postJson<AstrologyStaticResult>("/api/astrology/static", birthInfo)
      setAstrologyManual({ status: "success", data, error: null })
    } catch (err) {
      setAstrologyManual({
        status: "error",
        data: null,
        error: err instanceof Error ? err.message : "astrology/static 호출 실패",
      })
    }
  }, [birthInfo, setNoBirthInfoError])

  const fetchChartCoreConnected = useCallback(async () => {
    if (!birthInfo) return setNoBirthInfoError(setChartCoreManual)
    setChartCoreManual((prev) => ({ ...prev, status: "loading", error: null }))
    try {
      const data = await postJson<ChartCoreResponse>("/api/astrology/chart-core", birthInfo)
      setChartCoreManual({ status: "success", data, error: null })
    } catch (err) {
      setChartCoreManual({
        status: "error",
        data: null,
        error: err instanceof Error ? err.message : "astrology/chart-core 호출 실패",
      })
    }
  }, [birthInfo, setNoBirthInfoError])

  const fetchAspectsConnected = useCallback(async () => {
    if (!birthInfo) return setNoBirthInfoError(setAspectsManual)
    setAspectsManual((prev) => ({ ...prev, status: "loading", error: null }))
    try {
      const data = await postJson<AspectsResponse>("/api/astrology/aspects", birthInfo)
      setAspectsManual({ status: "success", data, error: null })
    } catch (err) {
      setAspectsManual({
        status: "error",
        data: null,
        error: err instanceof Error ? err.message : "astrology/aspects 호출 실패",
      })
    }
  }, [birthInfo, setNoBirthInfoError])

  const fetchVedicCoreConnected = useCallback(async () => {
    if (!birthInfo) return setNoBirthInfoError(setVedicCoreManual)
    setVedicCoreManual((prev) => ({ ...prev, status: "loading", error: null }))
    try {
      const data = await postJson<VedicCoreResponse>("/api/astrology/vedic-core", birthInfo)
      setVedicCoreManual({ status: "success", data, error: null })
    } catch (err) {
      setVedicCoreManual({
        status: "error",
        data: null,
        error: err instanceof Error ? err.message : "astrology/vedic-core 호출 실패",
      })
    }
  }, [birthInfo, setNoBirthInfoError])

  const fetchAllConnected = useCallback(async () => {
    await Promise.all([
      fetchSajuConnected(),
      fetchAstrologyConnected(),
      fetchChartCoreConnected(),
      fetchAspectsConnected(),
      fetchVedicCoreConnected(),
    ])
  }, [
    fetchAspectsConnected,
    fetchAstrologyConnected,
    fetchChartCoreConnected,
    fetchSajuConnected,
    fetchVedicCoreConnected,
  ])

  const fetchAccidental = useCallback(async () => {
    if (!birthInfo) return setNoBirthInfoError(setAccidental)
    setAccidental((prev) => ({ ...prev, status: "loading", error: null }))
    try {
      const data = await postJson<AccidentalScoreResponse>(
        "/api/astrology/accidental-score",
        birthInfo,
      )
      setAccidental({ status: "success", data, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : "accidental-score 호출 실패"
      setAccidental({
        status: "error",
        data: null,
        error: mapLabError(message, inputTier),
      })
    }
  }, [birthInfo, inputTier, setNoBirthInfoError])

  const fetchHellenistic = useCallback(async () => {
    if (!birthInfo) return setNoBirthInfoError(setHellenistic)
    setHellenistic((prev) => ({ ...prev, status: "loading", error: null }))
    try {
      const data = await postJson<HellenisticCoreResponse>(
        "/api/astrology/hellenistic-core",
        birthInfo,
      )
      setHellenistic({ status: "success", data, error: null })
    } catch (err) {
      setHellenistic({
        status: "error",
        data: null,
        error: err instanceof Error ? err.message : "hellenistic-core 호출 실패",
      })
    }
  }, [birthInfo, setNoBirthInfoError])

  const fetchVimshottari = useCallback(async () => {
    if (!birthInfo) return setNoBirthInfoError(setVimshottari)
    setVimshottariDebug(null)
    setVimshottari((prev) => ({ ...prev, status: "loading", error: null }))
    const requestBody = JSON.parse(JSON.stringify(birthInfo)) as BirthInfo
    try {
      const res = await fetch("/api/astrology/vimshottari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(birthInfo),
      })
      const rawText = await res.text()
      let payload: unknown = null
      if (rawText.trim().length > 0) {
        try {
          payload = JSON.parse(rawText)
        } catch {
          payload = rawText
        }
      }

      if (!res.ok) {
        setVimshottariDebug({
          request: requestBody,
          response: payload,
          status: res.status,
        })
        throw new Error(formatErrorMessage(payload, `호출 실패 (${res.status})`))
      }

      const data = payload as VimshottariResponse
      setVimshottari({ status: "success", data, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : "vimshottari 호출 실패"
      setVimshottari({
        status: "error",
        data: null,
        error: mapLabError(message, inputTier),
      })
    }
  }, [birthInfo, inputTier, setNoBirthInfoError])

  const fetchZiweiBoard = useCallback(async () => {
    if (!birthInfo) return setNoBirthInfoError(setZiweiBoard)
    setZiweiBoard((prev) => ({ ...prev, status: "loading", error: null }))
    try {
      const data = await postJson<ZiweiBoardResponse>("/api/ziwei/board", birthInfo)
      setZiweiBoard({ status: "success", data, error: null })
    } catch (err) {
      setZiweiBoard({
        status: "error",
        data: null,
        error: err instanceof Error ? err.message : "ziwei/board 호출 실패",
      })
    }
  }, [birthInfo, setNoBirthInfoError])

  const fetchZiweiOverlay = useCallback(async () => {
    if (!birthInfo) return setNoBirthInfoError(setZiweiOverlay)
    setZiweiOverlay((prev) => ({ ...prev, status: "loading", error: null }))
    try {
      const today = new Date().toISOString().slice(0, 10)
      const data = await postJson<ZiweiRuntimeOverlayResponse>(
        "/api/ziwei/runtime-overlay",
        { ...birthInfo, targetDate: today },
      )
      setZiweiOverlay({ status: "success", data, error: null })
    } catch (err) {
      setZiweiOverlay({
        status: "error",
        data: null,
        error:
          err instanceof Error ? err.message : "ziwei/runtime-overlay 호출 실패",
      })
    }
  }, [birthInfo, setNoBirthInfoError])

  const fetchAllExtended = useCallback(async () => {
    await Promise.all([
      fetchEssential(),
      fetchAccidental(),
      fetchHellenistic(),
      fetchVimshottari(),
      fetchZiweiBoard(),
      fetchZiweiOverlay(),
    ])
  }, [
    fetchAccidental,
    fetchEssential,
    fetchHellenistic,
    fetchVimshottari,
    fetchZiweiBoard,
    fetchZiweiOverlay,
  ])

  const resetExtended = useCallback(() => {
    setSajuManual(sectionState())
    setAstrologyManual(sectionState())
    setChartCoreManual(sectionState())
    setAspectsManual(sectionState())
    setVedicCoreManual(sectionState())
    setEssential(sectionState())
    setAccidental(sectionState())
    setHellenistic(sectionState())
    setVimshottari(sectionState())
    setVimshottariDebug(null)
    setZiweiBoard(sectionState())
    setZiweiOverlay(sectionState())
  }, [])

  const applyBirthInfo = useCallback(
    async (nextInfo: BirthInfo) => {
      resetExtended()
      try {
        await fetch("/api/user/birth-info", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextInfo),
        })
      } catch {
        // DB 저장 실패 시에도 로컬 상태 업데이트는 진행
      }
      await setBirthInfo(nextInfo)
    },
    [resetExtended, setBirthInfo],
  )

  const hasExtendedLoading = useMemo(
    () =>
      [
        essential.status,
        accidental.status,
        hellenistic.status,
        vimshottari.status,
        ziweiBoard.status,
        ziweiOverlay.status,
      ].includes("loading"),
    [
      accidental.status,
      essential.status,
      hellenistic.status,
      vimshottari.status,
      ziweiBoard.status,
      ziweiOverlay.status,
    ],
  )
  const hasConnectedLoading = useMemo(
    () =>
      [
        sajuManual.status,
        astrologyManual.status,
        chartCoreManual.status,
        aspectsManual.status,
        vedicCoreManual.status,
      ].includes("loading"),
    [
      aspectsManual.status,
      astrologyManual.status,
      chartCoreManual.status,
      sajuManual.status,
      vedicCoreManual.status,
    ],
  )

  const sajuConnectedData = sajuManual.data ?? sajuResult
  const astrologyConnectedData = astrologyManual.data ?? astrologyResult
  const chartCoreConnectedData = chartCoreManual.data ?? chartCore
  const aspectsConnectedData = aspectsManual.data ?? aspects
  const vedicCoreConnectedData = vedicCoreManual.data ?? vedicCore

  const dominantPlanet = astrologyConnectedData?.today.dominantPlanet
  const dayPillar = sajuConnectedData?.sajuData.pillars.일
  const topEssential = getTopScoreLabel(essential.data?.scores)
  const topAccidental = getTopScoreLabel(accidental.data?.scores)
  const currentGreatFortuneLabel = getCurrentGreatFortuneLabel(
    sajuConnectedData?.greatFortune,
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-8 pt-6">
      <header className="mb-5 rounded-2xl border border-border/40 bg-card/30 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Data Lab
            </p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              API 결과 실험실
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              기존 결과를 확인하고, 아직 연결하지 않은 API 응답을 수동으로 호출해 비교합니다.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/90">
              현재 입력 티어: {inputTier ?? "L0"} (L2/L3는 위치 필요, L3는 위치+시간 필요)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={fetchAllConnected}
              disabled={hasConnectedLoading}
            >
              {hasConnectedLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  호출 중...
                </>
              ) : (
                "연결 API 전체 호출"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={fetchAllExtended}
              disabled={hasExtendedLoading}
            >
              {hasExtendedLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  호출 중...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  확장 API 전체 호출
                </>
              )}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={resetExtended}>
              초기화
            </Button>
          </div>
        </div>
      </header>

      <BirthInfoEditor birthInfo={birthInfo} inputTier={inputTier} onApply={applyBirthInfo} />

      {!birthInfo && (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          출생정보가 없어 실험 API를 호출할 수 없습니다.
        </p>
      )}

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">현재 연결된 결과</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <SectionCard
            title="사주 분석 (/api/saju/analyze)"
            description="fortune-context 기본 데이터"
            status={
              sajuManual.status !== "idle"
                ? sajuManual.status
                : sajuResult
                  ? "success"
                  : fortuneError
                    ? "error"
                    : isLoading
                      ? "loading"
                      : "idle"
            }
            summary={
              sajuConnectedData ? (
                <ul className="space-y-1 text-xs">
                  <li>
                    일주: {dayPillar?.천간} {dayPillar?.지지}
                  </li>
                  <li>
                    신강/신약: {(sajuConnectedData.sinyakSingang as { strength_type?: string } | undefined)?.strength_type ?? "-"}
                  </li>
                  <li>
                    현재 대운: {currentGreatFortuneLabel}
                  </li>
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">아직 결과가 없습니다.</p>
              )
            }
            error={sajuManual.error ?? fortuneError}
            jsonData={sajuConnectedData}
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={fetchSajuConnected}
                disabled={sajuManual.status === "loading"}
              >
                호출
              </Button>
            }
          />

          <SectionCard
            title="정적 점성술 (/api/astrology/static)"
            description="오늘/7일 예보 + 출생 차트 랭킹"
            status={
              astrologyManual.status !== "idle"
                ? astrologyManual.status
                : astrologyResult
                  ? "success"
                  : isLoading
                    ? "loading"
                    : "idle"
            }
            summary={
              astrologyConnectedData ? (
                <ul className="space-y-1 text-xs">
                  <li>오늘 헤드라인: {astrologyConnectedData.today.headline}</li>
                  <li>지배 행성: {dominantPlanet}</li>
                  <li>상위 랭킹: {astrologyConnectedData.ranking.slice(0, 3).join(", ")}</li>
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">아직 결과가 없습니다.</p>
              )
            }
            error={astrologyManual.error}
            jsonData={astrologyConnectedData}
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={fetchAstrologyConnected}
                disabled={astrologyManual.status === "loading"}
              >
                호출
              </Button>
            }
          />

          <SectionCard
            title="차트 코어 (/api/astrology/chart-core)"
            description="ASC/MC/하우스/행성 배치"
            status={
              chartCoreManual.status !== "idle"
                ? chartCoreManual.status
                : chartCore
                  ? "success"
                  : isLoading
                    ? "loading"
                    : "idle"
            }
            summary={
              chartCoreConnectedData ? (
                <ul className="space-y-1 text-xs">
                  <li>
                    ASC:{" "}
                    {chartCoreConnectedData.ascendant
                      ? `${chartCoreConnectedData.ascendant.signLabel} ${chartCoreConnectedData.ascendant.degreeInSign}°`
                      : "-"}
                  </li>
                  <li>
                    MC:{" "}
                    {chartCoreConnectedData.midheaven
                      ? `${chartCoreConnectedData.midheaven.signLabel} ${chartCoreConnectedData.midheaven.degreeInSign}°`
                      : "-"}
                  </li>
                  <li>하우스 개수: {Array.isArray(chartCoreConnectedData.houses) ? chartCoreConnectedData.houses.length : 0}</li>
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">아직 결과가 없습니다.</p>
              )
            }
            error={chartCoreManual.error}
            jsonData={chartCoreConnectedData}
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={fetchChartCoreConnected}
                disabled={chartCoreManual.status === "loading"}
              >
                호출
              </Button>
            }
          />

          <SectionCard
            title="애스펙트 (/api/astrology/aspects)"
            description="행성 간 각도 관계"
            status={
              aspectsManual.status !== "idle"
                ? aspectsManual.status
                : aspects
                  ? "success"
                  : isLoading
                    ? "loading"
                    : "idle"
            }
            summary={
              aspectsConnectedData ? (
                <ul className="space-y-1 text-xs">
                  <li>총 애스펙트: {aspectsConnectedData.aspects.length}개</li>
                  <li>
                    적용 중(applying):{" "}
                    {aspectsConnectedData.aspects.filter((a) => a.applying).length}개
                  </li>
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">아직 결과가 없습니다.</p>
              )
            }
            error={aspectsManual.error}
            jsonData={aspectsConnectedData}
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={fetchAspectsConnected}
                disabled={aspectsManual.status === "loading"}
              >
                호출
              </Button>
            }
          />

          <SectionCard
            title="베다 코어 (/api/astrology/vedic-core)"
            description="낙샤트라 중심 사이드리얼 결과"
            status={
              vedicCoreManual.status !== "idle"
                ? vedicCoreManual.status
                : vedicCore
                  ? "success"
                  : isLoading
                    ? "loading"
                    : "idle"
            }
            summary={
              vedicCoreConnectedData ? (
                <ul className="space-y-1 text-xs">
                  <li>
                    Moon Nakshatra:{" "}
                    {vedicCoreConnectedData.moonNakshatra
                      ? `${vedicCoreConnectedData.moonNakshatra.name} (pada ${vedicCoreConnectedData.moonNakshatra.pada})`
                      : "-"}
                  </li>
                  <li>Ayanamsa: {Math.round(vedicCoreConnectedData.ayanamsa * 100) / 100}°</li>
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">아직 결과가 없습니다.</p>
              )
            }
            error={vedicCoreManual.error}
            jsonData={vedicCoreConnectedData}
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={fetchVedicCoreConnected}
                disabled={vedicCoreManual.status === "loading"}
              >
                호출
              </Button>
            }
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">미연결 API 실험 호출</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <SectionCard
            title="Essential Score"
            description="POST /api/astrology/essential-score"
            detail="행성이 본래 위치에서 얼마나 강한지(품위: domicile/exaltation 등) 점수화합니다."
            status={essential.status}
            summary={
              essential.data ? (
                <p className="text-xs">최고 점수 행성: {topEssential ?? "-"}</p>
              ) : (
                <p className="text-xs text-muted-foreground">아직 호출하지 않았습니다.</p>
              )
            }
            error={essential.error}
            jsonData={essential.data}
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={fetchEssential}
                disabled={essential.status === "loading"}
              >
                호출
              </Button>
            }
          />

          <SectionCard
            title="Accidental Score"
            description="POST /api/astrology/accidental-score"
            detail="행성의 상황적 상태(하우스, 역행, 연소 등)가 현재 표현력에 주는 영향을 점수화합니다."
            status={accidental.status}
            summary={
              accidental.data ? (
                <p className="text-xs">최고 점수 행성: {topAccidental ?? "-"}</p>
              ) : (
                <p className="text-xs text-muted-foreground">아직 호출하지 않았습니다.</p>
              )
            }
            error={accidental.error}
            jsonData={accidental.data}
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={fetchAccidental}
                disabled={accidental.status === "loading"}
              >
                호출
              </Button>
            }
          />

          <SectionCard
            title="Hellenistic Core"
            description="POST /api/astrology/hellenistic-core"
            detail="주간/야간 차트(sector), Lot of Fortune/Spirit, ASC/MC 등 헬레니즘 핵심 지표를 제공합니다."
            status={hellenistic.status}
            summary={
              hellenistic.data ? (
                <ul className="space-y-1 text-xs">
                  <li>섹트: {hellenistic.data.sect ?? "-"}</li>
                  <li>Lot of Fortune: {hellenistic.data.lot_of_fortune_sign ?? "-"}</li>
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">아직 호출하지 않았습니다.</p>
              )
            }
            error={hellenistic.error}
            jsonData={hellenistic.data}
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={fetchHellenistic}
                disabled={hellenistic.status === "loading"}
              >
                호출
              </Button>
            }
          />

          <SectionCard
            title="Vimshottari Dasha"
            description="POST /api/astrology/vimshottari"
            detail="베다 점성술의 대주기/소주기 타이밍(마하다샤/안타르다샤/프라티안타르다샤)을 제공합니다."
            status={vimshottari.status}
            summary={
              vimshottari.data ? (
                <ul className="space-y-1 text-xs">
                  <li>
                    현재 Maha:{" "}
                    {vimshottari.data.currentMahaDasha?.lord ?? "데이터 누락(스키마 불일치 가능)"}
                  </li>
                  <li>
                    현재 Antar:{" "}
                    {vimshottari.data.currentAntarDasha?.lord ?? "데이터 누락(스키마 불일치 가능)"}
                  </li>
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">아직 호출하지 않았습니다.</p>
              )
            }
            error={vimshottari.error}
            jsonData={
              vimshottari.data ??
              (vimshottariDebug
                ? {
                    debug: {
                      request: vimshottariDebug.request,
                      response: vimshottariDebug.response,
                      status: vimshottariDebug.status,
                    },
                  }
                : undefined)
            }
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={fetchVimshottari}
                disabled={vimshottari.status === "loading"}
              >
                호출
              </Button>
            }
          />

          <SectionCard
            title="Ziwei Board"
            description="POST /api/ziwei/board"
            detail="자미두수 명반(12궁/주성/보조성/사화/대한 등) 고정 구조를 제공합니다."
            status={ziweiBoard.status}
            summary={
              ziweiBoard.data ? (
                <ul className="space-y-1 text-xs">
                  <li>명궁: {ziweiBoard.data.board.soul}</li>
                  <li>신궁: {ziweiBoard.data.board.body}</li>
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">아직 호출하지 않았습니다.</p>
              )
            }
            error={ziweiBoard.error}
            jsonData={ziweiBoard.data}
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={fetchZiweiBoard}
                disabled={ziweiBoard.status === "loading"}
              >
                호출
              </Button>
            }
          />

          <SectionCard
            title="Ziwei Runtime Overlay"
            description="POST /api/ziwei/runtime-overlay"
            detail="명반 위에 대한/유년/월운/일운/시운을 겹쳐 현재 활성 궁과 흐름을 보여줍니다."
            status={ziweiOverlay.status}
            summary={
              ziweiOverlay.data ? (
                <ul className="space-y-1 text-xs">
                  <li>일운 궁: {ziweiOverlay.data.timing?.daily?.name ?? "-"}</li>
                  <li>시운 궁: {ziweiOverlay.data.timing?.hourly?.name ?? "-"}</li>
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">아직 호출하지 않았습니다.</p>
              )
            }
            error={ziweiOverlay.error}
            jsonData={ziweiOverlay.data}
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={fetchZiweiOverlay}
                disabled={ziweiOverlay.status === "loading"}
              >
                호출
              </Button>
            }
          />
        </div>
      </section>
    </div>
  )
}
