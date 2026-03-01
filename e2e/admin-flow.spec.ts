import { test, expect } from "@playwright/test"

// 관리자 플로우 — 실제 관리자 계정 필요
// CI에서는 SKIP_ADMIN_E2E=true로 스킵 가능
test.describe("관리자 플로우", () => {
  test.skip(
    !!process.env.SKIP_ADMIN_E2E,
    "SKIP_ADMIN_E2E 환경변수가 설정된 경우 스킵"
  )

  test("미인증 상태로 /api/admin/credits 접근 시 401/403 반환", async ({ request }) => {
    const res = await request.post("/api/admin/credits", {
      data: { userId: "u1", amount: 5, reason: "test", action: "add" },
    })
    expect([401, 403]).toContain(res.status())
  })

  test("관리자 로그인 후 사용자 목록 API 접근 성공", async ({ request }) => {
    // 실제 관리자 세션 쿠키가 필요 — CI에서는 환경 변수로 주입
    const adminCookie = process.env.ADMIN_SESSION_COOKIE
    if (!adminCookie) {
      test.skip()
      return
    }

    const res = await request.get("/api/admin/users", {
      headers: { Cookie: adminCookie },
    })
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.users)).toBe(true)
  })

  test("관리자가 크레딧 수동 지급 API 호출", async ({ request }) => {
    const adminCookie = process.env.ADMIN_SESSION_COOKIE
    const testUserId = process.env.TEST_USER_ID
    if (!adminCookie || !testUserId) {
      test.skip()
      return
    }

    const res = await request.post("/api/admin/credits", {
      headers: { Cookie: adminCookie },
      data: {
        userId: testUserId,
        amount: 5,
        reason: "E2E 테스트 지급",
        action: "add",
      },
    })
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(typeof json.balance).toBe("number")
    expect(json.transactionId).toBeDefined()
  })
})
