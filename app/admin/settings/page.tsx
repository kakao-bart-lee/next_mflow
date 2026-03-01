"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

const SETTING_DEFS = [
  {
    key: "creditSystem",
    label: "크레딧 시스템",
    description: "활성화 시 API 사용마다 크레딧이 차감됩니다",
    type: "boolean",
    default: false,
  },
  {
    key: "subscriptionSystem",
    label: "구독 시스템",
    description: "활성화 시 구독 플랜 기반 접근 제어가 적용됩니다",
    type: "boolean",
    default: false,
  },
  {
    key: "initialFreeCredits",
    label: "신규 가입 무료 크레딧",
    description: "신규 가입 시 자동으로 지급되는 크레딧 수",
    type: "number",
    default: 10,
  },
  {
    key: "sajuAnalysisCost",
    label: "사주 분석 크레딧 비용",
    description: "사주 분석 1회당 차감 크레딧",
    type: "number",
    default: 2,
  },
  {
    key: "chatMessageCost",
    label: "채팅 메시지 크레딧 비용",
    description: "AI 채팅 메시지 1회당 차감 크레딧",
    type: "number",
    default: 1,
  },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean | number>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // 초기값 설정
  useEffect(() => {
    const defaults: Record<string, boolean | number> = {};
    SETTING_DEFS.forEach((d) => { defaults[d.key] = d.default; });
    setSettings(defaults);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      // SystemSettings API (추후 구현 — 현재는 로컬 상태만)
      await new Promise((r) => setTimeout(r, 500));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">시스템 설정</h1>
        <p className="text-sm text-muted-foreground">서비스 동작 방식을 설정합니다</p>
      </div>

      <div className="space-y-4 max-w-xl">
        {SETTING_DEFS.map((def) => (
          <Card key={def.key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4 text-muted-foreground" />
                {def.label}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{def.description}</p>
            </CardHeader>
            <CardContent>
              {def.type === "boolean" ? (
                <div className="flex items-center gap-3">
                  <Switch
                    checked={Boolean(settings[def.key] ?? def.default)}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, [def.key]: v }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    {settings[def.key] ? "활성" : "비활성"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Label className="sr-only">{def.label}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={String(settings[def.key] ?? def.default)}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, [def.key]: Number(e.target.value) }))
                    }
                    className="w-24"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "저장 중…" : "설정 저장"}
          </Button>
          {saved && <p className="text-sm text-green-600">✓ 저장되었습니다</p>}
        </div>
      </div>
    </div>
  );
}
