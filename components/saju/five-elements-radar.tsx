"use client"

interface RadarDataPoint {
  element: string
  label: string
  value: number
}

interface FiveElementsRadarProps {
  data: RadarDataPoint[]
}

// 오행 전통 색상
const ELEMENT_COLORS: Record<string, string> = {
  목: "#22c55e", // 木 — 초록
  화: "#ef4444", // 火 — 빨강
  토: "#eab308", // 土 — 노랑
  금: "#94a3b8", // 金 — 은빛
  수: "#3b82f6", // 水 — 파랑
}

export function FiveElementsRadar({ data }: FiveElementsRadarProps) {
  if (data.length !== 5) return null

  const size = 220
  const cx = size / 2
  const cy = size / 2
  const maxR = 80
  const angleOffset = -Math.PI / 2 // start from top

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
      <defs>
        {/* 각 오행별 radial gradient — 배경 섹터 glow */}
        {data.map((d) => {
          const color = ELEMENT_COLORS[d.element] ?? "#888"
          return (
            <radialGradient key={`grad-${d.element}`} id={`grad-${d.element}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.04" />
            </radialGradient>
          )
        })}
      </defs>

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

      {/* Axis lines — 각 오행 색상 */}
      {data.map((d, i) => {
        const [px, py] = getPoint(i, maxR)
        const color = ELEMENT_COLORS[d.element] ?? "var(--border)"
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={px}
            y2={py}
            stroke={color}
            strokeWidth="1"
            opacity="0.5"
          />
        )
      })}

      {/* 데이터 영역 — 5개 삼각형 섹터, 각 오행 색상 */}
      {data.map((d, i) => {
        const r = (d.value / maxValue) * maxR
        const nextIdx = (i + 1) % 5
        const nextR = (data[nextIdx].value / maxValue) * maxR
        const [px, py] = getPoint(i, r)
        const [nx, ny] = getPoint(nextIdx, nextR)
        const color = ELEMENT_COLORS[d.element] ?? "#888"
        return (
          <polygon
            key={`sector-${i}`}
            points={`${cx},${cy} ${px},${py} ${nx},${ny}`}
            fill={color}
            opacity="0.35"
          />
        )
      })}

      {/* 데이터 폴리곤 외곽선 */}
      <polygon
        points={dataPolygonPoints()}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="1"
        opacity="0.3"
        strokeLinejoin="round"
      />

      {/* 데이터 꼭짓점 — 오행 색상 원 */}
      {data.map((d, i) => {
        const r = (d.value / maxValue) * maxR
        const [px, py] = getPoint(i, r)
        const color = ELEMENT_COLORS[d.element] ?? "var(--primary)"
        return (
          <circle
            key={`dot-${d.element}`}
            cx={px}
            cy={py}
            r="4"
            fill={color}
            stroke="var(--background)"
            strokeWidth="1.5"
          />
        )
      })}

      {/* Vertex labels */}
      {data.map((d, i) => {
        const [px, py] = getPoint(i, maxR + 18)
        const color = ELEMENT_COLORS[d.element] ?? "var(--muted)"
        return (
          <g key={`label-${d.element}`}>
            <circle
              cx={px}
              cy={py}
              r="13"
              fill={color}
              opacity="0.18"
            />
            <circle
              cx={px}
              cy={py}
              r="13"
              fill="none"
              stroke={color}
              strokeWidth="1"
              opacity="0.4"
            />
            <text
              x={px}
              y={py}
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
