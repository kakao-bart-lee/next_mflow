"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Shield, Ban, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  isSuspended: boolean;
  createdAt: string;
  credit: { balance: number } | null;
  subscriptions: Array<{ plan: { displayName: string } }>;
  _count: { chatSessions: number };
}

interface UsersResponse {
  users: UserRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // 검색어 디바운스
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        page: String(page),
        limit: "20",
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">회원 관리</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `전체 ${data.pagination.total.toLocaleString()}명` : "로딩 중…"}
          </p>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이메일 또는 이름으로 검색…"
          className="pl-9"
        />
      </div>

      {/* 테이블 */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr>
              {["이름 / 이메일", "상태", "크레딧", "구독", "세션 수", "가입일", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && !data ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  로딩 중…
                </td>
              </tr>
            ) : (data?.users ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  검색 결과가 없습니다
                </td>
              </tr>
            ) : (
              (data?.users ?? []).map((user) => (
                <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.isAdmin && <Shield className="h-3.5 w-3.5 text-primary" />}
                      <div>
                        <div className="font-medium text-foreground">{user.name ?? "이름 없음"}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.isSuspended ? (
                      <Badge variant="destructive" className="text-xs">
                        <Ban className="mr-1 h-3 w-3" />
                        정지
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <User className="mr-1 h-3 w-3" />
                        정상
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(user.credit?.balance ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {user.subscriptions[0] ? (
                      <Badge variant="outline" className="text-xs">
                        {user.subscriptions[0].plan.displayName}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">없음</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user._count.chatSessions.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      상세 보기
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {page} / {data.pagination.totalPages} 페이지
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
