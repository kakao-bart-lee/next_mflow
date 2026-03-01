"use client"

import { useState } from "react"
import { TodayScreen } from "./today-screen"
import { WeekScreen } from "./week-screen"
import { DecisionHelper } from "./decision-helper"
import { ExploreScreen } from "./explore-screen"
import { CalendarDays, Compass, Home, Telescope } from "lucide-react"

type Tab = "today" | "week" | "decision" | "explore"

const TABS = [
  { id: "today" as Tab, label: "오늘", icon: Home },
  { id: "week" as Tab, label: "이번 주", icon: CalendarDays },
  { id: "decision" as Tab, label: "결정", icon: Compass },
  { id: "explore" as Tab, label: "탐색", icon: Telescope },
] as const

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("today")

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Main content — all panels stay mounted to preserve scroll/state */}
      <main className="flex-1 pb-20">
        <div id="panel-today" role="tabpanel" className={activeTab !== "today" ? "hidden" : ""}>
          <TodayScreen />
        </div>
        <div id="panel-week" role="tabpanel" className={activeTab !== "week" ? "hidden" : ""}>
          <WeekScreen />
        </div>
        <div id="panel-decision" role="tabpanel" className={activeTab !== "decision" ? "hidden" : ""}>
          <DecisionHelper />
        </div>
        <div id="panel-explore" role="tabpanel" className={activeTab !== "explore" ? "hidden" : ""}>
          <ExploreScreen />
        </div>
      </main>

      {/* Bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm"
        role="tablist"
        aria-label="메인 탐색"
      >
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`panel-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex min-w-[56px] flex-col items-center gap-1 rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={activeTab === id ? 2.2 : 1.8}
              />
              <span className="text-[10px] font-medium leading-none">
                {label}
              </span>
            </button>
          ))}
        </div>
        {/* Safe area for mobile */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  )
}
