import { test, expect } from "@playwright/test"

// SKIP_AUTH=true 환경에서 실행 가정
test.describe("온보딩 플로우", () => {
  test.beforeEach(async ({ page }) => {
    // 기존 localStorage 초기화
    await page.goto("/")
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test("랜딩 화면에서 시작 버튼을 누르면 온보딩이 표시된다", async ({ page }) => {
    // Landing 화면
    await expect(page.getByText("사주 플레이북")).toBeVisible()
    // CTA → /onboarding
    await page.getByRole("button", { name: /시작/ }).click()
    await expect(page).toHaveURL("/onboarding")
    await expect(page.getByText("언제 태어나셨나요?")).toBeVisible()
  })

  test("날짜 입력 없이 다음 버튼을 누르면 진행되지 않는다", async ({ page }) => {
    await page.getByRole("button", { name: /시작/ }).click()
    await expect(page).toHaveURL("/onboarding")

    const nextBtn = page.getByRole("button", { name: "다음" })
    await nextBtn.click()
    // 여전히 step 0
    await expect(page.getByText("언제 태어나셨나요?")).toBeVisible()
  })

  test("생년월일 입력 후 다음 단계로 이동된다", async ({ page }) => {
    await page.getByRole("button", { name: /시작/ }).click()
    await expect(page).toHaveURL("/onboarding")

    await page.locator("#birthdate").fill("1990-01-15")
    await page.locator("#birthtime").fill("14:30")
    await page.getByRole("button", { name: "다음" }).click()
    await expect(page.getByText("조금만 더 알려주세요")).toBeVisible()
  })

  test("온보딩 완료 시 /today로 이동된다", async ({ page }) => {
    await page.getByRole("button", { name: /시작/ }).click()

    // Step 0
    await page.locator("#birthdate").fill("1990-01-15")
    await page.locator("#birthtime").fill("14:30")
    await page.getByRole("button", { name: "다음" }).click()

    // Step 1
    await page.getByRole("button", { name: "남성" }).click()
    await page.getByPlaceholder("도시를 검색하세요").fill("서울")
    await page.waitForTimeout(1000) // debounce
    await page.locator("[role='option']").first().click()
    await page.getByRole("button", { name: "시작하기" }).click()

    // /today로 이동
    await expect(page).toHaveURL("/today", { timeout: 15000 })
  })

  test("새로고침 후에도 온보딩 완료 상태가 유지된다", async ({ page }) => {
    // localStorage에 직접 birthInfo 주입
    await page.evaluate(() => {
      localStorage.setItem(
        "saju_birth_info",
        JSON.stringify({
          birthDate: "1990-01-15",
          birthTime: "14:30",
          isTimeUnknown: false,
          timezone: "Asia/Seoul",
          gender: "M",
          latitude: 37.5665,
          longitude: 126.978,
          locationName: "서울",
        })
      )
    })
    await page.reload()
    // birthInfo가 있으므로 /today로 리다이렉트
    await expect(page).toHaveURL("/today", { timeout: 5000 })
    // 온보딩이 아닌 메인 탭 화면
    await expect(page.getByRole("navigation", { name: "메인 탐색" })).toBeVisible()
  })
})
