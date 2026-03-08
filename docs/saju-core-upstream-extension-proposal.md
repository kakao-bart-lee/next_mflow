# Proposal: Promote Extended Saju Payload Contract Upstream

Last updated: 2026-03-08
Target baseline: `saju-core-lib@6aac047c7ff92bec1a388edfc108ba2441e7c8fb`
Owner repo (proposed change): `saju-core-lib`
Consumer repo: `next_mflow`

## Decision Goal

`next_mflow`에서 이미 소비 중인 extended payload를 `saju-core-lib`의 공식 계약으로 승격할지 결정한다.

대상 필드:

- `fortuneProfileResult` (특히 `basic` 프로필 경로)
- `inputData.theme_interpretation`
- `inputData.profile_id`
- `inputData.fortune_type_description`
- `inputData.jumno`

## Current State (2026-03-08)

- `next_mflow`는 위 필드를 런타임에서 사용/노출 중이다.
- `saju-core-lib@6aac047`는 동일 입력에서 core 계산은 일치하나, 위 필드는 미노출 또는 일부 누락이다.
- core parity는 녹색이며 drift는 extended 범위에 국한됨.

참조:

- `docs/saju-core-contract-alignment.md`
- `__tests__/lib/integrations/saju-core-contract-drift.test.ts`

## Options

### Option A (Recommended): Upstream Contract Promotion

`saju-core-lib`가 extended 필드를 공식 계약에 포함한다.

장점:

- 소비자별 ad-hoc 확장 제거
- parity 기준 단순화 (core + extended 통합)
- 향후 다중 소비자에서 동일 계약 사용 가능

단점:

- upstream 타입/문서/테스트 변경 필요
- minor version 정책 정합성 검토 필요

### Option B: Keep Drift + Adapter-only Extensions

현 상태를 유지하고 `next_mflow` adapter에서 확장을 계속 흡수한다.

장점:

- upstream 변경 비용 최소

단점:

- drift 영구화
- 소비자별 계약 분기 누적

## Recommended Contract Shape (Upstream)

### 1) `inputData.jumno`

- 타입: `number`
- 의미: 만세력 row identity/trace field (기존 계산 경로 provenance)
- 정책: optional 허용 (`number | undefined`)로 시작

### 2) `fortuneProfileResult`

- `getSajuFortune(request, "basic")` 경로에서 항상 채움
- 최소 보장:
  - `profile.id`
  - `profile.title`
  - `profile.description`
  - `sections[]`
  - `theme` (존재 시)

### 3) `inputData.theme_interpretation`

- `fortuneProfileResult.theme`의 backward-compatible alias
- 중복 저장이 아니라 “호환 뷰”로 정의

### 4) `inputData.profile_id`

- profile routing trace용 필드
- `basic` 포함 모든 profile 경로에 일관되게 설정

### 5) `inputData.fortune_type_description`

- profile/fortuneType에 대한 사용자 표시 설명
- 빈 문자열 대신 가능한 경우 description 채움

## Migration Plan

1. `saju-core-lib` 타입 승격
- `ts-src/models/fortuneTeller.ts`에 필드 타입 확장 반영
- `FortuneResponse` schema/types 일치

2. `saju-core-lib` 구현 반영
- `ts-src/facade.ts#getSajuFortune`에서 `basic` 포함 일관 채움
- `jumno` 노출 여부를 calculate/getSajuFortune 모두에서 통일

3. `saju-core-lib` 게이트
- `uv run pytest -q`
- `npm run typecheck`
- `npx vitest run`
- 신규 테스트: basic profile 계약 스냅샷

4. `next_mflow` 포팅
- baseline SHA 갱신
- drift test를 “expected aligned”로 전환
- adapter optional 처리 축소

## Test Plan

### Upstream (`saju-core-lib`)

- `getSajuFortune(..., "basic")`에서 `fortuneProfileResult` non-null
- `inputData.theme_interpretation` shape 보장
- `inputData.profile_id`/`fortune_type_description` 존재 보장
- `calculateSaju`/`getSajuFortune`의 `jumno` 존재 정책 일관성 검증

### Consumer (`next_mflow`)

- `pnpm run test:saju-sync`
- `saju-core-contract-drift.test.ts` 기대치 업데이트 (drift 제거 확인)

## Risks & Mitigations

- 위험: 기존 소비자가 추가 필드로 인한 schema mismatch
- 완화: optional 우선 + minor release note 명시

- 위험: `theme_interpretation` 중복 관리로 무결성 저하
- 완화: source-of-truth를 `fortuneProfileResult.theme`로 고정하고 alias는 파생 생성

- 위험: `jumno` 의미 불명확
- 완화: 필드 설명 문서화 + provenance 목적 제한

## Acceptance Criteria

- `saju-core-lib`에서 extended 필드가 공식 타입/문서/테스트로 보장됨
- `next_mflow` drift test에서 extended drift 항목 0개
- 포팅 커밋 메시지에 `port(saju-core-lib@<new-sha>)` 기록

## Suggested Execution Order

1. `saju-core-lib` PR: extended contract promotion
2. `saju-core-lib` release/minor tag
3. `next_mflow` port + parity/drift green
