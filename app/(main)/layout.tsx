"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { User, LogOut, Settings } from "lucide-react"
import { useSaju } from "@/lib/contexts/saju-context"

export default function MainLayout({ children }: { children: ReactNode }) {
  const { clearData } = useSaju()
  const router = useRouter()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-end px-5 py-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
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
                onClick={() => {
                  clearData()
                  router.replace("/")
                }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 pb-20 pt-14">
        {children}
      </main>
      <BottomNav />
      <DevToolbar />
    </div>
  )
}
