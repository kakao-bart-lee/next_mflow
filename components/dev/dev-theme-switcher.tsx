"use client"

import { useState, useEffect } from "react"
import { Palette, X } from "lucide-react"

interface Preset {
  id: string
  label: string
  sublabel: string
  isDark: boolean
  palette: "cosmic" | "moonlit"
  dots: string[]
  colors: { name: string; hex: string; role: string }[]
}

const PRESETS: Preset[] = [
  {
    id: "cosmic-light",
    label: "Cosmic Cream",
    sublabel: "낮의 우주",
    isDark: false,
    palette: "cosmic",
    dots: ["#FFF9E5", "#E9B44C", "#A7C7E7", "#B2A4D4"],
    colors: [
      { name: "배경", hex: "#FFF9E5", role: "Background" },
      { name: "골드", hex: "#E9B44C", role: "Primary" },
      { name: "레인 블루", hex: "#A7C7E7", role: "Accent" },
      { name: "라벤더", hex: "#B2A4D4", role: "Ring" },
      { name: "포그라운드", hex: "#2C3E50", role: "Foreground" },
      { name: "뮤티드", hex: "#708090", role: "Muted Fg" },
    ],
  },
  {
    id: "cosmic-dark",
    label: "Night Sky",
    sublabel: "밤의 우주",
    isDark: true,
    palette: "cosmic",
    dots: ["#0B0D17", "#FFD700", "#00F5FF", "#6347D1"],
    colors: [
      { name: "배경", hex: "#0B0D17", role: "Background" },
      { name: "골드", hex: "#FFD700", role: "Primary" },
      { name: "시안", hex: "#00F5FF", role: "Accent" },
      { name: "퍼플", hex: "#6347D1", role: "Ring" },
      { name: "포그라운드", hex: "#FFFFFF", role: "Foreground" },
      { name: "뮤티드", hex: "#CBD5E0", role: "Muted Fg" },
    ],
  },
  {
    id: "moonlit-light",
    label: "Moonlit Mist",
    sublabel: "달빛 안개",
    isDark: false,
    palette: "moonlit",
    dots: ["#F0EBF4", "#7C5CBF", "#9BB5CC", "#A492D4"],
    colors: [
      { name: "배경", hex: "#F0EBF4", role: "Background" },
      { name: "퍼플", hex: "#7C5CBF", role: "Primary" },
      { name: "스틸 블루", hex: "#9BB5CC", role: "Accent" },
      { name: "라벤더", hex: "#A492D4", role: "Ring" },
      { name: "포그라운드", hex: "#1E1840", role: "Foreground" },
      { name: "뮤티드", hex: "#6B738A", role: "Muted Fg" },
    ],
  },
  {
    id: "moonlit-dark",
    label: "Moonlit Night",
    sublabel: "달빛 밤하늘",
    isDark: true,
    palette: "moonlit",
    dots: ["#0D0B1A", "#A78BFA", "#67E8F9", "#7C5CBF"],
    colors: [
      { name: "배경", hex: "#0D0B1A", role: "Background" },
      { name: "소프트 바이올렛", hex: "#A78BFA", role: "Primary" },
      { name: "소프트 시안", hex: "#67E8F9", role: "Accent" },
      { name: "퍼플", hex: "#7C5CBF", role: "Ring" },
      { name: "포그라운드", hex: "#E8E4F5", role: "Foreground" },
      { name: "뮤티드", hex: "#A0AABB", role: "Muted Fg" },
    ],
  },
]

function applyPreset(preset: Preset) {
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
    localStorage.setItem("saju-theme-preset", preset.id)
  } catch {
    // ignore
  }
}

function loadSavedPresetId(): string {
  try {
    return localStorage.getItem("saju-theme-preset") ?? "cosmic-dark"
  } catch {
    return "cosmic-dark"
  }
}

export function DevThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string>("cosmic-dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = loadSavedPresetId()
    setActiveId(saved)
    const preset = PRESETS.find((p) => p.id === saved)
    if (preset) applyPreset(preset)
  }, [])

  if (!mounted) return null

  const activePreset = PRESETS.find((p) => p.id === activeId) ?? PRESETS[1]

  const handleSelect = (preset: Preset) => {
    setActiveId(preset.id)
    applyPreset(preset)
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-[5.5rem] right-4 z-[9999] flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-card/90 shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:border-primary/40"
        aria-label="테마 팔레트 전환"
        type="button"
      >
        {open ? (
          <X className="h-4 w-4 text-foreground/70" />
        ) : (
          <Palette className="h-4 w-4 text-foreground/70" />
        )}
      </button>

      {/* Popup panel */}
      {open && (
        <div className="fixed bottom-[7.5rem] right-4 z-[9999] w-72 rounded-2xl border border-border/40 bg-card/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              팔레트 선택
            </p>

            {/* Preset grid 2×2 */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => {
                const isActive = preset.id === activeId
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelect(preset)}
                    className={`relative flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      isActive
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/40 bg-muted/20 hover:bg-muted/40"
                    }`}
                    type="button"
                  >
                    {isActive && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                    )}
                    <div className="flex gap-1">
                      {preset.dots.map((hex, i) => (
                        <span
                          key={i}
                          className="h-3 w-3 rounded-full border border-white/10"
                          style={{ background: hex }}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-tight text-foreground">
                      {preset.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {preset.sublabel}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Color swatches for active preset */}
            <div className="mt-4 border-t border-border/30 pt-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                현재 — {activePreset.label}
              </p>
              <div className="mt-2 space-y-1.5">
                {activePreset.colors.map((color) => (
                  <div key={color.role} className="flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-sm border border-border/20"
                      style={{ background: color.hex }}
                    />
                    <span className="flex-1 text-[10px] text-muted-foreground">
                      {color.name}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      {color.hex}
                    </span>
                    <span className="w-16 text-right text-[10px] text-muted-foreground/50">
                      {color.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
