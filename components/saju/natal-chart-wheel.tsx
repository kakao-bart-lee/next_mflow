"use client"

import { useMemo } from "react"
import type { ChartCoreResponse, AspectsResponse } from "@/lib/astrology/types"

/* ─── 상수 ─── */

const ZODIAC_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]
const ZODIAC_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

const PLANET_SYMBOLS: Record<string, string> = {
  SUN: "☉", MOON: "☽", MERCURY: "☿", VENUS: "♀", MARS: "♂",
  JUPITER: "♃", SATURN: "♄",
}

const ASPECT_COLORS: Record<string, string> = {
  conjunction: "var(--chart-3)",
  opposition: "var(--chart-5)",
  trine: "var(--chart-4)",
  square: "var(--chart-5)",
  sextile: "var(--chart-2)",
}

const ASPECT_DASH: Record<string, string> = {
  conjunction: "none",
  opposition: "6,3",
  trine: "none",
  square: "4,2",
  sextile: "2,2",
}

/* ─── 유틸 ─── */

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, endDeg)
  const end = polarToCartesian(cx, cy, r, startDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

/* ─── 컴포넌트 ─── */

interface NatalChartWheelProps {
  chartCore: ChartCoreResponse
  aspects?: AspectsResponse | null
  className?: string
}

export function NatalChartWheel({ chartCore, aspects, className }: NatalChartWheelProps) {
  const size = 400
  const cx = size / 2
  const cy = size / 2
  const outerR = 185
  const zodiacR = 165
  const houseR = 130
  const innerR = 115
  const planetR = 145
  const aspectR = 90

  // ASC degree determines the chart rotation
  const ascDeg = chartCore.ascendant?.lonDeg ?? 0

  // Convert ecliptic longitude to chart angle (ASC on left = 180°)
  const toChartAngle = (lonDeg: number) => 180 - (lonDeg - ascDeg)

  // Zodiac sign boundaries
  const zodiacSlices = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const signStart = i * 30
      const startAngle = toChartAngle(signStart)
      const endAngle = toChartAngle(signStart + 30)
      return {
        index: i,
        symbol: ZODIAC_SYMBOLS[i],
        name: ZODIAC_NAMES[i],
        startAngle,
        endAngle,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ascDeg])

  // House boundaries from house cusps
  const houseCusps = useMemo(() => {
    if (!chartCore.houses || chartCore.houses.length < 12) return null
    return chartCore.houses.map((h) => ({
      house: h.house,
      angle: toChartAngle(h.cuspDeg),
      cuspDeg: h.cuspDeg,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartCore.houses, ascDeg])

  // Planet positions
  const planetPositions = useMemo(() => {
    if (!chartCore.planets) return []
    return Object.entries(chartCore.planets)
      .filter(([key]) => PLANET_SYMBOLS[key])
      .map(([key, val]) => ({
        id: key,
        symbol: PLANET_SYMBOLS[key],
        angle: toChartAngle(val.lonDeg),
        lonDeg: val.lonDeg,
        sign: val.signLabel,
        degInSign: val.degreeInSign,
      }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartCore.planets, ascDeg])

  // Spread overlapping planets
  const spreadPlanets = useMemo(() => {
    const sorted = [...planetPositions].sort((a, b) => a.angle - b.angle)
    const MIN_GAP = 12
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 1; i < sorted.length; i++) {
        const diff = sorted[i].angle - sorted[i - 1].angle
        if (Math.abs(diff) < MIN_GAP) {
          sorted[i - 1] = { ...sorted[i - 1], angle: sorted[i - 1].angle - MIN_GAP / 2 }
          sorted[i] = { ...sorted[i], angle: sorted[i].angle + MIN_GAP / 2 }
        }
      }
    }
    return sorted
  }, [planetPositions])

  // Aspect lines
  const aspectLines = useMemo(() => {
    if (!aspects?.aspects) return []
    return aspects.aspects
      .filter((a) => {
        const p1 = planetPositions.find((p) => p.id === a.planet1)
        const p2 = planetPositions.find((p) => p.id === a.planet2)
        return p1 && p2
      })
      .map((a) => {
        const p1 = planetPositions.find((p) => p.id === a.planet1)!
        const p2 = planetPositions.find((p) => p.id === a.planet2)!
        const pt1 = polarToCartesian(cx, cy, aspectR, p1.angle)
        const pt2 = polarToCartesian(cx, cy, aspectR, p2.angle)
        return {
          key: `${a.planet1}-${a.planet2}-${a.type}`,
          x1: pt1.x, y1: pt1.y,
          x2: pt2.x, y2: pt2.y,
          color: ASPECT_COLORS[a.type] ?? "var(--muted-foreground)",
          dash: ASPECT_DASH[a.type] ?? "none",
          type: a.type,
        }
      })
  }, [aspects, planetPositions, cx, cy])

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[400px]">
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="var(--border)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={zodiacR} fill="none" stroke="var(--border)" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={houseR} fill="none" stroke="var(--border)" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="var(--border)" strokeWidth="1" />

        {/* Zodiac sign slices */}
        {zodiacSlices.map((slice, i) => {
          const midAngle = slice.startAngle - 15
          const labelPos = polarToCartesian(cx, cy, (outerR + zodiacR) / 2, midAngle)
          const lineStart = polarToCartesian(cx, cy, zodiacR, slice.startAngle)
          const lineEnd = polarToCartesian(cx, cy, outerR, slice.startAngle)
          return (
            <g key={`zodiac-${i}`}>
              <line
                x1={lineStart.x} y1={lineStart.y}
                x2={lineEnd.x} y2={lineEnd.y}
                stroke="var(--border)" strokeWidth="0.5"
              />
              <text
                x={labelPos.x} y={labelPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize="11" fill="var(--muted-foreground)"
                opacity="0.8"
              >
                {slice.symbol}
              </text>
            </g>
          )
        })}

        {/* House lines */}
        {houseCusps?.map((cusp) => {
          const inner = polarToCartesian(cx, cy, innerR, cusp.angle)
          const outer = polarToCartesian(cx, cy, zodiacR, cusp.angle)
          const isCardinal = [1, 4, 7, 10].includes(cusp.house)
          const labelPos = polarToCartesian(cx, cy, (innerR + houseR) / 2, cusp.angle + 15)
          return (
            <g key={`house-${cusp.house}`}>
              <line
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke={isCardinal ? "var(--primary)" : "var(--border)"}
                strokeWidth={isCardinal ? "1.5" : "0.5"}
                opacity={isCardinal ? "0.7" : "0.4"}
              />
              <text
                x={labelPos.x} y={labelPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize="8" fill="var(--muted-foreground)"
                opacity="0.5"
              >
                {cusp.house}
              </text>
            </g>
          )
        })}

        {/* ASC / MC markers */}
        {chartCore.ascendant && (
          <text
            x={polarToCartesian(cx, cy, outerR + 12, 180).x}
            y={polarToCartesian(cx, cy, outerR + 12, 180).y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="9" fontWeight="700" fill="var(--primary)"
          >
            ASC
          </text>
        )}
        {chartCore.midheaven && (
          <text
            x={polarToCartesian(cx, cy, outerR + 12, toChartAngle(chartCore.midheaven.lonDeg)).x}
            y={polarToCartesian(cx, cy, outerR + 12, toChartAngle(chartCore.midheaven.lonDeg)).y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="9" fontWeight="700" fill="var(--accent)"
          >
            MC
          </text>
        )}

        {/* Aspect lines */}
        {aspectLines.map((line) => (
          <line
            key={line.key}
            x1={line.x1} y1={line.y1}
            x2={line.x2} y2={line.y2}
            stroke={line.color}
            strokeWidth="0.8"
            strokeDasharray={line.dash}
            opacity="0.5"
          />
        ))}

        {/* Planet glyphs */}
        {spreadPlanets.map((planet) => {
          const pos = polarToCartesian(cx, cy, planetR, planet.angle)
          return (
            <g key={planet.id}>
              <circle cx={pos.x} cy={pos.y} r="10" fill="var(--card)" stroke="var(--primary)" strokeWidth="1" opacity="0.9" />
              <text
                x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize="11" fill="var(--foreground)"
              >
                {planet.symbol}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
