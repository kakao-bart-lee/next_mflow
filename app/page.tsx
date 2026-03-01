"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { SajuProvider, useSaju } from "@/lib/contexts/saju-context"
import { OnboardingScreen } from "@/components/saju/onboarding-screen"
import { AppShell } from "@/components/saju/app-shell"
import { AlertTriangle, RotateCcw } from "lucide-react"

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground">
            예상치 못한 오류가 발생했습니다
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
            다시 시도
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function HomeContent() {
  const { birthInfo, setBirthInfo } = useSaju()

  if (!birthInfo) {
    return <OnboardingScreen onComplete={setBirthInfo} />
  }

  return <AppShell />
}

export default function Home() {
  return (
    <ErrorBoundary>
      <SajuProvider>
        <HomeContent />
      </SajuProvider>
    </ErrorBoundary>
  )
}
