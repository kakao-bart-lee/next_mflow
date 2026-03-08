# Saju Core Contract Alignment (next_mflow vs saju-core-lib)

Last updated: 2026-03-08
Baseline: `saju-core-lib@6aac047c7ff92bec1a388edfc108ba2441e7c8fb`

## Scope

이 문서는 `next_mflow`가 소비하는 사주 계약을 `core contract`와 `extended contract`로 분리해서 관리한다.

- core contract: 기준 저장소와 parity를 강제하는 최소 계약
- extended contract: 앱 확장 요구로 발생한 drift 계약

## Runtime Entry Points

- analyze: `POST /api/saju/analyze`
- interpret: `POST /api/saju/interpret`
- compatibility: `POST /api/saju/compatibility`
- workflow: `lib/mastra/workflows/fortune-workflow.ts`

모든 런타임 계산 호출은 `lib/integrations/saju-core-adapter.ts` 경유를 원칙으로 한다.

## Batch/Reporting Inventory

- 현재 `next_mflow` 런타임에서 사주 배치/리포팅 전용 소비 경로는 확인되지 않음.
- 관련 비교/리포팅 로직은 `saju-core-lib`에서 선행 관리하고, `next_mflow`에는 결과 소비 어댑터만 추가한다.
- 신규 배치 경로가 생기면 아래를 동시에 갱신한다.
  - `docs/saju-core-sync-checklist.md` Unit 4 섹션
  - `test:saju-sync` 명령의 대상 테스트 목록

## Contract Matrix

| 영역 | 필드/계약 | 상태 | 검증 경로 |
|---|---|---|---|
| core | `sajuData.basicInfo` | aligned | `saju-core-adapter.parity.test.ts` |
| core | `sajuData.pillars.{년,월,일,시}` | aligned | `saju-core-adapter.parity.test.ts` |
| core | `지장간`, `신살` | aligned | `saju-core-adapter.parity.test.ts` |
| core | `hyungchung`, `greatFortune` | aligned | `saju-core-adapter.parity.test.ts` |
| compatibility core | `total_score`, `*_match`, `overall_interpretation`, `recommendations` | aligned | `saju-core-compatibility.parity.test.ts` |
| extended | `fortuneProfileResult` (basic) | drift | `saju-core-contract-drift.test.ts` |
| extended | `inputData.theme_interpretation` | drift | `saju-core-contract-drift.test.ts` |
| extended | `inputData.profile_id` | drift | `saju-core-contract-drift.test.ts` |
| extended | `inputData.fortune_type_description` | drift | `saju-core-contract-drift.test.ts` |
| extended | `inputData.jumno` | drift | `saju-core-contract-drift.test.ts` |

## Drift Policy

1. core contract drift는 허용하지 않는다.
2. extended contract drift는 문서 + drift test로 추적한다.
3. extended 필드를 upstream 계약으로 승격할지 여부는 `saju-core-lib` 선행 변경으로만 결정한다.

## Verification Commands

```bash
cd /Users/bclaw/workspace/moonlit/next_mflow
pnpm run test:saju-sync
```

`test:saju-sync`는 아래를 포함한다.

- adapter boundary (직접 facade 사용 금지)
- core parity
- compatibility parity
- drift snapshot
- API/use-case 영향 테스트
- TypeScript typecheck

## Open Follow-ups

- `fortuneProfileResult` 및 `theme_interpretation`를 upstream 계약으로 승격할지 결정
- `G003/G012/G019/G026/G028`의 upstream baseline parity 기준 정식화
