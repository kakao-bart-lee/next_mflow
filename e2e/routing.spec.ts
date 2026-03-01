import { test, expect, type Page } from "@playwright/test"

const BIRTH_INFO = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M" as const,
  latitude: 37.5665,
  longitude: 126.978,
  locationName: "서울",
}

/** Inject birthInfo into localStorage and reload to simulate an existing user. */
async function seedBirthInfo(page: Page) {
  await page.evaluate((info) => {
    localStorage.setItem("saju_birth_info", JSON.stringify(info))
  }, BIRTH_INFO)
}

// ────────────────────────────────────────
// 1. New-user flow: / → /onboarding → /today
// ────────────────────────────────────────
test.describe("신규 유저 플로우", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test("/ 접속 시 Landing 화면이 표시된다", async ({ page }) => {
    await expect(page).toHaveURL("/")
    await expect(page.getByText("사주 플레이북")).toBeVisible()
    // CTA 버튼이 존재
    await expect(page.getByRole("button", { name: /시작/ })).toBeVisible()
  })

  test("CTA 클릭 시 /onboarding으로 이동한다", async ({ page }) => {
    await page.getByRole("button", { name: /시작/ }).click()
    await expect(page).toHaveURL("/onboarding")
    await expect(page.getByText("언제 태어나셨나요?")).toBeVisible()
  })

  test("온보딩 완료 시 /today로 이동한다", async ({ page }) => {
    // Landing → Onboarding
    await page.getByRole("button", { name: /시작/ }).click()
    await expect(page).toHaveURL("/onboarding")

    // Step 0: birth date & time
    await page.locator("#birthdate").fill("1990-01-15")
    await page.locator("#birthtime").fill("14:30")
    await page.getByRole("button", { name: "다음" }).click()

    // Step 1: gender & location
    await page.getByRole("button", { name: "남성" }).click()
    await page.getByPlaceholder("도시를 검색하세요").fill("서울")
    await page.waitForTimeout(1000) // debounce
    await page.locator("[role='option']").first().click()
    await page.getByRole("button", { name: "시작하기" }).click()

    // Should navigate to /today
    await expect(page).toHaveURL("/today", { timeout: 15000 })
  })
})

// ────────────────────────────────────────
// 2. Existing-user redirects
// ────────────────────────────────────────
test.describe("기존 유저 리다이렉트", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await seedBirthInfo(page)
  })

  test("/ 접속 시 /today로 리다이렉트된다", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL("/today", { timeout: 5000 })
  })

  test("/onboarding 접속 시 /today로 리다이렉트된다", async ({ page }) => {
    await page.goto("/onboarding")
    await expect(page).toHaveURL("/today", { timeout: 5000 })
  })
})

// ────────────────────────────────────────
// 3. Direct URL access — guard behavior
// ────────────────────────────────────────
test.describe("직접 URL 접근 가드", () => {
  test("신규 유저가 /week 접근 시 /로 리다이렉트", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => localStorage.clear())
    await page.goto("/week")
    await expect(page).toHaveURL("/", { timeout: 5000 })
  })

  test("신규 유저가 /decision 접근 시 /로 리다이렉트", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => localStorage.clear())
    await page.goto("/decision")
    await expect(page).toHaveURL("/", { timeout: 5000 })
  })

  test("신규 유저가 /explore 접근 시 /로 리다이렉트", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => localStorage.clear())
    await page.goto("/explore")
    await expect(page).toHaveURL("/", { timeout: 5000 })
  })

  test("기존 유저가 /week 직접 접근 시 정상 렌더", async ({ page }) => {
    await page.goto("/")
    await seedBirthInfo(page)
    await page.goto("/week")
    await expect(page).toHaveURL("/week")
    // BottomNav가 표시되어야 함
    await expect(page.getByRole("navigation", { name: "메인 탐색" })).toBeVisible()
  })

  test("기존 유저가 /explore 직접 접근 시 정상 렌더", async ({ page }) => {
    await page.goto("/")
    await seedBirthInfo(page)
    await page.goto("/explore")
    await expect(page).toHaveURL("/explore")
    await expect(page.getByRole("navigation", { name: "메인 탐색" })).toBeVisible()
  })
})

// ────────────────────────────────────────
// 4. Bottom nav tab switching
// ────────────────────────────────────────
test.describe("하단 네비게이션 탭 전환", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await seedBirthInfo(page)
    await page.goto("/today")
    await expect(page).toHaveURL("/today")
  })

  test("이번 주 탭 클릭 시 /week으로 이동", async ({ page }) => {
    await page.getByRole("navigation", { name: "메인 탐색" }).getByRole("link", { name: "이번 주" }).click()
    await expect(page).toHaveURL("/week")
  })

  test("결정 탭 클릭 시 /decision으로 이동", async ({ page }) => {
    await page.getByRole("navigation", { name: "메인 탐색" }).getByRole("link", { name: "결정" }).click()
    await expect(page).toHaveURL("/decision")
  })

  test("탐색 탭 클릭 시 /explore로 이동", async ({ page }) => {
    await page.getByRole("navigation", { name: "메인 탐색" }).getByRole("link", { name: "탐색" }).click()
    await expect(page).toHaveURL("/explore")
  })

  test("오늘 탭의 aria-current=page가 활성화된다", async ({ page }) => {
    const todayLink = page.getByRole("navigation", { name: "메인 탐색" }).getByRole("link", { name: "오늘" })
    await expect(todayLink).toHaveAttribute("aria-current", "page")
  })

  test("다른 탭으로 이동하면 aria-current가 전환된다", async ({ page }) => {
    await page.getByRole("navigation", { name: "메인 탐색" }).getByRole("link", { name: "탐색" }).click()
    await expect(page).toHaveURL("/explore")

    const exploreLink = page.getByRole("navigation", { name: "메인 탐색" }).getByRole("link", { name: "탐색" })
    await expect(exploreLink).toHaveAttribute("aria-current", "page")

    const todayLink = page.getByRole("navigation", { name: "메인 탐색" }).getByRole("link", { name: "오늘" })
    await expect(todayLink).not.toHaveAttribute("aria-current", "page")
  })
})

// ────────────────────────────────────────
// 5. Browser back/forward
// ────────────────────────────────────────
test.describe("브라우저 히스토리 네비게이션", () => {
  test("뒤로가기/앞으로가기가 정상 동작한다", async ({ page }) => {
    await page.goto("/")
    await seedBirthInfo(page)

    // /today → /week → /explore
    await page.goto("/today")
    await expect(page).toHaveURL("/today")

    await page.getByRole("navigation", { name: "메인 탐색" }).getByRole("link", { name: "이번 주" }).click()
    await expect(page).toHaveURL("/week")

    await page.getByRole("navigation", { name: "메인 탐색" }).getByRole("link", { name: "탐색" }).click()
    await expect(page).toHaveURL("/explore")

    // Back: /explore → /week
    await page.goBack()
    await expect(page).toHaveURL("/week")

    // Back: /week → /today
    await page.goBack()
    await expect(page).toHaveURL("/today")

    // Forward: /today → /week
    await page.goForward()
    await expect(page).toHaveURL("/week")
  })
})

// ────────────────────────────────────────
// 6. Refresh — sajuResult auto-restore
// ────────────────────────────────────────
test.describe("새로고침 후 상태 복원", () => {
  test("새로고침 후 /today에 머물며 분석을 자동 재요청한다", async ({ page }) => {
    await page.goto("/")
    await seedBirthInfo(page)
    await page.goto("/today")
    await expect(page).toHaveURL("/today")

    // Reload and verify we stay on /today (not redirected to /)
    await page.reload()
    await expect(page).toHaveURL("/today", { timeout: 5000 })

    // Verify the analyze API was called (auto-reanalyze)
    const analyzeRequest = page.waitForRequest(
      (req) => req.url().includes("/api/saju/analyze"),
      { timeout: 5000 }
    )
    await page.reload()
    await expect(page).toHaveURL("/today")
    await analyzeRequest
  })

  test("새로고침 후 /week에서도 birthInfo가 유지된다", async ({ page }) => {
    await page.goto("/")
    await seedBirthInfo(page)
    await page.goto("/week")
    await expect(page).toHaveURL("/week")

    await page.reload()
    await expect(page).toHaveURL("/week")
    await expect(page.getByRole("navigation", { name: "메인 탐색" })).toBeVisible()
  })
})
