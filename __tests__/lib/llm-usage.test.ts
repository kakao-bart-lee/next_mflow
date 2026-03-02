import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockLlmModelFindUnique, mockLlmUsageLogCreate } = vi.hoisted(() => ({
  mockLlmModelFindUnique: vi.fn(),
  mockLlmUsageLogCreate: vi.fn(),
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    llmModel: {
      findUnique: mockLlmModelFindUnique,
    },
    llmUsageLog: {
      create: mockLlmUsageLogCreate,
    },
  },
}))

import { logLlmUsage, calculateCost, _clearPricingCache } from "@/lib/llm-usage"

describe("calculateCost", () => {
  it("입력/출력 토큰에 대해 올바른 비용을 계산한다", () => {
    const cost = calculateCost(1000, 500, {
      inputPricePer1M: 0.15,
      outputPricePer1M: 0.60,
    })
    // (1000 * 0.15 / 1_000_000) + (500 * 0.60 / 1_000_000)
    // = 0.00015 + 0.0003 = 0.00045
    expect(cost).toBeCloseTo(0.00045, 8)
  })

  it("토큰이 0이면 비용도 0이다", () => {
    const cost = calculateCost(0, 0, {
      inputPricePer1M: 2.50,
      outputPricePer1M: 10.00,
    })
    expect(cost).toBe(0)
  })

  it("대량 토큰에 대해 정확히 계산한다", () => {
    // 1M 입력 토큰 + 1M 출력 토큰
    const cost = calculateCost(1_000_000, 1_000_000, {
      inputPricePer1M: 2.50,
      outputPricePer1M: 10.00,
    })
    expect(cost).toBeCloseTo(12.50, 2)
  })
})

describe("logLlmUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _clearPricingCache()
  })

  it("등록된 모델의 비용을 계산하여 로그를 기록한다", async () => {
    mockLlmModelFindUnique.mockResolvedValue({
      inputPricePer1M: 0.15,
      outputPricePer1M: 0.60,
    })
    mockLlmUsageLogCreate.mockResolvedValue({ id: "test-id" })

    await logLlmUsage({
      endpoint: "chat",
      modelId: "gpt-4o-mini",
      userId: "user-1",
      inputTokens: 1000,
      outputTokens: 500,
      latencyMs: 250,
      method: "streamText",
    })

    expect(mockLlmUsageLogCreate).toHaveBeenCalledOnce()
    const createArg = mockLlmUsageLogCreate.mock.calls[0][0]
    expect(createArg.data.endpoint).toBe("chat")
    expect(createArg.data.modelId).toBe("gpt-4o-mini")
    expect(createArg.data.userId).toBe("user-1")
    expect(createArg.data.inputTokens).toBe(1000)
    expect(createArg.data.outputTokens).toBe(500)
    expect(createArg.data.costUsd).toBeCloseTo(0.00045, 8)
    expect(createArg.data.latencyMs).toBe(250)
    expect(createArg.data.method).toBe("streamText")
  })

  it("미등록 모델은 costUsd=0으로 기록한다", async () => {
    mockLlmModelFindUnique.mockResolvedValue(null)
    mockLlmUsageLogCreate.mockResolvedValue({ id: "test-id" })

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    await logLlmUsage({
      endpoint: "interpret-daily",
      modelId: "unknown-model",
      inputTokens: 500,
      outputTokens: 200,
      method: "generateObject",
    })

    expect(mockLlmUsageLogCreate).toHaveBeenCalledOnce()
    const createArg = mockLlmUsageLogCreate.mock.calls[0][0]
    expect(createArg.data.costUsd).toBe(0)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("unknown-model"),
    )

    warnSpy.mockRestore()
  })

  it("DB 에러가 발생해도 throw하지 않는다 (fire-and-forget)", async () => {
    mockLlmModelFindUnique.mockRejectedValue(new Error("DB connection failed"))

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    // 에러가 throw되지 않아야 함
    await expect(
      logLlmUsage({
        endpoint: "chat",
        modelId: "gpt-4o-mini",
        inputTokens: 100,
        outputTokens: 50,
        method: "streamText",
      }),
    ).resolves.toBeUndefined()

    expect(errorSpy).toHaveBeenCalledWith(
      "[llm-usage] 사용량 기록 실패:",
      expect.any(Error),
    )

    errorSpy.mockRestore()
  })

  it("가격 캐시를 사용하여 중복 DB 조회를 방지한다", async () => {
    mockLlmModelFindUnique.mockResolvedValue({
      inputPricePer1M: 0.15,
      outputPricePer1M: 0.60,
    })
    mockLlmUsageLogCreate.mockResolvedValue({ id: "test-id" })

    // 첫 번째 호출 — DB 조회 발생
    await logLlmUsage({
      endpoint: "chat",
      modelId: "gpt-4o-mini",
      inputTokens: 100,
      outputTokens: 50,
      method: "streamText",
    })

    // 두 번째 호출 — 캐시 사용, DB 조회 없음
    await logLlmUsage({
      endpoint: "chat",
      modelId: "gpt-4o-mini",
      inputTokens: 200,
      outputTokens: 100,
      method: "streamText",
    })

    // findUnique는 1번만 호출되어야 함 (캐시 덕분)
    expect(mockLlmModelFindUnique).toHaveBeenCalledTimes(1)
    // create는 2번 호출
    expect(mockLlmUsageLogCreate).toHaveBeenCalledTimes(2)
  })

  it("userId가 null이면 null로 기록한다", async () => {
    mockLlmModelFindUnique.mockResolvedValue({
      inputPricePer1M: 0.15,
      outputPricePer1M: 0.60,
    })
    mockLlmUsageLogCreate.mockResolvedValue({ id: "test-id" })

    await logLlmUsage({
      endpoint: "chat",
      modelId: "gpt-4o-mini",
      inputTokens: 100,
      outputTokens: 50,
      method: "streamText",
    })

    const createArg = mockLlmUsageLogCreate.mock.calls[0][0]
    expect(createArg.data.userId).toBeNull()
  })

  it("metadata를 올바르게 전달한다", async () => {
    mockLlmModelFindUnique.mockResolvedValue({
      inputPricePer1M: 0.15,
      outputPricePer1M: 0.60,
    })
    mockLlmUsageLogCreate.mockResolvedValue({ id: "test-id" })

    await logLlmUsage({
      endpoint: "debate-turn-1",
      modelId: "gpt-4o-mini",
      inputTokens: 100,
      outputTokens: 50,
      method: "streamText",
      metadata: { agent: "saju-master", turn: 1 },
    })

    const createArg = mockLlmUsageLogCreate.mock.calls[0][0]
    expect(createArg.data.metadata).toEqual({ agent: "saju-master", turn: 1 })
  })
})
