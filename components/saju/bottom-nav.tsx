"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Compass, Home, Telescope } from "lucide-react"

const TABS = [
  { href: "/today", label: "오늘", icon: Home },
  { href: "/week", label: "이번 주", icon: CalendarDays },
  { href: "/decision", label: "결정", icon: Compass },
  { href: "/explore", label: "탐색", icon: Telescope },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm"
      role="navigation"
      aria-label="메인 탐색"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-w-[56px] flex-col items-center gap-1 rounded-lg px-3 py-1.5 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className="text-[10px] font-medium leading-none">
                {label}
              </span>
            </Link>
          )
        })}
      </div>
      {/* Safe area for mobile */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
