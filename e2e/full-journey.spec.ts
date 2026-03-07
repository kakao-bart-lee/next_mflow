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

async function seedBirthInfo(page: Page) {
  await page.evaluate((info) => {
    localStorage.setItem("saju_birth_info", JSON.stringify(info))
  }, BIRTH_INFO)
}

async function seedTodayCheckin(page: Page, selected: string) {
  await page.evaluate((moodId) => {
    const dateStr = new Date().toISOString().slice(0, 10)
    localStorage.setItem(
      `saju_checkin_${dateStr}`,
      JSON.stringify({ selected: moodId, saved: true })
    )
  }, selected)
}

function waitForAnalyzeResponse(page: Page) {
  return page.waitForResponse(
    (res) => res.url().includes("/api/saju/analyze") && res.status() === 200,
    { timeout: 15000 }
  )
}

test.describe("풀 저니 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test("온보딩 → 오늘 화면에서 기본 요소가 표시된다", async ({ page }) => {
    await page.getByRole("button", { name: /시작/ }).click()
    await expect(page).toHaveURL("/onboarding")

    await page.locator("#birthdate").fill("1990-01-15")
    await page.locator("#birthtime").fill("14:30")
    await page.getByRole("button", { name: "다음" }).click()

    await page.getByRole("button", { name: "남성" }).click()
    await page.getByPlaceholder("도시 이름을 검색하세요...").fill("서울")
    await page.locator("button").filter({ hasText: "서울특별시" }).first().click()

    const analyzeResponse = waitForAnalyzeResponse(page)
    await page.getByRole("button", { name: "시작하기" }).click()

    await expect(page).toHaveURL("/today", { timeout: 15000 })
    await analyzeResponse

    await expect(page.getByRole("navigation", { name: "메인 탐색" })).toBeVisible()
    await expect(page.locator('section[aria-label="오늘의 편지"] h1')).toBeVisible()
    await expect(page.getByText(/성장|시작|열정|표현|정리|안정|결단|집중|지혜|성찰/).first()).toBeVisible()
    await expect(page.getByText("오늘의 실천")).toBeVisible()
    await expect(page.getByRole("checkbox").first()).toBeVisible()
    // lucide-react v0.5+ 에서 AlertTriangle의 실제 CSS 클래스는 lucide-triangle-alert
    await expect(page.locator('section[aria-label="오늘의 실천"] svg.lucide-triangle-alert')).toBeVisible()
    await expect(page.getByRole("button", { name: "왜 이렇게 나왔나요?" })).toBeVisible()
    await expect(page.getByRole("button", { name: "이 내용에 대해 더 이야기하기" })).toBeVisible()
  })

  test("오늘 화면에서 실천 항목을 체크하면 상태가 유지된다", async ({ page }) => {
    await seedBirthInfo(page)

    const analyzeResponse = waitForAnalyzeResponse(page)
    await page.goto("/today")
    await expect(page).toHaveURL("/today", { timeout: 5000 })
    await analyzeResponse

    const firstAction = page.getByRole("checkbox").first()
    await firstAction.click()

    const storedActions = await page.evaluate<string[] | null>(() => {
      const dateStr = new Date().toISOString().slice(0, 10)
      const raw = localStorage.getItem(`saju_actions_${dateStr}`)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.map(String) : null
    })

    expect(storedActions).not.toBeNull()
    expect(storedActions?.length ?? 0).toBeGreaterThan(0)
  })

  test("이번 주 화면에서 예보 카드가 표시된다", async ({ page }) => {
    await seedBirthInfo(page)

    const analyzeResponse = waitForAnalyzeResponse(page)
    await page.goto("/week")
    await expect(page).toHaveURL("/week", { timeout: 5000 })
    await analyzeResponse

    const dayCards = page.locator('section[aria-label="7일 예보"] button[aria-expanded]')
    await expect(dayCards).toHaveCount(7)
    // 모바일/데스크톱 레이아웃 중복 렌더링 방어
    await expect(page.getByPlaceholder("30초만 적어보세요...").first()).toBeVisible()
    await expect(page.getByText("AI 주간 리캡")).toBeVisible()

    await dayCards.first().click()
    await expect(page.getByRole("button", { name: "이 날에 대해 더 알아보기" })).toBeVisible()
  })

  test("탐색 화면에서 트랜짓 정보가 표시된다", async ({ page }) => {
    await seedBirthInfo(page)

    const analyzeResponse = waitForAnalyzeResponse(page)
    await page.goto("/explore")
    await expect(page).toHaveURL("/explore", { timeout: 5000 })
    await analyzeResponse

    await expect(page.getByText("오행 에너지 분포")).toBeVisible()
    await expect(page.getByText("하늘의 변화")).toBeVisible()
    await expect(page.locator('section[aria-label="트랜짓과 사주 공명"] button[aria-expanded]').first()).toBeVisible()
    await expect(page.getByRole("button", { name: "이 해석에 대해 더 이야기하기" })).toBeVisible()
  })

  test("새로고침 후 체크인 상태가 유지된다", async ({ page }) => {
    await seedBirthInfo(page)
    await seedTodayCheckin(page, "calm")

    const analyzeResponse = waitForAnalyzeResponse(page)
    await page.goto("/today")
    await expect(page).toHaveURL("/today", { timeout: 5000 })
    await analyzeResponse

    const calmChip = page.getByRole("button", { name: "차분해요" })
    await expect(calmChip).toHaveAttribute("aria-pressed", "true")
    // 모바일/데스크톱 레이아웃 중복 렌더링 방어
    await expect(page.getByText("오늘의 체크인이 저장되었어요").first()).toBeVisible()

    await page.reload()
    await expect(page).toHaveURL("/today", { timeout: 5000 })
    await expect(page.getByRole("button", { name: "차분해요" })).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByText("오늘의 체크인이 저장되었어요").first()).toBeVisible()
  })
})
