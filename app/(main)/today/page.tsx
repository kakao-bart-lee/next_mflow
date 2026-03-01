"use client"

import { TodayScreen } from "@/components/saju/today-screen"
import { useRequireBirthInfo } from "@/lib/hooks/use-require-birth-info"

export default function TodayPage() {
  const isGuarding = useRequireBirthInfo()

  if (isGuarding) return null

  return <TodayScreen />
}
