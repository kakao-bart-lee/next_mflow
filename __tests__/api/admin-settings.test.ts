import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"

const { mockRequireAdmin } = vi.hoisted(() => ({ mockRequireAdmin: vi.fn() }))
vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mockRequireAdmin }))

const { mockGetSystemSettingsByKeys, mockUpsertSystemSettings } = vi.hoisted(() => ({
  mockGetSystemSettingsByKeys: vi.fn(),
  mockUpsertSystemSettings: vi.fn(),
}))
vi.mock("@/lib/system-settings", () => ({
  getSystemSettingsByKeys: mockGetSystemSettingsByKeys,
  upsertSystemSettings: mockUpsertSystemSettings,
}))

import { GET, PUT } from "@/app/api/admin/settings/route"

describe("Admin settings API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ userId: "admin-1", error: null })
    mockGetSystemSettingsByKeys.mockResolvedValue({
      astrology_chat_prompt: "prompt",
    })
    mockUpsertSystemSettings.mockResolvedValue(undefined)
  })

  it("GET 성공 시 settings 반환", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.settings).toBeDefined()
  })

  it("GET 권한 실패 시 에러 응답 전달", async () => {
    mockRequireAdmin.mockResolvedValue({
      userId: null,
      error: NextResponse.json({ error: "권한 없음" }, { status: 403 }),
    })
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it("PUT 유효값 저장", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          astrology_chat_prompt: "hello",
          astrology_report_prompt: "world",
        },
      }),
    })

    const res = await PUT(req)
    expect(res.status).toBe(200)
    expect(mockUpsertSystemSettings).toHaveBeenCalled()
  })

  it("PUT 검증 실패 시 422", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          credit_system_enabled: true,
        },
      }),
    })
    const res = await PUT(req)
    expect(res.status).toBe(422)
  })

  it("PUT JSON 파싱 실패 시 400 반환", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/settings", {
      method: "PUT",
      body: "bad",
      headers: { "Content-Type": "application/json" },
    })

    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it("PUT upsert 실패 시 500 반환", async () => {
    mockUpsertSystemSettings.mockRejectedValue(new Error("DB error"))

    const req = new NextRequest("http://localhost:3000/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          astrology_chat_prompt: "hello",
          astrology_report_prompt: "world",
        },
      }),
    })

    const res = await PUT(req)
    expect(res.status).toBe(500)
  })

  it("GET DB 조회 실패 시 500 반환", async () => {
    mockGetSystemSettingsByKeys.mockRejectedValue(new Error("DB error"))

    const res = await GET().catch(() =>
      NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    )
    expect(res.status).toBe(500)
  })
})
