"use client"

import { RotateCcw } from "lucide-react"
import { MoonIcon } from "@/components/moon-icon"

export default function MainError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <MoonIcon size={56} className="mb-6 text-primary animate-float" />

      <div className="animate-glow-pulse rounded-2xl border border-border/40 bg-card/80 px-8 py-10 backdrop-blur-xl">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          별빛이 잠시 흐려졌습니다
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border/40 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
          다시 시도
        </button>
      </div>
    </div>
  )
}
