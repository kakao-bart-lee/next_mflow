import { test, expect } from "@playwright/test"

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

test.describe("결정 도우미 플로우", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.evaluate((info) => {
      localStorage.setItem("saju_birth_info", JSON.stringify(info))
    }, BIRTH_INFO)
    await page.goto("/decision")
  })

  test("결정 도우미 화면이 표시된다", async ({ page }) => {
    await expect(page.getByText("결정 도우미")).toBeVisible()
    await expect(page.getByRole("heading", { name: "두 갈래 길에서 방향을 찾아볼까요?" })).toBeVisible()
    await expect(page.getByPlaceholder("예: 이직하기")).toBeVisible()
    await expect(page.getByPlaceholder("예: 현재 직장 유지")).toBeVisible()
  })

  test("질문과 선택지를 입력할 수 있다", async ({ page }) => {
    await page.getByPlaceholder("예: 이직하기").fill("이직하기")
    await page.getByPlaceholder("예: 현재 직장 유지").fill("현재 직장 유지")

    const startButton = page.getByRole("button", { name: "질문 시작" })
    await expect(startButton).toBeEnabled()

    await startButton.click()
    await expect(page.getByText("지금 더 중요한 건 무엇인가요?")).toBeVisible()
    await page.getByRole("button", { name: "속도 (빠른 결과)" }).click()
    await expect(page.getByText("이 결정에서 가장 두려운 건?")).toBeVisible()
  })

  test("AI 분석 결과가 로딩된다", async ({ page }) => {
    await page.getByPlaceholder("예: 이직하기").fill("이직하기")
    await page.getByPlaceholder("예: 현재 직장 유지").fill("현재 직장 유지")
    await page.getByRole("button", { name: "질문 시작" }).click()

    await page.getByRole("button", { name: "속도 (빠른 결과)" }).click()
    await page.getByRole("button", { name: "후회 (놓칠까봐)" }).click()

    const interpretRequest = page.waitForRequest(
      (req) => req.url().includes("/api/saju/interpret") && req.method() === "POST"
    )

    await page.getByRole("button", { name: "성장 (새로운 경험)" }).click()

    const request = await interpretRequest
    expect(request.postDataJSON()).toMatchObject({ type: "decision" })

    await expect(page.getByRole("button", { name: "다시 해보기" })).toBeVisible()
  })

  test("질문 없이는 다음 단계로 넘어갈 수 없다", async ({ page }) => {
    const startButton = page.getByRole("button", { name: "질문 시작" })

    await expect(startButton).toBeDisabled()

    await page.getByPlaceholder("예: 이직하기").fill("이직하기")
    await expect(startButton).toBeDisabled()
    await expect(page.getByText("지금 더 중요한 건 무엇인가요?")).not.toBeVisible()
  })
})
