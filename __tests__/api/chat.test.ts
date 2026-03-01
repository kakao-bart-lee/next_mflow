import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }))
vi.mock("@/lib/auth", () => ({ auth: mockAuth }))

const { mockIsCreditEnabled, mockConsumeCredit } = vi.hoisted(() => ({
  mockIsCreditEnabled: vi.fn(),
  mockConsumeCredit: vi.fn(),
}))
vi.mock("@/lib/credit-service", () => ({
  isCreditEnabled: mockIsCreditEnabled,
  consumeCredit: mockConsumeCredit,
  CREDIT_COSTS: { SAJU_ANALYSIS: 2, CHAT_MESSAGE: 1, COMPATIBILITY: 3 },
}))

const { mockToTextStreamResponse } = vi.hoisted(() => ({
  mockToTextStreamResponse: vi.fn(),
}))
vi.mock("ai", () => ({
  streamText: vi.fn(() => ({
    toTextStreamResponse: mockToTextStreamResponse,
  })),
}))

vi.mock("@ai-sdk/openai", () => ({ openai: vi.fn().mockReturnValue("gpt-4o-mini-model") }))

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
    mockAuth.mockResolvedValue(null)
    mockIsCreditEnabled.mockReturnValue(false)
    mockToTextStreamResponse.mockReturnValue(new Response("안녕하세요"))
  })

  it("정상 요청에 스트리밍 응답 반환", async () => {
    const res = await POST(makeRequest({
      messages: [{ role: "user", content: "오늘 운세가 궁금해요" }],
    }))
    expect(res.status).toBe(200)
    expect(mockToTextStreamResponse).toHaveBeenCalled()
  })

  it("JSON 파싱 실패 시 400 반환", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: "bad",
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("messages가 비어 있으면 400 반환", async () => {
    const res = await POST(makeRequest({ messages: [] }))
    expect(res.status).toBe(400)
  })

  it("크레딧 활성화 + 로그인 상태에서 크레딧 차감", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockIsCreditEnabled.mockReturnValue(true)
    mockConsumeCredit.mockResolvedValue({ success: true, balance: 7 })

    await POST(makeRequest({
      messages: [{ role: "user", content: "질문" }],
    }))
    expect(mockConsumeCredit).toHaveBeenCalledWith("user-1", 1, "AI 채팅")
  })

  it("크레딧 부족 시 402 반환", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockIsCreditEnabled.mockReturnValue(true)
    mockConsumeCredit.mockResolvedValue({ success: false, balance: 0 })

    const res = await POST(makeRequest({
      messages: [{ role: "user", content: "질문" }],
    }))
    expect(res.status).toBe(402)
    const json = await res.json()
    expect(json.code).toBe("INSUFFICIENT_CREDITS")
  })
})
