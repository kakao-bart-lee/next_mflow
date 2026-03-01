import { describe, it, expect, vi, beforeEach } from "vitest"

// vi.hoisted()로 선언해야 vi.mock() 팩토리에서 참조 가능
const { mockTransaction, mockCreditFindUnique, mockCreditUpsert, mockCreditLogCreate } =
  vi.hoisted(() => ({
    mockTransaction: vi.fn(),
    mockCreditFindUnique: vi.fn(),
    mockCreditUpsert: vi.fn(),
    mockCreditLogCreate: vi.fn(),
  }))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    credit: {
      findUnique: mockCreditFindUnique,
      upsert: mockCreditUpsert,
    },
    creditLog: {
      create: mockCreditLogCreate,
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: mockTransaction,
  },
}))

import {
  getBalance,
  consumeCredit,
  addCredit,
  isCreditEnabled,
  CREDIT_COSTS,
} from "@/lib/credit-service"

describe("credit-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("CREDIT_COSTS", () => {
    it("사주 분석 비용이 2이다", () => {
      expect(CREDIT_COSTS.SAJU_ANALYSIS).toBe(2)
    })

    it("채팅 메시지 비용이 1이다", () => {
      expect(CREDIT_COSTS.CHAT_MESSAGE).toBe(1)
    })
  })

  describe("isCreditEnabled()", () => {
    it("ENABLE_CREDIT_SYSTEM=false이면 false 반환", () => {
      vi.stubEnv("ENABLE_CREDIT_SYSTEM", "false")
      expect(isCreditEnabled()).toBe(false)
    })

    it("ENABLE_CREDIT_SYSTEM=true이면 true 반환", () => {
      vi.stubEnv("ENABLE_CREDIT_SYSTEM", "true")
      expect(isCreditEnabled()).toBe(true)
    })
  })

  describe("getBalance()", () => {
    it("크레딧 레코드가 있으면 balance 반환", async () => {
      mockCreditFindUnique.mockResolvedValue({ balance: 8 })
      const balance = await getBalance("user-1")
      expect(balance).toBe(8)
      expect(mockCreditFindUnique).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        select: { balance: true },
      })
    })

    it("크레딧 레코드가 없으면 0 반환", async () => {
      mockCreditFindUnique.mockResolvedValue(null)
      const balance = await getBalance("user-no-credit")
      expect(balance).toBe(0)
    })
  })

  describe("consumeCredit()", () => {
    it("잔액이 충분하면 차감 성공", async () => {
      mockTransaction.mockImplementation(async (fn: Function) => {
        const tx = {
          credit: {
            findUnique: vi.fn().mockResolvedValue({ balance: 10 }),
            upsert: vi.fn().mockResolvedValue({ balance: 8 }),
          },
          creditLog: { create: vi.fn().mockResolvedValue({ id: "log-1" }) },
        }
        return fn(tx)
      })

      const result = await consumeCredit("user-1", 2, "사주 분석")
      expect(result.success).toBe(true)
      expect(result.balance).toBe(8)
    })

    it("잔액이 부족하면 success=false 반환", async () => {
      mockTransaction.mockImplementation(async (fn: Function) => {
        const tx = {
          credit: { findUnique: vi.fn().mockResolvedValue({ balance: 1 }) },
          creditLog: { create: vi.fn() },
        }
        return fn(tx)
      })

      const result = await consumeCredit("user-1", 2, "사주 분석")
      expect(result.success).toBe(false)
      expect(result.balance).toBe(1)
    })

    it("amount가 0 이하면 에러 발생", async () => {
      await expect(consumeCredit("user-1", 0, "test")).rejects.toThrow("0보다 커야")
    })
  })

  describe("addCredit()", () => {
    it("크레딧 추가 성공", async () => {
      mockTransaction.mockImplementation(async (fn: Function) => {
        const tx = {
          credit: { upsert: vi.fn().mockResolvedValue({ balance: 15 }) },
          creditLog: { create: vi.fn().mockResolvedValue({ id: "log-2" }) },
        }
        return fn(tx)
      })

      const result = await addCredit("user-1", 5, "관리자 지급")
      expect(result.balance).toBe(15)
      expect(result.transactionId).toBe("log-2")
    })

    it("amount가 0 이하면 에러 발생", async () => {
      await expect(addCredit("user-1", -1, "test")).rejects.toThrow("0보다 커야")
    })
  })
})
