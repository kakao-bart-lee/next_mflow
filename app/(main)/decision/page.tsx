"use client"

import { DecisionHelper } from "@/components/saju/decision-helper"
import { useRequireBirthInfo } from "@/lib/hooks/use-require-birth-info"

export default function DecisionPage() {
  const isGuarding = useRequireBirthInfo()

  if (isGuarding) return null

  return <DecisionHelper />
}
