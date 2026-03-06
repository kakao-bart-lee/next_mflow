"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import type { BirthInfo } from "@/lib/schemas/birth-info"
import { VERSION as SAJU_CORE_VERSION } from "@/lib/saju-core/version"
import type { FortuneResponse } from "@/lib/saju-core"
import type { AstrologyStaticResult } from "@/lib/astrology/static/types"
import type {
  AccidentalScoreResponse,
  AspectsResponse,
  ChartCoreResponse,
  EssentialScoreResponse,
  VedicCoreResponse,
} from "@/lib/astrology/types"
import type { DailyFortune } from "@/lib/use-cases/interpret-saju"

interface FortuneContextValue {
  birthInfo: BirthInfo | null
  sajuResult: FortuneResponse | null
  astrologyResult: AstrologyStaticResult | null
  chartCore: ChartCoreResponse | null
  aspects: AspectsResponse | null
  vedicCore: VedicCoreResponse | null
  essentialScore: EssentialScoreResponse | null
  accidentalScore: AccidentalScoreResponse | null
  isLoading: boolean
  isHydrated: boolean
  isDemo: boolean
  error: string | null
  targetDate: string | null
  setTargetDate: (date: string | null) => void
  /** 사주는 유지하고 특정 날짜 기준 점성술만 재계산 */
  fetchAstrologyForDate: (targetDate: string) => Promise<void>
  setBirthInfo: (info: BirthInfo) => Promise<void>
  clearData: () => void
  /** 데모 모드 전용: localStorage에 저장하지 않고 샘플 데이터로 분석 실행 */
  initDemoMode: () => Promise<void>
}

/** 데모 프리뷰용 샘플 생년월일 (서울 출생, 1990-03-15 정오) */
export const DEMO_BIRTH_INFO: BirthInfo = {
  birthDate: "1990-03-15",
  birthTime: "12:00",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M",
  latitude: 37.5665,
  longitude: 126.978,
  locationName: "서울",
}

/** 데모 모드용 정적 일일 운세 (LLM 호출 없이 표시) */
export const DEMO_DAILY_FORTUNE: DailyFortune = {
  summary: "봄기운 속 새로운 가능성이 열리는 하루입니다",
  tags: ["성장", "시작", "관계"],
  body: "경오(庚午) 일주의 기운이 봄의 목(木) 에너지와 만나 활기를 띱니다. 오늘은 미뤄두었던 계획을 실행에 옮기기에 좋은 날이에요. 주변 사람들과의 소통에서 뜻밖의 영감을 얻을 수 있으니 열린 마음으로 대화해보세요. 오후에는 잠시 산책하며 마음을 정리하면 한결 가벼워질 거예요.",
  actions: [
    { id: "demo-1", text: "오늘 하루 가장 중요한 한 가지에 집중해보세요" },
    { id: "demo-2", text: "가까운 사람에게 안부 인사를 건네보세요" },
    { id: "demo-3", text: "저녁에 내일의 작은 목표를 하나 정해보세요" },
  ],
  avoid: "조급한 결정이나 무리한 일정 변경은 오늘은 피하세요",
}

const FortuneContext = createContext<FortuneContextValue | null>(null)

const STORAGE_KEY = "saju_birth_info"
const LEGACY_SAJU_CACHE_KEYS = [
  "saju_analysis_cache",
  `saju_analysis_cache_v${SAJU_CORE_VERSION}`,
] as const
const SAJU_CACHE_SCHEMA_VERSION = "structured-profile-v1"
const SAJU_CACHE_KEY = `saju_analysis_cache_v${SAJU_CORE_VERSION}_${SAJU_CACHE_SCHEMA_VERSION}`
const ASTRO_CACHE_KEY = "astro_analysis_cache"

// 사주 캐시: birthInfo fingerprint가 같으면 무한 유효 (결정적 계산)
function getSajuCacheKey(info: BirthInfo): string {
  return `${info.birthDate}:${info.birthTime ?? "unknown"}:${info.gender}:${info.timezone}`
}

// 점성술 캐시: 날짜별 1일 TTL (targetDate 포함)
interface AstroCacheEntry {
  date: string
  fingerprint: string
  targetDate?: string
  data: AstrologyStaticResult
}

function tryGetCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch { /* ignore */ }
  return null
}

function trySetCache(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

export function FortuneProvider({ children }: { children: ReactNode }) {
  const [birthInfo, setBirthInfoState] = useState<BirthInfo | null>(null)
  const [sajuResult, setSajuResult] = useState<FortuneResponse | null>(null)
  const [astrologyResult, setAstrologyResult] = useState<AstrologyStaticResult | null>(null)
  const [chartCore, setChartCore] = useState<ChartCoreResponse | null>(null)
  const [aspects, setAspects] = useState<AspectsResponse | null>(null)
  const [vedicCore, setVedicCore] = useState<VedicCoreResponse | null>(null)
  const [essentialScore, setEssentialScore] = useState<EssentialScoreResponse | null>(null)
  const [accidentalScore, setAccidentalScore] = useState<AccidentalScoreResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [targetDate, setTargetDate] = useState<string | null>(null)

  const fetchAnalysis = useCallback(async (info: BirthInfo) => {
    setIsLoading(true)
    setError(null)
    type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; network: boolean }

    // ── 클라이언트 캐시 확인 ──
    const sajuFingerprint = getSajuCacheKey(info)
    const todayStr = new Date().toISOString().slice(0, 10)

    // 사주 캐시: 같은 birthInfo면 무한 유효
    const cachedSajuMap = tryGetCached<Record<string, FortuneResponse>>(SAJU_CACHE_KEY)
    const cachedSaju = cachedSajuMap?.[sajuFingerprint] ?? null

    // 점성술 캐시: 당일 + 같은 birthInfo + targetDate 없음(오늘 기준)만 유효
    const cachedAstroEntry = tryGetCached<AstroCacheEntry>(ASTRO_CACHE_KEY)
    const cachedAstro =
      cachedAstroEntry?.date === todayStr &&
      cachedAstroEntry?.fingerprint === sajuFingerprint &&
      !cachedAstroEntry?.targetDate
        ? cachedAstroEntry.data
        : null

    // 둘 다 캐시 hit이면 API 호출 스킵
    if (cachedSaju && cachedAstro) {
      setSajuResult(cachedSaju)
      setAstrologyResult(cachedAstro)
      setIsLoading(false)
      return
    }

    const postAnalysis = async <T,>(url: string): Promise<ApiResult<T>> => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(info),
        })
        if (!res.ok) {
          let message = "분석 중 오류가 발생했습니다"
          try {
            const data = await res.json()
            message = data.error ?? message
          } catch {
            // ignore parse error
          }
          return { ok: false, error: message, network: false }
        }
        return { ok: true, data: (await res.json()) as T }
      } catch {
        return { ok: false, error: "네트워크 오류가 발생했습니다", network: true }
      }
    }

    // 캐시 miss인 것만 fetch (partial cache 지원)
    const sajuPromise = cachedSaju
      ? Promise.resolve({ ok: true as const, data: cachedSaju })
      : postAnalysis<FortuneResponse>("/api/saju/analyze")
    const astroPromise = cachedAstro
      ? Promise.resolve({ ok: true as const, data: cachedAstro })
      : postAnalysis<AstrologyStaticResult>("/api/astrology/static")

    const [sajuApi, astrologyApi] = await Promise.all([sajuPromise, astroPromise])

    if (sajuApi.ok) {
      setSajuResult(sajuApi.data)
      // 사주 캐시 저장 (fingerprint별)
      const map = cachedSajuMap ?? {}
      map[sajuFingerprint] = sajuApi.data
      trySetCache(SAJU_CACHE_KEY, map)
    } else {
      setSajuResult(null)
      setError(sajuApi.error)
    }

    if (astrologyApi.ok) {
      setAstrologyResult(astrologyApi.data)
      // 점성술 캐시 저장 (당일 + fingerprint, targetDate 없음)
      trySetCache(ASTRO_CACHE_KEY, {
        date: todayStr,
        fingerprint: sajuFingerprint,
        data: astrologyApi.data,
      } satisfies AstroCacheEntry)
    } else {
      setAstrologyResult(null)
    }

    if (!sajuApi.ok && !astrologyApi.ok && !("network" in sajuApi) && !("network" in astrologyApi)) {
      // both failed but not network errors — keep individual errors
    } else if (!sajuApi.ok && !astrologyApi.ok && "network" in sajuApi && sajuApi.network && "network" in astrologyApi && astrologyApi.network) {
      setError("네트워크 오류가 발생했습니다")
    }

    setIsLoading(false)

    // Horizons 확장 API: chart-core, aspects, vedic-core, essential-score, accidental-score
    // (best-effort, 실패 시 무시)
    const extendedFetch = async <T,>(url: string): Promise<T | null> => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(info),
        })
        if (!res.ok) return null
        return (await res.json()) as T
      } catch { return null }
    }

    // 비동기 병렬 — UI 블로킹 없이 데이터 보강
    void Promise.all([
      extendedFetch<ChartCoreResponse>("/api/astrology/chart-core"),
      extendedFetch<AspectsResponse>("/api/astrology/aspects"),
      extendedFetch<VedicCoreResponse>("/api/astrology/vedic-core"),
      extendedFetch<EssentialScoreResponse>("/api/astrology/essential-score"),
      extendedFetch<AccidentalScoreResponse>("/api/astrology/accidental-score"),
    ]).then(([
      chartCoreData,
      aspectsData,
      vedicCoreData,
      essentialScoreData,
      accidentalScoreData,
    ]) => {
      if (chartCoreData) setChartCore(chartCoreData)
      if (aspectsData) setAspects(aspectsData)
      if (vedicCoreData) setVedicCore(vedicCoreData)
      if (essentialScoreData) setEssentialScore(essentialScoreData)
      if (accidentalScoreData) setAccidentalScore(accidentalScoreData)
    })
  }, [])

  const fetchAstrologyForDate = useCallback(async (date: string) => {
    if (!birthInfo) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/astrology/static", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...birthInfo, targetDate: date }),
      })
      if (res.ok) {
        const data = (await res.json()) as AstrologyStaticResult
        setAstrologyResult(data)
        setTargetDate(date)
      } else {
        let message = "점성술 분석 중 오류가 발생했습니다"
        try {
          const errData = await res.json()
          message = errData.error ?? message
        } catch { /* ignore */ }
        setError(message)
      }
    } catch {
      setError("네트워크 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }, [birthInfo])

  // SSR-safe hydration: localStorage 우선, 없으면 DB에서 birthInfo 로드
  useEffect(() => {
    async function hydrate() {
      try {
        for (const legacyKey of LEGACY_SAJU_CACHE_KEYS) {
          try {
            localStorage.removeItem(legacyKey)
          } catch {
            // ignore storage errors
          }
        }

        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as BirthInfo
          setBirthInfoState(parsed)
          fetchAnalysis(parsed)
          return
        }
        // localStorage에 없으면 DB fallback (로그인 유저 대상)
        const res = await fetch("/api/user/birth-info")
        if (res.ok) {
          const { birthInfo: dbInfo } = await res.json() as { birthInfo: BirthInfo | null }
          if (dbInfo) {
            setBirthInfoState(dbInfo)
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dbInfo)) } catch { /* ignore */ }
            fetchAnalysis(dbInfo)
          }
        }
      } catch {
        // ignore parse or network errors
      } finally {
        setIsHydrated(true)
      }
    }
    void hydrate()
  }, [fetchAnalysis])

  // Auto-reanalyze: if birthInfo exists but sajuResult is missing (e.g. after refresh),
  // trigger analysis automatically. This covers the case where FortuneProvider is in root
  // layout and doesn't remount on navigation.
  useEffect(() => {
    if (isHydrated && birthInfo && !sajuResult && !isLoading && !error) {
      fetchAnalysis(birthInfo)
    }
  }, [isHydrated, birthInfo, sajuResult, isLoading, error, fetchAnalysis])

  const setBirthInfo = useCallback(
    async (info: BirthInfo) => {
      setBirthInfoState(info)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
      } catch {
        // ignore storage errors
      }
      await fetchAnalysis(info)
    },
    [fetchAnalysis]
  )

  const initDemoMode = useCallback(async () => {
    if (birthInfo) return  // 실제 데이터가 있으면 덮어쓰지 않음
    setIsDemo(true)
    setBirthInfoState(DEMO_BIRTH_INFO)
    await fetchAnalysis(DEMO_BIRTH_INFO)
  }, [birthInfo, fetchAnalysis])

  const clearData = useCallback(() => {
    setBirthInfoState(null)
    setSajuResult(null)
    setAstrologyResult(null)
    setChartCore(null)
    setAspects(null)
    setVedicCore(null)
    setEssentialScore(null)
    setAccidentalScore(null)
    setIsDemo(false)
    setError(null)
    setTargetDate(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(SAJU_CACHE_KEY)
      for (const legacyKey of LEGACY_SAJU_CACHE_KEYS) {
        localStorage.removeItem(legacyKey)
      }
    } catch {
      // ignore
    }
  }, [])

  return (
    <FortuneContext.Provider
      value={{
        birthInfo,
        sajuResult,
        astrologyResult,
        chartCore,
        aspects,
        vedicCore,
        essentialScore,
        accidentalScore,
        isLoading,
        isHydrated,
        isDemo,
        error,
        targetDate,
        setTargetDate,
        fetchAstrologyForDate,
        setBirthInfo,
        clearData,
        initDemoMode,
      }}
    >
      {children}
    </FortuneContext.Provider>
  )
}

export function useFortune() {
  const ctx = useContext(FortuneContext)
  if (!ctx) throw new Error("useFortune must be used within FortuneProvider")
  return ctx
}
