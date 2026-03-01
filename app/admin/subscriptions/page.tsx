"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

const AVAILABLE_PLANS = ["free", "basic", "pro"];

export default function AdminSubscriptionsPage() {
  const [userId, setUserId] = useState("");
  const [planName, setPlanName] = useState("basic");
  const [durationMonths, setDurationMonths] = useState("1");
  const [action, setAction] = useState<"grant" | "cancel">("grant");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          planName,
          durationMonths: Number(durationMonths),
          action,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(
          action === "grant"
            ? `✓ ${data.subscription.plan.displayName} 구독 부여 완료`
            : `✓ ${data.cancelled}건 구독 취소 완료`
        );
        setUserId("");
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
        <h1 className="text-xl font-semibold text-foreground">구독 관리</h1>
        <p className="text-sm text-muted-foreground">회원에게 구독 플랜을 수동으로 부여하거나 취소합니다</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4" />
            구독 부여 / 취소
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
            </div>

            <div className="space-y-1.5">
              <Label>작업</Label>
              <div className="flex gap-2">
                {(["grant", "cancel"] as const).map((a) => (
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
                    {a === "grant" ? "부여" : "취소"}
                  </button>
                ))}
              </div>
            </div>

            {action === "grant" && (
              <>
                <div className="space-y-1.5">
                  <Label>플랜</Label>
                  <div className="flex gap-2 flex-wrap">
                    {AVAILABLE_PLANS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlanName(p)}
                        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                          planName === p
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:bg-secondary"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>기간 (월)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                  />
                </div>
              </>
            )}

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
