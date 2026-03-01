"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronDown, ChevronUp, Monitor } from "lucide-react"

const VIEW_OPTIONS = [
  { path: "/", label: "Landing" },
  { path: "/onboarding", label: "Onboarding" },
  { path: "/today", label: "Today" },
  { path: "/week", label: "Week" },
  { path: "/decision", label: "Decision" },
  { path: "/explore", label: "Explore" },
] as const

export function DevToolbar() {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  if (process.env.NODE_ENV !== "development") return null

  return (
    <div className="fixed bottom-4 left-4 z-[9999] select-none">
      <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95 shadow-lg shadow-black/10 backdrop-blur-sm">
        {/* Header — always visible */}
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          type="button"
        >
          <Monitor className="h-3 w-3" />
          <span>DEV</span>
          <span className="ml-auto text-[10px] font-normal text-muted-foreground/50">
            {pathname}
          </span>
          {collapsed ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>

        {/* Body */}
        {!collapsed && (
          <div className="border-t border-border/50 px-2 py-2">
            <div className="flex flex-wrap gap-1">
              {VIEW_OPTIONS.map((opt) => (
                <button
                  key={opt.path}
                  onClick={() => router.push(opt.path)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    pathname === opt.path
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
