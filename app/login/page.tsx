import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/saju/theme-toggle"
import { LocaleToggle } from "@/components/saju/locale-toggle"
import { Globe, ArrowRight } from "lucide-react"
import { googleSignInAction, devSignInAction } from "@/lib/auth/actions"

const SKIP_AUTH = process.env.SKIP_AUTH === "true"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl = "" } = await searchParams

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

      {/* Centered content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div
            className="mb-10 text-center"
            style={{ animation: "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" }}
          >
            <div className="mx-auto mb-6 h-px w-12 bg-foreground/15" />
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
              사주 플레이북
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              당신의 운명을 탐구하세요
            </p>
          </div>

          {/* Login card */}
          <div
            className="rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-sm"
            style={{ animation: "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both" }}
          >
            <p className="mb-6 text-center text-sm text-muted-foreground">
              계속하려면 로그인하세요
            </p>

            {SKIP_AUTH ? (
              /* Dev mode: form으로 Server Action 호출 */
              <form action={devSignInAction}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  개발자로 로그인
                </Button>
              </form>
            ) : (
              /* Production: Google OAuth */
              <form action={googleSignInAction}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <Button
                  type="submit"
                  variant="outline"
                  className="h-12 w-full rounded-xl border-border hover:bg-secondary"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Google로 계속하기
                </Button>
              </form>
            )}
          </div>

          <p
            className="mt-8 text-center text-[11px] tracking-wide text-muted-foreground/40"
            style={{ animation: "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both" }}
          >
            Saju Playbook · talelapse
          </p>
        </div>
      </div>
    </main>
  )
}
