"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport, isTextUIPart, type UIMessage } from "ai"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  ArrowUp,
  X,
  Sparkles,
  RotateCcw,
  ArrowLeft,
  ScrollText,
  Star,
  MessageCircle,
} from "lucide-react"
import { useFortune } from "@/lib/contexts/fortune-context"
import { useDebate } from "@/lib/hooks/use-debate"
import { DebateMessage } from "./debate-message"
import { DebateSummaryCard } from "./debate-summary"
import { AgentBubble, UserBubble } from "./chat-bubble"
import Link from "next/link"

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ChatInterfaceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "full-page" | "sheet" | "modal"
  agents: "single" | "debate"
  context?: "today" | "week" | "decision" | "default"
  initialPrompt?: string
  onActionsGenerated?: (actions: string[]) => void
}

// ── Single-agent constants ────────────────────────────────────────────────────

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

// ── Single-agent chat content ─────────────────────────────────────────────────

interface SingleChatContentProps {
  open: boolean
  context?: string
  initialPrompt?: string
  onActionsGenerated?: (actions: string[]) => void
}

function SingleChatContent({
  open,
  context = "default",
  initialPrompt,
  onActionsGenerated,
}: SingleChatContentProps) {
  const { birthInfo, astrologyResult, sajuResult } = useFortune()
  const ctxKey = ["today", "week", "decision"].includes(context) ? context : "default"

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

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt)
  }, [initialPrompt])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isActive])

  useEffect(() => {
    if (open && messagesEndRef.current) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (!onActionsGenerated || messages.length < 2) return
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.id !== "init-1")
    if (!lastAssistant) return
    const text = getMessageText(lastAssistant)
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
    <>
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg) =>
            msg.role === "user" ? (
              <UserBubble key={msg.id} text={getMessageText(msg)} />
            ) : (
              <AgentBubble key={msg.id} text={getMessageText(msg)} />
            ),
          )}

          <div ref={messagesEndRef} />

          {/* Loading dots while waiting for AI */}
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
        <div className="mx-auto flex max-w-2xl flex-wrap gap-2 px-4 pb-3">
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
      <div className="border-t border-border/20 bg-background/30 p-3 pb-safe backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
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
    </>
  )
}

// ── Debate content ────────────────────────────────────────────────────────────

function DebateContent() {
  const { birthInfo } = useFortune()
  const {
    messages,
    summary,
    status,
    currentTurn,
    totalTurns,
    startDebate,
    error,
  } = useDebate()

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, summary])

  const progressPercent = totalTurns > 0 ? (currentTurn / totalTurns) * 100 : 0

  return (
    <>
      {/* 헤더 */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              <ScrollText className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
              <Star className="h-3.5 w-3.5 text-violet-700 dark:text-violet-400" />
            </div>
          </div>
          <h1 className="text-base font-semibold">사주 × 점성술 토론</h1>
        </div>

        {/* 진행 바 */}
        {status === "running" && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {currentTurn <= 4
                  ? `턴 ${currentTurn} / ${totalTurns - 1}`
                  : "종합 분석 중..."}
              </span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} />
          </div>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {/* Idle 상태: 시작 안내 */}
        {status === "idle" && (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                <ScrollText className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
                <Star className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">동서양 운세 토론</h2>
              <p className="max-w-xs text-sm text-muted-foreground">
                사주 명리사와 점성술사가 당신의 운세를 각자의 관점에서 해석하고,
                서로 토론하여 종합 운세를 도출합니다.
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => startDebate(birthInfo ?? undefined)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              토론 시작하기
            </Button>
          </div>
        )}

        {/* 토론 진행 중 또는 완료 */}
        {(status === "running" || status === "done") && (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <DebateMessage key={`${msg.agent}-${msg.turn}-${i}`} message={msg} />
            ))}

            {/* 스트리밍 중 스켈레톤 (다음 턴 대기) */}
            {status === "running" && messages.length > 0 && !messages[messages.length - 1]?.isStreaming && currentTurn < 5 && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full max-w-[90%] rounded-xl" />
              </div>
            )}

            {/* 종합 분석 로딩 */}
            {status === "running" && currentTurn === 5 && !summary && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  종합 분석을 생성하고 있습니다...
                </div>
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            )}

            {/* 종합 요약 카드 */}
            {summary && (
              <div className="pt-4">
                <DebateSummaryCard summary={summary} />
              </div>
            )}

            {/* 완료 후 CTA */}
            {status === "done" && summary && (
              <div className="flex flex-wrap gap-2 pt-4 pb-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startDebate(birthInfo ?? undefined)}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  새 토론 시작
                </Button>
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <Link href="/today">
                    <MessageCircle className="h-3.5 w-3.5" />
                    오늘의 운세
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 에러 상태 */}
        {status === "error" && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startDebate(birthInfo ?? undefined)}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              다시 시도
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

// ── ChatInterface ─────────────────────────────────────────────────────────────

export function ChatInterface({
  open,
  onOpenChange,
  mode,
  agents,
  context = "default",
  initialPrompt,
  onActionsGenerated,
}: ChatInterfaceProps) {
  const content =
    agents === "debate" ? (
      <DebateContent />
    ) : (
      <SingleChatContent
        open={open}
        context={context}
        initialPrompt={initialPrompt}
        onActionsGenerated={onActionsGenerated}
      />
    )

  if (mode === "full-page") {
    return <div className="flex h-full flex-col">{content}</div>
  }

  if (mode === "sheet") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="flex flex-row items-center border-b border-border/20 bg-background/50 px-4 py-3 backdrop-blur-xl">
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
          <div className="flex flex-1 flex-col overflow-hidden">{content}</div>
        </SheetContent>
      </Sheet>
    )
  }

  // mode === "modal"
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/80 backdrop-blur-xl animate-fade-in-up">
      <header className="flex items-center justify-between border-b border-border/20 bg-background/50 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            type="button"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-sm font-medium text-foreground">AI 통합 해석</h2>
              <p className="text-[10px] text-muted-foreground">사주 + 점성술 통합 분석</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          type="button"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="flex flex-1 flex-col overflow-hidden">{content}</div>
    </div>
  )
}
