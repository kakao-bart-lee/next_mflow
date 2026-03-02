"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { ScrollText, Star } from "lucide-react"
import type { DebateMessage as DebateMessageType } from "@/lib/hooks/use-debate"

/** 간단한 마크다운 → React 변환 (bold, heading만 처리) */
function renderSimpleMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, lineIdx) => {
    // ### 헤더
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      return (
        <div key={lineIdx} className="mt-3 mb-1 font-semibold text-foreground">
          {renderInline(headingMatch[2])}
        </div>
      )
    }
    if (line.trim() === "") {
      return <br key={lineIdx} />
    }
    return (
      <span key={lineIdx}>
        {renderInline(line)}
        {"\n"}
      </span>
    )
  })
}

function renderInline(text: string): React.ReactNode[] {
  // **bold** 처리
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

const AGENT_CONFIG = {
  "saju-master": {
    icon: ScrollText,
    bgClass: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40",
    nameClass: "text-amber-700 dark:text-amber-400",
    align: "self-start" as const,
  },
  astrologer: {
    icon: Star,
    bgClass: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/40",
    nameClass: "text-violet-700 dark:text-violet-400",
    align: "self-end" as const,
  },
} as const

interface DebateMessageProps {
  message: DebateMessageType
}

export function DebateMessage({ message }: DebateMessageProps) {
  const config = AGENT_CONFIG[message.agent]
  const Icon = config.icon
  const rendered = useMemo(() => renderSimpleMarkdown(message.text), [message.text])

  return (
    <div className={cn("flex w-full max-w-[90%] flex-col gap-2", config.align)}>
      {/* 에이전트 이름 */}
      <div className={cn("flex items-center gap-1.5 text-xs font-medium", config.nameClass)}>
        <Icon className="h-3.5 w-3.5" />
        <span>{message.name}</span>
        <span className="text-muted-foreground">· 턴 {message.turn}</span>
      </div>

      {/* 메시지 버블 */}
      <div
        className={cn(
          "rounded-xl border px-4 py-3 text-sm leading-relaxed",
          config.bgClass,
        )}
      >
        {rendered}
        {message.isStreaming && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-middle" />
        )}
      </div>
    </div>
  )
}
