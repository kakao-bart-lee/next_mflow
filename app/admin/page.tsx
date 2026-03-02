import { Users, BarChart3, CreditCard, Star, MessageSquare, Cpu, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCard {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}

async function getStats() {
  // 서버 컴포넌트에서 직접 API 호출 대신 서비스 레이어 사용
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, newUsers, totalAnalyses, activeSubscriptions, totalDebates, monthlyDebates, llmUsage] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.analysis.count(),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.chatSession.count({ where: { expertId: "debate" } }),
      prisma.chatSession.count({ where: { expertId: "debate", createdAt: { gte: thirtyDaysAgo } } }),
      prisma.llmUsageLog.aggregate({
        where: { createdAt: { gte: thisMonthStart } },
        _sum: { costUsd: true, inputTokens: true, outputTokens: true },
        _count: true,
      }),
    ]);

    const monthlyCostUsd = llmUsage._sum.costUsd ?? 0;
    const monthlyTokens = (llmUsage._sum.inputTokens ?? 0) + (llmUsage._sum.outputTokens ?? 0);

    return { totalUsers, newUsers, totalAnalyses, activeSubscriptions, totalDebates, monthlyDebates, monthlyCostUsd, monthlyTokens };
  } catch {
    return { totalUsers: 0, newUsers: 0, totalAnalyses: 0, activeSubscriptions: 0, totalDebates: 0, monthlyDebates: 0, monthlyCostUsd: 0, monthlyTokens: 0 };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards: StatCard[] = [
    {
      title: "전체 회원",
      value: stats.totalUsers.toLocaleString(),
      sub: `이번 달 +${stats.newUsers}명 가입`,
      icon: Users,
    },
    {
      title: "전체 분석",
      value: stats.totalAnalyses.toLocaleString(),
      sub: "사주 분석 누적",
      icon: BarChart3,
    },
    {
      title: "활성 구독",
      value: stats.activeSubscriptions.toLocaleString(),
      sub: "현재 유료 구독자",
      icon: Star,
    },
    {
      title: "크레딧 시스템",
      value: process.env.ENABLE_CREDIT_SYSTEM === "true" ? "활성" : "비활성",
      sub: "ENABLE_CREDIT_SYSTEM 환경변수",
      icon: CreditCard,
    },
    {
      title: "토론 세션",
      value: stats.totalDebates.toLocaleString(),
      sub: `이번 달 ${stats.monthlyDebates}건`,
      icon: MessageSquare,
    },
    {
      title: "이번 달 API 비용",
      value: `$${stats.monthlyCostUsd.toFixed(2)}`,
      sub: "LLM 토큰 비용 (USD)",
      icon: Cpu,
    },
    {
      title: "이번 달 토큰 사용",
      value: stats.monthlyTokens.toLocaleString(),
      sub: "입력 + 출력 토큰 합계",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">대시보드</h1>
        <p className="text-sm text-muted-foreground">서비스 현황을 한눈에 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
