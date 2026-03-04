"use client"

import { Sparkles, User } from "lucide-react"

interface AgentBubbleProps {
  text: string
  isStreaming?: boolean
}

interface UserBubbleProps {
  text: string
}

export function AgentBubble({ text, isStreaming }: AgentBubbleProps) {
  return (
    <div className="flex items-end gap-2 flex-row animate-in fade-in duration-200">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="max-w-[80%] px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap rounded-2xl rounded-bl-md border border-border/30 bg-card/80 backdrop-blur-sm">
        {text}
        {isStreaming && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-middle" />
        )}
      </div>
    </div>
  )
}

export function UserBubble({ text }: UserBubbleProps) {
  return (
    <div className="flex items-end gap-2 flex-row-reverse animate-in fade-in duration-200">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ring/15">
        <User className="h-3.5 w-3.5 text-ring" />
      </div>
      <div className="max-w-[80%] px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap rounded-2xl rounded-br-md border border-primary/20 bg-primary/15">
        {text}
      </div>
    </div>
  )
}
