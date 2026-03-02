import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

export default async function DebateSessionsPage() {
  const sessions = await prisma.chatSession.findMany({
    where: { expertId: "debate" },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">토론 세션</h1>
        <p className="text-sm text-muted-foreground">
          사주 × 점성술 토론 세션 목록 (최근 50건)
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            아직 토론 세션이 없습니다.
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  )
}
