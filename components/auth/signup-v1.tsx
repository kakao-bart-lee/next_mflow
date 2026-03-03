"use client"

import { Button } from "@/components/ui/button"
import { StarfieldBg } from "@/components/starfield-bg"
import { MoonIcon } from "@/components/moon-icon"
import { ThemeToggle } from "@/components/saju/theme-toggle"
import { LocaleToggle } from "@/components/saju/locale-toggle"
import { googleSignInAction, devSignInAction } from "@/lib/auth/actions"
import { Globe, ArrowRight } from "lucide-react"
import Link from "next/link"

interface SignupV1Props {
  skipAuth: boolean
}

export function SignupV1({ skipAuth }: SignupV1Props) {
  return (
    <main className="relative flex min-h-svh flex-col bg-background">
      <StarfieldBg />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, color-mix(in srgb, var(--primary) 12%, transparent), transparent)",
        }}
      />

      <div className="fixed right-5 top-5 z-50 flex items-center gap-2">
        <LocaleToggle />
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center animate-fade-in-up">
            <MoonIcon size={48} className="mx-auto mb-4 text-primary animate-float" />
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
              별자리 여정을 시작하세요
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              사주와 점성술이 만나는 곳
            </p>
          </div>

          <div
            className="animate-glow-pulse rounded-2xl border border-border/40 bg-card/80 p-8 backdrop-blur-xl"
            style={{ animation: "fade-in-up 0.6s ease-out 0.2s both" }}
          >
            <p className="mb-6 text-center text-sm text-muted-foreground">
              계정을 만들고 운세를 확인하세요
            </p>

            {skipAuth ? (
              <form action={devSignInAction}>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  개발자로 시작하기
                </Button>
              </form>
            ) : (
              <form action={googleSignInAction}>
                <Button
                  type="submit"
                  variant="outline"
                  className="h-12 w-full rounded-xl border-border/40 hover:bg-secondary"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Google로 가입하기
                </Button>
              </form>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
