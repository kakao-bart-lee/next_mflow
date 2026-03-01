import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/admin"
import { getSystemSettingsByKeys, upsertSystemSettings } from "@/lib/system-settings"

const SUPPORTED_KEYS = [
  "saju_agent_prompt",
  "saju_today_prompt",
  "saju_weekly_prompt",
] as const

const SettingsPayloadSchema = z.object({
  settings: z.record(
    z.enum(SUPPORTED_KEYS),
    z.string().min(1)
  ),
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

  await upsertSystemSettings(parsed.data.settings)
  return NextResponse.json({ ok: true })
}
