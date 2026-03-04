# Moonlit — 회원 인증 & 크레딧 결제 시스템 스펙

> 작성일: 2026-03-04 | 상태: 확정

---

## 1. 회원 인증 시스템

### 1.1 지원 OAuth 프로바이더

| 프로바이더 | 라이브러리 |
|-----------|-----------|
| Google | NextAuth.js built-in |
| X (Twitter) | NextAuth.js built-in |
| Kakao | NextAuth.js 커스텀 프로바이더 |

### 1.2 기술 스택

- **라이브러리**: Auth.js (NextAuth v5)
- **DB**: PostgreSQL (Prisma ORM) — 기존 DB 사용
- **세션 전략**: JWT
- **이메일/비밀번호**: ❌ 미지원 (소셜 로그인 전용)

### 1.3 멀티 소셜 계정 연결

- 동일 유저가 여러 소셜 계정을 **하나의 계정에 연결** 가능
- 예: Google로 가입 후 Kakao 추가 연결
- NextAuth 기본 Account 연결 방식 활용

### 1.4 프로필 데이터

소셜에서 공통으로 가져오는 필드만:
- `name` (닉네임)
- `image` (프로필 사진 URL)
- `email`

별도 온보딩 스텝 없음.

---

## 2. 크레딧 시스템

> ⚠️ 코드에 이미 `lib/credit-service.ts` 뼈대 구현됨. `ENABLE_CREDIT_SYSTEM=true` 환경변수로 활성화.

### 2.1 기능별 크레딧 비용 (기존 코드 유지)

| 기능 | 크레딧 |
|------|--------|
| 사주 분석 | 2 |
| AI 채팅 1턴 | 1 |
| 궁합 분석 | 3 |

### 2.2 신규 가입 무료 크레딧

- **10 크레딧** 지급 (기존 `INITIAL_FREE_CREDITS = 10` 유지)
- 사주 분석 5회 또는 채팅 10턴 분량

### 2.3 크레딧 패키지

| 패키지명 | 크레딧 | 가격 (KRW) | 단가 |
|---------|--------|-----------|------|
| 스타터 | 50 | ₩490 | ₩9.8 |
| 베이직 | 200 | ₩1,900 | ₩9.5 |
| 플러스 | 500 | ₩3,900 | ₩7.8 |
| 프로 | 1,200 | ₩7,900 | ₩6.6 |

- **만료 없음** (크레딧은 영구 보유)
- 많이 살수록 단가 낮아지는 구조

---

## 3. 결제 시스템

### 3.1 결제 수단

- **1순위**: 토스페이먼츠 (TossPayments)
  - 카드, 카카오페이, 네이버페이 등 커버
- Stripe: 현재 미지원 (추후 글로벌 확장 시 고려)

### 3.2 결제 플로우

```
유저 → 패키지 선택 → 토스페이먼츠 결제창 → 결제 완료 콜백 → DB 크레딧 추가
```

- 결제 성공 시 `addCredit()` 호출 (기존 함수 활용)
- 결제 내역 별도 `PaymentLog` 테이블에 저장
- 실패/취소 처리 포함

---

## 4. DB 스키마 추가 사항

기존 Prisma 스키마에 추가 필요:

```prisma
model CreditPackage {
  id         String   @id @default(cuid())
  name       String   // "스타터", "베이직" 등
  credits    Int
  priceKrw   Int
  active     Boolean  @default(true)
  createdAt  DateTime @default(now())
}

model PaymentLog {
  id            String   @id @default(cuid())
  userId        String
  packageId     String
  orderId       String   @unique  // 토스 주문 ID
  amount        Int               // 결제 금액 (KRW)
  creditsAdded  Int
  status        String   // "pending" | "success" | "failed" | "cancelled"
  tossPaymentKey String?
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])
}
```

---

## 5. 구현 우선순위

1. **Phase 1 — 인증**: NextAuth 설정, Google/X/Kakao OAuth, 멀티 계정 연결
2. **Phase 2 — 크레딧 활성화**: `ENABLE_CREDIT_SYSTEM=true`, 가입 시 무료 크레딧 지급
3. **Phase 3 — 결제**: 토스페이먼츠 연동, 패키지 구매 UI, 결제 콜백 처리
4. **Phase 4 (추후)**: 어드민 수익률 시뮬레이션 (LLM 원가 vs 크레딧 수익 비교)

---

## 6. 환경변수 추가 필요

```env
# Auth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

AUTH_TWITTER_ID=
AUTH_TWITTER_SECRET=

AUTH_KAKAO_ID=
AUTH_KAKAO_SECRET=

# Credit
ENABLE_CREDIT_SYSTEM=true

# Toss Payments
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
```

---

## 7. 참고

- 기존 `lib/credit-service.ts` — 크레딧 차감/충전/조회 로직 완성됨
- 기존 `lib/llm-usage.ts` + `/admin/llm-costs` — LLM 비용 추적 완성됨
- Phase 4 어드민 시뮬레이션: 실제 LLM 비용 데이터 vs 크레딧 수익을 차트로 비교하는 기능
