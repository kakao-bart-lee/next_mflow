"use client"

import { ExploreScreen } from "@/components/saju/explore-screen"
import { useRequireBirthInfo } from "@/lib/hooks/use-require-birth-info"

export default function ExplorePage() {
  const isGuarding = useRequireBirthInfo()

  if (isGuarding) return null

  return <ExploreScreen />
}
