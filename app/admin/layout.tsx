import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { LayoutDashboard, Users, CreditCard, Star, Settings, LogOut, MessageSquare, Cpu, BarChart2, DollarSign } from "lucide-react";

export const metadata = { title: "관리자 | 사주 플레이북" };

const navItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "회원 관리", icon: Users },
  { href: "/admin/credits", label: "크레딧 관리", icon: CreditCard },
  { href: "/admin/subscriptions", label: "구독 관리", icon: Star },
  { href: "/admin/debate", label: "토론 관리", icon: MessageSquare },
  { href: "/admin/llm-models", label: "LLM 모델", icon: Cpu },
  { href: "/admin/llm-usage", label: "토큰 사용량", icon: BarChart2 },
  { href: "/admin/llm-costs", label: "비용 분석", icon: DollarSign },
  { href: "/admin/settings", label: "시스템 설정", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, isSuspended: true, name: true, email: true },
  });

  if (!user?.isAdmin || user.isSuspended) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* 사이드바 */}
      <aside className="w-60 shrink-0 border-r border-border bg-card">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="font-semibold text-sm text-foreground">사주 플레이북 관리</span>
        </div>

        <nav className="p-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-60 border-t border-border p-4">
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <Link
            href="/api/auth/signout"
            className="mt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3 w-3" />
            로그아웃
          </Link>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </main>
    </div>
  );
}
