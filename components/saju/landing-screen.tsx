"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { LocaleToggle } from "./locale-toggle"
import { useLocale } from "@/lib/contexts/locale-context"

export function LandingScreen() {
  const router = useRouter()
  const { t } = useLocale()
  const msg = t.onboarding

  return (
    <main className="relative flex min-h-svh flex-col bg-background">
      {/* Ambient warm glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, var(--gradient-warm), transparent)",
        }}
      />

      {/* Top-right controls */}
      <div className="fixed right-5 top-5 z-50 flex items-center gap-2">
        <LocaleToggle />
        <ThemeToggle />
      </div>

      {/* Centered hero content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 sm:py-20">
        <div className="w-full max-w-[32rem] text-center">
          {/* Decorative line */}
          <div
            className="mx-auto mb-8 h-px w-12 origin-center bg-foreground/15"
            style={{
              animation:
                "line-grow 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both",
            }}
          />

          {/* Brand */}
          <h1
            className="font-serif text-[2.25rem] font-bold tracking-tight text-foreground sm:text-[2.75rem]"
            style={{
              animation:
                "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
            }}
          >
            {msg.brand}
          </h1>

          <p
            className="mx-auto mt-5 max-w-[22rem] text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{
              animation:
                "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both",
            }}
          >
            {msg.tagline}
          </p>

          {/* CTA */}
          <div
            className="mt-12 flex flex-col items-center gap-3"
            style={{
              animation:
                "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both",
            }}
          >
            <Button
              onClick={() => router.push("/login")}
              className="h-14 w-full max-w-[16rem] rounded-xl bg-foreground px-10 font-medium text-background transition-all hover:bg-foreground/90"
            >
              {t.common.start}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/today?demo=true")}
              className="h-9 rounded-xl px-6 text-sm text-muted-foreground hover:text-foreground"
            >
              먼저 둘러보기
            </Button>
          </div>

          {/* 기존 사용자 로그인 링크 */}
          <div
            className="mt-6"
            style={{
              animation:
                "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both",
            }}
          >
            <Link
              href="/login"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
            >
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>

          {/* Subtle footer note */}
          <p
            className="mt-10 text-[11px] tracking-wide text-muted-foreground/40"
            style={{
              animation:
                "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both",
            }}
          >
            Saju Playbook · talelapse
          </p>
        </div>
      </div>
    </main>
  )
}
