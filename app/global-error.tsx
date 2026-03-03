"use client"

import { RotateCcw } from "lucide-react"

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body className="bg-[#0B0D17] text-white">
        <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-10 backdrop-blur-xl">
            <p className="text-4xl">🌙</p>
            <h2 className="mt-4 text-xl font-semibold">
              별빛이 잠시 흐려졌습니다
            </h2>
            <p className="mt-3 text-sm text-white/60">
              예상치 못한 오류가 발생했습니다.
            </p>
            <button
              onClick={reset}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/20"
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
