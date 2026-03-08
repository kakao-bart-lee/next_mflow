# Saju Core Sync Checklist (next_mflow)

Last updated: 2026-03-08

## 1) Baseline Pin

- Baseline repo: `saju-core-lib`
- Baseline SHA: `cdbd4c77147395d1fc757a6069635ae3633c8ed1` (`cdbd4c7`)
- Sync policy: `SYNC_POLICY.md` (copied from upstream policy)
- Commit message rule: `port(saju-core-lib@<sha>): ...`

## 2) Consumer Contract Inventory (current next_mflow)

- Analyze API: `app/api/saju/analyze/route.ts`
- Interpret API: `app/api/saju/interpret/route.ts`
- Compatibility API: `app/api/saju/compatibility/route.ts`
- Workflow consumer: `lib/mastra/workflows/fortune-workflow.ts`
- Use-case entry: `lib/use-cases/analyze-saju.ts`, `lib/use-cases/interpret-saju.ts`

## 3) Contract Alignment Checklist

- [x] **사주 원국 결과**: `sajuData.basicInfo`, `sajuData.pillars.{년,월,일,시}` 필드 구조 고정
- [x] **확장 해석 payload**: `fortuneProfileResult`, `inputData.fortune_interpretations` 호환성 점검
- [x] **오류/예외 계약**: `CALCULATION_ERROR`, `LLM_ERROR`, `INSUFFICIENT_CREDITS` 코드 유지
- [x] **midnight policy**: `23:xx`, `00:xx` 경계 케이스 fixture parity 통과
- [x] **engine/source metadata**: adapter 기준 SHA/출처 추적 가능 상태 유지

현재 확인된 차이(2026-03-08):

| 항목 | next_mflow | saju-core-lib@cdbd4c7 | 처리 방향 |
|---|---|---|---|
| `inputData.jumno` | 있음 | 있음 | aligned 유지 |
| `fortuneProfileResult` (`basic`) | 구조화 결과 있음 | 구조화 결과 있음 | drift 0 유지 |
| `inputData.theme_interpretation` | 있음 | 있음 | drift 0 유지 |

## 4) Porting Unit Order

- [x] Unit 1: core calculation
- [x] Unit 2: extended interpretation
- [x] Unit 3: comparison/compat shim
- [x] Unit 4: batch/reporting needed paths

각 Unit은 `next_mflow`에서 PR 또는 커밋 묶음 1개로 종료한다.

## 5) Adapter Rules

- `next_mflow` 런타임 호출부는 `lib/integrations/saju-core-adapter.ts`를 통해서만 사주 계산을 호출한다.
- 도메인 규칙(계산식/테이블 룰)은 `next_mflow`에서 재구현하지 않는다.
- 기존 호출부 호환은 adapter에서 입력 정규화(`isTimeUnknown -> 12:00`)로 처리한다.

## 6) Verification Gates

### Upstream (`saju-core-lib`)

```bash
cd /Users/bclaw/workspace/moonlit/saju-core-lib
uv run pytest -q
npm run typecheck
npx vitest run
```

### App (`next_mflow`)

```bash
cd /Users/bclaw/workspace/moonlit/next_mflow
pnpm run test:saju-sync
pnpm run build
```

## 7) Parity Gate

- Golden fixture: `__tests__/fixtures/saju-core-parity-cases.json`
- Parity test: `__tests__/lib/integrations/saju-core-adapter.parity.test.ts`
- 비교 대상: `next_mflow adapter` vs `../saju-core-lib/dist/esm/facade.js`
- 기본 비교 범위: pillars, 지장간, 신살, hyungchung, greatFortune (core contract)
- 확장 해석 payload(`fortuneProfileResult`, `inputData` 세부)도 drift 0을 기본값으로 관리한다.
- compatibility parity: `__tests__/lib/integrations/saju-core-compatibility.parity.test.ts`
- legacy G-code parity: `__tests__/lib/integrations/saju-core-legacy-gcodes.parity.test.ts`
  - fixture: `__tests__/fixtures/saju-legacy-gcode-parity-cases.json`
- 계약표: `docs/saju-core-contract-alignment.md`

## 8) Completion Criteria

- [x] `next_mflow` 사주 호출 경로가 adapter 경유로 통일됨
- [x] parity fixture에서 adapter 출력과 baseline 출력 일치
- [x] 포팅 커밋에 `saju-core-lib@<sha>`가 기록됨
- [x] 양 저장소 게이트 통과 로그 확보
