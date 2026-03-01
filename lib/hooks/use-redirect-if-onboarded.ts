"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSaju } from "@/lib/contexts/saju-context"

/**
 * Guard hook for landing & onboarding pages.
 * Redirects to "/today" if birthInfo already exists after hydration.
 * Returns `true` while still checking, `false` when safe to render.
 */
export function useRedirectIfOnboarded(): boolean {
  const { birthInfo, isHydrated } = useSaju()
  const router = useRouter()

  useEffect(() => {
    if (isHydrated && birthInfo) {
      router.replace("/today")
    }
  }, [isHydrated, birthInfo, router])

  return !isHydrated
}
