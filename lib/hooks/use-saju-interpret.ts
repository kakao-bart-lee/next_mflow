"use client"

import { useState, useEffect, useRef } from "react"
import type { BirthInfo } from "@/lib/schemas/birth-info"
import type { DailyFortune, WeeklyFortune } from "@/lib/use-cases/interpret-saju"

type InterpretationType = "daily" | "weekly"

type InterpretResult<T extends InterpretationType> = T extends "daily"
  ? DailyFortune
  : WeeklyFortune

interface UseSajuInterpretReturn<T extends InterpretationType> {
  data: InterpretResult<T> | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * 사주 해석 데이터를 LLM API에서 가져오는 훅
 *
 * birthInfo가 null이면 fetch하지 않습니다.
 * 같은 birthInfo + type 조합에 대해 중복 fetch를 방지합니다.
 */
export function useSajuInterpret<T extends InterpretationType>(
  type: T,
  birthInfo: BirthInfo | null,
  weekStartDate?: string
): UseSajuInterpretReturn<T> {
  const [data, setData] = useState<InterpretResult<T> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchKey = birthInfo
    ? `${type}:${birthInfo.birthDate}:${birthInfo.birthTime}:${weekStartDate ?? ""}`
    : null

  const doFetch = async () => {
    if (!birthInfo) return

    // 이미 같은 키로 fetch 완료된 경우 스킵
    if (fetchedRef.current === fetchKey && data) return

    // 진행 중인 요청 취소
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/saju/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, birthInfo, weekStartDate }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "운세 생성에 실패했습니다")
      }

      const json = await res.json()
      setData(json.data as InterpretResult<T>)
      fetchedRef.current = fetchKey
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setError(err instanceof Error ? err.message : "운세 생성 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (birthInfo && fetchKey !== fetchedRef.current) {
      doFetch()
    }

    return () => {
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey])

  const refetch = () => {
    fetchedRef.current = null
    doFetch()
  }

  return { data, isLoading, error, refetch }
}
