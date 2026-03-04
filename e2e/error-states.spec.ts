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

test.describe("에러 및 그레이스풀 디그레이데이션", () => {
  test("API 실패 시에도 오늘 화면이 표시된다", async ({ page }) => {
    await page.route("**/api/saju/analyze", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "test" }),
      })
    })

    await seedBirthInfo(page)
    await page.goto("/today")

    await expect(page).toHaveURL("/today")
    await expect(page.getByText("사주 분석 결과를 불러오는 중입니다")).toBeVisible()
  })

  test("birthInfo 없이 메인 페이지 접근 시 리다이렉트된다", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => localStorage.clear())

    await page.goto("/today")

    await expect(page).toHaveURL("/", { timeout: 5000 })
    await expect(page.getByText("moonlit")).toBeVisible()
  })

  test("잘못된 birthInfo 형식에도 크래시하지 않는다", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => {
      localStorage.setItem("saju_birth_info", JSON.stringify("bad"))
    })

    await page.goto("/today")
    await page.waitForTimeout(1000)

    const path = new URL(page.url()).pathname
    if (path === "/") {
      await expect(page.getByText("moonlit")).toBeVisible()
      return
    }

    await expect(page).toHaveURL("/today")
    await expect(page.locator('section[aria-label="오늘의 편지"]')).toBeVisible()
  })

  test("오프라인 상태에서 체크인은 로컬에 저장된다", async ({ page }) => {
    const todayKey = `saju_checkin_${new Date().toISOString().slice(0, 10)}`

    await page.route("**/api/**", async (route) => {
      await route.abort("internetdisconnected")
    })

    await page.goto("/")
    await page.evaluate(
      ({ info, key }) => {
        localStorage.setItem("saju_birth_info", JSON.stringify(info))
        localStorage.setItem(key, JSON.stringify({ selected: "calm", saved: true }))
      },
      { info: BIRTH_INFO, key: todayKey }
    )

    await page.goto("/today")

    const checkinState = await page.evaluate((key) => {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw) as { selected: string | null; saved: boolean }
    }, todayKey)

    expect(checkinState).not.toBeNull()
    expect(checkinState?.saved).toBe(true)
    expect(checkinState?.selected).toBe("calm")
    await expect(page.getByText("오늘의 체크인이 저장되었어요")).toBeVisible()
  })

  test("LLM interpret 실패 시 정적 데이터로 폴백된다", async ({ page }) => {
    await page.route("**/api/saju/interpret", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "test" }),
      })
    })

    await seedBirthInfo(page)

    const analyzeResponse = page.waitForResponse(
      (res) => res.url().includes("/api/saju/analyze") && res.request().method() === "POST" && res.ok()
    )
    await page.goto("/today")
    await analyzeResponse

    await expect(page.locator('section[aria-label="오늘의 편지"]')).toBeVisible()
    await expect(
      page.getByText(
        /새로운 시작과 성장의 기운이 흐릅니다|열정과 활력이 넘치는 하루입니다|안정과 중심을 잡는 기운이 흐릅니다|결단력이 빛나는 날입니다|지혜와 내면의 성찰을 위한 날입니다/
      )
    ).toBeVisible()
  })
})
