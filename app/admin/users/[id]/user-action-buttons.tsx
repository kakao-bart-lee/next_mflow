"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Ban, CreditCard, Plus, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  userId: string;
  isAdmin: boolean;
  isSuspended: boolean;
  currentUserId: string;
}

export function UserActionButtons({ userId, isAdmin, isSuspended, currentUserId }: Props) {
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditAction, setCreditAction] = useState<"add" | "deduct">("add");
  const [loading, setLoading] = useState(false);

  const isSelf = userId === currentUserId;

  const toggleAdmin = async () => {
    if (isSelf && isAdmin) {
      alert("자신의 관리자 권한은 제거할 수 없습니다");
      return;
    }
    if (!confirm(`관리자 권한을 ${isAdmin ? "제거" : "부여"}하겠습니까?`)) return;

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !isAdmin }),
    });

    if (res.ok) location.reload();
    else alert("오류가 발생했습니다");
  };

  const toggleSuspend = async () => {
    if (!confirm(`이 계정을 ${isSuspended ? "복구" : "정지"}하겠습니까?`)) return;

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSuspended: !isSuspended }),
    });

    if (res.ok) location.reload();
    else alert("오류가 발생했습니다");
  };

  const handleCreditAction = async () => {
    const amount = Number(creditAmount);
    if (!amount || amount <= 0 || !creditReason.trim()) {
      alert("금액과 사유를 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount, reason: creditReason, action: creditAction }),
      });

      if (res.ok) {
        setCreditDialogOpen(false);
        setCreditAmount("");
        setCreditReason("");
        location.reload();
      } else {
        const data = await res.json();
        alert(data.error ?? "오류가 발생했습니다");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={toggleAdmin} disabled={isSelf && isAdmin}>
          <Shield className="mr-1 h-3.5 w-3.5" />
          {isAdmin ? "관리자 제거" : "관리자 부여"}
        </Button>

        <Button
          variant={isSuspended ? "secondary" : "destructive"}
          size="sm"
          onClick={toggleSuspend}
        >
          <Ban className="mr-1 h-3.5 w-3.5" />
          {isSuspended ? "정지 해제" : "계정 정지"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => { setCreditAction("add"); setCreditDialogOpen(true); }}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          크레딧 지급
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => { setCreditAction("deduct"); setCreditDialogOpen(true); }}
        >
          <Minus className="mr-1 h-3.5 w-3.5" />
          크레딧 차감
        </Button>
      </div>

      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              크레딧 {creditAction === "add" ? "지급" : "차감"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>금액</Label>
              <Input
                type="number"
                min={1}
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="예: 100"
              />
            </div>
            <div className="space-y-1.5">
              <Label>사유</Label>
              <Input
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="예: 이벤트 보상"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreditAction} disabled={loading}>
              {loading ? "처리 중…" : "확인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
