"use client"

import { ChatInterface } from "./chat-interface"

interface AIChatPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context?: string
  initialPrompt?: string
  onActionsGenerated?: (actions: string[]) => void
}

const VALID_CONTEXTS = ["today", "week", "decision", "default"] as const
type ValidContext = (typeof VALID_CONTEXTS)[number]

function toValidContext(ctx?: string): ValidContext | undefined {
  if ((VALID_CONTEXTS as readonly string[]).includes(ctx ?? "")) return ctx as ValidContext
  return undefined
}

export function AIChatPanel({
  open,
  onOpenChange,
  context,
  initialPrompt,
  onActionsGenerated,
}: AIChatPanelProps) {
  return (
    <ChatInterface
      mode="modal"
      agents="single"
      open={open}
      onOpenChange={onOpenChange}
      context={toValidContext(context)}
      initialPrompt={initialPrompt}
      onActionsGenerated={onActionsGenerated}
    />
  )
}
