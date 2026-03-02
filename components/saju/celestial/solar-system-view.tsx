"use client"

import dynamic from "next/dynamic"
import type { PlanetSizeMode } from "./scene"

const SolarSystemScene = dynamic(
  () => import("./scene").then((mod) => ({ default: mod.SolarSystemScene })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  },
)

interface SolarSystemViewProps {
  activePlanetIdx: number | null
  onPlanetClick: (i: number) => void
  /**
   * Optional zodiac degrees for each planet [Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn].
   * When provided (e.g. from an ephemeris API), planets animate to the new positions.
   * Falls back to hardcoded default positions when omitted.
   */
  planetDegrees?: number[]
  /** Planet size rendering mode. Default: "influence" */
  sizeMode?: PlanetSizeMode
}

export function SolarSystemView({
  activePlanetIdx,
  onPlanetClick,
  planetDegrees,
  sizeMode,
}: SolarSystemViewProps) {
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[480px] sm:max-w-[520px] rounded-xl overflow-hidden bg-[#07070f]">
      <SolarSystemScene
        activePlanetIdx={activePlanetIdx}
        onPlanetClick={onPlanetClick}
        planetDegrees={planetDegrees}
        sizeMode={sizeMode}
      />
    </div>
  )
}
