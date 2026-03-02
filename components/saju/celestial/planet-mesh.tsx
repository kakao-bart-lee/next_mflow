"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import type { Group, Mesh } from "three"

interface PlanetMeshProps {
  index: number
  color: string
  size: number
  orbitRadius: number
  degree: number
  rotationSpeed: number
  /** 공전 속도 (rad/s). entry animation 완료 후 적용됩니다. */
  orbitSpeed: number
  texturePath: string
  isActive: boolean
  onClick: () => void
}

/** Spring-like overshoot easing (for initial entry) */
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const ENTRY_DURATION = 1.4
const ENTRY_STAGGER = 0.12

export function PlanetMesh({
  index,
  color,
  size,
  orbitRadius,
  degree,
  rotationSpeed,
  orbitSpeed,
  texturePath,
  isActive,
  onClick,
}: PlanetMeshProps) {
  const groupRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const elapsed = useRef(0)
  const pointerDownAt = useRef(0)

  // 공전 각도: degree 기반으로 초기화, entry 완료 후 orbitSpeed로 누적
  const currentOrbitAngle = useRef(((degree - 90) * Math.PI) / 180)

  // Smooth size transition via scale (geometry stays constant at initial size)
  const baseSize = useRef(size)
  const currentScale = useRef(1)
  const targetScale = useRef(1)

  const texture = useTexture(texturePath)

  useFrame((_, delta) => {
    elapsed.current += delta

    // Update target scale when size prop changes
    targetScale.current = size / baseSize.current

    // Lerp scale toward target (for size mode transitions)
    if (Math.abs(currentScale.current - targetScale.current) > 0.001) {
      currentScale.current += (targetScale.current - currentScale.current) * Math.min(1, delta * 6)
      if (meshRef.current) {
        meshRef.current.scale.setScalar(currentScale.current)
      }
    }

    const entryT = Math.max(0, elapsed.current - index * ENTRY_STAGGER)
    const entryProgress = Math.min(1, entryT / ENTRY_DURATION)

    if (entryProgress >= 1) {
      // Entry 완료 후: 개별 공전 속도로 각도 누적
      currentOrbitAngle.current += delta * orbitSpeed
    }

    const angleRad = currentOrbitAngle.current
    const tgtX = Math.cos(angleRad) * orbitRadius
    const tgtZ = Math.sin(angleRad) * orbitRadius

    if (groupRef.current) {
      if (entryProgress < 1) {
        // Phase 1: Initial entry — spring from center to orbit (초기 각도 기준)
        const initialAngle = ((degree - 90) * Math.PI) / 180
        const initX = Math.cos(initialAngle) * orbitRadius
        const initZ = Math.sin(initialAngle) * orbitRadius
        const eased = easeOutBack(entryProgress)
        groupRef.current.position.x = initX * eased
        groupRef.current.position.z = initZ * eased
      } else {
        // Phase 2+: 공전 궤도 추적
        groupRef.current.position.x = tgtX
        groupRef.current.position.z = tgtZ
      }
    }

    // Self-rotation around Y axis
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * rotationSpeed
    }
  })

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onPointerDown={() => {
          pointerDownAt.current = performance.now()
        }}
        onClick={(e) => {
          // Only register as click if press was short (< 250ms), not a drag
          if (performance.now() - pointerDownAt.current < 250) {
            e.stopPropagation()
            onClick()
          }
        }}
      >
        <sphereGeometry args={[baseSize.current, 32, 32]} />
        <meshStandardMaterial
          map={texture}
          emissive={color}
          emissiveIntensity={isActive ? 0.4 : 0.08}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      {/* Selection ring when active — scales with current size */}
      {isActive && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={currentScale.current}>
          <ringGeometry args={[baseSize.current + 0.06, baseSize.current + 0.09, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  )
}
