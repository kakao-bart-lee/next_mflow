# Explore 페이지 API 인벤토리 — 호출 결과 분석 및 테마 조합

> 작성일: 2026-03-05
> 목적: 모든 API의 응답 내용·특징을 파악하고, 테마별로 묶어 explore 페이지 구성안 도출

---

## Scope (문서 범위)

- 이 문서는 **Explore/fortune 도메인 API** 중심 인벤토리다.
- `app/api` 전체 라우트 목록을 포괄하지 않는다.
- `API-8b`는 내부 `/api` 라우트가 아니라 서버에서 호출하는 **외부 Horizons 엔드포인트**다.

---

## Part 1: 현재 연결된 API (fortune-context에서 호출 중)

### API-1. `POST /api/saju/analyze` → `FortuneResponse`

**주제: 동양 명리학의 근간 — "나는 누구인가"**

| 필드 | 내용 | 데이터 성격 |
|---|---|---|
| `sajuData.pillars.년/월/일/시` | 4기둥 각각의 천간·지지·오행 | 🔒 고정 (출생 시 결정) |
| `sajuData.pillars.*.십이운성` | 각 기둥의 에너지 단계 (장생~양) | 🔒 고정 |
| `sajuData.pillars.*.신살[]` | 도화살, 역마살 등 특수 기운 | 🔒 고정 |
| `sajuData.pillars.*.지장간[]` | 각 지지 속 숨은 천간 + 십신 | 🔒 고정 |
| `sipsin.positions` | 년간·월간·시간·년지·월지·일지·시지의 십신명 | 🔒 고정 |
| `sipsin.counts` | 비겁/식상/재성/관성/인성 분포 수치 | 🔒 고정 |
| `sipsin.dominant_sipsin` | 가장 강한 십신 | 🔒 고정 |
| `sinyakSingang.strength_type` | 신강/신약 | 🔒 고정 |
| `sinyakSingang.strength_score` | 강약 수치 | 🔒 고정 |
| `sinyakSingang.element_powers` | 목·화·토·금·수 파워 수치 | 🔒 고정 |
| `greatFortune.periods[]` | 대운 전체 목록 (시작·종료 나이, 천간·지지·십신) | 🔒 고정 |
| `greatFortune.current_period` | 현재 대운 | 🔄 반고정 (10년 단위 변경) |
| `hyungchung` | 삼합·천간합·삼형살·자형살·육충살·육파살·육해살 | 🔒 고정 |

**특징**: 한 번의 호출로 사주의 거의 모든 고정 데이터를 가져옴. 현재 프론트에서 일주만 쓰고 나머지 대부분을 버리고 있음.

---

### API-2. `POST /api/astrology/static` → `AstrologyStaticResult`

**주제: 서양 점성술의 현재 — "오늘 하늘은 어떤가"**

| 필드 | 내용 | 데이터 성격 |
|---|---|---|
| `positions[PLANET]` | 7행성 각각의 황경·별자리·도수·하우스 | 🔒 고정 (출생 차트) |
| `influences[PLANET]` | 행성별 영향력 (natural/essential/positional/final score) + dignity breakdown + interpretation | 🔒 고정 + 🔄 날짜별 |
| `isDayChart` | 주간/야간 차트 여부 | 🔒 고정 |
| `ranking` | 영향력 기준 행성 순위 | 🔒 고정 |
| `assumptions` | 계산 모드/시간 정확도/입력 등급 메타 | 🔒 고정 |
| `generatedAt` | 결과 생성 시각 | 🔄 호출 시점 기준 |
| `today.headline` | 오늘의 한 줄 제목 | 🔄 매일 변경 |
| `today.summary` | 오늘의 요약 | 🔄 매일 변경 |
| `today.dominantPlanet` | 오늘의 지배 행성 | 🔄 매일 변경 |
| `today.tags[]` | 오늘의 테마 태그 | 🔄 매일 변경 |
| `today.actions[]` | 오늘의 추천 행동 | 🔄 매일 변경 |
| `today.caution` | 오늘의 주의사항 | 🔄 매일 변경 |
| `future.days[]` | 향후 7일: date·dominantPlanet·theme·focus·intensity | 🔄 매일 변경 |
| `observationTimeUtc` | 천문 계산 기준 시각 | 🔄 호출 시점/targetDate 기준 |

**특징**: 고정(출생 차트)과 동적(오늘/미래) 데이터가 혼합. `today`의 tags/actions/caution과 `future.days`가 완전히 미활용 상태.

---

### API-3. `POST /api/astrology/chart-core` → `ChartCoreResponse`

**주제: 출생 차트의 뼈대 — "나의 하늘 지도"**

| 필드 | 내용 | 데이터 성격 |
|---|---|---|
| `ascendant` | 상승점 (ASC) — 별자리·도수 | 🔒 고정 |
| `midheaven` | 중천 (MC) — 별자리·도수 | 🔒 고정 |
| `houses[]` | 12하우스 경계(cusp) — 각각 도수·별자리 | 🔒 고정 |
| `planets[PLANET]` | 행성별 정밀 배치 — 황경·별자리·도수·하우스 | 🔒 고정 |
| `observation_time_utc` | 천문 계산 기준 시각 | 🔄 호출 시점 기준 |

**특징**: 출생 차트 시각화(원형 차트, 하우스 차트)의 핵심 데이터. ASC/MC가 현재 UI에서 누락됨.

---

### API-4. `POST /api/astrology/aspects` → `AspectsResponse`

**주제: 행성 간의 관계 — "내 안의 긴장과 조화"**

| 필드 | 내용 | 데이터 성격 |
|---|---|---|
| `aspects[]` | 행성 쌍별: type(합/충/삼합/사각/육각), 각도, 허용도, applying 여부 | 🔒 고정 |
| `observation_time_utc` | 천문 계산 기준 시각 | 🔄 호출 시점 기준 |

**특징**: 출생 차트의 행성 간 각도 관계. conjunction(합일)은 에너지 증폭, opposition(대립)은 긴장, trine(삼각)은 조화. applying=true면 영향 강화 중.

---

### API-5. `POST /api/astrology/vedic-core` → `VedicCoreResponse`

**주제: 베다 점성술 기초 — "달의 영혼"**

| 필드 | 내용 | 데이터 성격 |
|---|---|---|
| `ayanamsa` | 아야남사 보정값 (서양↔베다 좌표 차이) | 🔒 고정 |
| `planets[PLANET]` | 사이드리얼 좌표 기준 행성 위치 + 낙샥트라(name, pada, lord) | 🔒 고정 |
| `moonNakshatra` | 달의 낙샥트라 — 베다 점성술의 핵심 | 🔒 고정 |
| `observation_time_utc` | 천문 계산 기준 시각 | 🔄 호출 시점 기준 |

**특징**: 서양 점성술과 같은 행성이지만 좌표계가 다름(~24° 차이). 낙샥트라는 27개의 달의 별자리로, 인도 점성술의 근간.

---

## Part 2: 미연결 API (라우트 존재, fortune-context 미호출)

### API-6. `POST /api/astrology/essential-score` → `EssentialScoreResponse`

**주제: 행성의 품격 — "이 행성은 얼마나 편안한가"**

| 필드 | 내용 | 데이터 성격 |
|---|---|---|
| `scores[PLANET].score` | 전통적 품위 총점 | 🔒 고정 |
| `scores[PLANET].dignities[]` | 보유 품위 목록 (domicile, exaltation, triplicity 등) | 🔒 고정 |
| `scores[PLANET].debilities[]` | 보유 약점 목록 (detriment, fall, peregrine 등) | 🔒 고정 |
| `observation_time_utc` | 천문 계산 기준 시각 | 🔄 호출 시점 기준 |

**특징**: 중세 점성술의 핵심 개념. 행성이 어느 별자리에 있느냐에 따라 "자기 집"(domicile +5)인지 "적진"(detriment -5)인지 결정. 행성 카드의 깊이를 크게 높일 수 있음.

---

### API-7. `POST /api/astrology/accidental-score` → `AccidentalScoreResponse`

**주제: 행성의 상태 — "지금 이 행성이 얼마나 활성화됐는가"**

| 필드 | 내용 | 데이터 성격 |
|---|---|---|
| `scores[PLANET].score` | 우발적 품위 총점 | 🔒 고정 + 🔄 일부 동적 |
| `scores[PLANET].factors[]` | 영향 요인 (하우스 강도, 역행/직행, 연소, 어스펙트 등) | 🔒 고정 + 🔄 일부 동적 |
| `observation_time_utc` | 천문 계산 기준 시각 | 🔄 호출 시점 기준 |

**특징**: Essential(본질적 품위)이 "이 행성이 어떤 별자리인가"라면, Accidental(우발적 품위)은 "이 행성이 어떤 상황에 있는가". 역행(retrograde), 연소(combustion) 등 상태 정보 포함.

---

### API-8. `POST /api/astrology/hellenistic-core` → `HellenisticCoreResponse`

**주제: 헬레니즘 점성술 — "운명의 좌표"**

| 필드 | 내용 | 데이터 성격 |
|---|---|---|
| `sect` | DAY/NIGHT (주간/야간 차트) | 🔒 고정 |
| `sect_scores[PLANET]` | 행성별 sect 점수 (in_sect, above_horizon, rationale) | 🔒 고정 |
| `lot_of_fortune_deg/sign` | 행운의 점 (Lot of Fortune) 위치 | 🔒 고정 |
| `lot_of_spirit_deg/sign` | 영혼의 점 (Lot of Spirit) 위치 | 🔒 고정 |
| `asc_deg`, `mc_deg` | ASC/MC 정밀 도수 | 🔒 고정 |
| `observation_time_utc` | 천문 계산 기준 시각 | 🔄 호출 시점 기준 |

**특징**: 2000년 전 그리스-로마 시대의 점성술 기법. "아라빅 파츠(Lots)"는 특정 수학 공식으로 계산된 운명의 포인트. Lot of Fortune = 물질적 행운, Lot of Spirit = 정신적 방향.

---

### API-8b. `fetchHellenisticProfection` (외부 호출) → `HellenisticProfectionResponse`

**주제: 올해의 테마 — "지금 인생의 어느 챕터인가"**

> 내부 `/api` 라우트가 아니라 서버에서 Haruna Horizons의 `/v1/hellenistic/profection`을 직접 호출

| 필드 | 내용 | 데이터 성격 |
|---|---|---|
| `profected_house` | 올해 활성화된 하우스 (1~12) | 🔄 매년 변경 |
| `profected_sign` | 해당 별자리 | 🔄 매년 변경 |
| `time_lord` | 올해의 지배 행성 (Time Lord) | 🔄 매년 변경 |
| `monthly_offset` | 월간 프로펙션 오프셋 | 🔄 매월 변경 |
| `age_years` | 현재 나이 | 🔄 매년 변경 |
| `observation_time_utc` | 천문 계산 기준 시각 | 🔄 호출 시점 기준 |

**특징**: 1세=1하우스, 2세=2하우스, ... 12세=12하우스, 13세→다시 1하우스. 매년 활성화되는 인생의 "챕터"를 결정. 대운(사주)의 서양 버전. 매우 직관적이라 사용자에게 설명하기 쉬움.

---

### API-9. `POST /api/astrology/vimshottari` → `VimshottariResponse`

**주제: 인생의 대주기 — "우주적 시간표"**

| 필드 | 내용 | 데이터 성격 |
|---|---|---|
| `currentMahaDasha` | 현재 대주기 (lord, start~end, 6~20년 단위) | 🔄 수년~수십 년 단위 |
| `currentAntarDasha` | 현재 소주기 (lord, start~end) | 🔄 수개월~수년 단위 |
| `currentPratyantarDasha` | 현재 극소주기 (lord, start~end) | 🔄 수주~수개월 단위 |
| `upcoming[]` | 다가오는 주기들 | 🔄 동적 |
| `observation_time_utc` | 천문 계산 기준 시각 | 🔄 호출 시점 기준 |

**특징**: 베다 점성술의 핵심 타이밍 시스템. 달의 낙샥트라를 기반으로 120년 주기를 7행성에 배분. 사주 대운(10년 단위)과 매우 유사한 개념이라 크로스시스템 비교의 핵심.

---

### API-10. `POST /api/ziwei/board` → `ZiweiBoardResponse`

**주제: 자미두수 명반 — "별들이 그린 나의 인생 설계도"**

| 필드 | 내용 | 데이터 성격 |
|---|---|---|
| `board.soul` | 명궁 위치 | 🔒 고정 |
| `board.body` | 신궁 위치 | 🔒 고정 |
| `board.five_elements_class` | 오행국 (금사국/수이국 등) | 🔒 고정 |
| `board.palaces[12]` | 12궁 각각: 이름, 주성, 보조성, 잡요성, 밝기, 사화(록/권/과/기), 십이장생, 대한(10년 대운 범위) | 🔒 고정 |

**특징**: 중국 전통 점성술 체계. 12궁이 인생의 12가지 영역(명궁=자아, 재백궁=재물, 관록궁=직업, 부처궁=배우자 등)을 담당. 사화(四化: 록·권·과·기)가 가장 중요한 해석 키. 현재 **100% 미활용**.

---

### API-11. `POST /api/ziwei/runtime-overlay` → `ZiweiRuntimeOverlayResponse`

**주제: 자미두수의 시간 흐름 — "지금 어떤 궁이 활성화됐는가"**

| 필드 | 내용 | 데이터 성격 |
|---|---|---|
| `timing.decadal` | 대한(10년 대운): 활성 궁·사화·성요 | 🔄 10년 단위 |
| `timing.age` | 소한(나이별): 활성 궁·사화·성요·nominal_age | 🔄 매년 |
| `timing.yearly` | 유년운: 올해의 궁·사화·성요 + dec_star | 🔄 매년 |
| `timing.monthly` | 월운: 이번 달의 궁·사화·성요 | 🔄 매월 |
| `timing.daily` | 일운: 오늘의 궁·사화·성요 | 🔄 매일 |
| `timing.hourly` | 시운: 지금의 궁·사화·성요 | 🔄 매시간 |

**특징**: 명반(고정)에 시간의 레이어를 겹치는 것. 대한→유년→월→일→시 순으로 점점 세밀한 운세를 제공. 사주 대운, Profection, Dasha와 함께 놓으면 4중 타이밍 비교 가능.

---

### API-12. `POST /api/saju/compatibility` → `GunghapResult`

**주제: 두 사람의 궁합 — "우리는 어떤 관계인가"**

| 필드 | 내용 | 데이터 성격 |
|---|---|---|
| `total_score` | 전체 궁합 점수·등급·설명·장단점·조언 | 🔒 고정 (2인 조합) |
| `elemental_compatibility` | 오행 궁합 (상생/상극/동오행) | 🔒 고정 |
| `animals_compatibility` | 띠 궁합 (삼합/육합/충/형/해) | 🔒 고정 |
| `personality_match` | 성격 궁합 점수 | 🔒 고정 |
| `fortune_match` | 운세 궁합 점수 | 🔒 고정 |

**특징**: 2인용 분석. 별도 입력(상대방 생년월일)이 필요하므로 explore 기본 뷰가 아닌 별도 플로우 필요.

---

### API-13. `POST /api/saju/interpret` (LLM 기반, 별도 비용)

**주제: AI 해석 — "사주를 자연어로 풀어주는 대화"**

현재 chat 기능에서 사용 중. explore 데이터 확장과는 별개.

---

### (미구현 API) ThemeInterpreterManager — 코드 존재, 라우트 없음

**주제: 10가지 테마별 사주 해설 — "인생의 10가지 면"**

| 테마 | 내용 |
|---|---|
| fortune | 전체 운세 |
| wealth | 재물운 |
| career | 직업운 |
| love | 연애운 |
| marriage | 결혼운 |
| health | 건강운 |
| study | 학업운 |
| children | 자녀운 |
| family | 가족운 |
| personality | 성격 분석 |

각 테마 출력: `title`, `summary`, `detailed_analysis`, `strengths[]`, `weaknesses[]`, `advice[]`, `lucky_elements`, `unlucky_elements`, `score(0~100)`, `grade`

+ `ThemeInterpretation` 확장: `life_stages[]` (유년~노년), `yearly_overview` (향후 10년), `recommendations[]`

**특징**: **라우트가 아직 없음**. 클래스 로직만 존재. 라우트를 만들면 LLM 없이 구조화된 해석문 10세트를 즉시 제공 가능. 콘텐츠 양 대비 구현 비용이 가장 낮은 항목.

---

### (미구현 API) ExtendedFortuneInterpreter — 코드 존재, 라우트 없음

**주제: 고전 사주 해설문 10종 — "전통의 지혜"**

토정비결, 새해신수, 자평명리학 평생총운, 인생풀이, 사주운세, 십년대운풀이, 전생운, 질병운, 오행기운세, 오늘의 운세 등.

**특징**: 마찬가지로 라우트 없음. 전통 DB 기반이라 LLM 불필요.

---

## Part 3: 테마별 조합 분석 — Explore 페이지 구성안

### 🎯 조합 원칙
1. **사용자 관점**: "나는 누구인가" → "지금 무슨 일이?" → "앞으로 어떻게?"
2. **시스템 경계 무시**: 사주·점성술·자미두수를 섞어서 같은 질문에 답하게 함
3. **시간축 기준**: 고정(출생) vs 동적(오늘/올해/인생 주기)

---

### 조합 1: 🪞 **"나의 정체성" (Identity)**

> "세 가지 거울로 보는 나"

| 소스 | 데이터 | 역할 |
|---|---|---|
| 사주 | 일주 천간·지지 + 오행 파워 + 신강/신약 | 동양이 보는 나의 본질 |
| 점성술 | ASC(상승점) + 행성 파워 랭킹 TOP 3 + isDayChart | 서양이 보는 나의 외면 + 핵심 에너지 |
| 자미두수 | 명궁 주성 + 신궁 + 오행국 | 중국 전통이 보는 나의 운명 설계 |
| 크로스 | 일간 오행 ↔ 지배 행성 일치도 | 동서양 정체성 공명 |

**UI 아이디어**: "세 가지 거울" 카드 3장 — 탭하면 각 시스템의 해석 확장

---

### 조합 2: 🧬 **"나의 에너지 구조" (Energy Blueprint)**

> "숨은 힘의 지도"

| 소스 | 데이터 | 역할 |
|---|---|---|
| 사주 | 4기둥 전체 (년·월·일·시) + 십신 분포 레이더 + 십이운성 | 에너지의 구조적 배치 |
| 사주 | 지장간 (숨은 천간) + 형충파해 | 숨은 영향력 + 기둥 간 긴장/조화 |
| 사주 | 신살 (도화살, 역마살 등) | 특수 에너지 태그 |
| 점성술 | Essential Dignity + Accidental Dignity | 행성별 품위와 상태 |
| 점성술 | 출생 차트 어스펙트 (conjunction/opposition/trine...) | 행성 간 관계 |
| 자미두수 | 12궁 주성·보조성 배치 + 사화(록/권/과/기) | 인생 12영역의 별 배치 |

**UI 아이디어**: 
- 상단: 사주 4기둥 시각화 (십신 오버레이 + 십이운성 그래프)
- 중단: 점성술 출생 차트 휠 (행성 + 어스펙트 선 + dignity 색상)
- 하단: 자미두수 12궁 격자 (탭하면 각 궁 상세)

---

### 조합 3: 🌅 **"오늘의 에너지" (Today's Energy)**

> "세 시스템이 말하는 오늘"

| 소스 | 데이터 | 역할 |
|---|---|---|
| 점성술 | today.headline + summary + dominantPlanet | 오늘의 대표 메시지 |
| 점성술 | today.tags[] + actions[] + caution | 오늘의 키워드·행동·주의 |
| 점성술 | 트랜짓 어스펙트 | 오늘의 행성 변화 |
| 자미두수 | timing.daily (일운): 활성 궁 + 사화 | 오늘 활성화된 인생 영역 |
| 자미두수 | timing.hourly (시운) | 지금 이 시간의 에너지 |
| 사주 | (추후) 일간 에너지 — ExtendedFortuneInterpreter saju_10 | 오늘의 전통 운세 |
| 크로스 | 트랜짓 + 일운 사화 동시 분석 → 시너지/충돌 감지 | 통합 오늘 판단 |

**UI 아이디어**: 
- Hero 카드: 통합 헤드라인 + 지배 행성 + 활성 궁 + tags 칩
- 아래: 행동 체크리스트 + 주의 배너 + 시간대별 미니 차트

---

### 조합 4: 📅 **"이번 주 / 7일 전망" (Weekly Forecast)**

> "앞으로 7일의 에너지 파도"

| 소스 | 데이터 | 역할 |
|---|---|---|
| 점성술 | future.days[7]: dominantPlanet·theme·focus·intensity | 일별 에너지 강도 + 테마 |
| 점성술 | 주간 트랜짓 (weekly type) | 주요 행성 이벤트 |
| 자미두수 | 7일분 daily timing (반복 호출 또는 배치) | 일별 활성 궁 + 사화 |
| 크로스 | 각 날의 시너지/충돌 마커 | 🟢 좋은 날 / 🔴 주의 날 |

**UI 아이디어**: 7일 에너지 웨이브 차트 + 각 날 탭하면 상세

---

### 조합 5: 🗓️ **"올해의 테마" (This Year's Theme)**

> "네 가지 시계가 가리키는 올해"

| 소스 | 데이터 | 역할 |
|---|---|---|
| 사주 | 현재 대운 (천간·지지·십신) | 동양의 10년 주기 |
| 점성술 | Profection (profected_house·time_lord) | 서양의 연간 테마 |
| 베다 | Vimshottari (currentMaha·Antar·Pratyanter) | 인도의 인생 대주기 |
| 자미두수 | timing.yearly (유년운: 활성 궁 + 사화) | 중국의 올해 운세 |
| 크로스 | 대운 십신 방향 ↔ Profection 하우스 방향 일치도 | 동서양 일치도 |

**UI 아이디어**: "올해의 네 시계" — 4개 시스템을 나란히. 같은 테마면 🟢 공명 표시.

---

### 조합 6: ⏳ **"인생 타임라인" (Life Timeline)**

> "과거-현재-미래를 관통하는 네 줄기"

| 소스 | 데이터 | 역할 |
|---|---|---|
| 사주 | greatFortune.periods[] (대운 전체) | 10년 단위 동양 주기 |
| 점성술 | Profection (매년 순환) | 12년 순환 서양 주기 |
| 베다 | Vimshottari upcoming[] | 6~20년 단위 인도 주기 |
| 자미두수 | board.palaces[].decadal (각 궁의 10년 대운 범위) | 12궁별 10년 대운 |
| 사주 | 십이운성 (각 기둥의 에너지 단계) | 인생 에너지 커브 |

**UI 아이디어**: 횡축 타임라인 (0~80세), 4개 행, 겹치는 구간 하이라이트

---

### 조합 7: 💫 **"숨은 재능과 약점" (Hidden Talents)**

> "세 시스템이 동시에 가리키는 강점"

| 소스 | 데이터 | 역할 |
|---|---|---|
| 사주 | sipsin.dominant_sipsin + counts | 에너지 유형 (식상형=창조, 재성형=현실 등) |
| 사주 | 신살 | 특수 재능 (도화살=매력, 화개살=예술, 학당귀인=학문) |
| 점성술 | ranking[0~2] + Essential Dignity의 강한 행성 | 핵심 행성 + 품위 |
| 점성술 | Sect scores (in_sect인 행성이 유리) | 주간/야간에 따른 유불리 |
| 자미두수 | 명궁·관록궁·재백궁의 주성 + 사화 록/권 | 핵심 궁의 길한 배치 |

**UI 아이디어**: "당신의 TOP 3 재능" + "주의할 약점" 카드

---

### 조합 8: 🔮 **"테마별 인생 리포트" (Life Report by Theme)**

> "재물·커리어·연애·건강... 10가지 렌즈"

| 소스 | 데이터 | 역할 |
|---|---|---|
| 사주 | ThemeInterpreterManager 10가지 (score + grade + 상세) | 동양 관점 점수 + 해석 |
| 점성술 | 관련 하우스 + 행성 (2H=재물, 7H=파트너, 10H=커리어) | 서양 관점 연결 |
| 자미두수 | 관련 궁 (재백궁=재물, 부처궁=배우자, 관록궁=직업) | 중국 관점 연결 |

**예시**: "재물운" 탭 →
- 사주: 재성 분포 + 재물운 score 78점
- 점성술: 2하우스 배치 + 금성(정재) 품위
- 자미두수: 재백궁 주성 + 사화
- 통합: "세 시스템 모두 재물 에너지가 강합니다" or "사주는 강하지만 자미두수는 기(忌)가 있어 주의"

**UI 아이디어**: 10개 테마 그리드 카드 (점수 + 등급 배지). 탭하면 3시스템 통합 상세.

---

### 조합 9: 📖 **"고전의 지혜" (Classical Readings)**

> "토정비결부터 전생까지"

| 소스 | 데이터 | 역할 |
|---|---|---|
| 사주 | ExtendedFortuneInterpreter saju_1~10 | 전통 해석문 10종 |
| 핵심 콘텐츠 | 토정비결(연간), 인생풀이(평생), 전생운(흥미), 십년대운풀이(현 대운) | 바이럴 가능 콘텐츠 |

**UI 아이디어**: "고전 서재" 섹션. 책 표지 스타일 카드. "전생운" 카드가 공유 가능한 바이럴 콘텐츠.

---

### 조합 10: 💑 **"궁합" (Compatibility)**  ← 별도 플로우

> "두 사람의 사주 교차 분석"

별도 입력이 필요하므로 explore 메인이 아닌 서브 페이지/모달. 
향후 점성술 시나스트리(synastry) + 자미두수 궁합과 결합 가능.

---

## Part 4: 구현 우선순위 제안 (API 연결 기준)

### Phase 1 — fortune-context 확장 (기존 데이터 활용 극대화)
1. **saju/analyze의 미활용 필드** → 4기둥 전체, 십신 분포, 신살, 형충파해, 십이운성, 지장간
2. **astrology/static의 미활용 필드** → today.tags/actions/caution, future.days, ranking, isDayChart

→ 조합 1(정체성), 조합 2(에너지 구조), 조합 3(오늘), 조합 4(7일) 바로 가능

### Phase 2 — 미연결 API 연결
3. **essential-score + accidental-score** → 조합 2, 7 강화
4. **hellenistic-core + profection** → 조합 5(올해 테마) 핵심
5. **vimshottari** → 조합 5, 6(타임라인) 핵심

→ 조합 5(올해 테마), 조합 6(인생 타임라인), 조합 7(숨은 재능) 가능

### Phase 3 — 자미두수 연결
6. **ziwei/board** → 조합 1, 2, 7, 8 완성
7. **ziwei/runtime-overlay** → 조합 3, 5 완성

→ 전체 3시스템 통합 완성

### Phase 4 — 미구현 라우트 생성
8. **ThemeInterpreterManager 라우트** → 조합 8(테마별 리포트) 핵심
9. **ExtendedFortuneInterpreter 라우트** → 조합 9(고전 지혜)

→ 콘텐츠 폭발적 확장

---

## Appendix: 비탐색(Out of Scope) API

다음 라우트들은 프로젝트에 존재하지만 Explore 인벤토리 범위에서는 제외했다.

- 토론/스트리밍: `/api/debate`
- 채팅: `/api/chat`, `/api/chat/sessions`, `/api/chat/sessions/[id]/messages`, `/api/chat/threads`, `/api/chat/threads/[threadId]/messages`
- 사용자/행동: `/api/user`, `/api/user/birth-info`, `/api/user/credits`, `/api/user/daily-actions`, `/api/user/daily-checkin`, `/api/user/decisions`, `/api/user/journal`
- 크레딧/인증/관리자: `/api/credits`, `/api/auth/[...nextauth]`, `/api/admin/*`
