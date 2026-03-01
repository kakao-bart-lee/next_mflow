import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const {
  mockAuth,
  mockGetStringSystemSetting,
  mockIsCreditEnabled,
  mockConsumeCredit,
  mockStreamText,
  mockOpenai,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetStringSystemSetting: vi.fn(),
  mockIsCreditEnabled: vi.fn(),
  mockConsumeCredit: vi.fn(),
  mockStreamText: vi.fn(),
  mockOpenai: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}))

vi.mock("@/lib/system-settings", () => ({
  getStringSystemSetting: mockGetStringSystemSetting,
}))

vi.mock("@/lib/mastra/agents/saju-agent", () => ({
  SAJU_EXPERT_PROMPT: "fallback prompt",
  buildSajuSystemPrompt: (context: { birthInfo?: unknown; sajuData?: unknown }, customPrompt?: string) => {
    const lines = [customPrompt ?? "fallback prompt"]

    if (context.birthInfo || context.sajuData) {
      lines.push("## Current User Context")
      if (context.birthInfo) {
        lines.push(`BIRTH_INFO_JSON: ${JSON.stringify(context.birthInfo)}`)
      }
      if (context.sajuData) {
        lines.push(`SAJU_DATA_JSON: ${JSON.stringify(context.sajuData)}`)
      }
    }

    return lines.join("\n")
  },
}))

vi.mock("@/lib/credit-service", () => ({
  isCreditEnabled: mockIsCreditEnabled,
  consumeCredit: mockConsumeCredit,
  CREDIT_COSTS: { CHAT_MESSAGE: 1 },
}))

vi.mock("ai", () => ({
  streamText: mockStreamText,
}))

vi.mock("@ai-sdk/openai", () => ({
  openai: mockOpenai,
}))

import { POST } from "@/app/api/chat/route"

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: "test-user" } })
    mockGetStringSystemSetting.mockResolvedValue("custom saju prompt")
    mockIsCreditEnabled.mockReturnValue(false)
    mockOpenai.mockReturnValue("mock-model")
    mockStreamText.mockImplementation(() => ({
      toTextStreamResponse: () => new Response("mock stream"),
    }))
  })

  it("POST with valid messages returns 200 streaming response", async () => {
    const response = await POST(
      makeRequest({
        messages: [{ role: "user", content: "오늘 운세 알려주세요" }],
      })
    )

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe("mock stream")
    expect(mockStreamText).toHaveBeenCalledTimes(1)
  })

  it("POST with empty messages returns 400", async () => {
    const response = await POST(makeRequest({ messages: [] }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "messages가 필요합니다" })
    expect(mockStreamText).not.toHaveBeenCalled()
  })

  it("POST with malformed body returns 400", async () => {
    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid-json",
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "잘못된 요청 형식입니다" })
  })

  it("System prompt includes saju context when provided", async () => {
    const context = {
      birthInfo: { birthDate: "1993-10-08", gender: "M" },
      sajuData: { pillars: { 일: { 천간: "임(壬)", 지지: "술(戌)" } } },
    }

    const response = await POST(
      makeRequest({
        messages: [{ role: "user", content: "제 사주를 해석해 주세요" }],
        context,
      })
    )

    expect(response.status).toBe(200)
    expect(mockStreamText).toHaveBeenCalledTimes(1)

    const streamArg = mockStreamText.mock.calls[0]?.[0]
    expect(streamArg.messages).toEqual([{ role: "user", content: "제 사주를 해석해 주세요" }])
    expect(streamArg.system).toContain("## Current User Context")
    expect(streamArg.system).toContain(`BIRTH_INFO_JSON: ${JSON.stringify(context.birthInfo)}`)
    expect(streamArg.system).toContain(`SAJU_DATA_JSON: ${JSON.stringify(context.sajuData)}`)
  })
})
