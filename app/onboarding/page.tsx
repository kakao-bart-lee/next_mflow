"use client"

import { OnboardingScreen } from "@/components/saju/onboarding-screen"
import { DevToolbar } from "@/components/dev/dev-toolbar"
import { useRedirectIfOnboarded } from "@/lib/hooks/use-redirect-if-onboarded"

export default function OnboardingPage() {
  const isChecking = useRedirectIfOnboarded()

  if (isChecking) return null

  return (
    <>
      <OnboardingScreen />
      <DevToolbar />
    </>
  )
}
