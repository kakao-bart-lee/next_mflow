"use client"

import { WeekScreen } from "@/components/saju/week-screen"
import { useRequireBirthInfo } from "@/lib/hooks/use-require-birth-info"

export default function WeekPage() {
  const isGuarding = useRequireBirthInfo()

  if (isGuarding) return null

  return <WeekScreen />
}
