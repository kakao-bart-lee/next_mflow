"use client"

import { ChatInterface } from "./chat-interface"

export function DebateScreen() {
  return (
    <ChatInterface
      mode="full-page"
      agents="debate"
      open={true}
      onOpenChange={() => {}}
    />
  )
}
