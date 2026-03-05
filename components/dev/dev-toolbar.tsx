"use client"

import type { ReactNode } from "react"
import { useState, useRef, useEffect } from "react"
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
const PALETTE_KEY = "saju-theme-preset"
const FONT_KEY = "saju-font-preset"
const SERVICE_KEY = "saju-service-name"

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

/* ─── Palette presets ─── */

interface Preset {
  id: string
  label: string
  sublabel: string
  isDark: boolean
  palette: "cosmic" | "moonlit"
  dots: string[]
}

const PRESETS: Preset[] = [
  {
    id: "cosmic-light",
    label: "Cream",
    sublabel: "낮의 우주",
    isDark: false,
    palette: "cosmic",
    dots: ["#FFF9E5", "#E9B44C", "#A7C7E7", "#B2A4D4"],
  },
  {
    id: "cosmic-dark",
    label: "Night",
    sublabel: "밤의 우주",
    isDark: true,
    palette: "cosmic",
    dots: ["#0B0D17", "#FFD700", "#00F5FF", "#6347D1"],
  },
  {
    id: "moonlit-light",
    label: "Mist",
    sublabel: "달빛 안개",
    isDark: false,
    palette: "moonlit",
    dots: ["#F0EBF4", "#7C5CBF", "#9BB5CC", "#A492D4"],
  },
  {
    id: "moonlit-dark",
    label: "Moon",
    sublabel: "달빛 밤하늘",
    isDark: true,
    palette: "moonlit",
    dots: ["#0D0B1A", "#A78BFA", "#67E8F9", "#7C5CBF"],
  },
]

function applyPreset(preset: Preset): void {
  const root = document.documentElement
  if (preset.isDark) {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
  if (preset.palette === "moonlit") {
    root.setAttribute("data-palette", "moonlit")
  } else {
    root.removeAttribute("data-palette")
  }
  try {
    localStorage.setItem(PALETTE_KEY, preset.id)
  } catch {
    // ignore
  }
}

/* ─── Font presets ─── */

interface FontPreset {
  id: string
  label: string
}

const FONT_PRESETS: FontPreset[] = [
  { id: "pretendard", label: "Pretendard" },
  { id: "noto", label: "Noto" },
  { id: "system", label: "System" },
]

function applyFont(preset: FontPreset): void {
  const root = document.documentElement
  if (preset.id === "pretendard") {
    root.removeAttribute("data-font")
  } else {
    root.setAttribute("data-font", preset.id)
  }
  try { localStorage.setItem(FONT_KEY, preset.id) } catch { /* ignore */ }
}

/* ─── Service name presets ─── */

interface ServicePreset {
  id: string
  label: string
}

const SERVICE_PRESETS: ServicePreset[] = [
  { id: "moonlit", label: "moonlit" },
  { id: "astro-rain-cat", label: "Astro Rain Cat" },
]

function applyServiceName(preset: ServicePreset): void {
  try { localStorage.setItem(SERVICE_KEY, preset.id) } catch { /* ignore */ }
  // Dispatch custom event so header can react
  window.dispatchEvent(new CustomEvent("service-name-change", { detail: preset.id }))
}

/* ─── View options ─── */

const VIEW_OPTIONS = [
  { path: "/", label: "Landing" },
  { path: "/onboarding", label: "Onboarding" },
  { path: "/today", label: "Today" },
  { path: "/week", label: "Week" },
  { path: "/decision", label: "Decision" },
  { path: "/explore", label: "Explore" },
  { path: "/lab", label: "Lab" },
] as const

export function DevToolbar(): ReactNode {
  const [collapsed, setCollapsed] = useState(false)
  const [pos, setPos] = useState<Position | null>(null)
  const [activePaletteId, setActivePaletteId] = useState<string>("cosmic-dark")
  const [activeFontId, setActiveFontId] = useState<string>("pretendard")
  const [activeServiceId, setActiveServiceId] = useState<string>("moonlit")

  useEffect(() => {
    const saved = loadPos()
    if (saved) setPos(saved)
  }, [])
  const containerRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef<DragOffset | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Load and apply saved palette, font, service on mount
  useEffect(() => {
    try {
      const savedPalette = localStorage.getItem(PALETTE_KEY) ?? "cosmic-dark"
      setActivePaletteId(savedPalette)
      const preset = PRESETS.find((p) => p.id === savedPalette)
      if (preset) applyPreset(preset)

      const savedFont = localStorage.getItem(FONT_KEY) ?? "pretendard"
      setActiveFontId(savedFont)
      const fontPreset = FONT_PRESETS.find((f) => f.id === savedFont)
      if (fontPreset) applyFont(fontPreset)

      const savedService = localStorage.getItem(SERVICE_KEY) ?? "moonlit"
      setActiveServiceId(savedService)
    } catch {
      // ignore
    }
  }, [])

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

  function handlePresetSelect(preset: Preset): void {
    setActivePaletteId(preset.id)
    applyPreset(preset)
  }

  function handleFontSelect(preset: FontPreset): void {
    setActiveFontId(preset.id)
    applyFont(preset)
  }

  function handleServiceSelect(preset: ServicePreset): void {
    setActiveServiceId(preset.id)
    applyServiceName(preset)
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
      className={`fixed z-[9999] select-none ${pos ? "" : "bottom-20 left-4"}`}
      style={posStyle}
    >
      <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95 shadow-lg shadow-black/10 backdrop-blur-sm">
        {/* Header row */}
        <div className="flex w-full items-center text-[11px] font-semibold tracking-wide text-muted-foreground">
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
          <>
            {/* View navigation */}
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

            {/* Palette switcher */}
            <div className="border-t border-border/50 px-2 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-[10px] text-muted-foreground/50">팔레트</span>
                <div className="flex gap-1">
                  {PRESETS.map((preset) => {
                    const isActive = preset.id === activePaletteId
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset)}
                        title={`${preset.label} — ${preset.sublabel}`}
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                          isActive
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                        type="button"
                      >
                        <span className="flex gap-0.5">
                          {preset.dots.slice(1, 3).map((hex, i) => (
                            <span
                              key={i}
                              className="h-2 w-2 rounded-full"
                              style={{ background: hex }}
                            />
                          ))}
                        </span>
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Font switcher */}
            <div className="border-t border-border/50 px-2 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-[10px] text-muted-foreground/50">폰트</span>
                <div className="flex gap-1">
                  {FONT_PRESETS.map((fp) => (
                    <button
                      key={fp.id}
                      onClick={() => handleFontSelect(fp)}
                      className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                        fp.id === activeFontId
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                      type="button"
                    >
                      {fp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Service name switcher */}
            <div className="border-t border-border/50 px-2 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-[10px] text-muted-foreground/50">서비스</span>
                <div className="flex gap-1">
                  {SERVICE_PRESETS.map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => handleServiceSelect(sp)}
                      className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                        sp.id === activeServiceId
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                      type="button"
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
