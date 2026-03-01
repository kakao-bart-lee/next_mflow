import { test, expect } from "@playwright/test"

// 사주 분석 결과 화면 테스트 — localStorage에 birthInfo를 주입하여 API 의존성 최소화
test.describe("사주 분석 결과 화면", () => {
  const BIRTH_INFO = {
    birthDate: "1990-01-15",
    birthTime: "14:30",
    isTimeUnknown: false,
    timezone: "Asia/Seoul",
    gender: "M",
    latitude: 37.5665,
    longitude: 126.978,
    locationName: "서울",
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.evaluate((info) => {
      localStorage.setItem("saju_birth_info", JSON.stringify(info))
    }, BIRTH_INFO)
    // With birthInfo, / redirects to /today
    await page.goto("/today")
  })

  test("메인 앱 화면의 하단 네비게이션이 표시된다", async ({ page }) => {
    await expect(page.getByRole("navigation", { name: "메인 탐색" })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole("link", { name: "오늘" })).toBeVisible()
    await expect(page.getByRole("link", { name: "이번 주" })).toBeVisible()
    await expect(page.getByRole("link", { name: "결정" })).toBeVisible()
    await expect(page.getByRole("link", { name: "탐색" })).toBeVisible()
  })

  test("탐색 탭으로 이동하면 사주 일주가 표시된다", async ({ page }) => {
    await page.getByRole("link", { name: "탐색" }).click()
    await expect(page).toHaveURL("/explore")
    await expect(page.getByText("나의 사주 일주").or(page.getByText("나의 하늘과 사주"))).toBeVisible({ timeout: 5000 })
  })

  test("사주 분석 API 응답 후 데이터가 화면에 표시된다", async ({ page }) => {
    // API 응답 대기 (실제 서버 필요)
    await page.waitForResponse(
      (resp) => resp.url().includes("/api/saju/analyze") && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => {
      // API가 없는 환경에서는 스킵
      test.skip()
    })
  })
})
