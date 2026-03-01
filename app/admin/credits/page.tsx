"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function AdminCreditsPage() {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<"add" | "deduct">("add");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
              <Label>회원 ID</Label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="회원 ID를 입력하세요"
              />
              <p className="text-xs text-muted-foreground">
                회원 상세 페이지 URL에서 확인할 수 있습니다
              </p>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "처리 중…" : "확인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
