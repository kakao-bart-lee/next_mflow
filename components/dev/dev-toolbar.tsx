"use client"

import type { ReactNode } from "react"
import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronDown, ChevronUp, GripVertical, Monitor } from "lucide-react"

interface Position {
  x: number
  y: number
}

interface DragOffset {
  dx: number
  dy: number
}

const STORAGE_KEY = "dev-toolbar-pos"

function loadPos(): Position | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Position) : null
  } catch {
    return null
  }
}

function savePos(p: Position): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // 저장 실패는 무시
  }
}

const VIEW_OPTIONS = [
  { path: "/", label: "Landing" },
  { path: "/onboarding", label: "Onboarding" },
  { path: "/today", label: "Today" },
  { path: "/week", label: "Week" },
  { path: "/decision", label: "Decision" },
  { path: "/explore", label: "Explore" },
] as const

export function DevToolbar(): ReactNode {
  const [collapsed, setCollapsed] = useState(false)
  const [pos, setPos] = useState<Position | null>(() => loadPos())
  const containerRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef<DragOffset | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  if (process.env.NODE_ENV !== "development") return null

  function handleDragStart(e: React.MouseEvent): void {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const originX = pos?.x ?? rect.left
    const originY = pos?.y ?? rect.top
    dragOffset.current = { dx: e.clientX - originX, dy: e.clientY - originY }

    function onMove(ev: MouseEvent): void {
      if (!dragOffset.current) return
      setPos({
        x: ev.clientX - dragOffset.current.dx,
        y: ev.clientY - dragOffset.current.dy,
      })
    }

    function onUp(ev: MouseEvent): void {
      if (dragOffset.current) {
        const newPos = {
          x: ev.clientX - dragOffset.current.dx,
          y: ev.clientY - dragOffset.current.dy,
        }
        savePos(newPos)
      }
      dragOffset.current = null
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }

    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  function toggleCollapsed(): void {
    setCollapsed((prev) => !prev)
  }

  const posStyle = pos
    ? { left: pos.x, top: pos.y, bottom: "auto" as const }
    : {}

  return (
    <div
      ref={containerRef}
      className={`fixed z-[9999] select-none ${pos ? "" : "bottom-4 left-4"}`}
      style={posStyle}
    >
      <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95 shadow-lg shadow-black/10 backdrop-blur-sm">
        <div className="flex w-full items-center text-[11px] font-semibold tracking-wide text-muted-foreground">
          {/* 드래그 핸들 */}
          <div
            onMouseDown={handleDragStart}
            className="cursor-grab px-1.5 py-1.5 text-muted-foreground/40 transition-colors hover:text-muted-foreground active:cursor-grabbing"
          >
            <GripVertical className="h-3 w-3" />
          </div>

          <button
            onClick={toggleCollapsed}
            className="flex flex-1 items-center gap-2 py-1.5 pr-3 text-left transition-colors hover:text-foreground"
            type="button"
          >
            <Monitor className="h-3 w-3" />
            <span>DEV</span>
            <span className="ml-auto text-[10px] font-normal text-muted-foreground/50">
              {pathname}
            </span>
            {collapsed
              ? <ChevronUp className="h-3 w-3" />
              : <ChevronDown className="h-3 w-3" />
            }
          </button>
        </div>

        {!collapsed && (
          <div className="border-t border-border/50 px-2 py-2">
            <div className="flex flex-wrap gap-1">
              {VIEW_OPTIONS.map((opt) => (
                <button
                  key={opt.path}
                  onClick={() => router.push(opt.path)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    pathname === opt.path
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
