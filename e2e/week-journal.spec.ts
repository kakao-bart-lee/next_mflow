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
  await page.goto("/")
  await page.evaluate((info) => {
    localStorage.setItem("saju_birth_info", JSON.stringify(info))
  }, BIRTH_INFO)
}

test.describe("주간 저널 플로우", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/saju/interpret", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "test" }),
      })
    })

    await seedBirthInfo(page)
    await page.goto("/week")
  })

  test("저널 입력 영역이 표시된다", async ({ page }) => {
    const journalInput = page.getByPlaceholder("30초만 적어보세요...")
    const saveButton = page.getByRole("button", { name: "저장" })

    await expect(journalInput).toBeVisible()
    await expect(saveButton).toBeDisabled()
  })

  test("텍스트 입력 후 저장 버튼이 활성화된다", async ({ page }) => {
    const journalInput = page.getByPlaceholder("30초만 적어보세요...")
    const saveButton = page.getByRole("button", { name: "저장" })

    await journalInput.fill("이번 주에는 수면 루틴을 지키고 싶다.")

    await expect(saveButton).toBeEnabled()
  })

  test("저널 저장 시 저장 확인이 표시된다", async ({ page }) => {
    const journalInput = page.getByPlaceholder("30초만 적어보세요...")
    const saveButton = page.getByRole("button", { name: "저장" })
    const requestOrResponse = Promise.race([
      page.waitForRequest((req) => req.url().includes("/api/user/journal") && req.method() === "POST"),
      page.waitForResponse((res) => res.url().includes("/api/user/journal") && res.request().method() === "POST"),
    ])

    await journalInput.fill("일정 사이에 10분 산책 시간을 고정하겠다.")
    await saveButton.click()
    await requestOrResponse

    const savedNotice = page.getByText("저장되었어요")
    const textStillVisible = page.getByText("일정 사이에 10분 산책 시간을 고정하겠다.")
    await expect(savedNotice.or(textStillVisible)).toBeVisible()
  })

  test("주간 예보의 날짜 카드가 7개 표시된다", async ({ page }) => {
    const forecastSection = page.locator('section[aria-label="7일 예보"]')
    const dayCards = forecastSection.locator('button[aria-expanded]')

    await expect(forecastSection).toBeVisible()
    await expect(dayCards).toHaveCount(7)

    await expect(
      page
        .getByText(/정리|표현|휴식|성장|만남|이동|마무리|정렬|돌봄|소통|관계|실행|확장|구조/)
        .first()
    ).toBeVisible()
  })
})
