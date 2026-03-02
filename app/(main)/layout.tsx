"use client"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { LogOut, Settings, User } from "lucide-react"
import { logoutAction } from "@/lib/auth/actions"
import { useSaju } from "@/lib/contexts/saju-context"
import { BottomNav } from "@/components/saju/bottom-nav"
import { DevToolbar } from "@/components/dev/dev-toolbar"
import { ThemeToggle } from "@/components/saju/theme-toggle"
import { StarfieldBg } from "@/components/starfield-bg"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps): ReactNode {
  const { clearData } = useSaju()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  function handleLogout(): void {
    clearData()
    logoutAction()
  }

  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-background">
      {/* Animated starfield background */}
      <StarfieldBg />

      {/* Ambient radial gradient overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 20%, color-mix(in srgb, var(--primary) 8%, transparent), transparent 70%)",
        }}
      />

      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-border/20 bg-background/60 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-5">
          {/* Logo */}
          <Link
            href="/today"
            className="font-serif text-base font-semibold text-foreground/90 transition-opacity hover:opacity-70"
          >
            Saju Playbook
          </Link>

          {/* Controls */}
          {mounted && (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-card/60 text-foreground backdrop-blur-sm transition-colors hover:bg-secondary"
                    aria-label="프로필 및 설정"
                  >
                    <User className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 border-border/40 bg-card/90 backdrop-blur-xl">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      프로필 및 설정
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      {/* Scrollable content */}
      <main className="relative z-10 flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <BottomNav />
      <DevToolbar />
    </div>
  )
}
