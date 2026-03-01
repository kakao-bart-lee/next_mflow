"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Bot } from "lucide-react"

type SettingValue = boolean | number | string

type SettingDef = {
  key: string
  label: string
  description: string
  type: "text"
  default: SettingValue
}

const SETTING_DEFS: SettingDef[] = [
  {
    key: "astrology_chat_prompt",
    label: "점성 채팅 시스템 프롬프트",
    description: "AI 점성 해석 에이전트의 기본 시스템 프롬프트",
    type: "text",
    default:
      "You are an astrology interpretation guide for a destiny decision product. Use Korean honorifics and practical advice.",
  },
  {
    key: "astrology_report_prompt",
    label: "점성 해석 생성 프롬프트",
    description: "정적 점성 데이터 기반 리포트 생성 시 사용할 프롬프트",
    type: "text",
    default:
      "Generate concise Korean astrology interpretation using static planetary influence data. Keep it practical, specific, and grounded.",
  },
]

function buildDefaultSettings(): Record<string, SettingValue> {
  return SETTING_DEFS.reduce<Record<string, SettingValue>>((acc, def) => {
    acc[def.key] = def.default
    return acc
  }, {})
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, SettingValue>>(buildDefaultSettings())
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const defaultSettings = useMemo(() => buildDefaultSettings(), [])

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      setFetching(true)
      setError(null)
      try {
        const res = await fetch("/api/admin/settings")
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? "설정을 불러오지 못했습니다")
        }
        const data = (await res.json()) as { settings?: Record<string, SettingValue> }
        if (cancelled) return
        setSettings({
          ...defaultSettings,
          ...(data.settings ?? {}),
        })
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "설정을 불러오지 못했습니다")
      } finally {
        if (!cancelled) setFetching(false)
      }
    }

    loadSettings()
    return () => {
      cancelled = true
    }
  }, [defaultSettings])

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "설정 저장에 실패했습니다")
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "설정 저장에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">시스템 설정</h1>
        <p className="text-sm text-muted-foreground">AI 프롬프트를 설정합니다</p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-4 max-w-3xl">
        {SETTING_DEFS.map((def) => (
          <Card key={def.key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bot className="h-4 w-4 text-muted-foreground" />
                {def.label}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{def.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  value={String(settings[def.key] ?? def.default)}
                  onChange={(e) => setSettings((s) => ({ ...s, [def.key]: e.target.value }))}
                  rows={6}
                  className="font-mono text-xs"
                  disabled={fetching || loading}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={loading || fetching}>
            {loading ? "저장 중…" : "설정 저장"}
          </Button>
          {saved && <p className="text-sm text-green-600">✓ 저장되었습니다</p>}
        </div>
      </div>
    </div>
  )
}
