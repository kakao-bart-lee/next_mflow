import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { DebateMessage } from "@/components/saju/debate-message"
import { DebateSummaryCard } from "@/components/saju/debate-summary"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { DebateAgent } from "@/lib/use-cases/run-debate"
import type { DebateSummary } from "@/lib/use-cases/run-debate"

interface PageProps {
  params: Promise<{ id: string }>
}

interface MessageMetadata {
  agent?: string
  turn?: number
  avatar?: string
}

export default async function DebateSessionDetailPage({ params }: PageProps) {
  const { id } = await params

  const session = await prisma.chatSession.findUnique({
    where: { id, expertId: "debate" },
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!session) {
    notFound()
  }

  // 메시지를 토론 메시지와 종합 분석으로 분리
  const debateMessages: { agent: DebateAgent; name: string; avatar: string; turn: number; text: string; isStreaming: false }[] = []
  let summary: DebateSummary | null = null

  for (const msg of session.messages) {
    const meta = (msg.metadata ?? {}) as MessageMetadata

    if (meta.agent === "synthesis") {
      // synthesis 메시지의 content는 JSON으로 저장됨
      try {
        summary = JSON.parse(msg.content) as DebateSummary
      } catch {
        // 파싱 실패 시 무시
      }
    } else if (meta.agent && meta.turn != null) {
      debateMessages.push({
        agent: meta.agent as DebateAgent,
        name: meta.agent === "saju-master" ? "사주 명리사" : "점성술사",
        avatar: meta.avatar ?? (meta.agent === "saju-master" ? "scroll" : "star"),
        turn: meta.turn,
        text: msg.content,
        isStreaming: false,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/debate/sessions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            목록으로
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">토론 세션 상세</h1>
          <p className="text-sm text-muted-foreground">
            {session.user.name ?? "이름 없음"} ({session.user.email}) ·{" "}
            {session.createdAt.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* 토론 메시지 */}
      {debateMessages.length > 0 ? (
        <div className="space-y-4">
          {debateMessages.map((msg, i) => (
            <DebateMessage key={i} message={msg} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">토론 메시지가 없습니다.</p>
      )}

      {/* 종합 분석 */}
      {summary && (
        <div className="pt-2">
          <DebateSummaryCard summary={summary} />
        </div>
      )}
    </div>
  )
}
