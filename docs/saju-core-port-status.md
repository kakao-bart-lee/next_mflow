# Saju Core 3.0 Port Status

**Last Updated**: 2026-03-07

## Overview

`next_mflow`의 내장 `lib/saju-core`는 `saju-core-lib` 3.0.0 방향에 맞춰 structured profile 응답을 내도록 포팅 중이다.

현재까지는 아래 두 축이 진행됐다.

1. 응답 구조 포팅
2. 레거시 계산/조회 호환성 복구

아직 일부 테이블은 원본 수식 또는 원본 데이터가 없어 exact port가 끝나지 않았다.

## Completed

### 1. 3.0.0 profile response 포팅

- `fortuneProfileResult` 구조를 앱 응답에 추가
- `fullText`, `briefText`, `oneLineSummary`를 가지는 profile entry 구조 반영
- `Lab` 내부 해설 화면이 structured profile을 우선 표시하도록 변경
- 레거시 `inputData.theme_interpretation`, `fortune_interpretations`는 호환용으로 유지

관련 커밋:

- `c07e830` `feat port saju 3.0 profile responses`

### 2. 기본 호환성 수정

- `basic` profile 요청이 enum 파싱에서 실패하던 문제 수정
- 사주 캐시 키를 버전 기반으로 분리해 구 응답이 계속 재사용되던 문제 수정
- 클라이언트 코드가 `lib/saju-core/index.ts`를 통해 `fs` 의존 경로를 끌어오던 문제 수정
- `VERSION` 상수를 클라이언트 안전한 별도 파일로 분리

관련 커밋:

- `49a3fe1` `fix saju basic fortune compatibility`

### 3. profile sweep 기반 호환성 복구

- `S144` 계산 포팅
- `S087`~`S092` lookup fallback 보강
  - 숫자 key
  - prefixed key suffix
  - `num`, `DB_num` 메타 fallback
- `GenderBasedCalculator`가 `DB_data_m`, `DB_data_w` 같은 성별 컬럼을 실제로 읽도록 수정
- `DatabaseResultRetriever`에 `preferredColumns` 기반 조회 지원 추가

관련 커밋:

- `2ee9df0` `fix saju gender column retrieval`
- `271cc9a` `feat finish saju profile port integration`

### 4. upstream TS 소스 반영

`../saju-core-lib`의 TS 포트에도 같은 retrieval 호환 수정 반영.

관련 커밋:

- `4f8788c` `fix ts fortune interpreter compatibility`

## Verified

반복적으로 수행한 검증:

- `pnpm exec tsc --noEmit`
- `pnpm build`
- `pnpm exec vitest run __tests__/lib/saju-core/fortuneInterpreter.test.ts`
- `pnpm exec tsx /tmp/saju-profile-sweep.ts`

추가 확인:

- `../saju-core-lib`에서 `pnpm exec tsc --noEmit -p tsconfig.json`
- Python 원본 일부 파일에 대해 `python3 -m py_compile`

## Current Sweep Snapshot

2026-03-07 기준 profile sweep 요약:

- `basic`: `4/4`
- `daily_fortune`: `6/6`
- `career_fortune`: `6/6`
- `wealth_fortune`: `6/6`
- `birth_season_fortune`: `6/7`
- `five_elements_balance`: `8/10`
- `life_overview`: `20/24`
- `detailed_saju_reading`: `10/12`
- `lifetime_overview`: `11/12`
- `new_year_fortune`: `15/26`
- `tojeong_yearly_fortune`: `10/18`

남은 실패는 크게 세 범주로 나뉜다.

## Remaining Blockers

### 1. 원본 데이터 손실

현재 로컬 데이터와 `../saju-core-lib/data`는 동일하게 아래 문제가 있다.

- `S095`, `S097`, `S098`, `S099`, `S100`: 테이블이 비어 있음
- `S101`: 월별 `DB_data_1`~`DB_data_12` 컬럼이 JSON에 남아 있지 않음
- `S110`: 월별 컬럼이 JSON에 남아 있지 않음
- `S081`, `S085`: `DB_data_m`, `DB_data_w` 원문이 비어 있음
- `T022`: `DB_data_m`, `DB_data_w` 원문이 비어 있음

즉, retrieval 계층은 복구됐지만 실제 원문 데이터가 비어 있어 일부 결과는 여전히 `missing_data`다.

### 2. 원본 helper 또는 수식 부재

아래 항목은 참조 PHP는 확인했지만 핵심 계산 함수 또는 include 파일이 로컬 스냅샷에 없다.

- `F_Juyeok_trigram`
  - 영향: `F011`, `T039`, `J004`, `J005`, `J009`, `J010`
- `F_woonday`, `F_ohengSearch`
  - 영향: `S008`, `S009`
- `yong/hee/kee/goo code` 산출 파이프라인
  - 영향: `S014`
- `cut_tot`
  - 영향: `S103`, `S104`, `S106`, `S107`, `S108`, `S109`, `S110`
- `temp_03`
  - 영향: `S095`, `S096`, `S097`, `S098`, `S099`, `S100`, `S101`
- `result_14jusung_guanrok`, `result_guanrokgung`
  - 영향: `J023`
- `S126_sal_data.php`
  - 영향: `S126`

### 3. 일부 테이블은 config 미등록

현재 일부 실패는 실제 미지원이라기보다 calculator factory에 아직 등록되지 않아 `unsupported_table`로 떨어진다.

대표 항목:

- `S095`, `S097`, `S098`, `S099`, `S100`, `S101`
- `S103`, `S104`, `S106`, `S107`, `S108`, `S109`, `S110`
- `J004`, `J005`, `J009`, `J010`, `J023`
- `S126`

이 항목들은 다음 라운드에서 최소한 “정확한 blocked reason을 드러내는 계산 경로”로 먼저 등록하는 것이 좋다.

## Current Assessment

현재 상태는 다음과 같이 볼 수 있다.

- 3.0.0 응답 구조 포팅은 완료됐다.
- 주요 사용 경로 중 `basic`, `daily_fortune`, `career_fortune`, `wealth_fortune`는 안정권이다.
- 일부 레거시 항목은 조용히 잘못 계산되는 상태가 아니라, 대부분 명시적 에러나 `missing_data`로 드러나게 정리됐다.
- 남은 일의 대부분은 단순 TS 구현이 아니라 원본 수식 또는 원본 데이터 복구 문제다.

## Recommended Next Steps

### Priority 1

`unsupported_table`로만 떨어지는 항목을 calculator config에 등록하고, 각 항목별 차단 사유를 명시적으로 노출한다.

목표:

- sweep 결과가 단순 `unsupported_table`이 아니라
- `missing_cut_tot_formula`
- `missing_temp_03_source`
- `missing_juyeok_trigram_helper`
- `missing_yongsin_pipeline`

같은 식으로 더 좁혀지게 만들기

### Priority 2

원본 데이터 복구 경로를 찾는다.

우선 대상:

- `S081`, `S085`, `T022`
- `S101`, `S110`

찾아야 할 것:

- 과거 raw export
- DB dump
- 변환 전 intermediate file
- 생성 스크립트 또는 변환 규칙 누락

### Priority 3

원본 helper 복원 가능성을 계속 조사한다.

우선 대상:

- `F_Juyeok_trigram`
- `F_woonday`
- `F_ohengSearch`
- `cut_tot`
- `temp_03`

가능하면 `../saju-core-lib` 쪽에서 먼저 exact port를 만들고, 그 후 `next_mflow`로 가져오는 방식이 가장 안전하다.

## Notes

- `next_mflow`와 `../saju-core-lib`는 현재 일부 수정이 양쪽에 분산되어 있으므로, 앞으로도 원본 수정 후 포팅 방식을 유지하는 편이 좋다.
- `.codex/`는 개발 도구 산출물이므로 관리 대상에서 제외한다.
