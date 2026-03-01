import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"

const {
  mockRequireAdmin,
  mockGetSystemSettingsByKeys,
  mockUpsertSystemSettings,
} = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockGetSystemSettingsByKeys: vi.fn(),
  mockUpsertSystemSettings: vi.fn(),
}))

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: mockRequireAdmin,
}))

vi.mock("@/lib/system-settings", () => ({
  getSystemSettingsByKeys: mockGetSystemSettingsByKeys,
  upsertSystemSettings: mockUpsertSystemSettings,
}))

import { GET, PUT } from "@/app/api/admin/settings/route"

const SUPPORTED_KEYS = ["saju_agent_prompt", "saju_today_prompt", "saju_weekly_prompt"]

function makePutRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("/api/admin/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ error: null })
  })

  it("GET returns settings from DB", async () => {
    mockGetSystemSettingsByKeys.mockResolvedValue({
      saju_agent_prompt: "agent prompt",
      saju_today_prompt: "today prompt",
      saju_weekly_prompt: "weekly prompt",
    })

    const response = await GET()

    expect(response.status).toBe(200)
    expect(mockGetSystemSettingsByKeys).toHaveBeenCalledWith(SUPPORTED_KEYS)
    await expect(response.json()).resolves.toEqual({
      settings: {
        saju_agent_prompt: "agent prompt",
        saju_today_prompt: "today prompt",
        saju_weekly_prompt: "weekly prompt",
      },
    })
  })

  it("GET returns 401 when not admin", async () => {
    mockRequireAdmin.mockResolvedValue({
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    })

    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
    expect(mockGetSystemSettingsByKeys).not.toHaveBeenCalled()
  })

  it("PUT updates settings successfully", async () => {
    const payload = {
      settings: {
        saju_agent_prompt: "updated agent prompt",
        saju_today_prompt: "updated today prompt",
      },
    }

    const response = await PUT(makePutRequest(payload))

    expect(response.status).toBe(200)
    expect(mockUpsertSystemSettings).toHaveBeenCalledWith(payload.settings)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it("PUT returns 422 for invalid payload", async () => {
    const response = await PUT(
      makePutRequest({
        settings: {
          saju_agent_prompt: "",
        },
      })
    )

    expect(response.status).toBe(422)
    const json = await response.json()
    expect(json.error).toBe("설정값이 올바르지 않습니다")
    expect(mockUpsertSystemSettings).not.toHaveBeenCalled()
  })

  it("PUT returns 400 for malformed JSON", async () => {
    const request = new NextRequest("http://localhost:3000/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "{invalid-json",
    })

    const response = await PUT(request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "잘못된 요청 형식입니다" })
    expect(mockUpsertSystemSettings).not.toHaveBeenCalled()
  })
})
