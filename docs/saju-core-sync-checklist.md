# Saju Core Sync Checklist (next_mflow)

Last updated: 2026-03-08

## 1) Baseline Pin

- Baseline repo: `saju-core-lib`
- Baseline SHA: `6aac047c7ff92bec1a388edfc108ba2441e7c8fb` (`6aac047`)
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
- [ ] **확장 해석 payload**: `fortuneProfileResult`, `inputData.fortune_interpretations` 호환성 점검
- [ ] **오류/예외 계약**: `CALCULATION_ERROR`, `LLM_ERROR`, `INSUFFICIENT_CREDITS` 코드 유지
- [x] **midnight policy**: `23:xx`, `00:xx` 경계 케이스 fixture parity 통과
- [x] **engine/source metadata**: adapter 기준 SHA/출처 추적 가능 상태 유지

현재 확인된 차이(2026-03-08):

| 항목 | next_mflow | saju-core-lib@6aac047 | 처리 방향 |
|---|---|---|---|
| `inputData.jumno` | 있음 | 없음 | adapter에서 optional 필드로 흡수 |
| `fortuneProfileResult` (`basic`) | 구조화 결과 있음 | 없음 | 계약 상향 여부를 upstream 우선 검토 |
| `inputData.theme_interpretation` | 있음 | 없음 | parity fail 대상에서 제외, drift 추적 |

## 4) Porting Unit Order

- [x] Unit 1: core calculation
- [ ] Unit 2: extended interpretation
- [ ] Unit 3: comparison/compat shim
- [ ] Unit 4: batch/reporting needed paths

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
pnpm run test:run -- __tests__/lib/integrations/saju-core-adapter.test.ts
pnpm run test:saju-parity
pnpm run test:run -- __tests__/api/saju-interpret.test.ts __tests__/lib/use-cases/analyze-saju.test.ts
pnpm run build
```

## 7) Parity Gate

- Golden fixture: `__tests__/fixtures/saju-core-parity-cases.json`
- Parity test: `__tests__/lib/integrations/saju-core-adapter.parity.test.ts`
- 비교 대상: `next_mflow adapter` vs `../saju-core-lib/dist/esm/facade.js`
- 기본 비교 범위: pillars, 지장간, 신살, hyungchung, greatFortune (core contract)
- 확장 해석 payload(`fortuneProfileResult`, `inputData` 세부)는 별도 계약표에서 drift를 추적한다.

## 8) Completion Criteria

- [x] `next_mflow` 사주 호출 경로가 adapter 경유로 통일됨
- [x] parity fixture에서 adapter 출력과 baseline 출력 일치
- [ ] 포팅 커밋에 `saju-core-lib@<sha>`가 기록됨
- [x] 양 저장소 게이트 통과 로그 확보
