"use client"

import { useRouter } from "next/navigation"
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
            className="mt-12"
            style={{
              animation:
                "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both",
            }}
          >
            <Button
              onClick={() => router.push("/onboarding")}
              className="h-14 rounded-xl bg-foreground px-10 font-medium text-background transition-all hover:bg-foreground/90"
            >
              {t.common.start}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Subtle footer note */}
          <p
            className="mt-16 text-[11px] tracking-wide text-muted-foreground/40"
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
