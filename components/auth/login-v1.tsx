"use client"

import { Button } from "@/components/ui/button"
import { StarfieldBg } from "@/components/starfield-bg"
import { MoonIcon } from "@/components/moon-icon"
import { ThemeToggle } from "@/components/saju/theme-toggle"
import { LocaleToggle } from "@/components/saju/locale-toggle"
import { googleSignInAction, twitterSignInAction, kakaoSignInAction, devSignInAction } from "@/lib/auth/actions"
import { Globe, ArrowRight, MessageCircle } from "lucide-react"

interface EnabledProviders {
  google: boolean
  twitter: boolean
  kakao: boolean
}

interface LoginV1Props {
  skipAuth: boolean
  callbackUrl: string
  enabledProviders: EnabledProviders
}

export function LoginV1({ skipAuth, callbackUrl, enabledProviders }: LoginV1Props) {
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

            <div className="space-y-3">
              {enabledProviders.google && (
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
              {enabledProviders.twitter && (
                <form action={twitterSignInAction}>
                  <input type="hidden" name="callbackUrl" value={callbackUrl} />
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-12 w-full rounded-xl border-border/40 hover:bg-secondary"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X로 계속하기
                  </Button>
                </form>
              )}
              {enabledProviders.kakao && (
                <form action={kakaoSignInAction}>
                  <input type="hidden" name="callbackUrl" value={callbackUrl} />
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-12 w-full rounded-xl border-border/40 bg-[#FEE500]/10 hover:bg-[#FEE500]/20"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    카카오로 계속하기
                  </Button>
                </form>
              )}
              {skipAuth && (
                <>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
                    <div className="relative flex justify-center"><span className="bg-card/80 px-3 text-[11px] text-muted-foreground/50">DEV</span></div>
                  </div>
                  <form action={devSignInAction}>
                    <input type="hidden" name="callbackUrl" value={callbackUrl} />
                    <Button
                      type="submit"
                      variant="ghost"
                      className="h-10 w-full rounded-xl text-muted-foreground hover:text-foreground"
                    >
                      <ArrowRight className="mr-2 h-3.5 w-3.5" />
                      개발자로 로그인
                    </Button>
                  </form>
                </>
              )}
            </div>
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
