"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { LogOut, Settings, User } from "lucide-react"
import { logoutAction } from "@/lib/auth/actions"
import { useSaju } from "@/lib/contexts/saju-context"
import { BottomNav } from "@/components/saju/bottom-nav"
import { DevToolbar } from "@/components/dev/dev-toolbar"
import { ThemeToggle } from "@/components/saju/theme-toggle"
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

  function handleLogout(): void {
    clearData()
    logoutAction()
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-end px-5 py-3">
        <div className="pointer-events-auto flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary"
                aria-label="프로필 및 설정"
              >
                <User className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
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
      </header>
      <main className="flex-1 overflow-y-auto pb-20 pt-14">
        {children}
      </main>
      <BottomNav />
      <DevToolbar />
    </div>
  )
}
