"use client"

import { useEffect, useState } from "react"
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
    key: "saju_agent_prompt",
    label: "사주 채팅 시스템 프롬프트",
    description: "AI 사주 해석 에이전트의 기본 시스템 프롬프트",
    type: "text",
    default:
      "You are a saju (사주) fortune-telling expert for a Korean destiny decision product. Use Korean honorifics and give practical, specific advice based on the user's four pillars.",
  },
  {
    key: "saju_today_prompt",
    label: "오늘의 운세 생성 프롬프트",
    description: "일일 운세 LLM 생성 시 사용할 프롬프트",
    type: "text",
    default:
      "Generate a concise daily fortune in Korean based on the user's saju data and today's energy. Keep it practical, encouraging, and grounded in saju theory.",
  },
  {
    key: "saju_weekly_prompt",
    label: "주간 운세 생성 프롬프트",
    description: "주간 운세 LLM 생성 시 사용할 프롬프트",
    type: "text",
    default:
      "Generate a 7-day weekly forecast in Korean based on the user's saju data. Include specific advice for each day, grounded in saju principles.",
  },
]

function buildDefaultSettings(): Record<string, SettingValue> {
  const defaults: Record<string, SettingValue> = {}
  SETTING_DEFS.forEach((def) => {
    defaults[def.key] = def.default
  })
  return defaults
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, SettingValue>>({})
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings")
        if (!res.ok) {
          throw new Error("Failed to fetch settings")
        }
        const data = await res.json()
        if (!cancelled) {
          const defaults = buildDefaultSettings()
          setSettings({ ...defaults, ...data })
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err)
          setError("설정을 불러오는데 실패했습니다.")
          setSettings(buildDefaultSettings())
        }
      } finally {
        if (!cancelled) {
          setFetching(false)
        }
      }
    }

    fetchSettings()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    setError(null)

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!res.ok) {
        throw new Error("Failed to save settings")
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
      setError("설정 저장에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">시스템 설정</h1>
          <p className="text-sm text-muted-foreground">AI 프롬프트를 설정합니다</p>
        </div>
        <div className="text-sm text-muted-foreground">설정을 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">시스템 설정</h1>
        <p className="text-sm text-muted-foreground">AI 프롬프트를 설정합니다</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
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
              <Textarea
                value={String(settings[def.key] ?? def.default)}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, [def.key]: e.target.value }))
                }
                className="min-h-[100px] font-mono text-xs"
              />
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
  )
}
