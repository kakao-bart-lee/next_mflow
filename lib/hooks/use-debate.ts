"use client"

import { useState, useCallback, useRef } from "react"
import type { DebateEvent, DebateAgent, DebateSummary } from "@/lib/use-cases/run-debate"
import type { BirthInfo } from "@/lib/schemas/birth-info"

// =============================================================================
// Types
// =============================================================================

export interface DebateMessage {
  agent: DebateAgent
  name: string
  avatar: string
  turn: number
  text: string
  isStreaming: boolean
}

export type DebateStatus = "idle" | "running" | "done" | "error"

export interface UseDebateReturn {
  messages: DebateMessage[]
  summary: DebateSummary | null
  status: DebateStatus
  currentTurn: number
  totalTurns: number
  startDebate: (birthInfo?: BirthInfo) => Promise<void>
  error: string | null
}

// =============================================================================
// Hook
// =============================================================================

export function useDebate(): UseDebateReturn {
  const [messages, setMessages] = useState<DebateMessage[]>([])
  const [summary, setSummary] = useState<DebateSummary | null>(null)
  const [status, setStatus] = useState<DebateStatus>("idle")
  const [currentTurn, setCurrentTurn] = useState(0)
  const [totalTurns, setTotalTurns] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const startDebate = useCallback(async (birthInfo?: BirthInfo) => {
    // 진행 중인 요청 취소
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // 상태 초기화
    setMessages([])
    setSummary(null)
    setStatus("running")
    setCurrentTurn(0)
    setError(null)

    try {
      const res = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthInfo }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "토론 시작에 실패했습니다")
      }

      if (!res.body) {
        throw new Error("스트리밍 응답을 받지 못했습니다")
      }

      // NDJSON 스트림 파싱
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        // 마지막 줄은 불완전할 수 있으므로 버퍼에 유지
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const event = JSON.parse(line) as DebateEvent
            handleEvent(event)
          } catch {
            // JSON 파싱 실패 시 무시
          }
        }
      }

      // 잔여 버퍼 처리
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer) as DebateEvent
          handleEvent(event)
        } catch {
          // 무시
        }
      }

      setStatus((prev) => (prev === "error" ? "error" : "done"))
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setError(err instanceof Error ? err.message : "토론 중 오류가 발생했습니다")
      setStatus("error")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleEvent(event: DebateEvent) {
    switch (event.type) {
      case "debate-start":
        setTotalTurns(event.totalTurns)
        break

      case "turn-start":
        setCurrentTurn(event.turn)
        setMessages((prev) => [
          ...prev,
          {
            agent: event.agent,
            name: event.name,
            avatar: event.avatar,
            turn: event.turn,
            text: "",
            isStreaming: true,
          },
        ])
        break

      case "text-delta":
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last && last.agent === event.agent && last.isStreaming) {
            updated[updated.length - 1] = {
              ...last,
              text: last.text + event.delta,
            }
          }
          return updated
        })
        break

      case "turn-end":
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last && last.agent === event.agent) {
            updated[updated.length - 1] = { ...last, isStreaming: false }
          }
          return updated
        })
        break

      case "synthesis-start":
        setCurrentTurn(5)
        break

      case "synthesis-result":
        setSummary(event.summary)
        break

      case "debate-end":
        setStatus("done")
        break

      case "error":
        setError(event.message)
        setStatus("error")
        break
    }
  }

  return {
    messages,
    summary,
    status,
    currentTurn,
    totalTurns,
    startDebate,
    error,
  }
}
