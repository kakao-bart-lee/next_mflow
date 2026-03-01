"use client"

import { useMemo } from "react"
import { Line } from "@react-three/drei"

interface OrbitLineProps {
  radius: number
}

export function OrbitLine({ radius }: OrbitLineProps) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = []
    const segments = 96
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      pts.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius])
    }
    return pts
  }, [radius])

  return (
    <Line
      points={points}
      color="#888888"
      lineWidth={0.5}
      transparent
      opacity={0.15}
      raycast={() => null}
    />
  )
}
