"use client"

import { AlertTriangle, RotateCcw } from "lucide-react"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <p className="text-sm text-muted-foreground">
        예상치 못한 오류가 발생했습니다
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
        type="button"
      >
        <RotateCcw className="h-4 w-4" />
        다시 시도
      </button>
    </div>
  )
}
