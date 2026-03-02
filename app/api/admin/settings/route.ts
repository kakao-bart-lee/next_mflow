import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/admin"
import { getSystemSettingsByKeys, upsertSystemSettings } from "@/lib/system-settings"

const SUPPORTED_KEYS = [
  "astrology_chat_prompt",
  "astrology_report_prompt",
  "debate_enabled",
  "debate_mock_mode",
  "debate_model",
  "debate_turn_count",
  "debate_credit_cost",
  "debate_saju_persona",
  "debate_astrologer_persona",
  "debate_synthesis_prompt",
] as const

const SettingsPayloadSchema = z.object({
  settings: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
  ),
}).transform(({ settings }) => {
  const supportedSet = new Set<string>(SUPPORTED_KEYS)
  const filtered: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(settings)) {
    if (supportedSet.has(key)) {
      filtered[key] = value
    }
  }
  return { settings: filtered }
})

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const settings = await getSystemSettingsByKeys([...SUPPORTED_KEYS])
  return NextResponse.json({ settings })
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 })
  }

  const parsed = SettingsPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "설정값이 올바르지 않습니다", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  // 지원되지 않는 키만 보낸 경우 빈 객체가 되므로 422 반환
  if (Object.keys(parsed.data.settings).length === 0) {
    return NextResponse.json(
      { error: "유효한 설정 키가 없습니다" },
      { status: 422 }
    )
  }

  try {
    await upsertSystemSettings(parsed.data.settings)
  } catch {
    return NextResponse.json(
      { error: "설정 저장 중 오류가 발생했습니다", code: "DB_ERROR" },
      { status: 500 }
    )
  }

  return NextResponse.json({ settings: parsed.data.settings })
}
