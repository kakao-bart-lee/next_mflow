"use client"

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

      {/* Axis lines */}
      {data.map((_, i) => {
        const [px, py] = getPoint(i, maxR)
        return (
          <line
            key={i}
            x1={cx} y1={cy} x2={px} y2={py}
            stroke="var(--border)"
            strokeWidth="0.5"
            opacity="0.3"
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={dataPolygonPoints()}
        fill="color-mix(in srgb, var(--primary) 15%, transparent)"
        stroke="var(--primary)"
        strokeWidth="1.5"
      />

      {/* Data points */}
      {data.map((d, i) => {
        const r = (d.value / maxValue) * maxR
        const [px, py] = getPoint(i, r)
        return (
          <circle key={d.element} cx={px} cy={py} r="3" fill="var(--primary)" />
        )
      })}

      {/* Vertex labels */}
      {data.map((d, i) => {
        const [px, py] = getPoint(i, maxR + 18)
        return (
          <g key={`label-${d.element}`}>
            <circle cx={px} cy={py} r="12" fill="var(--primary)" opacity="0.15" />
            <text
              x={px} y={py}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fontWeight="600"
              fill="var(--foreground)"
            >
              {d.element}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
