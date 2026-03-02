"use client"

import { DebateScreen } from "@/components/saju/debate-screen"
import { useRequireBirthInfo } from "@/lib/hooks/use-require-birth-info"

export default function DebatePage() {
  const isGuarding = useRequireBirthInfo()

  if (isGuarding) return null

  return <DebateScreen />
}
