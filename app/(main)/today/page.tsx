"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { TodayScreen } from "@/components/saju/today-screen"
import { useRequireBirthInfo } from "@/lib/hooks/use-require-birth-info"
import { useSaju } from "@/lib/contexts/saju-context"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

/** 데모 배너: 가입 유도 CTA */
function DemoBanner() {
  return (
    <div className="sticky top-14 z-20 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur-sm text-sm">
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
function DemoTodayPage() {
  const { initDemoMode, isHydrated } = useSaju()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isHydrated) return
    initDemoMode().then(() => setReady(true))
  }, [isHydrated, initDemoMode])

  if (!ready) return null

  return (
    <>
      <DemoBanner />
      <TodayScreen />
    </>
  )
}

/** 실제 사용자 모드: birthInfo 없으면 홈으로 redirect */
function RealTodayPage() {
  const isGuarding = useRequireBirthInfo()
  if (isGuarding) return null
  return <TodayScreen />
}

function TodayPageInner() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get("demo") === "true"

  return isDemo ? <DemoTodayPage /> : <RealTodayPage />
}

export default function TodayPage() {
  return (
    <Suspense>
      <TodayPageInner />
    </Suspense>
  )
}
