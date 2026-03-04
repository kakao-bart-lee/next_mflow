"use client"

import { ELEMENT_HEX } from "@/lib/constants/element-colors"

interface RadarDataPoint {
  element: string
  label: string
  value: number
}

interface FiveElementsRadarProps {
  data: RadarDataPoint[]
}

export function FiveElementsRadar({ data }: FiveElementsRadarProps) {
  if (data.length !== 5) return null

  const size = 220
  const cx = size / 2
  const cy = size / 2
  const maxR = 80
  const angleOffset = -Math.PI / 2

  const maxValue = Math.max(...data.map((d) => d.value), 1)

  function getPoint(index: number, radius: number): [number, number] {
    const angle = angleOffset + (2 * Math.PI * index) / 5
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  }

  function polygonPoints(radius: number): string {
    return Array.from({ length: 5 }, (_, i) => getPoint(i, radius).join(",")).join(" ")
  }

  function dataPolygonPoints(): string {
    return data
      .map((d, i) => {
        const r = (d.value / maxValue) * maxR
        return getPoint(i, r).join(",")
      })
      .join(" ")
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[220px]">
      {/* Background grid */}
      {[0.33, 0.66, 1].map((scale) => (
        <polygon
          key={scale}
          points={polygonPoints(maxR * scale)}
          fill="none"
          stroke="var(--border)"
          strokeWidth="0.5"
          opacity="0.4"
        />
      ))}

      {/* 배경 축선 — 가이드용 (연하게) */}
      {data.map((_, i) => {
        const [px, py] = getPoint(i, maxR)
        return (
          <line
            key={`axis-bg-${i}`}
            x1={cx} y1={cy} x2={px} y2={py}
            stroke="var(--border)"
            strokeWidth="0.5"
            opacity="0.3"
          />
        )
      })}

      {/* 데이터 폴리곤 — 중립 색상으로 전체 형태 표시 */}
      <polygon
        points={dataPolygonPoints()}
        fill="var(--foreground)"
        fillOpacity="0.05"
        stroke="var(--foreground)"
        strokeWidth="0.8"
        strokeOpacity="0.2"
        strokeLinejoin="round"
      />

      {/*
        핵심: 각 원소의 스포크(spoke) — 축 위에 해당 원소 색의 굵은 선으로 값만큼만 표시.
        이 방식은 인접 원소의 영향 없이, 각 원소의 값을 독립적으로 색상 표현함.
      */}
      {data.map((d, i) => {
        const r = (d.value / maxValue) * maxR
        const [px, py] = getPoint(i, r)
        const color = ELEMENT_HEX[d.element] ?? "var(--primary)"
        return (
          <line
            key={`spoke-${d.element}`}
            x1={cx} y1={cy}
            x2={px} y2={py}
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.65"
          />
        )
      })}

      {/* 데이터 꼭짓점 dot — 오행 색상 */}
      {data.map((d, i) => {
        const r = (d.value / maxValue) * maxR
        const [px, py] = getPoint(i, r)
        const color = ELEMENT_HEX[d.element] ?? "var(--primary)"
        return (
          <circle
            key={`dot-${d.element}`}
            cx={px} cy={py}
            r="4"
            fill={color}
            stroke="var(--background)"
            strokeWidth="1.5"
          />
        )
      })}

      {/* Vertex 레이블 */}
      {data.map((d, i) => {
        const [px, py] = getPoint(i, maxR + 18)
        const color = ELEMENT_HEX[d.element] ?? "var(--muted)"
        return (
          <g key={`label-${d.element}`}>
            <circle cx={px} cy={py} r="13" fill={color} opacity="0.15" />
            <circle cx={px} cy={py} r="13" fill="none" stroke={color} strokeWidth="1" opacity="0.35" />
            <text
              x={px} y={py}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fontWeight="700"
              fill={color}
            >
              {d.element}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
