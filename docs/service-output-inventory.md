# Service Output Inventory (Today/Future/AI)

작성일: 2026-03-02

## 1) 사용자에게 현재 제공 중인 결과 형태

### Today 화면
- 형식: 카드형 요약 + 실천 체크리스트 + AI 대화 진입
- 데이터 원천:
  - 사주 분석 결과(`sajuData.pillars.일`, `sinyakSingang.element_powers`) 기반 파생
  - 문구는 규칙 기반 템플릿

### Week 화면 (미래 흐름)
- 형식: 7일 리스트 + AI 리캡 카드 + 저널 질문
- 기존: 하드코딩된 주간 데이터
- 변경: `astrology static` 계산 결과(`future.days`) 기반 동적 구성

### Explore 화면
- 형식:
  - 사주+점성 융합 헤드라인
  - 행성/사주 매핑 인터랙션
  - 오행 분포/대운/신약신강 보조 카드
- 기존: 점성 파트(행성 위치/설명)가 하드코딩
- 변경: `astrology static` 계산 결과(`positions`, `influences`, `today`) 사용

### Decision 화면
- 형식: 3문항 의사결정 프레임 + 결과 카드 + AI 대화
- 데이터 원천: 현재는 로컬 규칙 기반

## 2) AI 대화 제공 형태

- 엔드포인트: `POST /api/chat`
- 모델: `MASTRA_SAJU_MODEL` (기본 `gpt-4o-mini`)
- 컨텍스트:
  - `BIRTH_INFO_JSON`
  - `SAJU_DATA_JSON`
  - `ASTROLOGY_STATIC_JSON` (이번 변경 추가)
- 결과 형식: 스트리밍 텍스트 응답

## 3) 백오피스(관리자) 설정 가능 항목

### 변경
- 관리자 설정 API 추가:
  - `GET /api/admin/settings`
  - `PUT /api/admin/settings`
- 저장 키:
  - `astrology_chat_prompt` (채팅 시스템 프롬프트)
  - `astrology_report_prompt` (리포트 생성용 프롬프트)

## 4) 정적 점성 계산값 저장/재사용

- 신규 분석 API: `POST /api/astrology/static`
- 입력: 기존 `BirthInfoSchema`
- 계산 결과:
  - 행성 위치(`positions`)
  - 행성 영향력 점수(`influences`):
    - Naisargika Bala
    - Essential Dignity
    - 혼합 점수
  - 오늘 인사이트(`today`)
  - 주간 인사이트(`future`)
- 저장:
  - 로그인 사용자 기준 `Analysis` 테이블에 `expertId = "astrology-static"`로 저장
- 재사용:
  - `SajuContext`에서 사주 분석과 함께 조회해 Today/Week/Explore/Chat 컨텍스트에 공급
- 계산 소스:
  - 우선: Haruna Horizons `POST /v1/ephemeris/positions` (환경변수 `HARUNA_HORIZONS_BASE_URL` 설정 시)
  - 폴백: 외부 서비스 네트워크/서버 오류 시 로컬 deterministic static 계산
  - fail-fast: 입력/옵션 오류(`invalid_request`, `unsupported_option`, 위치 누락)는 에러 반환
