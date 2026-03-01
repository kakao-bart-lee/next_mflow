import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { Shield, Ban, Star, CreditCard, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserActionButtons } from "./user-action-buttons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [adminUser, user] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    }),
    prisma.user.findUnique({
      where: { id },
      include: {
        credit: true,
        subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 5 },
        preferences: true,
      },
    }),
  ]);

  if (!adminUser?.isAdmin) redirect("/");
  if (!user) notFound();

  const [recentAnalyses, creditLogs] = await Promise.all([
    prisma.analysis.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, expertId: true, createdAt: true },
    }),
    prisma.creditLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, amount: true, reason: true, createdAt: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{user.name ?? "이름 없음"}</h1>
            {user.isAdmin && (
              <Badge variant="default" className="text-xs">
                <Shield className="mr-1 h-3 w-3" />
                관리자
              </Badge>
            )}
            {user.isSuspended && (
              <Badge variant="destructive" className="text-xs">
                <Ban className="mr-1 h-3 w-3" />
                정지됨
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            가입일: {new Date(user.createdAt).toLocaleDateString("ko-KR")}
          </p>
        </div>

        {/* 관리 버튼 (클라이언트 컴포넌트) */}
        <UserActionButtons
          userId={user.id}
          isAdmin={user.isAdmin}
          isSuspended={user.isSuspended}
          currentUserId={session.user.id}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* 크레딧 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">크레딧 잔액</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(user.credit?.balance ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        {/* 구독 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">현재 구독</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {user.subscriptions.find((s) => s.status === "active")?.plan.displayName ?? "없음"}
            </div>
          </CardContent>
        </Card>

        {/* 분석 횟수 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">분석 횟수</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentAnalyses.length}+</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 최근 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">최근 분석</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAnalyses.length === 0 ? (
              <p className="text-xs text-muted-foreground">분석 내역이 없습니다</p>
            ) : (
              recentAnalyses.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs">
                  <Badge variant="outline">{a.expertId}</Badge>
                  <span className="text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 크레딧 내역 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">크레딧 내역</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {creditLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">크레딧 내역이 없습니다</p>
            ) : (
              creditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-xs">
                  <span className="truncate text-muted-foreground max-w-[60%]">{log.reason}</span>
                  <span className={log.amount > 0 ? "text-green-600" : "text-destructive"}>
                    {log.amount > 0 ? "+" : ""}
                    {log.amount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
