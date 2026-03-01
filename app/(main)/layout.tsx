"use client"

import type { ReactNode } from "react"
import { BottomNav } from "@/components/saju/bottom-nav"
import { DevToolbar } from "@/components/dev/dev-toolbar"

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <main className="flex-1 pb-20">
        {children}
      </main>
      <BottomNav />
      <DevToolbar />
    </div>
  )
}
