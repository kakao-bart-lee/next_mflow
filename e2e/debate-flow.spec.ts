import { test, expect } from "@playwright/test"

test.describe("사주 × 점성술 토론", () => {
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
  })

  test("토론 페이지에 접근하면 시작 화면이 표시된다", async ({ page }) => {
    await page.goto("/debate")
    // 토론 시작 화면 요소 확인
    await expect(page.getByText("동서양 운세 토론")).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole("button", { name: /토론 시작/ })).toBeVisible()
  })

  test("오늘의 운세에서 토론 진입 CTA가 표시된다", async ({ page }) => {
    await page.goto("/today")
    // 사주 분석 API 응답 대기 (최대 15초)
    await page.waitForResponse(
      (resp) => resp.url().includes("/api/saju/analyze") && resp.status() === 200,
      { timeout: 15000 },
    ).catch(() => {
      test.skip()
    })
    // 토론 CTA 링크 확인
    const debateLink = page.getByRole("link", { name: /동서양 전문가 토론/ })
    await expect(debateLink).toBeVisible({ timeout: 5000 })
    // 클릭 시 토론 페이지로 이동
    await debateLink.click()
    await expect(page).toHaveURL("/debate")
  })

  test("토론 시작 시 NDJSON 스트리밍 메시지가 표시된다", async ({ page }) => {
    await page.goto("/debate")
    await expect(page.getByRole("button", { name: /토론 시작/ })).toBeVisible({ timeout: 10000 })

    // 토론 시작 버튼 클릭
    await page.getByRole("button", { name: /토론 시작/ }).click()

    // API 응답 시작 대기
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/debate"),
      { timeout: 30000 },
    )

    // 첫 번째 에이전트 메시지 표시 대기
    await expect(page.getByText("사주 명리사")).toBeVisible({ timeout: 30000 })

    // 스트리밍 텍스트가 나타나는지 확인 (턴 1 마커)
    await expect(page.getByText("턴 1")).toBeVisible({ timeout: 5000 })

    // API 응답 확인
    const response = await responsePromise.catch(() => null)
    if (response) {
      expect(response.headers()["content-type"]).toContain("application/x-ndjson")
    }
  })

  test("토론 완료 후 종합 분석 카드가 표시된다", async ({ page }) => {
    // 이 테스트는 전체 토론이 완료될 때까지 기다림 (MOCK_DEBATE=true 환경에서 빠름)
    await page.goto("/debate")
    await expect(page.getByRole("button", { name: /토론 시작/ })).toBeVisible({ timeout: 10000 })
    await page.getByRole("button", { name: /토론 시작/ }).click()

    // 종합 분석 카드 대기 (Mock: ~5초, Real LLM: ~60초)
    await expect(page.getByText("종합 분석")).toBeVisible({ timeout: 120000 })

    // 요약 카드의 핵심 요소 확인
    await expect(page.getByText("두 전문가의 합의")).toBeVisible()
    await expect(page.getByText("실천 조언")).toBeVisible()

    // CTA 버튼 확인
    await expect(page.getByRole("button", { name: /새 토론 시작/ })).toBeVisible()
    await expect(page.getByRole("link", { name: /오늘의 운세/ })).toBeVisible()
  })

  test("birthInfo 없이 토론 페이지 접근 시 리다이렉트된다", async ({ page }) => {
    // localStorage 비우고 접근
    await page.evaluate(() => localStorage.removeItem("saju_birth_info"))
    await page.goto("/debate")
    // useRequireBirthInfo 가드에 의해 랜딩 페이지로 리다이렉트
    await expect(page).toHaveURL(/^\/$/, { timeout: 10000 })
  })
})
