# next-mflow 시스템 개요

작성일: 2026-03-03
최종 업데이트: 2026-03-03 (사주 자체 해석층 + 점성술 텍스트 생성 메커니즘 + haruna-horizons 엔진 상세 추가)
대상: 연구/기획 에이전트 참고용 — 코드베이스 구조와 데이터 흐름을 빠르게 파악하기 위한 문서

---

## 1. 서비스 목적

한국 운세 서비스. **사주명리학(四柱命理)**과 **서양 점성술**을 두 개의 독립 엔진으로 계산한 뒤, AI(LLM)를 통해 사용자 맞춤 운세로 해석하여 제공한다.

현재 상태: 두 엔진의 계산 결과를 **LLM에 통합 전달하지 않고** 별도로 사용 중 (→ [§5. 미통합 현황](#5-미통합-현황) 참조).

---

## 2. 전체 데이터 흐름

```
[사용자 입력]
  생년월일시(양력), 출생 지역(위도/경도), 성별, 시간모름 여부
         │
         ▼  SajuContext.fetchAnalysis() — 두 API 병렬 호출
    ┌────┴────┐
    │         │
    ▼         ▼
POST /api/saju/analyze      POST /api/astrology/static
(사주 4주 계산)              (행성 위치·영향력 계산)
    │         │
    ▼         ▼
FortuneResponse          AstrologyStaticResult
    └────┬────┘
         │  전역 SajuContext에 저장 (React Context)
         │  → 모든 화면에서 공유
         ▼
  [화면별 LLM 해석 요청]
  POST /api/saju/interpret  (daily / weekly / decision)
         │
         ▼
  fortuneOrchestrator.generate()  ← Mastra + OpenAI
  (사주 컨텍스트 텍스트 + system prompt → structured JSON 반환)
```

---

## 3. 사주 엔진 (lib/saju-core/)

### 진입점
`lib/saju-core/facade.ts` → `FortuneTellerService` (싱글턴)

### 입력
```ts
interface FortuneRequest {
  birthDate: string    // "1990-03-15" (양력)
  birthTime: string    // "12:00"
  gender: "M" | "F"
  isTimeUnknown: boolean
  latitude: number
  longitude: number
  timezone: string
}
```

### 계산 항목

| 항목 | 설명 |
|------|------|
| **사주 4주** | 년주·월주·일주·시주 (천간+지지) — 절입(節入) 보정 포함 |
| **오행 분포** | 각 주의 목/화/토/금/수 에너지 |
| **십신(十神)** | 비겁·식상·재성·관성·인성 관계 |
| **십이운성** | 장생·목욕·관대·건록·제왕·쇠·병·사·묘·절·태·양 |
| **신살(神煞)** | 도화살·역마살·천을귀인·화개살 등 |
| **신약/신강** | 일간(日干)의 강약 판정 |
| **형충(刑沖)** | 지지 간 상호 충돌·자극 |
| **지장간(支藏干)** | 지지 내 숨겨진 천간 |

### 출력 타입 핵심 구조
```ts
interface FortuneResponse {
  sajuData: {
    basicInfo: { solarDate, lunarDate, ... }
    pillars: {
      년: Pillar   // { 천간, 지지, 오행, 십이운성, 신살[] }
      월: Pillar
      일: Pillar
      시: Pillar
    }
  }
}
```

### 자체 해석층 — LLM 없이도 텍스트 생성 가능

사주 엔진은 계산뿐 아니라 **자체 해석 텍스트도 내장**하고 있다. `FortuneTellerService.getSajuFortune()`을 통해 접근하며, 현재 서비스에서는 이 기능을 사용하지 않고 계산 결과만 LLM에 넘기고 있다.

**해석 시스템 ①: 주제별 해석 (lib/saju-core/saju/interpreters.ts)**

일간(日干)의 오행을 기준으로 13개 카테고리에 대한 구조화된 해석을 반환한다.

| 카테고리 | 출력 |
|---------|------|
| 재물운·직업운·연애운·결혼운·건강운·학업운·자녀운·가족운·성격·연간·월간·일간·전체 (13개) | `{ summary, detailed_analysis, strengths[], weaknesses[], advice[], score(0-100), grade("최상"~"하") }` |

점수 계산: `base_score(카테고리별 고정) + element_bonus(오행별 가산)` → 등급 판정.

**해석 시스템 ②: DB 기반 해석 (lib/saju-core/saju/interpreter.ts)**

`s_tables.json`의 60가지 일주(日柱) 조합별 텍스트 직접 조회. 21가지 운세 타입(총평·초년운·재물운·직업운·연애운 등) 지원.

**공개 API:**
```ts
FortuneTellerService.calculateSaju(request)     // 계산만
FortuneTellerService.getSajuFortune(request, fortuneType)  // 계산 + 해석
```

### 주의사항
- `lib/saju-core/data/` 내 61MB JSON 데이터 파일 → `getDataLoader()` 싱글턴으로만 접근
- 시진(時辰) 경계: 정각(00분)은 이전 시간대로 처리
- 절입(節入) 날짜 미보정 시 월주 오류 발생

---

## 4. 점성술 엔진 (lib/astrology/)

### 진입점
`lib/astrology/static/calculator.ts`

### 계산 대상 행성
태양(SUN)·달(MOON)·수성(MERCURY)·금성(VENUS)·화성(MARS)·목성(JUPITER)·토성(SATURN) — 7개

### 계산 소스 (이중화)

1. **haruna-horizons** (`HARUNA_HORIZONS_BASE_URL` 설정 시) — 자체 SPICE 엔진 기반 실제 천문 계산
2. **내부 정적 계산기** — haruna-horizons 실패 시 자동 fallback, 결정론적 해시 기반

---

### haruna-horizons 엔진 (`../haruna-horizons`)

**단순 API 프록시가 아닌 자체 천문 계산 서버**다. NASA JPL의 DE440s 행성 궤도 커널을 로컬에서 구동하며, 외부 인터넷 연결 없이 오프라인으로 동작한다.

**스택**: Python + FastAPI + SpiceyPy(NASA SPICE C API 래퍼) + Astropy

**계산 파이프라인**:
```
출생 일시 + 위치
  ↓ UTC 정규화 → Ephemeris Time (초/J2000)
  ↓ SpiceyPy.spkpos() — DE440s 커널 쿼리
  ↓ 상태 벡터(x, y, z km) → lon_deg / lat_deg / distance_km
  ↓ Astropy 좌표 변환: ECLIPJ2000 → TRUE_ECLIPTIC_OF_DATE (STANDARD 모드)
  → 황도경도(lon_deg) 반환
```

**정확도** (JPL Horizons 실측 대비 50개 케이스 벤치마크):

| 모드 | 방향 오차 중앙값 | 100km 이내 비율 |
|------|--------------|--------------|
| FAST | 20 arcsec | 24% |
| **STANDARD** (기본) | **0.26 arcsec** | **94%** |
| HIGH | 0.26 arcsec | 94% |

**제공 엔드포인트**:

| 엔드포인트 | 용도 |
|-----------|------|
| `POST /v1/ephemeris/positions` | 다중 행성 황도 위치 (next-mflow 주 사용) |
| `POST /v1/saju/solar-longitude` | 태양 황도경도 (사주 절입 계산용) |
| `POST /v1/saju/solar-term-time` | 절기 시각 이분 탐색 (오차 5초 이내) |

**사주 연동**: `/v1/saju/solar-term-time`으로 절입(節入) 날짜를 정밀 계산할 수 있다. 현재 next-mflow 사주 엔진이 이 엔드포인트를 활용하는지는 별도 확인 필요.

---

### 내부 정적 계산기의 실제 동작 방식 ⚠️

**실제 천문 계산을 하지 않는다.** haruna-horizons 연결이 없거나 실패할 때만 작동하는 fallback이다.

```
행성 황경 = BASE_LONGITUDE[행성] + 해시 오프셋(±12°)
```

- `BASE_LONGITUDE`: 7개 행성별 고정 기준값 (예: SUN=340°, MOON=95°)
- 오프셋: 생년월일 문자열의 FNV-1a 해시 → ±12° 범위
- 같은 날 태어난 두 사람이 서로 다른 행성 위치를 받음 (생년월일 외 정보가 해시에 포함)
- 행성의 실제 공전 주기 미반영 (목성 12년 주기, 토성 29.5년 주기 등 무시)

**haruna-horizons 연결 시**: 실제 천문 황경이 들어와 Essential Dignity 계산이 의미를 가짐. **미연결 시**: 텍스트 선택만 다를 뿐 점성술적 근거는 없음.

두 경우 모두 **텍스트 선택 로직(PLANET_THEME 7개 고정 템플릿)은 동일** — 어느 행성이 finalScore 1위가 되느냐만 달라진다.

### 계산 항목

| 항목 | 설명 |
|------|------|
| **황도 위치** | 황경(lonDeg), 황도12궁(sign), 궁 내 각도 |
| **하우스** | 행성이 위치한 하우스 (출생 시간 있을 때만) |
| **Essential Dignity** | domicile(+5)·exaltation(+4)·triplicity(+3)·term(+2)·face(+1)·detriment(-5)·fall(-4)·peregrine(-5) 합산 |
| **영향력 점수** | `finalScore = 자연강도×0.4 + 위치강도×0.6` (0-100) |
| **행성 순위** | `ranking: PlanetId[]` — finalScore 내림차순 |
| **오늘 인사이트** | 지배 행성의 고정 텍스트 선택 |
| **미래 예보** | ranking 순서대로 7일에 순환 배정 |
| **어스펙트** | 행성 간 각도 → conjunction/opposition/trine/square/sextile 해석 |

### 텍스트 생성 메커니즘 — 7개 고정 템플릿

오늘 인사이트·미래 예보의 텍스트는 `PLANET_THEME`에 하드코딩된 **7개 행성별 고정 문장**에서 선택된다. 개인화 없음.

```
finalScore 1위 행성 결정 → PLANET_THEME[행성].summary 반환
```

| 행성 | summary | caution |
|------|---------|---------|
| 태양 | 정체성과 목표 의식이 선명해지는 흐름입니다. | 과한 자기 확신은 주변 협력을 약화시킬 수 있습니다. |
| 달 | 감정의 미세한 변화와 관계 감수성이 커지는 날입니다. | 기분 기복에 즉각 반응하면 판단이 흔들릴 수 있습니다. |
| 수성 | 정보 정리와 소통 효율이 올라가는 흐름입니다. | 속도를 올릴수록 오해 가능성도 커집니다. |
| 금성 | 관계 조율과 가치 판단이 부드럽게 작동하는 시기입니다. | 갈등 회피가 장기적으로 비용을 키울 수 있습니다. |
| 화성 | 실행력과 돌파 에너지가 상승하는 국면입니다. | 속도만 앞서면 마찰과 소모가 커질 수 있습니다. |
| 목성 | 확장, 학습, 기회 탐색에 유리한 흐름입니다. | 낙관 과잉은 리스크 확인을 누락시킬 수 있습니다. |
| 토성 | 구조화와 책임 강화가 성과로 이어지는 시기입니다. | 완벽주의가 시작 자체를 지연시킬 수 있습니다. |

자연강도(`NAISARGIKA_BALA`)도 고정값이므로, 행성 위치에 의한 Essential Dignity 변화가 작을 경우 순위가 비슷하게 나올 수 있다. 태양이 자연강도 최고(60점)라 특이한 Essential Dignity 구성이 없는 한 상위권을 차지하는 경향이 있다.

**어스펙트 해석 (lib/astrology/static/transits.ts)**: 행성 간 각도(conjunction·opposition·trine·square·sextile)를 계산하고, 어스펙트별 한국어 의미 문장과 사주 십신 공명 텍스트를 자동 생성한다.

### 출력 타입 핵심 구조
```ts
interface AstrologyStaticResult {
  positions: Record<PlanetId, AstrologyPosition>
  influences: Record<PlanetId, AstrologyInfluence>
  ranking: PlanetId[]
  today: TodayInsight        // 지배 행성의 고정 텍스트 (LLM 불필요)
  future: FutureInsight      // ranking 순환 배정 7일 예보
  isDayChart: boolean
  assumptions: AstrologyAssumptions  // 계산 신뢰도 메타데이터 (L0~L3)
}
```

### 입력 등급 (inputGrade)

| 등급 | 조건 | 추가 기능 |
|------|------|---------|
| L0 | 생년월일만 | 제한적 행성 위치 |
| L1 | + 출생 시간 | 행성 도수, 어스펙트 |
| L2 | + 출생 위치 | ASC 후보 |
| L3 | 모두 | 완전 차트 (houses 포함) |

---

## 5. AI 해석 레이어 (lib/use-cases/interpret-saju.ts)

### 역할
사주 계산 결과(`FortuneResponse`)를 텍스트 컨텍스트로 변환 후 LLM에 전달, 구조화된 운세 JSON을 반환받는다.

### 해석 유형 3가지

| 유형 | 엔드포인트 | LLM 출력 |
|------|-----------|----------|
| `daily` | POST /api/saju/interpret | summary·tags·body·actions(3)·avoid |
| `weekly` | POST /api/saju/interpret | theme + 7일(day·keyword·note·highlight) + aiRecap |
| `decision` | POST /api/saju/interpret | recommendation(A/B)·headline·body·reasoning·caution |

### LLM에 전달되는 사주 컨텍스트
`buildSajuContext()` 함수가 구성:
```
## 사주 데이터
- 년주: 경(庚) 오(午)
- 월주: 갑(甲) 진(辰)
- 일주: 경(庚) 오(午)
- 시주: 갑(甲) 자(子)

## 오행 분포 (주별 천간/지지 오행)

## 십이운성 (4주)

## 신살 (해당 시)

## 기본정보 (양력/음력)

## 오늘 날짜 / 주간 시작일 / 선택지 A·B  ← 유형별 추가
```

### System Prompt 관리
DB `SystemSettings` 테이블에 저장. 관리자 `/admin/settings`에서 편집 가능.
키: `saju_today_prompt` / `saju_weekly_prompt` / `saju_decision_prompt`

### AI 에이전트 구조 (Mastra)
`fortuneOrchestrator` — Supervisor 패턴 (maxSteps: 5).
메모리: `{resourceId}:readings` 스레드로 유저별 대화 이력 유지.

---

## 6. 미통합 현황 — 두 엔진의 관계

두 엔진 모두 **LLM 없이도 자체 해석 텍스트를 제공**할 수 있지만, 현재 서비스는 그 기능을 충분히 활용하지 않고 있다.

```
사주 계산 결과  ──→ LLM 프롬프트에 포함 ──→ AI 운세 카드 생성  ✅
사주 자체 해석  ──→ LLM에 미전달         ──→ 미사용             ⚠️
점성술 결과     ──→ LLM 프롬프트에 미포함 ──→ UI 직접 렌더링만   ⚠️
점성술 자체해석 ──→ LLM에 미전달         ──→ UI 직접 렌더링만   ⚠️
```

**화면별 활용 현황:**

| 화면 | 사주 계산 결과 | 사주 자체 해석 | 점성술 결과 |
|------|--------------|--------------|------------|
| 오늘 | LLM 해석 원재료 | 미사용 | TodayInsight 카드 직접 표시 |
| 주간 | LLM 7일 예보 원재료 | 미사용 | FutureInsight 강도 표시 |
| 결정 | LLM A/B 조언 원재료 | 미사용 | 미사용 |
| 탐색 | 기반 데이터 | 미사용 | 행성 공전 시각화 |
| 채팅 | 시스템 프롬프트에 포함 | 미사용 | 미포함 |

**통합 시 고려사항:**
- `buildSajuContext()`에 점성술 데이터 섹션 추가 필요
- 사주 자체 해석(`getSajuFortune()`) 결과를 LLM 프롬프트에 보조 자료로 추가 가능
- 점성술 텍스트는 7개 고정 템플릿 기반이므로, LLM에 행성 위치 수치(`influences`)를 직접 넘기는 것이 더 유효
- 두 시스템 해석 충돌 시 우선순위 규칙 필요 (사주 vs 점성술)

---

## 7. 화면 구성

| 경로 | 화면 | 핵심 기능 |
|------|------|----------|
| `/onboarding` | 온보딩 | 생년월일시·위치 입력 → SajuContext 초기화 |
| `/today` | 오늘 | 일간 LLM 운세 + 점성술 인사이트 카드 |
| `/week` | 주간 | 주간 예보(미래)/회고(과거) 탐색, 티어 잠금 |
| `/decision` | 결정 | A/B 선택지 입력 → LLM 조언 |
| `/explore` | 탐색 | 행성 공전 시각화 + 카테고리 운세 |
| `/admin/settings` | 관리자 | System Prompt CRUD, LLM 비용 모니터링 |

### 주간 화면 티어 기준 (현재 하드코딩)
```ts
FREE_PAST_WEEKS = 4    // 무료: 과거 4주 회고
FREE_FUTURE_WEEKS = 1  // 무료: 다음 1주 예보
```

---

## 8. 인프라 개요

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 14 App Router |
| DB | PostgreSQL (Docker, 포트 6532) + Prisma ORM |
| 인증 | NextAuth v5 (Google OAuth, 개발 시 SKIP_AUTH=true) |
| AI | Mastra 오케스트레이터 + OpenAI (gpt-4o-mini 기본) |
| 과금 | 크레딧 시스템 (ENABLE_CREDIT_SYSTEM env, 현재 비활성) |
| 개발 포트 | 앱 4830 / Prisma Studio 6830 |

### DB 주요 테이블
- `User` — 유저 + birthInfo JSON + 크레딧 잔액
- `SystemSettings` — LLM 시스템 프롬프트 (key/value)
- `LlmUsage` — 토큰 사용량 로그 (관리자 모니터링용)
- `Credit` / `CreditTransaction` — 크레딧 과금 내역

---

## 9. 핵심 파일 경로

| 역할 | 파일 |
|------|------|
| 사주 계산+해석 진입점 | `lib/saju-core/facade.ts` |
| 사주 주제별 해석 | `lib/saju-core/saju/interpreters.ts` |
| 사주 DB 기반 해석 | `lib/saju-core/saju/interpreter.ts` |
| 사주 해석 데이터 | `lib/saju-core/saju/interpretationData.ts` |
| 점성술 계산 엔진 | `lib/astrology/static/calculator.ts` |
| 점성술 행성 텍스트 상수 | `lib/astrology/static/constants.ts` |
| 점성술 어스펙트 해석 | `lib/astrology/static/transits.ts` |
| 점성술 타입 정의 | `lib/astrology/static/types.ts` |
| Horizons API 클라이언트 | `lib/astrology/horizons-client.ts` |
| LLM 해석 use-case | `lib/use-cases/interpret-saju.ts` |
| 전역 데이터 컨텍스트 | `lib/contexts/saju-context.tsx` |
| Mastra 에이전트 | `lib/mastra/index.ts` |
| 사주 분석 API | `app/api/saju/analyze/route.ts` |
| 점성술 API | `app/api/astrology/static/route.ts` |
| LLM 해석 API | `app/api/saju/interpret/route.ts` |
| 채팅 API | `app/api/chat/route.ts` |
| BirthInfo 스키마 | `lib/schemas/birth-info.ts` |
| 시스템 설정 | `lib/system-settings.ts` |
| 크레딧 서비스 | `lib/credit-service.ts` |

---

## 10. 관련 문서

- `docs/adr/` — 아키텍처 결정 기록 (ADR 001~003)
- `docs/service-output-inventory.md` — 화면별 데이터 출력 상세 목록
- `docs/planetary-influence-systems.md` — 행성 영향력 계산 방식 상세
- `docs/astro_plan.md` — 점성술 통합 계획
- `lib/saju-core/AGENTS.md` — 사주 엔진 에이전트 가이드
- `../haruna-horizons/docs/api-contract-v1.md` — haruna-horizons API 계약 (입출력 스키마)
- `../haruna-horizons/docs/calculation-theory-and-outputs.md` — SPICE 계산 이론 상세
- `../haruna-horizons/reports/horizons-parity-report-2026-03-02.md` — JPL 대비 정확도 벤치마크
