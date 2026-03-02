"use client"

import { DecisionHub } from "@/components/saju/decision-hub"
import { useRequireBirthInfo } from "@/lib/hooks/use-require-birth-info"

export default function DecisionPage() {
  const isGuarding = useRequireBirthInfo()

  if (isGuarding) return null

  return <DecisionHub />
}
