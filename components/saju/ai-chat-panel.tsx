"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport, isTextUIPart, type UIMessage } from "ai"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { ArrowUp, X, Sparkles, RotateCcw, User } from "lucide-react"
import { useSaju } from "@/lib/contexts/saju-context"

interface AIChatPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context?: string
  initialPrompt?: string
  onActionsGenerated?: (actions: string[]) => void
}

const INITIAL_CONTENT: Record<string, string> = {
  today: "오늘의 기운에 대해 궁금한 게 있으신가요? 편하게 물어보세요. 지금 느끼는 감정이나 고민을 나누어주셔도 좋아요.",
  week: "이번 주 흐름을 함께 돌아볼까요? 특별히 신경 쓰이는 날이나 계획이 있다면 알려주세요.",
  decision: "결정이 어려우셨군요. 조금 더 깊이 이야기 나눠볼까요? 어떤 부분이 가장 마음에 걸리세요?",
  default: "안녕하세요. 무엇이든 편하게 물어보세요.",
}

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  today: ["오늘 기분이 좀 가라앉아요", "직장에서 큰 결정이 있어요", "관계 고민이 있어요"],
  week: ["이번 주 중요한 미팅이 있어요", "주말에 여행을 갈까 고민이에요", "에너지가 떨어지는 느낌이에요"],
  default: ["더 자세히 알고 싶어요", "다른 관점에서 봐주세요", "실천할 수 있는 조언이 필요해요"],
}

function makeInitialMessage(ctxKey: string): UIMessage {
  return {
    id: "init-1",
    role: "assistant",
    parts: [{ type: "text", text: INITIAL_CONTENT[ctxKey] ?? INITIAL_CONTENT.default }],
  }
}

function getMessageText(msg: UIMessage): string {
  return msg.parts.filter(isTextUIPart).map((p) => p.text).join("")
}

function ChatContent({
  open,
  context = "default",
  initialPrompt,
  onActionsGenerated,
}: Omit<AIChatPanelProps, "onOpenChange">) {
  const { birthInfo, astrologyResult, sajuResult } = useSaju()
  const ctxKey = ["today", "week", "decision"].includes(context ?? "")
    ? (context as string)
    : "default"

  const [input, setInput] = useState(initialPrompt ?? "")
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/chat",
        body: {
          context: {
            birthInfo: birthInfo ?? undefined,
            sajuData: sajuResult ?? undefined,
            astrologyData: astrologyResult ?? undefined,
          },
        },
      }),
    [birthInfo, astrologyResult, sajuResult],
  )

  const { messages, sendMessage, stop, setMessages, status } = useChat({
    transport,
    messages: [makeInitialMessage(ctxKey)],
    onError: (error) => {
      console.error("채팅 API 오류:", error)
      toast.error("메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요")
    },
  })

  const isActive = status === "submitted" || status === "streaming"

  // Sync initialPrompt prop → local input state
  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt)
  }, [initialPrompt])

  // Auto-scroll to bottom on new messages or while streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isActive])

  // 패널이 열릴 때 메시지 목록 최하단으로 스크롤 (재오픈 시 이전 대화 위치 복원)
  useEffect(() => {
    if (open && messagesEndRef.current) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // AI 응답에서 실천 항목 추출 → onActionsGenerated 콜백
  useEffect(() => {
    if (!onActionsGenerated || messages.length < 2) return
    // 마지막 AI 응답에서 실천항목 패턴 추출
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.id !== "init-1")
    if (!lastAssistant) return
    const text = getMessageText(lastAssistant)
    // "실천:", "추천:", "해보세요", "시도해보세요" 패턴 또는 번호 리스트(1. 2. 3.) 추출
    const actionLines = text
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim()
        return (
          /^\d+[.)\s]/.test(trimmed) ||
          /^[-•]\s/.test(trimmed) ||
          /(실천|추천|해보세요|시도|시작)/.test(trimmed)
        )
      })
      .map((line) => line.replace(/^[\d.)\-•\s]+/, "").trim())
      .filter((line) => line.length > 5 && line.length < 100)
      .slice(0, 3)
    if (actionLines.length > 0) {
      onActionsGenerated(actionLines)
    }
  }, [messages, onActionsGenerated])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isActive) return
    setInput("")
    await sendMessage({ text })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReset = () => {
    stop()
    setMessages([makeInitialMessage(ctxKey)])
    setInput("")
  }

  const suggestedPrompts = SUGGESTED_PROMPTS[ctxKey] ?? SUGGESTED_PROMPTS.default

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in duration-200`}
            >
              {/* Avatar */}
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                msg.role === "assistant" ? "bg-primary/15" : "bg-ring/15"
              }`}>
                {msg.role === "assistant" ? (
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <User className="h-3.5 w-3.5 text-ring" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "rounded-2xl rounded-br-md border border-primary/20 bg-primary/15"
                    : "rounded-2xl rounded-bl-md border border-border/30 bg-card/80 backdrop-blur-sm"
                }`}
              >
                {getMessageText(msg)}
              </div>
            </div>
          ))}

          {/* 스크롤 앵커 — 메시지 목록 최하단 */}
          <div ref={messagesEndRef} />

          {/* Loading dots — shown while waiting for the AI to start responding */}
          {status === "submitted" && (
            <div className="flex items-end gap-2 animate-in fade-in duration-200">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="rounded-2xl rounded-bl-md border border-border/30 bg-card/80 px-4 py-3 backdrop-blur-sm">
                <div className="flex gap-1.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested prompts — shown only before any user message */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setInput(prompt)
                textareaRef.current?.focus()
              }}
              className="rounded-full border border-border/40 bg-card/40 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-colors hover:bg-card/70 hover:text-foreground"
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border/20 bg-background/40 p-3 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <button
            onClick={handleReset}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="대화 초기화"
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="min-h-[40px] max-h-[120px] flex-1 resize-none rounded-xl border-border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground/50"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isActive}
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground"
            aria-label="전송"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AIChatPanel({
  open,
  onOpenChange,
  context,
  initialPrompt,
  onActionsGenerated,
}: AIChatPanelProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh] border-border/20 bg-card/95 backdrop-blur-xl">
          <DrawerHeader className="border-b border-border/20 pb-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <DrawerTitle className="font-serif text-sm font-medium text-foreground">
                    AI 통합 해석
                  </DrawerTitle>
                  <p className="text-[10px] text-muted-foreground">사주 + 점성술 통합 분석</p>
                </div>
              </div>
              <DrawerClose className="rounded-full p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
                <span className="sr-only">닫기</span>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <ChatContent
            open={open}
            context={context}
            initialPrompt={initialPrompt}
            onActionsGenerated={onActionsGenerated}
          />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col border-border/20 bg-card/95 p-0 backdrop-blur-xl sm:max-w-lg">
        <SheetHeader className="border-b border-border/20 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="font-serif text-sm font-medium text-foreground">
                AI 통합 해석
              </SheetTitle>
              <p className="text-[10px] text-muted-foreground">사주 + 점성술 통합 분석</p>
            </div>
          </div>
        </SheetHeader>
        <ChatContent
          open={open}
          context={context}
          initialPrompt={initialPrompt}
          onActionsGenerated={onActionsGenerated}
        />
      </SheetContent>
    </Sheet>
  )
}
