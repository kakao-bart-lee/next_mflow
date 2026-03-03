"use client"

import { Button } from "@/components/ui/button"
import { MeteorShower } from "./meteor-shower"
import { MoonIcon } from "@/components/moon-icon"
import { ThemeToggle } from "@/components/saju/theme-toggle"
import { LocaleToggle } from "@/components/saju/locale-toggle"
import { googleSignInAction, devSignInAction } from "@/lib/auth/actions"
import { Globe, ArrowRight } from "lucide-react"
import Link from "next/link"

interface SignupV2Props {
  skipAuth: boolean
}

export function SignupV2({ skipAuth }: SignupV2Props) {
  return (
    <main className="flex min-h-svh bg-background">
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
            별자리 여정의 시작
          </h2>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            동양의 사주와 서양의 점성술을 하나의 시선으로
          </p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 lg:max-w-md">
        <div className="absolute right-5 top-5 flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-10 text-center lg:hidden">
            <MoonIcon size={48} className="mx-auto mb-4 text-primary animate-float" />
          </div>

          <h1 className="font-serif text-2xl font-bold text-foreground">회원가입</h1>
          <p className="mt-2 text-sm text-muted-foreground">별자리 여정을 시작하세요</p>

          <div className="mt-8">
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

            <p className="mt-6 text-center text-xs text-muted-foreground">
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
