"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, RotateCcw } from "lucide-react"
import { SAJU_MASTER_PERSONA, ASTROLOGER_PERSONA } from "@/lib/mastra/personas"

// =============================================================================
// Setting definitions
// =============================================================================

type SettingValue = string | number | boolean

interface SettingDef {
  key: string
  label: string
  description: string
  type: "boolean" | "number" | "select" | "textarea"
  default: SettingValue
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
}

const DEFAULT_SYNTHESIS_PROMPT = `당신은 동서양 운명학의 종합 분석가입니다. 사주 명리사와 점성술사의 토론 내용을 분석하여 구조화된 요약을 생성합니다.
한국어 존댓말로 작성하세요. 구체적이고 실용적인 내용을 포함하세요.`

const OPERATION_SETTINGS: SettingDef[] = [
  {
    key: "debate_enabled",
    label: "토론 기능 활성화",
    description: "비활성화 시 토론 API가 503을 반환합니다",
    type: "boolean",
    default: true,
  },
  {
    key: "debate_mock_mode",
    label: "Mock 모드",
    description: "활성화 시 LLM 호출 없이 더미 데이터로 토론합니다",
    type: "boolean",
    default: false,
  },
  {
    key: "debate_model",
    label: "LLM 모델",
    description: "에이전트가 사용할 OpenAI 모델",
    type: "select",
    default: "gpt-4o-mini",
    options: [
      { value: "gpt-4o-mini", label: "GPT-4o Mini (빠름/저렴)" },
      { value: "gpt-4o", label: "GPT-4o (고품질)" },
      { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
      { value: "gpt-4.1", label: "GPT-4.1" },
    ],
  },
  {
    key: "debate_turn_count",
    label: "토론 턴 수",
    description: "에이전트 토론 턴 수 (2~8, 짝수만)",
    type: "number",
    default: 4,
    min: 2,
    max: 8,
    step: 2,
  },
  {
    key: "debate_credit_cost",
    label: "크레딧 비용",
    description: "토론 1회당 차감 크레딧",
    type: "number",
    default: 3,
    min: 0,
    max: 50,
    step: 1,
  },
]

const PROMPT_SETTINGS: SettingDef[] = [
  {
    key: "debate_saju_persona",
    label: "사주 명리사",
    description: "사주 명리사 에이전트의 시스템 프롬프트",
    type: "textarea",
    default: SAJU_MASTER_PERSONA,
  },
  {
    key: "debate_astrologer_persona",
    label: "점성술사",
    description: "점성술사 에이전트의 시스템 프롬프트",
    type: "textarea",
    default: ASTROLOGER_PERSONA,
  },
  {
    key: "debate_synthesis_prompt",
    label: "종합 분석",
    description: "종합 요약 생성 시스템 프롬프트",
    type: "textarea",
    default: DEFAULT_SYNTHESIS_PROMPT,
  },
]

const ALL_SETTINGS = [...OPERATION_SETTINGS, ...PROMPT_SETTINGS]

function buildDefaults(): Record<string, SettingValue> {
  return ALL_SETTINGS.reduce<Record<string, SettingValue>>((acc, def) => {
    acc[def.key] = def.default
    return acc
  }, {})
}

// =============================================================================
// Page component
// =============================================================================

export default function AdminDebatePage() {
  const [settings, setSettings] = useState<Record<string, SettingValue>>(buildDefaults)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const defaults = useMemo(() => buildDefaults(), [])

  useEffect(() => {
    let cancelled = false

    async function load() {
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
        setSettings({ ...defaults, ...(data.settings ?? {}) })
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "설정을 불러오지 못했습니다")
      } finally {
        if (!cancelled) setFetching(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [defaults])

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    setError(null)
    try {
      // debate_ 키만 전송
      const debateSettings: Record<string, SettingValue> = {}
      for (const [key, value] of Object.entries(settings)) {
        if (key.startsWith("debate_")) {
          debateSettings[key] = value
        }
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: debateSettings }),
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

  const resetPrompts = () => {
    setSettings((prev) => {
      const next = { ...prev }
      for (const def of PROMPT_SETTINGS) {
        next[def.key] = def.default
      }
      return next
    })
  }

  const updateSetting = (key: string, value: SettingValue) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const disabled = fetching || loading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">토론 관리</h1>
        <p className="text-sm text-muted-foreground">
          사주 × 점성술 토론 시스템 설정을 관리합니다
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="max-w-3xl space-y-6">
        {/* 운영 설정 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              운영 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {OPERATION_SETTINGS.map((def) => (
              <OperationField
                key={def.key}
                def={def}
                value={settings[def.key] ?? def.default}
                onChange={(v) => updateSetting(def.key, v)}
                disabled={disabled}
              />
            ))}
          </CardContent>
        </Card>

        {/* 프롬프트 편집 카드 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">에이전트 프롬프트</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetPrompts}
                disabled={disabled}
                className="text-xs"
              >
                <RotateCcw className="mr-1.5 h-3 w-3" />
                기본값 리셋
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="debate_saju_persona">
              <TabsList className="mb-4">
                {PROMPT_SETTINGS.map((def) => (
                  <TabsTrigger key={def.key} value={def.key} className="text-xs">
                    {def.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {PROMPT_SETTINGS.map((def) => (
                <TabsContent key={def.key} value={def.key}>
                  <p className="mb-2 text-xs text-muted-foreground">{def.description}</p>
                  <Textarea
                    value={String(settings[def.key] ?? def.default)}
                    onChange={(e) => updateSetting(def.key, e.target.value)}
                    rows={12}
                    className="font-mono text-xs"
                    disabled={disabled}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* 저장 버튼 */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={disabled}>
            {loading ? "저장 중…" : "설정 저장"}
          </Button>
          {saved && <p className="text-sm text-green-600">✓ 저장되었습니다</p>}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Field renderers
// =============================================================================

function OperationField({
  def,
  value,
  onChange,
  disabled,
}: {
  def: SettingDef
  value: SettingValue
  onChange: (v: SettingValue) => void
  disabled: boolean
}) {
  switch (def.type) {
    case "boolean":
      return (
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">{def.label}</Label>
            <p className="text-xs text-muted-foreground">{def.description}</p>
          </div>
          <Switch
            checked={value === true || value === "true"}
            onCheckedChange={(checked) => onChange(checked)}
            disabled={disabled}
          />
        </div>
      )

    case "number":
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">{def.label}</Label>
          <p className="text-xs text-muted-foreground">{def.description}</p>
          <Input
            type="number"
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
            min={def.min}
            max={def.max}
            step={def.step}
            className="w-32"
            disabled={disabled}
          />
        </div>
      )

    case "select":
      return (
        <div className="space-y-1.5">
          <Label className="text-sm">{def.label}</Label>
          <p className="text-xs text-muted-foreground">{def.description}</p>
          <select
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="flex h-9 w-64 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {def.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )

    default:
      return null
  }
}
