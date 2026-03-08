"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFortune } from "@/lib/contexts/fortune-context"

/**
 * Guard hook for (main) tab pages.
 * Redirects to "/" if no birthInfo is found after hydration.
 * Returns `true` while still checking (show nothing), `false` when safe to render.
 */
export function useRequireBirthInfo(): boolean {
  const { birthInfo, isHydrated } = useFortune()
  const router = useRouter()

  useEffect(() => {
    if (isHydrated && !birthInfo) {
      router.replace("/onboarding")
    }
  }, [isHydrated, birthInfo, router])

  return !isHydrated || !birthInfo
}
