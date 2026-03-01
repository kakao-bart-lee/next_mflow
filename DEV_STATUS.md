# next-mflow 개발 현황

> 마지막 업데이트: 2026-03

---

## 변경 이력

| 날짜 | 변경 내용 | 커밋 |
|------|----------|------|
| 2026-03 | 사주 엔진 파이프라인 구현 (교차검증·LLM 해석·프롬프트 관리·동적 화면) | `b185084` |
| 2025-01 | 초기 개발 완료 (사주 계산 엔진·인증·크레딧·백오피스·채팅) | — |

---

## 개발 완료 항목

### 핵심 엔진

| 항목 | 파일 | 비고 |
|------|------|------|
| 사주 계산 엔진 | `lib/saju-core/` | 천간지지·오행·십신·신살·육효·신강신약 완전 구현 |
| FortuneTellerService | `lib/saju-core/facade.ts` | 단일 진입점 |
| BirthInfo 스키마 | `lib/schemas/birth-info.ts` | Zod 유효성 검증 |
| 🆕 외부 라이브러리 교차검증 | `__tests__/lib/saju-core/cross-verification.test.ts` | lunar-javascript 대비 100% 일치 (48/48 pillars) |
| 🆕 한중 천간지지 매핑 | `lib/saju-core/test-utils/character-mapping.ts` | 갑(甲) ↔ 甲 변환 유틸 |

### LLM 해석 파이프라인 🆕

| 항목 | 파일 | 비고 |
|------|------|------|
| 사주 해석 use-case | `lib/use-cases/interpret-saju.ts` | OpenAI `generateObject` + Zod 스키마 (Daily/Weekly) |
| 해석 API | `app/api/saju/interpret/route.ts` | 인증 필수, 크레딧 후차감 (LLM 성공 후 차감) |
| React 훅 | `lib/hooks/use-saju-interpret.ts` | AbortController, 중복 요청 방지, refetch |
| 시스템 프롬프트 | DB `SystemSettings` → 코드 기본값 폴백 | 백오피스에서 실시간 수정 가능 |

### 시스템 설정 CRUD 🆕

| 항목 | 파일 | 비고 |
|------|------|------|
| 설정 서비스 | `lib/system-settings.ts` | get/upsert, `prisma.$transaction` 원자적 저장 |
| 설정 API | `app/api/admin/settings/route.ts` | GET/PUT, `requireAdmin()`, Zod 검증 |
| 설정 UI | `app/admin/settings/page.tsx` | 사주 프롬프트 3종 관리 (시스템/오늘/주간) |

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
| 🆕 `POST /api/saju/interpret` | `app/api/saju/interpret/route.ts` | LLM 사주 해석 (일간/주간) + 인증 + 크레딧 |
| `POST /api/chat` | `app/api/chat/route.ts` | AI 채팅 스트리밍 (🔄 DB 프롬프트 로딩 추가) |
| `GET /api/credits` | `app/api/credits/route.ts` | 크레딧 잔액 조회 |
| `POST /api/user/birth-info` | `app/api/user/birth-info/route.ts` | 생년월일 저장 |
| `POST /api/admin/credits` | `app/api/admin/credits/route.ts` | 크레딧 수동 지급/차감 |
| `GET /api/admin/stats` | `app/api/admin/stats/route.ts` | 통계 조회 |
| `GET/PATCH /api/admin/users/[id]` | `app/api/admin/users/[id]/route.ts` | 사용자 상세 수정 |
| `GET /api/admin/subscriptions` | `app/api/admin/subscriptions/route.ts` | 구독 목록 |
| 🆕 `GET/PUT /api/admin/settings` | `app/api/admin/settings/route.ts` | 시스템 설정 (프롬프트 등) |

### UI 컴포넌트 (백엔드 연결 완료)

| 컴포넌트 | 파일 | 상태 |
|---------|------|------|
| 온보딩 폼 | `components/saju/onboarding-screen.tsx` | API 연결, gender 버그 수정 |
| 오늘의 운세 | `components/saju/today-screen.tsx` | 🔄 LLM 동적 콘텐츠 + AI 뱃지 + 정적 폴백 |
| 주간 운세 | `components/saju/week-screen.tsx` | 🔄 LLM 동적 콘텐츠 + 아이콘 매핑 + 정적 폴백 |
| 탐색 화면 | `components/saju/explore-screen.tsx` | SajuContext 연결, TS 오류 수정 |
| AI 채팅 패널 | `components/saju/ai-chat-panel.tsx` | useChat (ai/react) 연결 |
| 체크인 칩 | `components/saju/check-in-chips.tsx` | localStorage 저장 |

### 상태 관리

| 항목 | 파일 | 비고 |
|------|------|------|
| SajuContext | `lib/contexts/saju-context.tsx` | birthInfo + sajuResult 전역 공유 |
| 홈 페이지 | `app/page.tsx` | SajuProvider 래핑, localStorage 복원 |
| 🆕 useSajuInterpret | `lib/hooks/use-saju-interpret.ts` | LLM 해석 결과 패칭 (abort, dedup, refetch) |

### 크레딧 시스템

| 항목 | 파일 | 비고 |
|------|------|------|
| 크레딧 서비스 | `lib/credit-service.ts` | 잔액 조회·소비·충전 |
| 분석 use-case | `lib/use-cases/analyze-saju.ts` | 크레딧 차감 후 계산 |
| 🆕 해석 use-case | `lib/use-cases/interpret-saju.ts` | 크레딧 후차감 (LLM 성공 후) |

### 관리자 백오피스 (UI)

| 페이지 | 경로 | 기능 |
|--------|------|------|
| 대시보드 | `/admin` | 주요 통계 요약 |
| 사용자 목록 | `/admin/users` | 전체 사용자 조회 |
| 사용자 상세 | `/admin/users/[id]` | 정지·권한·크레딧 관리 |
| 크레딧 관리 | `/admin/credits` | 크레딧 수동 지급/차감 |
| 구독 관리 | `/admin/subscriptions` | 구독 현황 조회 |
| 🔄 설정 | `/admin/settings` | 사주 프롬프트 관리 (시스템/오늘/주간) |

### 테스트 (116개)

| 파일 | 테스트 수 | 대상 |
|------|----------|------|
| `__tests__/lib/schemas/birth-info.test.ts` | 14 | BirthInfoSchema 유효성 |
| `__tests__/lib/credit-service.test.ts` | 8 | 크레딧 서비스 |
| `__tests__/lib/use-cases/analyze-saju.test.ts` | 7 | 사주 분석 use-case |
| `__tests__/lib/saju-core/facade.test.ts` | 6 | 실제 사주 계산 |
| `__tests__/api/saju-analyze.test.ts` | 5 | POST /api/saju/analyze |
| `__tests__/api/chat.test.ts` | 5 | POST /api/chat (🔄 DB 프롬프트 테스트 추가) |
| `__tests__/api/admin.test.ts` | 6 | 관리자 API |
| 🆕 `__tests__/lib/saju-core/cross-verification.test.ts` | 19 | lunar-javascript 교차검증 (12 날짜) |
| 🆕 `__tests__/lib/saju-core/calculator.test.ts` | 7 | 사주 계산기 코어 로직 |
| 🆕 `__tests__/lib/saju-core/sipsin.test.ts` | 4 | 십신 (十神) 계산 |
| 🆕 `__tests__/lib/saju-core/sinyakSingang.test.ts` | 4 | 신약·신강 판정 |
| 🆕 `__tests__/lib/saju-core/lifecycleStage.test.ts` | 6 | 대운·세운 생애주기 |
| 🆕 `__tests__/lib/saju-core/jijanggan.test.ts` | 6 | 지장간 (地藏干) 추출 |
| 🆕 `__tests__/lib/saju-core/hyungchung.test.ts` | 6 | 형충파해 관계 판정 |
| 🆕 `__tests__/api/admin-settings.test.ts` | 5 | 관리자 설정 API |
| 🆕 `__tests__/api/saju-interpret.test.ts` | 7 | 사주 해석 API (인증/크레딧/검증) |
| `e2e/onboarding-flow.spec.ts` | — | E2E: 온보딩 플로우 |
| `e2e/saju-analysis-flow.spec.ts` | — | E2E: 사주 분석 플로우 |
| `e2e/chat-flow.spec.ts` | — | E2E: AI 채팅 플로우 |
| `e2e/admin-flow.spec.ts` | — | E2E: 관리자 플로우 |
| 🆕 `e2e/saju-engine-flow.spec.ts` | 8 | E2E: 사주 엔진 전체 플로우 |

### 개발 인프라

| 항목 | 파일 | 비고 |
|------|------|------|
| Docker Compose | `docker-compose.yml` | PostgreSQL(5433), Mailhog(1026/8026) |
| Makefile | `Makefile` | `make setup`, `make dev`, `make test` 등 |
| Prisma 시드 | `prisma/seed.ts` | 4개 계정 + 샘플 데이터 |
| 테스트 설정 | `vitest.config.ts`, `playwright.config.ts` | |

---

## 2026-03 사주 엔진 파이프라인 상세

### 개요

사주팔자 정적 계산 → 외부 라이브러리 교차검증 → 시스템 설정 저장 → LLM 해석 생성 → 백오피스 프롬프트 관리 → 프론트엔드 동적 전달까지의 **전체 파이프라인**을 구축했습니다.

### 아키텍처

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│ BirthInfo   │────▶│ saju-core    │────▶│ Analysis (DB)  │
│ (사용자 입력) │     │ (정적 계산)   │     │ (JSON 저장)     │
└─────────────┘     └──────────────┘     └───────┬────────┘
                                                 │
                    ┌──────────────┐             │
                    │ SystemSettings│             │
                    │ (DB 프롬프트)  │─────┐       │
                    └──────────────┘     │       │
                                        ▼       ▼
                              ┌───────────────────┐
                              │ interpret-saju.ts  │
                              │ (OpenAI generateObj)│
                              └─────────┬─────────┘
                                        │
                    ┌────────────────────┼─────────────────┐
                    ▼                    ▼                 ▼
            ┌──────────────┐   ┌──────────────┐  ┌──────────────┐
            │ today-screen │   │ week-screen  │  │ AI Chat      │
            │ (일간 운세)   │   │ (주간 운세)   │  │ (대화형)      │
            └──────────────┘   └──────────────┘  └──────────────┘
```

### 데이터 흐름

1. **정적 계산**: `FortuneTellerService.calculateSaju(birthInfo)` → 천간지지·오행·십신·신살·형충 등
2. **DB 저장**: `Analysis` 테이블에 JSON으로 저장
3. **LLM 해석 요청**: `POST /api/saju/interpret` → 인증 확인 → 분석 데이터 + DB 프롬프트 로딩
4. **AI 생성**: `generateObject()` + Zod 스키마로 구조화된 응답 (DailyFortune / WeeklyFortune)
5. **크레딧 차감**: LLM 성공 후 차감 (fail-closed 정책)
6. **프론트 렌더링**: `useSajuInterpret` 훅 → 정적 폴백 UI 위에 AI 콘텐츠 오버레이

### 교차검증 결과

saju-core의 사주팔자 계산 정확도를 [lunar-javascript](https://github.com/6tail/lunar-javascript) 라이브러리로 검증했습니다.

- **검증 범위**: 12개 날짜 × 4주 (연·월·일·시) = 48 pillars
- **일치율**: 100% (48/48)
- **알려진 차이**: 시진(時辰) 경계 처리 — saju-core는 정시(예: 11:00)를 이전 시진으로 분류하고, lunar-javascript는 다음 시진으로 분류. 이는 사주명리학 학파 차이로 정상입니다.

### 주요 설계 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| 크레딧 차감 시점 | LLM 호출 성공 후 (후차감) | LLM 실패 시 크레딧 손실 방지 |
| 크레딧 부족 정책 | fail-closed (차감 실패 → 전체 실패) | 무료 이용 방지 |
| 프롬프트 저장소 | DB (SystemSettings) + 코드 기본값 | 재배포 없이 프롬프트 변경 가능 |
| 설정 저장 방식 | `prisma.$transaction` | 여러 키 동시 저장 시 원자성 보장 |
| 해석 API 인증 | 필수 (401 반환) | 비인증 사용자의 무료 LLM 이용 차단 |
| 주간 운세 날짜 검증 | Zod `.superRefine()` | 잘못된 weekStartDate 방지 |
| 프론트엔드 전략 | 정적 폴백 + AI 오버레이 | LLM 지연/실패 시에도 기본 콘텐츠 표시 |
| 외부 라이브러리 | devDependency (검증 전용) | 프로덕션 번들에 포함하지 않음 |

### 코드 리뷰 이력

Oracle 기반 심층 코드 리뷰를 수행하여 발견된 9개 항목을 모두 수정했습니다.

**CRITICAL (3건)**
| 항목 | 문제 | 수정 |
|------|------|------|
| 관리자 설정 페이로드 | `settings` 미래핑 → save/fetch 모두 동작 불가 | `{ settings }` 래핑 + 응답 구조 정렬 |
| 해석 API 인증 | 미인증 사용자 LLM 무료 이용 가능 | `requireAuth()` 가드 추가 (401) |
| 크레딧 정책 | fail-open + LLM 호출 전 차감 | fail-closed + LLM 성공 후 차감 |

**WARNING (6건)**: 비원자적 upsert → `$transaction`, TAG_ICONS 누락, 훅 stale closure, weekStartDate 미검증, 에러 로깅 누락, 응답 형식 불일치

---

## 개발 필요 항목

### 우선순위 높음 (서비스 운영 필수)

| 항목 | 현황 | 필요 작업 |
|------|------|----------|
| **OAuth 실제 자격증명** | 환경변수 비어 있음 | Google Cloud Console에서 Client ID/Secret 발급 |
| **결제 연동** | 미구현 | Stripe 또는 포트원(아임포트) 연동 |
| **이메일 발송** | Mailhog만 있음 | SendGrid / AWS SES 연동 |
| **이미지 저장소** | 미구현 | 프로필 이미지용 S3/Cloudflare R2 연동 |
| **LLM 요율 제한** | 미구현 | 해석 API에 rate limiting 추가 |

### 우선순위 중간 (UX 개선)

| 항목 | 현황 | 필요 작업 |
|------|------|----------|
| **채팅 세션 지속성** | 새로고침 시 초기화됨 | DB에서 ChatSession/ChatMessage 로드 |
| **구독 결제 플로우** | UI만 있음 | 실제 결제 연동 후 Subscription 생성 자동화 |
| **월별 크레딧 자동 지급** | 미구현 | cron job 또는 serverless scheduled function |
| **사용자 프로필 이미지** | 미구현 | 업로드 UI + 저장 |
| ~~주간/대운 분석~~ | ✅ 완료 | LLM 동적 콘텐츠로 전환 완료 |
| **LLM 해석 결과 캐싱** | 미구현 | DB 저장 후 동일 요청 재활용 |
| **프롬프트 DB 읽기 캐싱** | 미구현 | 매 요청마다 DB 조회 → 인메모리/Redis 캐시 |
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
| **클라이언트 Zod 검증** | 미구현 | useSajuInterpret API 응답 검증 |

---

## 알려진 이슈

| 이슈 | 위치 | 상태 |
|------|------|------|
| ~~채팅 API 스트리밍 context 주입~~ | `app/api/chat/route.ts` | ✅ DB 프롬프트 로딩으로 해결 |
| 관리자 E2E 테스트 | `e2e/admin-flow.spec.ts` | `SKIP_ADMIN_E2E=true` 시 스킵 (실제 세션 쿠키 필요) |
| Kakao OAuth | `lib/auth/index.ts` | 설정에 Kakao Provider 없음 (환경변수는 있음) |
| 시진 경계 학파 차이 | `lib/saju-core/calculator.ts` | saju-core는 정시를 이전 시진으로 분류 (정상 — 학파 차이) |

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
make test       # 단위/통합 테스트 실행 (116개)
make e2e        # E2E 테스트 실행
```

접속:
- 앱: http://localhost:4830
- 관리자: http://localhost:4830/admin
- 관리자 설정: http://localhost:4830/admin/settings
- Prisma Studio: `make db-studio` → http://localhost:6830
- Mailhog: `make mail-up` → http://localhost:9830
