import { PrismaClient } from "@prisma/client"
import { startOfMonth, endOfMonth } from "date-fns"

const prisma = new PrismaClient()

// ── 1. 구독 플랜 ─────────────────────────────────
async function seedPlans() {
  const plans = [
    {
      name: "free",
      displayName: "무료 플랜",
      description: "기본 사주 분석 기능을 무료로 이용하세요.",
      monthlyCredits: 10,
      priceKrw: 0,
      features: ["사주 분석 월 2회", "기본 오늘의 운세", "AI 채팅 5회"],
      sortOrder: 0,
    },
    {
      name: "basic",
      displayName: "베이직 플랜",
      description: "더 많은 분석과 AI 채팅을 이용하세요.",
      monthlyCredits: 50,
      priceKrw: 9900,
      features: [
        "사주 분석 월 10회",
        "오늘의 운세 무제한",
        "AI 채팅 50회",
        "대운 분석",
        "적성/직업 분석",
      ],
      sortOrder: 1,
    },
    {
      name: "pro",
      displayName: "프로 플랜",
      description: "제한 없이 모든 기능을 이용하세요.",
      monthlyCredits: 200,
      priceKrw: 29900,
      features: [
        "사주 분석 무제한",
        "AI 채팅 무제한",
        "대운/세운 전체 분석",
        "궁합 분석",
        "이름 작명 상담",
        "우선 고객 지원",
      ],
      sortOrder: 2,
    },
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    })
  }
  console.log("✓ 구독 플랜 3개 생성됨")
}

// ── 2. 시스템 설정 ───────────────────────────────
async function seedSystemSettings() {
  const settings = [
    {
      key: "maintenance_mode",
      value: false,
      description: "점검 모드 활성화 시 true",
    },
    {
      key: "credit_system_enabled",
      value: false,
      description: "크레딧 시스템 사용 여부",
    },
    {
      key: "subscription_system_enabled",
      value: false,
      description: "구독 시스템 사용 여부",
    },
    {
      key: "initial_free_credits",
      value: 10,
      description: "신규 가입자 지급 크레딧",
    },
    {
      key: "saju_analysis_cost",
      value: 2,
      description: "사주 분석 1회 크레딧 비용",
    },
    {
      key: "chat_message_cost",
      value: 1,
      description: "AI 채팅 1회 크레딧 비용",
    },
    {
      key: "astrology_chat_prompt",
      value:
        "You are an astrology interpretation guide for a destiny decision product. Use Korean honorifics and practical advice.",
      description: "점성 AI 채팅 시스템 프롬프트",
    },
    {
      key: "astrology_report_prompt",
      value:
        "Generate concise Korean astrology interpretations using static planetary influence data.",
      description: "점성 리포트 생성 시스템 프롬프트",
    },
  ]

  for (const { key, value, description } of settings) {
    await prisma.systemSettings.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    })
  }
  console.log("✓ 시스템 설정 생성됨")
}

// ── 3. 사용자 + 크레딧 + 분석 데이터 ────────────
async function seedUsers() {
  const now = new Date()
  const freePlan = await prisma.subscriptionPlan.findUnique({ where: { name: "free" } })
  const basicPlan = await prisma.subscriptionPlan.findUnique({ where: { name: "basic" } })

  // ── 3-1. 관리자 개발 계정 (SKIP_AUTH=true 자동 로그인 계정) ──
  const devUser = await prisma.user.upsert({
    where: { id: "dev-user-local" },
    update: {
      email: "dev@localhost",
      name: "개발자 (Admin)",
      isAdmin: true,
    },
    create: {
      id: "dev-user-local",
      email: "dev@localhost",
      name: "개발자 (Admin)",
      isAdmin: true,
      birthInfo: {
        birthDate: "1990-05-20",
        birthTime: "09:00",
        isTimeUnknown: false,
        timezone: "Asia/Seoul",
        gender: "M",
      },
    },
  })
  await prisma.credit.upsert({
    where: { userId: devUser.id },
    update: { balance: 9999 },
    create: { userId: devUser.id, balance: 9999 },
  })
  await prisma.userPreferences.upsert({
    where: { userId: devUser.id },
    update: {},
    create: { userId: devUser.id, language: "ko", emailNotifications: false, saveHistory: true },
  })
  console.log("  ✓ dev@localhost (관리자, 크레딧 9999)")

  // ── 3-2. 일반 테스트 유저 1 (베이직 플랜, 크레딧 보통) ──
  const user1 = await prisma.user.upsert({
    where: { email: "user1@test.com" },
    update: {},
    create: {
      email: "user1@test.com",
      name: "테스트 유저1",
      isAdmin: false,
      birthInfo: {
        birthDate: "1988-03-15",
        birthTime: "14:30",
        isTimeUnknown: false,
        timezone: "Asia/Seoul",
        gender: "F",
      },
    },
  })
  await prisma.credit.upsert({
    where: { userId: user1.id },
    update: { balance: 35 },
    create: { userId: user1.id, balance: 35 },
  })
  await prisma.creditLog.createMany({
    data: [
      { userId: user1.id, amount: 10, reason: "가입 축하 보너스" },
      { userId: user1.id, amount: 50, reason: "베이직 플랜 월 지급" },
      { userId: user1.id, amount: -2, reason: "사주 분석" },
      { userId: user1.id, amount: -1, reason: "AI 채팅" },
      { userId: user1.id, amount: -22, reason: "AI 채팅 (22회)" },
    ],
    skipDuplicates: true,
  })
  if (basicPlan) {
    await prisma.subscription.create({
      data: {
        userId: user1.id,
        planId: basicPlan.id,
        status: "active",
        currentPeriodStart: startOfMonth(now),
        currentPeriodEnd: endOfMonth(now),
      },
    })
  }
  console.log("  ✓ user1@test.com (베이직 플랜, 크레딧 35)")

  // ── 3-3. 일반 테스트 유저 2 (무료 플랜, 크레딧 소진 직전) ──
  const user2 = await prisma.user.upsert({
    where: { email: "user2@test.com" },
    update: {},
    create: {
      email: "user2@test.com",
      name: "테스트 유저2",
      isAdmin: false,
      birthInfo: {
        birthDate: "1995-11-08",
        birthTime: null,
        isTimeUnknown: true,
        timezone: "Asia/Seoul",
        gender: "M",
      },
    },
  })
  await prisma.credit.upsert({
    where: { userId: user2.id },
    update: { balance: 1 },
    create: { userId: user2.id, balance: 1 },
  })
  await prisma.creditLog.createMany({
    data: [
      { userId: user2.id, amount: 10, reason: "가입 축하 보너스" },
      { userId: user2.id, amount: -9, reason: "사주 분석 및 채팅" },
    ],
    skipDuplicates: true,
  })
  if (freePlan) {
    await prisma.subscription.create({
      data: {
        userId: user2.id,
        planId: freePlan.id,
        status: "active",
        currentPeriodStart: startOfMonth(now),
        currentPeriodEnd: endOfMonth(now),
      },
    })
  }
  console.log("  ✓ user2@test.com (무료 플랜, 크레딧 1 — 소진 직전)")

  // ── 3-4. 일반 테스트 유저 3 (크레딧 없음 — 부족 상태 테스트용) ──
  const user3 = await prisma.user.upsert({
    where: { email: "user3@test.com" },
    update: {},
    create: {
      email: "user3@test.com",
      name: "테스트 유저3",
      isAdmin: false,
    },
  })
  await prisma.credit.upsert({
    where: { userId: user3.id },
    update: { balance: 0 },
    create: { userId: user3.id, balance: 0 },
  })
  console.log("  ✓ user3@test.com (크레딧 0 — 결제 유도 테스트용)")

  return { devUser, user1, user2, user3 }
}

// ── 4. 샘플 분석 데이터 ──────────────────────────
async function seedAnalyses(users: { devUser: { id: string }; user1: { id: string } }) {
  const sampleInput = {
    birthDate: "1988-03-15",
    birthTime: "14:30",
    isTimeUnknown: false,
    timezone: "Asia/Seoul",
    gender: "F",
  }

  // 실제 사주 계산 결과 형식 (FortuneTellerService 출력 구조)
  const sampleResult = {
    sajuData: {
      pillars: {
        년: { 천간: "무(戊)", 지지: "진(辰)", 오행: { 천간: "토", 지지: "토" } },
        월: { 천간: "계(癸)", 지지: "묘(卯)", 오행: { 천간: "수", 지지: "목" } },
        일: { 천간: "무(戊)", 지지: "신(申)", 오행: { 천간: "토", 지지: "금" } },
        시: { 천간: "갑(甲)", 지지: "신(申)", 오행: { 천간: "목", 지지: "금" } },
      },
      fiveElementBalance: { 목: 20, 화: 0, 토: 40, 금: 30, 수: 10 },
    },
    dayFortune: {
      overall: "안정적인 하루입니다. 새로운 시작보다는 현재 업무 마무리에 집중하세요.",
      work: "꼼꼼한 검토가 필요한 날",
      love: "소통이 중요한 시기",
      health: "충분한 휴식 필요",
    },
  }

  await prisma.analysis.createMany({
    data: [
      {
        userId: users.devUser.id,
        expertId: "saju",
        input: sampleInput,
        result: { ...sampleResult, note: "개발자 테스트 분석 1" },
      },
      {
        userId: users.user1.id,
        expertId: "saju",
        input: sampleInput,
        result: { ...sampleResult, note: "user1 분석 기록" },
      },
    ],
    skipDuplicates: false,
  })
  console.log("✓ 샘플 분석 데이터 생성됨")
}

// ── 5. 샘플 채팅 세션 ────────────────────────────
async function seedChatSessions(users: { devUser: { id: string } }) {
  const session = await prisma.chatSession.create({
    data: {
      userId: users.devUser.id,
      expertId: "saju",
      title: "사주 상담 샘플 세션",
    },
  })

  await prisma.chatMessage.createMany({
    data: [
      {
        sessionId: session.id,
        role: "user",
        content: "저의 사주를 기반으로 올해 운세를 알려주세요.",
      },
      {
        sessionId: session.id,
        role: "assistant",
        content:
          "2024년은 갑진년으로, 무일주 분께는 목극토의 기운이 강하게 작용하는 해입니다. 직업운은 변화가 있을 수 있으니 신중한 판단이 필요하고, 인간관계에서 새로운 인연이 생길 가능성이 높습니다. 건강 면에서는 소화기 계통에 주의하시기 바랍니다.",
      },
      {
        sessionId: session.id,
        role: "user",
        content: "재물운은 어떤가요?",
      },
      {
        sessionId: session.id,
        role: "assistant",
        content:
          "재물운은 상반기보다 하반기가 더 좋습니다. 특히 9월~11월 사이에 예상치 못한 수입이 생길 수 있습니다. 단, 충동적인 투자나 보증은 피하시는 것이 좋겠습니다.",
      },
    ],
  })
  console.log("✓ 샘플 채팅 세션 생성됨")
}

// ── 6. LLM 모델 단가 ─────────────────────────────
async function seedLlmModels() {
  const models = [
    {
      modelId: "gpt-4o-mini",
      displayName: "GPT-4o Mini",
      provider: "openai",
      inputPricePer1M: 0.15,
      outputPricePer1M: 0.60,
    },
    {
      modelId: "gpt-4o",
      displayName: "GPT-4o",
      provider: "openai",
      inputPricePer1M: 2.50,
      outputPricePer1M: 10.00,
    },
    {
      modelId: "gpt-4.1-mini",
      displayName: "GPT-4.1 Mini",
      provider: "openai",
      inputPricePer1M: 0.40,
      outputPricePer1M: 1.60,
    },
    {
      modelId: "gpt-4.1",
      displayName: "GPT-4.1",
      provider: "openai",
      inputPricePer1M: 2.00,
      outputPricePer1M: 8.00,
    },
  ]

  for (const model of models) {
    await prisma.llmModel.upsert({
      where: { modelId: model.modelId },
      update: model,
      create: model,
    })
  }
  console.log("✓ LLM 모델 단가 4개 생성됨")
}

// ── 메인 ─────────────────────────────────────────
async function main() {
  console.log("\n🌱 시드 데이터 삽입 시작...\n")

  await seedPlans()
  await seedSystemSettings()
  await seedLlmModels()
  const users = await seedUsers()
  await seedAnalyses(users)
  await seedChatSessions(users)

  console.log("\n✅ 시드 완료!\n")
  console.log("  개발 계정:")
  console.log("  ┌─────────────────────────────────────────────────────┐")
  console.log("  │ 역할        │ 이메일            │ 크레딧 │ 비고      │")
  console.log("  ├─────────────┼───────────────────┼────────┼───────────┤")
  console.log("  │ 관리자      │ dev@localhost      │  9999  │ SKIP_AUTH │")
  console.log("  │ 일반 (베이직) │ user1@test.com   │    35  │ 샘플 풍부 │")
  console.log("  │ 일반 (무료)  │ user2@test.com   │     1  │ 소진 직전 │")
  console.log("  │ 일반 (신규)  │ user3@test.com   │     0  │ 크레딧 없음│")
  console.log("  └─────────────────────────────────────────────────────┘")
  console.log("\n  make dev → SKIP_AUTH=true로 dev@localhost 자동 로그인")
  console.log("  관리자 패널: http://localhost:3000/admin\n")
}

main()
  .catch((e) => {
    console.error("시드 오류:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
