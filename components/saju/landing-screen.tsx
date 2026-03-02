"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { LocaleToggle } from "./locale-toggle"
import { useLocale } from "@/lib/contexts/locale-context"
import { StarfieldBg } from "@/components/starfield-bg"
import { MoonIcon } from "@/components/moon-icon"

export function LandingScreen() {
  const router = useRouter()
  const { t } = useLocale()
  const msg = t.onboarding

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      {/* Animated starfield */}
      <StarfieldBg />

      {/* Ambient radial glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%)",
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
          {/* Moon icon */}
          <div
            className="mb-6 flex justify-center"
            style={{ animation: "fade-in-up 0.6s ease-out 0ms both" }}
          >
            <MoonIcon size={80} />
          </div>

          {/* Decorative line */}
          <div
            className="mx-auto mb-8 h-px w-12 origin-center bg-primary/30"
            style={{ animation: "line-grow 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both" }}
          />

          {/* Brand */}
          <h1
            className="font-serif text-[2.25rem] font-bold tracking-tight text-foreground sm:text-[2.75rem]"
            style={{ animation: "fade-in-up 0.6s ease-out 100ms both" }}
          >
            {msg.brand}
          </h1>

          <p
            className="mx-auto mt-5 max-w-[22rem] text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ animation: "fade-in-up 0.6s ease-out 250ms both" }}
          >
            {msg.tagline}
          </p>

          {/* CTA */}
          <div
            className="mt-12 flex flex-col items-center gap-3"
            style={{ animation: "fade-in-up 0.6s ease-out 400ms both" }}
          >
            <Button
              onClick={() => router.push("/login")}
              className="animate-glow-pulse h-14 w-full max-w-[16rem] rounded-xl px-10 font-semibold transition-all hover:brightness-110"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {t.common.start}
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/today?demo=true")}
              className="h-9 rounded-xl border border-border/40 bg-card/20 px-6 text-sm text-muted-foreground backdrop-blur-sm hover:bg-card/40 hover:text-foreground"
            >
              먼저 둘러보기
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Existing user login */}
          <div
            className="mt-6"
            style={{ animation: "fade-in-up 0.6s ease-out 500ms both" }}
          >
            <Link
              href="/login"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>

          {/* Footer note */}
          <p
            className="mt-10 text-[11px] tracking-wide text-muted-foreground/40"
            style={{ animation: "fade-in-up 0.6s ease-out 550ms both" }}
          >
            Saju Playbook · talelapse
          </p>
        </div>
      </div>
    </main>
  )
}
