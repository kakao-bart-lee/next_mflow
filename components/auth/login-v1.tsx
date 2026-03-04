"use client"

import { Button } from "@/components/ui/button"
import { StarfieldBg } from "@/components/starfield-bg"
import { MoonIcon } from "@/components/moon-icon"
import { ThemeToggle } from "@/components/saju/theme-toggle"
import { LocaleToggle } from "@/components/saju/locale-toggle"
import { googleSignInAction, devSignInAction } from "@/lib/auth/actions"
import { Globe, ArrowRight } from "lucide-react"

interface LoginV1Props {
  skipAuth: boolean
  callbackUrl: string
}

export function LoginV1({ skipAuth, callbackUrl }: LoginV1Props) {
  return (
    <main className="relative flex min-h-svh flex-col bg-background">
      <StarfieldBg />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, color-mix(in srgb, var(--primary) 12%, transparent), transparent)",
        }}
      />

      {/* Top controls */}
      <div className="fixed right-5 top-5 z-50 flex items-center gap-2">
        <LocaleToggle />
        <ThemeToggle />
      </div>

      {/* Centered content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="mb-10 text-center animate-fade-in-up">
            <MoonIcon size={48} className="mx-auto mb-4 text-primary animate-float" />
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
              moonlit
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              당신의 운명을 탐구하세요
            </p>
          </div>

          {/* Login card */}
          <div
            className="animate-glow-pulse rounded-2xl border border-border/40 bg-card/80 p-8 backdrop-blur-xl"
            style={{ animation: "fade-in-up 0.6s ease-out 0.2s both" }}
          >
            <p className="mb-6 text-center text-sm text-muted-foreground">
              계속하려면 로그인하세요
            </p>

            {skipAuth ? (
              <form action={devSignInAction}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  개발자로 로그인
                </Button>
              </form>
            ) : (
              <form action={googleSignInAction}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <Button
                  type="submit"
                  variant="outline"
                  className="h-12 w-full rounded-xl border-border/40 hover:bg-secondary"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Google로 계속하기
                </Button>
              </form>
            )}
          </div>

          <p
            className="mt-8 text-center text-[11px] tracking-wide text-muted-foreground/40"
            style={{ animation: "fade-in-up 0.6s ease-out 0.4s both" }}
          >
            moonlit · talelapse
          </p>
        </div>
      </div>
    </main>
  )
}
