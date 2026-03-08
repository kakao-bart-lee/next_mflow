# Saju Core Contract Alignment (next_mflow vs saju-core-lib)

Last updated: 2026-03-08
Baseline: `saju-core-lib@1e57848e115b2bee38149c76c63b3d4a487254d2`

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
| compatibility legacy | `G003/G012/G019/G026/G028` lookup/score/text snapshot | aligned | `saju-core-legacy-gcodes.parity.test.ts` |
| extended | `fortuneProfileResult` (basic) | aligned | `saju-core-contract-drift.test.ts` |
| extended | `inputData.theme_interpretation` | aligned | `saju-core-contract-drift.test.ts` |
| extended | `inputData.profile_id` | aligned | `saju-core-contract-drift.test.ts` |
| extended | `inputData.fortune_type_description` | aligned | `saju-core-contract-drift.test.ts` |
| extended | `inputData.jumno` | aligned | `saju-core-contract-drift.test.ts` |

## Drift Policy

1. core contract drift는 허용하지 않는다.
2. extended contract drift도 기본적으로 허용하지 않는다.
3. drift가 발생하면 upstream(`saju-core-lib`) 선행 수정 후 baseline 재고정으로 해소한다.

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

- `G003/G012/G019/G026/G028`의 upstream baseline parity 기준 정식화
- 다음 upstream 변경 시 baseline SHA 재고정 + `test:saju-sync` 재실행
- parity fixture 확장 범위 유지: `marriage/business/friendship`, `isTimeUnknown`, 자정 경계, `sasangConstitution` null
