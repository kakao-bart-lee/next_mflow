import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getStorage } from "@/lib/mastra/storage"

/**
 * GET /api/chat/threads/[threadId]/messages — 특정 대화의 메시지 목록
 *
 * Mastra PgStore의 mastra_messages 테이블에서 threadId로 조회.
 * 사용자 인가: thread의 resourceId === userId 확인
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const { threadId } = await params
  const storage = getStorage()
  if (!storage) {
    return NextResponse.json(
      { error: "채팅 저장소가 설정되지 않았습니다. DATABASE_URL을 확인하세요." },
      { status: 503 }
    )
  }

  const memory = storage.stores.memory

  try {
    // thread 존재 + 소유권 확인
    const thread = await memory.getThreadById({ threadId })
    if (!thread) {
      return NextResponse.json({ error: "대화를 찾을 수 없습니다" }, { status: 404 })
    }
    if (thread.resourceId !== session.user.id) {
      return NextResponse.json({ error: "접근 권한이 없습니다" }, { status: 403 })
    }

    const result = await memory.listMessages({
      threadId,
      perPage: 50,
      page: 0,
      orderBy: { field: "createdAt", direction: "ASC" },
    })

    return NextResponse.json({
      threadId,
      messages: result.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content.content ?? m.content.parts
          ?.map((p: { type: string; text?: string }) => p.type === "text" ? p.text : "")
          .join("") ?? "",
        createdAt: m.createdAt,
      })),
      total: result.total,
      hasMore: result.hasMore,
    })
  } catch (err) {
    console.error("메시지 조회 실패:", err)
    return NextResponse.json(
      { error: "메시지를 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
