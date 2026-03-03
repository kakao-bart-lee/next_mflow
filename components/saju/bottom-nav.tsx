"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Compass, Home, Telescope } from "lucide-react"
import { useLocale } from "@/lib/contexts/locale-context"

const TAB_DEFS = [
  { href: "/today", key: "today" as const, icon: Home },
  { href: "/week", key: "week" as const, icon: CalendarDays },
  { href: "/decision", key: "decision" as const, icon: Compass },
  { href: "/explore", key: "explore" as const, icon: Telescope },
]

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useLocale()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/20 bg-background/60 backdrop-blur-xl"
      role="navigation"
      aria-label="메인 탐색"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {TAB_DEFS.map(({ href, key, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              }`}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-1.5 h-1 w-1 rounded-full bg-primary" />
              )}
              <Icon
                className="h-5 w-5 shrink-0"
                strokeWidth={isActive ? 2.2 : 1.6}
              />
              <span className="whitespace-nowrap text-[10px] font-medium leading-none">
                {t.nav[key]}
              </span>
            </Link>
          )
        })}
      </div>
      {/* Safe area for notched devices */}
      <div className="pb-safe" />
    </nav>
  )
}
