"use client"

import { Fragment, Suspense, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stars, useTexture } from "@react-three/drei"
import { OrbitLine } from "./orbit-line"
import { PlanetMesh } from "./planet-mesh"
import type { Mesh } from "three"

/* ─── Planet layout ─── */

/**
 * Default zodiac degrees (hardcoded from current PLANET_POSITIONS).
 * Used as fallback when no external degrees are provided.
 * Order: [0]Sun, [1]Moon, [2]Mercury, [3]Venus, [4]Mars, [5]Jupiter, [6]Saturn
 */
export const DEFAULT_PLANET_DEGREES = [340, 95, 310, 15, 68, 62, 345]

/**
 * Orbiting bodies in heliocentric order (Sun at center, not here).
 * posIdx maps to PLANET_POSITIONS[] / DEFAULT_PLANET_DEGREES[] in explore-screen.
 *
 *   Body      Real AU   sqrt    visual radius
 *   ☿ Mercury 0.39      0.62    0.85
 *   ♀ Venus   0.72      0.85    1.10
 *   ☽ Moon    1.00*     1.00    1.40  (* Earth's orbit — Moon shown as proxy)
 *   ♂ Mars    1.52      1.23    2.00  ← inner/outer 경계
 *   ♃ Jupiter 5.20      2.28    2.90  ← 가스 거성 도약
 *   ♄ Saturn  9.54      3.09    3.40
 */
/**
 * Size modes:
 *   physical   — log-scaled real diameters (Jupiter/Saturn dominate)
 *   influence  — astrological weight tiers (Luminaries > Benefics > Malefics)
 */
export type PlanetSizeMode = "physical" | "influence"

// orbitSpeed: rad/s, 실제 공전 주기 비율 기반 (달 27일 → 토성 10759일)
// 시각적으로 차이가 드러나도록 log 스케일 적용
const ORBITING_PLANETS = [
  { posIdx: 2, color: "#8B93A1", physicalSize: 0.06, influenceSize: 0.09, orbitRadius: 0.85, rotSpeed: 0.25, orbitSpeed: 0.28, texture: "/textures/planets/mercury.jpg" },
  { posIdx: 3, color: "#D4886C", physicalSize: 0.09, influenceSize: 0.11, orbitRadius: 1.10, rotSpeed: 0.15, orbitSpeed: 0.13, texture: "/textures/planets/venus.jpg" },
  { posIdx: 1, color: "#C4C9D2", physicalSize: 0.05, influenceSize: 0.16, orbitRadius: 1.40, rotSpeed: 0.18, orbitSpeed: 0.08, texture: "/textures/planets/moon.jpg" },
  { posIdx: 4, color: "#C15839", physicalSize: 0.07, influenceSize: 0.10, orbitRadius: 2.00, rotSpeed: 0.20, orbitSpeed: 0.055, texture: "/textures/planets/mars.jpg" },
  { posIdx: 5, color: "#B8935A", physicalSize: 0.18, influenceSize: 0.14, orbitRadius: 2.90, rotSpeed: 0.08, orbitSpeed: 0.018, texture: "/textures/planets/jupiter.jpg" },
  { posIdx: 6, color: "#A89670", physicalSize: 0.16, influenceSize: 0.12, orbitRadius: 3.40, rotSpeed: 0.06, orbitSpeed: 0.007, texture: "/textures/planets/saturn.jpg" },
]

/* ─── Central Sun (clickable, shows Sun info at index 0) ─── */

function CentralSun({
  isActive,
  onClick,
}: {
  isActive: boolean
  onClick: () => void
}) {
  const sunTexture = useTexture("/textures/planets/sun.jpg")
  const meshRef = useRef<Mesh>(null)
  const pointerDownAt = useRef(0)

  return (
    <group>
      <mesh
        ref={meshRef}
        onPointerDown={() => {
          pointerDownAt.current = performance.now()
        }}
        onClick={(e) => {
          if (performance.now() - pointerDownAt.current < 250) {
            e.stopPropagation()
            onClick()
          }
        }}
      >
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          map={sunTexture}
          emissive="#E8A838"
          emissiveMap={sunTexture}
          emissiveIntensity={isActive ? 2.2 : 1.5}
          toneMapped={false}
        />
      </mesh>
      {/* Soft glow halo */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshBasicMaterial color="#E8A838" transparent opacity={0.06} />
      </mesh>
      {/* Selection ring */}
      {isActive && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.30, 0.34, 32]} />
          <meshBasicMaterial color="#E8A838" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  )
}

/* ─── Scene internals ─── */

interface SceneProps {
  activePlanetIdx: number | null
  onPlanetClick: (i: number) => void
  /** Optional zodiac degrees per planet. Falls back to DEFAULT_PLANET_DEGREES. */
  planetDegrees?: number[]
  /** Planet size rendering mode. Default: "influence" */
  sizeMode?: PlanetSizeMode
}

function SceneContent({ activePlanetIdx, onPlanetClick, planetDegrees, sizeMode = "influence" }: SceneProps) {
  const degrees = planetDegrees ?? DEFAULT_PLANET_DEGREES

  return (
    <>
      {/* Starfield backdrop */}
      <Stars
        radius={60}
        depth={50}
        count={1500}
        factor={3}
        saturation={0.1}
        fade
        speed={0.3}
      />

      {/* Ambient fill + warm point light from the sun */}
      <ambientLight intensity={0.35} />
      <pointLight
        position={[0, 2, 0]}
        intensity={1.5}
        color="#E8A838"
        distance={12}
        decay={2}
      />

      <Suspense fallback={null}>
        {/* Central sun — clickable, maps to PLANET_POSITIONS[0] */}
        <CentralSun
          isActive={activePlanetIdx === 0}
          onClick={() => onPlanetClick(0)}
        />

        {/* Orbiting planets — Moon through Saturn (indices 1-6) */}
        {ORBITING_PLANETS.map((cfg, i) => (
          <Fragment key={cfg.posIdx}>
            <OrbitLine radius={cfg.orbitRadius} />
            <PlanetMesh
              index={i}
              color={cfg.color}
              size={sizeMode === "physical" ? cfg.physicalSize : cfg.influenceSize}
              orbitRadius={cfg.orbitRadius}
              degree={degrees[cfg.posIdx] ?? DEFAULT_PLANET_DEGREES[cfg.posIdx]}
              rotationSpeed={cfg.rotSpeed}
              orbitSpeed={cfg.orbitSpeed}
              texturePath={cfg.texture}
              isActive={activePlanetIdx === cfg.posIdx}
              onClick={() => onPlanetClick(cfg.posIdx)}
            />
          </Fragment>
        ))}
      </Suspense>

      {/* Slightly tilted top-view camera controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        makeDefault
      />
    </>
  )
}

/* ─── Exported Canvas wrapper (loaded via dynamic import) ─── */

export function SolarSystemScene({ activePlanetIdx, onPlanetClick, planetDegrees, sizeMode }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 6, 3.2], fov: 50 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <SceneContent
        activePlanetIdx={activePlanetIdx}
        onPlanetClick={onPlanetClick}
        planetDegrees={planetDegrees}
        sizeMode={sizeMode}
      />
    </Canvas>
  )
}
