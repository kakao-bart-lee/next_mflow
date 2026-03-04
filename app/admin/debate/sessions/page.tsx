import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const PAGE_SIZE = 20

interface Props {
  searchParams?: { page?: string }
}

export default async function DebateSessionsPage({ searchParams }: Props) {
  const { page: pageParam } = searchParams ?? {}
  const parsedPage = parseInt(pageParam ?? "", 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

  const total = await prisma.chatSession.count({ where: { expertId: "debate" } })
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // 범위 초과 페이지는 마지막 페이지로 clamp
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const skip = (safePage - 1) * PAGE_SIZE

  const sessions = await prisma.chatSession.findMany({
    where: { expertId: "debate" },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    skip,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">토론 세션</h1>
          <p className="text-sm text-muted-foreground">
            사주 × 점성술 토론 세션 목록 (총 {total.toLocaleString()}건)
          </p>
        </div>
      </div>

      {sessions.length === 0 && total === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            아직 토론 세션이 없습니다.
          </CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            해당 페이지에 세션이 없습니다.{" "}
            <Link href="/admin/debate/sessions" className="text-primary hover:underline">
              첫 페이지로
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                세션 목록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4">날짜</th>
                      <th className="pb-2 pr-4">사용자</th>
                      <th className="pb-2 pr-4">메시지 수</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 pr-4 text-muted-foreground">
                          {s.createdAt.toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-medium">{s.user.name ?? "이름 없음"}</div>
                          <div className="text-xs text-muted-foreground">{s.user.email}</div>
                        </td>
                        <td className="py-3 pr-4">{s._count.messages}개</td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/admin/debate/sessions/${s.id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            상세 보기
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, total)} / {total.toLocaleString()}건
              </p>
              <div className="flex items-center gap-2">
                {safePage > 1 ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/debate/sessions?page=${safePage - 1}`}>
                      <ChevronLeft className="h-4 w-4" />
                      이전
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4" />
                    이전
                  </Button>
                )}
                <span className="text-muted-foreground">
                  {safePage} / {totalPages}
                </span>
                {safePage < totalPages ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/debate/sessions?page=${safePage + 1}`}>
                      다음
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    다음
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
