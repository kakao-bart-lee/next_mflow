# Service Output Inventory (Today/Future/AI)

작성일: 2026-03-02
최종 업데이트: 2026-03-02 (astrology integration merge)

## 1) 사용자에게 제공되는 결과 형태

### Today 화면
- 형식: 카드형 요약 + 실천 체크리스트 + AI 대화 진입
- 현재 데이터 원천:
  - 레거시 개인 분석 결과 기반 파생(범위 외)
  - 일부 문구는 LLM 일일 해석 오버레이
- 비고: 점성 정적 결과를 Today 본문에 직접 투입하는 구조는 아직 제한적

### Week 화면 (미래 흐름)
- 형식: 7일 리스트 + AI 리캡 카드 + 저널 질문
- 데이터 원천:
  - 우선 `astrology static` 결과(`future.days`, `today`) 기반 동적 구성
  - 결과 미존재 시 로컬 기본 템플릿 폴백

### Explore 화면
- 형식:
  - 점성 헤드라인
  - 행성 영향/해석 인터랙션
  - 보조 인사이트 카드
- 데이터 원천:
  - `astrology static`의 `positions`, `influences`, `today` 사용
- 현재 제한:
  - 트랜짓 섹션은 아직 하드코딩 데이터 사용

### Decision 화면
- 형식: 3문항 의사결정 프레임 + 결과 카드 + AI 대화
- 데이터 원천: 현재 로컬 규칙 기반

## 2) AI 대화 제공 형태

- 엔드포인트: `POST /api/chat`
- 모델 우선순위:
  - `MASTRA_ASTROLOGY_MODEL`
  - 미설정 시 `MASTRA_SAJU_MODEL` (레거시 호환)
  - 최종 기본값 `gpt-4o-mini`
- 시스템 프롬프트 구성:
  - `astrology_chat_prompt` (관리자 설정 가능)
  - `astrology_report_prompt` (관리자 설정 가능)
  - 컨텍스트 주입: `BIRTH_INFO_JSON`, `ASTROLOGY_STATIC_JSON`
- 결과 형식: 스트리밍 텍스트 응답

## 3) 백오피스(관리자) 설정 가능 항목

- 설정 API:
  - `GET /api/admin/settings`
  - `PUT /api/admin/settings`
- 저장 키:
  - `astrology_chat_prompt` (채팅 시스템 프롬프트)
  - `astrology_report_prompt` (정적 점성 해석 가이드 프롬프트)

## 4) 정적 점성 계산값 저장/재사용

- 분석 API: `POST /api/astrology/static`
- 입력: `BirthInfoSchema`
- 출력 핵심:
  - 행성 위치(`positions`)
  - 행성 영향력(`influences`)
  - 오늘 인사이트(`today`)
  - 주간 인사이트(`future`)
- 저장:
  - 로그인 사용자 기준 `Analysis` 테이블에 `expertId = "astrology-static"`로 저장

재사용 경로:
- `SajuContext`에서 점성 정적 분석을 포함한 컨텍스트를 병렬 조회
- 점성 결과는 Week/Explore/Chat 컨텍스트에서 사용
- 레거시 분석 API 실패와 점성 API 실패를 분리 처리하여, 한쪽 실패가 다른 쪽 계산을 직접 차단하지 않음

## 5) Haruna Horizons 연동 정책

- 외부 계산 우선 조건:
  - `HARUNA_HORIZONS_BASE_URL` 설정됨
  - `ASTROLOGY_USE_HORIZONS !== "false"`
- 호출 API: `POST /v1/ephemeris/positions`
- 폴백 정책:
  - fail-fast: `HORIZONS_INVALID_REQUEST`, `HORIZONS_UNSUPPORTED_OPTION`
  - 그 외 오류(네트워크, 타임아웃, 위치 누락 포함)는 로컬 정적 계산 폴백
