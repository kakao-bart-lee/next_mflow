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
import type { FortuneResponse } from "@/lib/saju-core"
import type { AstrologyStaticResult } from "@/lib/astrology/static/types"
import type { DailyFortune } from "@/lib/use-cases/interpret-saju"

interface SajuContextValue {
  birthInfo: BirthInfo | null
  sajuResult: FortuneResponse | null
  astrologyResult: AstrologyStaticResult | null
  isLoading: boolean
  isHydrated: boolean
  isDemo: boolean
  error: string | null
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

const SajuContext = createContext<SajuContextValue | null>(null)

const STORAGE_KEY = "saju_birth_info"

export function SajuProvider({ children }: { children: ReactNode }) {
  const [birthInfo, setBirthInfoState] = useState<BirthInfo | null>(null)
  const [sajuResult, setSajuResult] = useState<FortuneResponse | null>(null)
  const [astrologyResult, setAstrologyResult] = useState<AstrologyStaticResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isDemo, setIsDemo] = useState(false)

  const fetchAnalysis = useCallback(async (info: BirthInfo) => {
    setIsLoading(true)
    setError(null)
    type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; network: boolean }

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

    const [sajuApi, astrologyApi] = await Promise.all([
      postAnalysis<FortuneResponse>("/api/saju/analyze"),
      postAnalysis<AstrologyStaticResult>("/api/astrology/static"),
    ])

    if (sajuApi.ok) {
      setSajuResult(sajuApi.data)
    } else {
      setSajuResult(null)
      setError(sajuApi.error)
    }

    if (astrologyApi.ok) {
      setAstrologyResult(astrologyApi.data)
    } else {
      setAstrologyResult(null)
    }

    if (!sajuApi.ok && !astrologyApi.ok && sajuApi.network && astrologyApi.network) {
      setError("네트워크 오류가 발생했습니다")
    }

    setIsLoading(false)
  }, [])

  // SSR-safe hydration: localStorage 우선, 없으면 DB에서 birthInfo 로드
  useEffect(() => {
    async function hydrate() {
      try {
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
  // trigger analysis automatically. This covers the case where SajuProvider is in root
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
    setIsDemo(false)
    setError(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  return (
    <SajuContext.Provider
      value={{
        birthInfo,
        sajuResult,
        astrologyResult,
        isLoading,
        isHydrated,
        isDemo,
        error,
        setBirthInfo,
        clearData,
        initDemoMode,
      }}
    >
      {children}
    </SajuContext.Provider>
  )
}

export function useSaju() {
  const ctx = useContext(SajuContext)
  if (!ctx) throw new Error("useSaju must be used within SajuProvider")
  return ctx
}
