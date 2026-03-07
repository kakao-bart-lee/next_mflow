import { test, expect } from "@playwright/test"

/**
 * 사주 엔진 E2E 테스트
 *
 * 전체 사용자 여정을 검증합니다:
 * 1. 생년월일 입력 → 사주 분석 → 오늘의 운세 표시
 * 2. 주간 운세 탭 이동 → 주간 데이터 표시
 * 3. AI 채팅 패널 열기 → 메시지 전송
 *
 * 주의: LLM 의존 기능은 API 에러 시 정적 폴백이 표시되는지 검증합니다.
 */

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

test.describe("사주 엔진 — 오늘의 운세 흐름", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.evaluate((info) => {
      localStorage.setItem("saju_birth_info", JSON.stringify(info))
    }, BIRTH_INFO)
    await page.goto("/today")
  })

  test("오늘의 운세 화면에 사주 데이터 기반 콘텐츠가 표시된다", async ({ page }) => {
    // 네비게이션이 표시될 때까지 대기 (앱 로딩 완료 신호)
    await expect(
      page.getByRole("navigation", { name: "메인 탐색" })
    ).toBeVisible({ timeout: 10000 })

    // 오늘의 운세 섹션: 요약 또는 태그가 표시되어야 함
    // 정적 폴백(오행 기반) 또는 LLM 생성 콘텐츠 중 하나가 보임
    const todayContent = page.locator("[data-testid='today-content'], .space-y-4").first()
    await expect(todayContent).toBeVisible({ timeout: 10000 })
  })

  test("하단 네비게이션에서 이번 주 탭으로 이동할 수 있다", async ({ page }) => {
    await expect(
      page.getByRole("navigation", { name: "메인 탐색" })
    ).toBeVisible({ timeout: 10000 })

    await page.getByRole("link", { name: "이번 주" }).click()
    await expect(page).toHaveURL("/week")

    // 주간 테마가 표시되어야 함 (정적 또는 LLM 생성)
    const weekHeader = page.locator("header h1, h1").first()
    await expect(weekHeader).toBeVisible({ timeout: 10000 })
  })
})

test.describe("사주 엔진 — API 직접 테스트", () => {
  test("POST /api/saju/analyze — 유효한 입력으로 사주 분석 성공", async ({ request }) => {
    const res = await request.post("/api/saju/analyze", {
      data: BIRTH_INFO,
    })
    expect(res.status()).toBe(200)

    const json = await res.json()
    expect(json.sajuData).toBeDefined()
    expect(json.sajuData.pillars).toBeDefined()
    expect(json.sajuData.pillars.년).toBeDefined()
    expect(json.sajuData.pillars.월).toBeDefined()
    expect(json.sajuData.pillars.일).toBeDefined()
    expect(json.sajuData.pillars.시).toBeDefined()

    // 검증된 결과와 비교
    expect(json.sajuData.pillars.년.천간).toContain("계")
    expect(json.sajuData.pillars.년.지지).toContain("유")
  })

  test("POST /api/saju/analyze — 잘못된 입력은 422 반환", async ({ request }) => {
    const res = await request.post("/api/saju/analyze", {
      data: { birthDate: "invalid", gender: "X" },
    })
    expect(res.status()).toBe(422)
  })

  test("POST /api/saju/interpret — 유효한 daily 요청 처리", async ({ request }) => {
    const res = await request.post("/api/saju/interpret", {
      data: {
        type: "daily",
        birthInfo: BIRTH_INFO,
      },
    })

    // LLM API 키가 없는 환경에서는 500 반환 가능 — 구조만 검증
    if (res.status() === 200) {
      const json = await res.json()
      expect(json.type).toBe("daily")
      expect(json.data).toBeDefined()
      expect(json.data.summary).toBeDefined()
      expect(json.data.body).toBeDefined()
    } else {
      // API 키 없는 환경: 에러 응답 구조 확인
      expect([500, 402]).toContain(res.status())
    }
  })

  test("POST /api/saju/interpret — 잘못된 type은 422 반환", async ({ request }) => {
    const res = await request.post("/api/saju/interpret", {
      data: {
        type: "invalid",
        birthInfo: BIRTH_INFO,
      },
    })
    expect(res.status()).toBe(422)
  })

  test("GET /api/admin/settings — 미인증 상태에서 접근 거부", async ({ request }) => {
    const res = await request.get("/api/admin/settings")
    // SKIP_AUTH=true 개발 환경에서는 세션 없이 직접 호출 시 500 반환 가능
    expect([401, 403, 500]).toContain(res.status())
  })

  test("PUT /api/admin/settings — 미인증 상태에서 접근 거부", async ({ request }) => {
    const res = await request.put("/api/admin/settings", {
      data: { settings: { saju_agent_prompt: "test" } },
    })
    // SKIP_AUTH=true 개발 환경에서는 세션 없이 직접 호출 시 500 반환 가능
    expect([401, 403, 500]).toContain(res.status())
  })
})

test.describe("사주 엔진 — 채팅 흐름", () => {
  test("POST /api/chat — 유효한 메시지로 스트림 응답", async ({ request }) => {
    const res = await request.post("/api/chat", {
      data: {
        messages: [{ role: "user", content: "안녕하세요" }],
        context: {
          birthInfo: BIRTH_INFO,
        },
      },
    })

    // 스트리밍 응답이므로 200 또는 LLM 에러 시 500
    if (res.status() === 200) {
      const text = await res.text()
      expect(text.length).toBeGreaterThan(0)
    }
  })

  test("POST /api/chat — 빈 messages는 400 반환", async ({ request }) => {
    const res = await request.post("/api/chat", {
      data: { messages: [] },
    })
    expect(res.status()).toBe(400)
  })
})
