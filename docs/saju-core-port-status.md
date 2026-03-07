# Saju Core 3.0 Port Status

**Last Updated**: 2026-03-07

## Overview

`next_mflow`의 내장 `lib/saju-core`는 `saju-core-lib` 3.0.0 방향에 맞춰 structured profile 응답을 내도록 포팅했고, 주요 레거시 PHP 흐름 복구도 완료했다.

현재 기준으로는 “동작 복구” 단계보다 “opaque한 legacy 흐름을 의미 있는 계산 단계로 재배치하는 유지보수성 개선” 단계가 더 중요하다.

추가 계획은 아래 문서로 관리한다.

- `docs/saju-core-maintenance-roadmap.md`

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
- `birth_season_fortune`: `7/7`
- `five_elements_balance`: `10/10`
- `life_overview`: `24/24`
- `detailed_saju_reading`: `12/12`
- `lifetime_overview`: `12/12`
- `new_year_fortune`: `26/26`
- `tojeong_yearly_fortune`: `18/18`
- `early_life_fortune`: `15/15`
- `midlife_fortune`: `14/14`
- `later_life_fortune`: `11/11`
- `misfortune_relief`: `2/2`

현재 `next_mflow` 기준 남은 대형 기능 blocker는 없다. 남은 일은 결과 정합성을 해치지 않으면서 `temp_03`, `cut_tot`, `serial_no`, `choie_data` 같은 레거시 중간값을 의미 있는 구조로 바꾸는 유지보수성 작업이다.

## Current Assessment

현재 상태는 다음과 같이 볼 수 있다.

- 3.0.0 응답 구조 포팅은 완료됐다.
- SQL 기반 원문 데이터와 주요 PHP 계산 흐름은 `next_mflow`와 `saju-core-lib` 양쪽에 반영됐다.
- profile sweep 기준 사용자 노출 경로는 모두 복구됐다.
- 다음 단계의 핵심은 “정답을 맞히는 것”이 아니라 “정답을 유지보수 가능하게 설명하는 것”이다.

## Maintenance Refactor Progress

2026-03-07 현재 유지보수성 개선 작업은 아래까지 진행됐다.

- `Gendered narrative` family
  - `S081`, `S085`, `T022` 공통 흐름을 `genderedNarratives.ts`로 분리
  - `combined_value`, `day_stem_num` 같은 legacy field alias는 호환 유지
- `New year signal` family
  - `S095`~`S101` 공통 흐름을 `newYearSignals.ts`로 분리
  - `temp_03` 의미를 `current year stem` 기준의 계산 단계로 치환
- `Tojeong trigram` family
  - `S103`~`S110` 공통 흐름을 `tojeongTrigrams.ts`로 분리 완료
  - 기존 `cut_tot`는 `tojeong trigram composite key`라는 의미 있는 내부 개념으로 교체 완료
- `Juyeok` family
  - `F011`, `T039`, `J004`, `J005`, `J009`, `J010` 공통 흐름을 `juyeokTrigrams.ts` helper 경계로 분리
- `legacy cycle` family
  - `F_woonday`, `F_ohengSearch` 계열을 `legacyCycles.ts` helper로 분리

즉 현재는 profile 결과 복구가 아니라 “family별 key builder와 lookup 단계 분리”가 실제 코드 구조에 반영되는 단계다.

## Recommended Next Steps

실행 계획은 `docs/saju-core-maintenance-roadmap.md`에서 관리한다.

핵심 원칙:

- 복구 가능한 데이터와 계산식은 먼저 확보한다.
- 그 위에서 레거시 중간값을 의미 있는 key builder와 lookup module로 분리한다.
- `../saju-core-lib`를 정본으로 정리하고, 안정화 후 `next_mflow`로 포팅한다.

## Notes

- `next_mflow`와 `../saju-core-lib`는 현재 일부 수정이 양쪽에 분산되어 있으므로, 앞으로도 원본 수정 후 포팅 방식을 유지하는 편이 좋다.
- `.codex/`는 개발 도구 산출물이므로 관리 대상에서 제외한다.
