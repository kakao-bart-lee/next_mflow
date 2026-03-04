"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Search, X } from "lucide-react";

interface UserResult {
  id: string;
  name: string | null;
  email: string;
  credit: { balance: number } | null;
}

function UserSearchField({
  onSelect,
}: {
  onSelect: (user: UserResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) return;
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setFetchError(false);
      const res = await fetch(
        `/api/admin/users?q=${encodeURIComponent(query)}&limit=5`
      );
      if (!res.ok) {
        setFetchError(true);
        setOpen(true);
        return;
      }
      const data = await res.json();
      setResults(data.users ?? []);
      setOpen(true);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user: UserResult) => {
    setSelected(user);
    setQuery(user.email);
    setOpen(false);
    onSelect(user);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
    setFetchError(false);
    onSelect({ id: "", name: null, email: "", credit: null });
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setSelected(null);
            setQuery(e.target.value);
          }}
          placeholder="이메일 또는 이름으로 검색"
          className="pl-8 pr-8"
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-card shadow-md">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
              onClick={() => handleSelect(user)}
            >
              <span className="font-medium">{user.name ?? "이름 없음"}</span>
              <span className="text-xs text-muted-foreground">
                {user.email}
                {user.credit != null && (
                  <span className="ml-2">· 잔액 {user.credit.balance.toLocaleString()}C</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && fetchError && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-destructive/30 bg-card px-3 py-2 text-sm text-destructive shadow-md">
          검색 중 오류가 발생했습니다
        </div>
      )}

      {open && !fetchError && results.length === 0 && query.trim() && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground shadow-md">
          검색 결과가 없습니다
        </div>
      )}

      {selected && (
        <p className="mt-1 text-xs text-muted-foreground">
          ID: <span className="font-mono">{selected.id}</span>
        </p>
      )}
    </div>
  );
}

export default function AdminCreditsPage() {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<"add" | "deduct">("add");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId.trim() || !amount || !reason.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount: Number(amount), reason, action }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(`✓ 완료. 새 잔액: ${data.balance.toLocaleString()} 크레딧`);
        setAmount("");
        setReason("");
      } else {
        setResult(`✗ 오류: ${data.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">크레딧 관리</h1>
        <p className="text-sm text-muted-foreground">회원 크레딧을 수동으로 지급하거나 차감합니다</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4" />
            크레딧 지급 / 차감
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>회원 검색</Label>
              <UserSearchField
                onSelect={(user) => setUserId(user.id)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>작업</Label>
              <div className="flex gap-2">
                {(["add", "deduct"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAction(a)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      action === a
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-secondary"
                    }`}
                  >
                    {a === "add" ? "지급" : "차감"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>금액</Label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="예: 100"
              />
            </div>

            <div className="space-y-1.5">
              <Label>사유</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 이벤트 보상, 오류 보상"
              />
            </div>

            {result && (
              <p
                className={`text-sm ${result.startsWith("✓") ? "text-green-600" : "text-destructive"}`}
              >
                {result}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading || !userId}>
              {loading ? "처리 중…" : "확인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
