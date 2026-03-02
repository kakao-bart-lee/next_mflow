"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"

const MOODS = [
  { id: "calm", label: "차분해요" },
  { id: "anxious", label: "불안해요" },
  { id: "happy", label: "기분 좋아요" },
  { id: "tired", label: "지쳐 있어요" },
  { id: "focused", label: "집중돼요" },
  { id: "scattered", label: "산만해요" },
]

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

// 날짜별 키 — 매일 초기화됨
function getTodayKey() {
  return `saju_checkin_${getTodayStr()}`
}

interface CheckInState {
  selected: string | null
  saved: boolean
}

export function CheckInChips() {
  const [selected, setSelected] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // 오늘의 체크인 상태 복원: API → fallback localStorage
  useEffect(() => {
    let cancelled = false

    async function loadCheckIn() {
      // 1차: API에서 조회
      try {
        const res = await fetch(`/api/user/daily-checkin?date=${getTodayStr()}`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && data.checkin) {
            setSelected(data.checkin.mood)
            setSaved(true)
            return
          }
        }
      } catch {
        // API 실패 시 localStorage fallback
      }

      // 2차: localStorage fallback
      if (cancelled) return
      try {
        const stored = localStorage.getItem(getTodayKey())
        if (stored) {
          const state: CheckInState = JSON.parse(stored)
          setSelected(state.selected)
          setSaved(state.saved)
        }
      } catch {
        // ignore
      }
    }

    loadCheckIn()
    return () => { cancelled = true }
  }, [])

  const handleSelect = (id: string) => {
    if (saved) return
    setSelected(id)
  }

  const handleSave = () => {
    if (!selected) return
    setSaved(true)

    // localStorage write-through
    try {
      const state: CheckInState = { selected, saved: true }
      localStorage.setItem(getTodayKey(), JSON.stringify(state))
    } catch {
      // ignore storage errors
    }

    // API 동기화 (background, fire-and-forget)
    fetch("/api/user/daily-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: getTodayStr(), mood: selected }),
    }).catch(() => {
      // API 실패해도 localStorage에 이미 저장됨
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        오늘의 체크인
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        지금 기분은 어떤가요?
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => handleSelect(mood.id)}
            disabled={saved}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              selected === mood.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary/50 text-secondary-foreground hover:bg-secondary"
            } ${saved && selected !== mood.id ? "opacity-40" : ""}`}
            type="button"
            aria-pressed={selected === mood.id}
          >
            {mood.label}
          </button>
        ))}
      </div>

      {selected && !saved && (
        <button
          onClick={handleSave}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          type="button"
        >
          <Check className="h-3.5 w-3.5" />
          저장하기
        </button>
      )}

      {saved && (
        <p className="mt-3 text-xs text-primary/70 animate-in fade-in duration-300">
          오늘의 체크인이 저장되었어요
        </p>
      )}
    </div>
  )
}
