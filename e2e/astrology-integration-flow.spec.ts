import { test, expect } from "@playwright/test"

const BIRTH_INFO = {
  birthDate: "1993-10-08",
  birthTime: "14:37",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M",
  latitude: 37.5665,
  longitude: 126.978,
  locationName: "서울",
}

test.describe("점성술 — API 직접 테스트", () => {
  test("POST /api/astrology/static — 유효한 입력으로 점성술 분석 성공", async ({ request }) => {
    const res = await request.post("/api/astrology/static", {
      data: BIRTH_INFO,
    })
    expect(res.status()).toBe(200)

    const json = await res.json()
    expect(json.version).toBeDefined()
    expect(json.positions).toBeDefined()
    expect(json.influences).toBeDefined()
    expect(json.ranking).toBeDefined()
  })

  test("POST /api/astrology/static — 잘못된 입력은 422 반환", async ({ request }) => {
    const res = await request.post("/api/astrology/static", {
      data: { birthDate: "invalid" },
    })
    expect(res.status()).toBe(422)
  })

  test("POST /api/astrology/static — 빈 요청은 4xx 반환", async ({ request }) => {
    const res = await request.post("/api/astrology/static", {
      data: "{",
      headers: {
        "content-type": "application/json",
      },
    })
    // JSON 파싱 실패 시 400, Zod 검증 실패 시 422
    expect([400, 422]).toContain(res.status())
  })
})

test.describe("점성술 — 탐색 화면 (Explore)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.evaluate((info) => {
      localStorage.setItem("saju_birth_info", JSON.stringify(info))
    }, BIRTH_INFO)
    await page.goto("/explore")
  })

  test("탐색 화면에 나의 하늘과 사주 제목이 표시된다", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "나의 하늘과 사주" })
    ).toBeVisible({ timeout: 10000 })
  })

  test("행성 위치 버튼들이 표시된다", async ({ page }) => {
    // 트랜짓 아코디언 버튼에 행성 기호가 포함되어 렌더링됨
    // 동일 기호가 여러 트랜짓에 나올 수 있으므로 .first() 사용
    await expect(page.getByRole("button", { name: /☉/ }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole("button", { name: /☽/ }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole("button", { name: /☿/ }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole("button", { name: /♀/ }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole("button", { name: /♂/ }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole("button", { name: /♃/ }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole("button", { name: /♄/ }).first()).toBeVisible({ timeout: 10000 })
  })

  test("오행 에너지 분포 섹션이 표시된다", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "오행 에너지 분포" })).toBeVisible({
      timeout: 10000,
    })
  })

  test("행성 클릭 시 상세 정보가 표시된다", async ({ page }) => {
    await page.getByRole("button", { name: /☉/ }).first().click()

    await expect(page.getByText("사주 대응:")).toBeVisible({ timeout: 10000 })
  })
})

test.describe("사주·점성술 — 통합 검증", () => {
  test("사주와 점성술 API가 동시에 성공 응답", async ({ request }) => {
    const [sajuRes, astrologyRes] = await Promise.all([
      request.post("/api/saju/analyze", {
        data: BIRTH_INFO,
      }),
      request.post("/api/astrology/static", {
        data: BIRTH_INFO,
      }),
    ])

    expect(sajuRes.status()).toBe(200)
    expect(astrologyRes.status()).toBe(200)
  })

  test("탐색 화면에서 사주 일주 데이터가 함께 표시된다", async ({ page }) => {
    await page.goto("/")
    await page.evaluate((info) => {
      localStorage.setItem("saju_birth_info", JSON.stringify(info))
    }, BIRTH_INFO)
    await page.goto("/explore")

    // 일주는 천간·지지가 별도 span으로 분리 렌더링되므로 구조적 헤딩으로 검증
    await expect(page.getByText("사주 일주")).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole("button", { name: /☉/ }).first()).toBeVisible({ timeout: 10000 })
  })
})
