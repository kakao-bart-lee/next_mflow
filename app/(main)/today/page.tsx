"use client"

import { Suspense, useEffect, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Sparkles } from "lucide-react"
import { useSaju } from "@/lib/contexts/saju-context"
import { useRequireBirthInfo } from "@/lib/hooks/use-require-birth-info"
import { TodayScreen } from "@/components/saju/today-screen"
import { Button } from "@/components/ui/button"

/** 데모 배너: 가입 유도 CTA */
function DemoBanner(): ReactNode {
  return (
    <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2.5 text-sm backdrop-blur-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        <span>샘플 사주로 체험 중입니다</span>
      </div>
      <Button asChild size="sm" className="h-7 rounded-lg px-3 text-xs">
        <Link href="/login">내 사주 시작하기</Link>
      </Button>
    </div>
  )
}

/** 데모 모드: SajuContext에 샘플 데이터 로드 후 화면 표시 */
function DemoTodayPage(): ReactNode {
  const { initDemoMode, isHydrated } = useSaju()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isHydrated) return

    let cancelled = false
    initDemoMode().then(() => {
      if (!cancelled) setReady(true)
    })
    return () => { cancelled = true }
  }, [isHydrated, initDemoMode])

  if (!ready) return null

  return (
    <>
      <DemoBanner />
      <TodayScreen />
    </>
  )
}

/** 실제 사용자 모드: birthInfo 없으면 온보딩으로 redirect */
function RealTodayPage(): ReactNode {
  const isGuarding = useRequireBirthInfo()
  if (isGuarding) return null
  return <TodayScreen />
}

function TodayPageInner(): ReactNode {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get("demo") === "true"

  return isDemo ? <DemoTodayPage /> : <RealTodayPage />
}

export default function TodayPage(): ReactNode {
  return (
    <Suspense fallback={null}>
      <TodayPageInner />
    </Suspense>
  )
}
