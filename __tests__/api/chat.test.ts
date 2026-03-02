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

const { mockGetStringSystemSetting } = vi.hoisted(() => ({
  mockGetStringSystemSetting: vi.fn(),
}))
vi.mock("@/lib/system-settings", () => ({
  getStringSystemSetting: mockGetStringSystemSetting,
}))

vi.mock("@/lib/llm-usage", () => ({
  logLlmUsage: vi.fn(),
}))

// Mastra chatAgent mock
const { mockStream } = vi.hoisted(() => ({ mockStream: vi.fn() }))
vi.mock("@/lib/mastra", () => ({
  chatAgent: { stream: mockStream },
}))

import { POST } from "@/app/api/chat/route"

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function mockStreamResult(text: string) {
  const chunks = [text]
  return {
    textStream: (async function* () {
      for (const chunk of chunks) yield chunk
    })(),
    usage: Promise.resolve({ inputTokens: 10, outputTokens: 20 }),
    steps: Promise.resolve([]),
  }
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue(null)
    mockIsCreditEnabled.mockReturnValue(false)
    mockGetStringSystemSetting.mockResolvedValue("기본 프롬프트")
    mockStream.mockReturnValue(mockStreamResult("안녕하세요"))
  })

  it("정상 요청에 스트리밍 응답 반환", async () => {
    const res = await POST(makeRequest({
      messages: [{ role: "user", content: "오늘 운세가 궁금해요" }],
    }))
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toBe("안녕하세요")
    expect(mockStream).toHaveBeenCalled()
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

  it("context.birthInfo가 있으면 instructions에 BIRTH_INFO_JSON 포함", async () => {
    await POST(makeRequest({
      messages: [{ role: "user", content: "내 사주 해석해줘" }],
      context: {
        birthInfo: { birthDate: "1990-01-01", birthTime: "13:30", gender: "male" },
      },
    }))

    const lastCallArg = mockStream.mock.calls.at(-1)?.[1]
    expect(lastCallArg?.instructions).toContain("BIRTH_INFO_JSON")
  })

  it("context.astrologyData가 있으면 instructions에 ASTROLOGY_STATIC_JSON 포함", async () => {
    await POST(makeRequest({
      messages: [{ role: "user", content: "이번주 운세 알려줘" }],
      context: {
        astrologyData: { dayPillar: "갑자", monthPillar: "을축", yearPillar: "병인" },
      },
    }))

    const lastCallArg = mockStream.mock.calls.at(-1)?.[1]
    expect(lastCallArg?.instructions).toContain("ASTROLOGY_STATIC_JSON")
  })

  it("context가 없어도 정상 응답", async () => {
    const res = await POST(makeRequest({
      messages: [{ role: "user", content: "질문" }],
    }))

    expect(res.status).toBe(200)
    expect(mockStream).toHaveBeenCalled()
  })

  it("threadId를 전달하면 memory.thread에 포함", async () => {
    await POST(makeRequest({
      messages: [{ role: "user", content: "이어서 대화" }],
      threadId: "thread-123",
    }))

    const lastCallArg = mockStream.mock.calls.at(-1)?.[1]
    expect(lastCallArg?.memory?.thread).toBe("thread-123")
  })

  it("user 메시지만 agent에 전달", async () => {
    await POST(makeRequest({
      messages: [
        { role: "assistant", content: "이전 답변" },
        { role: "user", content: "새 질문" },
      ],
    }))

    const firstArg = mockStream.mock.calls.at(-1)?.[0]
    expect(firstArg).toBe("새 질문")
  })
})
