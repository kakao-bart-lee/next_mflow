# next-mflow 개발 현황

> 마지막 업데이트: 2025-01

---

## 개발 완료 항목

### 핵심 엔진

| 항목 | 파일 | 비고 |
|------|------|------|
| 사주 계산 엔진 | `lib/saju-core/` | 천간지지·오행·십신·신살·육효·신강신약 완전 구현 |
| FortuneTellerService | `lib/saju-core/facade.ts` | 단일 진입점 |
| BirthInfo 스키마 | `lib/schemas/birth-info.ts` | Zod 유효성 검증 |

### 인증 & 세션

| 항목 | 파일 | 비고 |
|------|------|------|
| NextAuth v5 설정 | `lib/auth/index.ts` | Google OAuth + 개발 Credentials |
| 개발 자동 로그인 | `lib/auth/index.ts` | `SKIP_AUTH=true` → `dev-user-local` |
| 관리자 권한 검사 | `lib/auth/admin.ts` | `requireAdmin()` |

### API Routes

| 엔드포인트 | 파일 | 기능 |
|-----------|------|------|
| `POST /api/saju/analyze` | `app/api/saju/analyze/route.ts` | 사주 분석 + 크레딧 소비 |
| `POST /api/chat` | `app/api/chat/route.ts` | AI 채팅 스트리밍 |
| `GET /api/credits` | `app/api/credits/route.ts` | 크레딧 잔액 조회 |
| `POST /api/user/birth-info` | `app/api/user/birth-info/route.ts` | 생년월일 저장 |
| `POST /api/admin/credits` | `app/api/admin/credits/route.ts` | 크레딧 수동 지급/차감 |
| `GET /api/admin/stats` | `app/api/admin/stats/route.ts` | 통계 조회 |
| `GET/PATCH /api/admin/users/[id]` | `app/api/admin/users/[id]/route.ts` | 사용자 상세 수정 |
| `GET /api/admin/subscriptions` | `app/api/admin/subscriptions/route.ts` | 구독 목록 |

### UI 컴포넌트 (백엔드 연결 완료)

| 컴포넌트 | 파일 | 상태 |
|---------|------|------|
| 온보딩 폼 | `components/saju/onboarding-screen.tsx` | API 연결, gender 버그 수정 |
| 오늘의 운세 | `components/saju/today-screen.tsx` | SajuContext 연결 |
| 탐색 화면 | `components/saju/explore-screen.tsx` | SajuContext 연결, TS 오류 수정 |
| AI 채팅 패널 | `components/saju/ai-chat-panel.tsx` | useChat (ai/react) 연결 |
| 체크인 칩 | `components/saju/check-in-chips.tsx` | localStorage 저장 |

### 상태 관리

| 항목 | 파일 | 비고 |
|------|------|------|
| SajuContext | `lib/contexts/saju-context.tsx` | birthInfo + sajuResult 전역 공유 |
| 홈 페이지 | `app/page.tsx` | SajuProvider 래핑, localStorage 복원 |

### 크레딧 시스템

| 항목 | 파일 | 비고 |
|------|------|------|
| 크레딧 서비스 | `lib/credit-service.ts` | 잔액 조회·소비·충전 |
| 분석 use-case | `lib/use-cases/analyze-saju.ts` | 크레딧 차감 후 계산 |

### 관리자 백오피스 (UI)

| 페이지 | 경로 | 기능 |
|--------|------|------|
| 대시보드 | `/admin` | 주요 통계 요약 |
| 사용자 목록 | `/admin/users` | 전체 사용자 조회 |
| 사용자 상세 | `/admin/users/[id]` | 정지·권한·크레딧 관리 |
| 크레딧 관리 | `/admin/credits` | 크레딧 수동 지급/차감 |
| 구독 관리 | `/admin/subscriptions` | 구독 현황 조회 |
| 설정 | `/admin/settings` | 시스템 설정 |

### 테스트 (53개)

| 파일 | 테스트 수 | 대상 |
|------|----------|------|
| `__tests__/lib/schemas/birth-info.test.ts` | 14 | BirthInfoSchema 유효성 |
| `__tests__/lib/credit-service.test.ts` | 8 | 크레딧 서비스 |
| `__tests__/lib/use-cases/analyze-saju.test.ts` | 7 | 사주 분석 use-case |
| `__tests__/lib/saju-core/facade.test.ts` | 6 | 실제 사주 계산 |
| `__tests__/api/saju-analyze.test.ts` | 5 | POST /api/saju/analyze |
| `__tests__/api/chat.test.ts` | 5 | POST /api/chat |
| `__tests__/api/admin.test.ts` | 6 | 관리자 API |
| `e2e/onboarding-flow.spec.ts` | — | E2E: 온보딩 플로우 |
| `e2e/saju-analysis-flow.spec.ts` | — | E2E: 사주 분석 플로우 |
| `e2e/chat-flow.spec.ts` | — | E2E: AI 채팅 플로우 |
| `e2e/admin-flow.spec.ts` | — | E2E: 관리자 플로우 |

### 개발 인프라

| 항목 | 파일 | 비고 |
|------|------|------|
| Docker Compose | `docker-compose.yml` | PostgreSQL(5433), Mailhog(1026/8026) |
| Makefile | `Makefile` | `make setup`, `make dev`, `make test` 등 |
| Prisma 시드 | `prisma/seed.ts` | 4개 계정 + 샘플 데이터 |
| 테스트 설정 | `vitest.config.ts`, `playwright.config.ts` | |

---

## 개발 필요 항목

### 우선순위 높음 (서비스 운영 필수)

| 항목 | 현황 | 필요 작업 |
|------|------|----------|
| **OAuth 실제 자격증명** | 환경변수 비어 있음 | Google Cloud Console에서 Client ID/Secret 발급 |
| **결제 연동** | 미구현 | Stripe 또는 포트원(아임포트) 연동 |
| **이메일 발송** | Mailhog만 있음 | SendGrid / AWS SES 연동 |
| **이미지 저장소** | 미구현 | 프로필 이미지용 S3/Cloudflare R2 연동 |

### 우선순위 중간 (UX 개선)

| 항목 | 현황 | 필요 작업 |
|------|------|----------|
| **채팅 세션 지속성** | 새로고침 시 초기화됨 | DB에서 ChatSession/ChatMessage 로드 |
| **구독 결제 플로우** | UI만 있음 | 실제 결제 연동 후 Subscription 생성 자동화 |
| **월별 크레딧 자동 지급** | 미구현 | cron job 또는 serverless scheduled function |
| **사용자 프로필 이미지** | 미구현 | 업로드 UI + 저장 |
| **주간/대운 분석** | `week-screen.tsx` 하드코딩 | SajuContext 연결 |
| **location-search** | UI만 있음 | 지역 선택 → lat/lng 연동 |
| **deep-dive-sheet** | UI만 있음 | 상세 분석 항목별 API 연동 |
| **decision-helper** | UI만 있음 | 질문 기반 사주 판단 API 연동 |

### 우선순위 낮음 (고도화)

| 항목 | 현황 | 필요 작업 |
|------|------|----------|
| **궁합 분석** | 엔진 있음 (`saju-core/gunghap.ts`) | API 라우트 + UI 작성 |
| **이름 작명 상담** | 미구현 | 별도 엔진 또는 AI 프롬프트 |
| **푸시 알림** | 미구현 | Web Push API |
| **소셜 공유** | 미구현 | 사주 결과 이미지 공유 기능 |
| **다국어 지원** | 한국어만 | i18n 설정 (영어, 중국어) |
| **PWA** | 미구현 | manifest.json, service worker |

---

## 알려진 이슈

| 이슈 | 위치 | 상태 |
|------|------|------|
| 채팅 API 스트리밍 context 주입 경로 | `app/api/chat/route.ts` | Mastra agent에 birthInfo 전달 방식 확인 필요 |
| 관리자 E2E 테스트 | `e2e/admin-flow.spec.ts` | `SKIP_ADMIN_E2E=true` 시 스킵 (실제 세션 쿠키 필요) |
| Kakao OAuth | `lib/auth/index.ts` | 설정에 Kakao Provider 없음 (환경변수는 있음) |

---

## 개발 계정 (시드 데이터)

```
이메일              역할    크레딧  비고
dev@localhost       관리자  9999    SKIP_AUTH=true 자동 로그인
user1@test.com      일반    35      베이직 플랜, 채팅/분석 내역 있음
user2@test.com      일반    1       무료 플랜, 크레딧 소진 직전
user3@test.com      일반    0       크레딧 없음 (결제 유도 테스트용)
```

---

## 빠른 시작

```bash
make setup      # 최초 1회: 패키지 설치 + DB 시작 + 스키마 + 시드
make dev        # 개발 서버 시작 (SKIP_AUTH=true 자동 적용)
make test       # 단위/통합 테스트 실행
make e2e        # E2E 테스트 실행
```

접속:
- 앱: http://localhost:4830
- 관리자: http://localhost:4830/admin
- Prisma Studio: `make db-studio` → http://localhost:6830
- Mailhog: `make mail-up` → http://localhost:9830
