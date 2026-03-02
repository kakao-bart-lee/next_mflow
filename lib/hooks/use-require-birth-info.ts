"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSaju } from "@/lib/contexts/saju-context"

/**
 * Guard hook for (main) tab pages.
 * Redirects to "/" if no birthInfo is found after hydration.
 * Returns `true` while still checking (show nothing), `false` when safe to render.
 */
export function useRequireBirthInfo(): boolean {
  const { birthInfo, isHydrated } = useSaju()
  const router = useRouter()

  useEffect(() => {
    if (isHydrated && !birthInfo) {
      router.replace("/onboarding")
    }
  }, [isHydrated, birthInfo, router])

  return !isHydrated || !birthInfo
}
