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

interface SajuContextValue {
  birthInfo: BirthInfo | null
  sajuResult: FortuneResponse | null
  isLoading: boolean
  isHydrated: boolean
  error: string | null
  setBirthInfo: (info: BirthInfo) => Promise<void>
  clearData: () => void
}

const SajuContext = createContext<SajuContextValue | null>(null)

const STORAGE_KEY = "saju_birth_info"

export function SajuProvider({ children }: { children: ReactNode }) {
  const [birthInfo, setBirthInfoState] = useState<BirthInfo | null>(null)
  const [sajuResult, setSajuResult] = useState<FortuneResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  const fetchAnalysis = useCallback(async (info: BirthInfo) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/saju/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "분석 중 오류가 발생했습니다")
        return
      }
      const data: FortuneResponse = await res.json()
      setSajuResult(data)
    } catch {
      setError("네트워크 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // SSR-safe hydration: only read localStorage on the client after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as BirthInfo
        setBirthInfoState(parsed)
        fetchAnalysis(parsed)
      }
    } catch {
      // ignore parse or storage errors
    } finally {
      setIsHydrated(true)
    }
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

  const clearData = useCallback(() => {
    setBirthInfoState(null)
    setSajuResult(null)
    setError(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  return (
    <SajuContext.Provider
      value={{ birthInfo, sajuResult, isLoading, isHydrated, error, setBirthInfo, clearData }}
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
