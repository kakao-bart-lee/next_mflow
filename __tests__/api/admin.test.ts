import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const { mockRequireAdmin } = vi.hoisted(() => ({ mockRequireAdmin: vi.fn() }))
vi.mock("@/lib/auth/admin", () => ({ requireAdmin: mockRequireAdmin }))

const { mockAddCredit, mockConsumeCredit } = vi.hoisted(() => ({
  mockAddCredit: vi.fn(),
  mockConsumeCredit: vi.fn(),
}))
vi.mock("@/lib/credit-service", () => ({
  addCredit: mockAddCredit,
  consumeCredit: mockConsumeCredit,
}))

const { mockUserFindUnique } = vi.hoisted(() => ({ mockUserFindUnique: vi.fn() }))
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
  },
}))

import { POST } from "@/app/api/admin/credits/route"

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/admin/credits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const VALID_ADD_BODY = {
  userId: "target-user-1",
  amount: 10,
  reason: "이벤트 보상",
  action: "add",
}

describe("POST /api/admin/credits", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ userId: "admin-1", error: null })
    mockUserFindUnique.mockResolvedValue({ id: "target-user-1" })
    mockAddCredit.mockResolvedValue({ balance: 15, transactionId: "tx-1" })
    mockConsumeCredit.mockResolvedValue({ success: true, balance: 5, transactionId: "tx-2" })
  })

  it("관리자가 아니면 requireAdmin이 반환한 error response 전달", async () => {
    mockRequireAdmin.mockResolvedValue({
      userId: null,
      error: NextResponse.json({ error: "권한 없음" }, { status: 403 }),
    })
    const res = await POST(makeRequest(VALID_ADD_BODY))
    expect(res.status).toBe(403)
  })

  it("스키마 검증 실패 시 422 반환", async () => {
    const res = await POST(makeRequest({ userId: "", amount: -1, reason: "", action: "bad" }))
    expect(res.status).toBe(422)
  })

  it("대상 유저 없으면 404 반환", async () => {
    mockUserFindUnique.mockResolvedValue(null)
    const res = await POST(makeRequest(VALID_ADD_BODY))
    expect(res.status).toBe(404)
  })

  it("action=add 시 addCredit 호출하고 200 반환", async () => {
    const res = await POST(makeRequest(VALID_ADD_BODY))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.balance).toBe(15)
    expect(json.transactionId).toBe("tx-1")
    expect(mockAddCredit).toHaveBeenCalledWith(
      "target-user-1",
      10,
      "[관리자] 이벤트 보상",
      "admin-1"
    )
  })

  it("action=deduct 시 consumeCredit 호출하고 200 반환", async () => {
    const res = await POST(makeRequest({ ...VALID_ADD_BODY, action: "deduct" }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.balance).toBe(5)
    expect(mockConsumeCredit).toHaveBeenCalled()
  })

  it("action=deduct 시 잔액 부족이면 400 반환", async () => {
    mockConsumeCredit.mockResolvedValue({ success: false, balance: 0 })
    const res = await POST(makeRequest({ ...VALID_ADD_BODY, action: "deduct" }))
    expect(res.status).toBe(400)
  })
})
