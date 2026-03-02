import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { storage } from "@/lib/mastra/storage"

/**
 * GET /api/chat/threads — 사용자의 채팅 대화 목록 조회
 *
 * Mastra PgStore의 mastra_threads 테이블에서 resourceId(=userId) 기준으로 조회.
 * 접근: storage.stores.memory.listThreads()
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  try {
    const memory = storage.stores.memory
    const result = await memory.listThreads({
      filter: { resourceId: session.user.id },
      orderBy: { field: "updatedAt", direction: "DESC" },
      perPage: 50,
      page: 0,
    })

    return NextResponse.json({
      threads: result.threads.map((t) => ({
        id: t.id,
        title: t.title ?? null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      total: result.total,
      hasMore: result.hasMore,
    })
  } catch (err) {
    console.error("Thread 목록 조회 실패:", err)
    return NextResponse.json(
      { error: "대화 목록을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
