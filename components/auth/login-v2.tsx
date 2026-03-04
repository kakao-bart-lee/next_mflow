"use client"

import { Button } from "@/components/ui/button"
import { MeteorShower } from "./meteor-shower"
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

interface LoginV2Props {
  skipAuth: boolean
  callbackUrl: string
  enabledProviders: EnabledProviders
}

export function LoginV2({ skipAuth, callbackUrl, enabledProviders }: LoginV2Props) {
  return (
    <main className="flex min-h-svh bg-background">
      {/* Left — visual panel (hidden on mobile) */}
      <div
        className="relative hidden flex-1 overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--background)), color-mix(in srgb, var(--accent) 6%, var(--background)))",
        }}
      >
        <MeteorShower />
        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          <MoonIcon size={80} className="mb-6 text-primary animate-float" />
          <h2 className="font-serif text-3xl font-bold text-foreground">
            별이 말하는 오늘
          </h2>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            사주와 점성술이 만나 당신의 하루를 비춰줍니다
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 lg:max-w-md">
        {/* Top controls */}
        <div className="absolute right-5 top-5 flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          {/* Mobile brand (hidden on desktop where left panel shows it) */}
          <div className="mb-10 text-center lg:hidden">
            <MoonIcon size={48} className="mx-auto mb-4 text-primary animate-float" />
          </div>

          <h1 className="font-serif text-2xl font-bold text-foreground">로그인</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            moonlit에 오신 것을 환영합니다
          </p>

          <div className="mt-8">
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
                    <div className="relative flex justify-center"><span className="bg-background px-3 text-[11px] text-muted-foreground/50">DEV</span></div>
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

          <p className="mt-12 text-center text-[11px] tracking-wide text-muted-foreground/40">
            moonlit · talelapse
          </p>
        </div>
      </div>
    </main>
  )
}
