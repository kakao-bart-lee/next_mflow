# Saju Core 3.0 Port Status

**Last Updated**: 2026-03-08

## Overview

`next_mflow`의 내장 `lib/saju-core`는 `saju-core-lib` 3.0.0 방향에 맞춰 structured profile 응답을 내도록 포팅했고, 주요 레거시 PHP 흐름 복구도 완료했다.

`2026-03-08` 기준 연동 운영 고정 작업으로 아래를 추가했다.

- `lib/integrations/saju-core-adapter.ts` 경유 호출 경로 적용
- `SYNC_POLICY.md`를 upstream 정책과 동일 내용으로 동기화
- `__tests__/lib/integrations/saju-core-adapter.parity.test.ts` parity 게이트 추가
- 실행 체크리스트 문서 `docs/saju-core-sync-checklist.md` 추가
- 계약 정렬 문서 `docs/saju-core-contract-alignment.md` 추가
- compatibility parity 게이트 `__tests__/lib/integrations/saju-core-compatibility.parity.test.ts` 추가
- adapter boundary 게이트 `__tests__/lib/integrations/saju-core-adapter.boundary.test.ts` 추가

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

### 5. synthetic `ten_year_fortune_cycle` 및 marker 해설층 추가

- `greatFortune` 원데이터를 그대로 노출하는 대신, `ten_year_fortune_cycle` profile을 synthetic section으로 재구성
- `GF_TIMELINE`
  - 현재 연도 기준 10년 창을 생성
  - 각 연도별 `천간/지지`, `십성`, `십이신살`, `양인`, `공망`, `fortune year marker`를 함께 표시
- `GF_PERIODS`
  - 대운 구간을 `start_age~end_age`, 간지, 십성 기준으로 다시 조립
- `fortuneYearMarkers.ts`
  - `천덕귀인`, `월덕귀인`, `천덕합`, `월덕합`, `생기`, `천의`를 shared helper로 분리
  - marker별 `briefText`와 `fullText`를 같이 관리하도록 확장
- `GF_TIMELINE.oneLineSummary`
  - 현재 연도 marker의 짧은 해설을 붙이도록 보강
- `GF_TIMELINE.fullText`
  - 단순 연도 목록만 출력하던 형태에서, 10년 창 안에 실제 marker가 뜨는 연도들을 모아 `연도별 표식 해설` 섹션을 추가

관련 커밋:

- `c37b95c` `feat synthesize ten year fortune profile`
- `aa23dfd` `feat add fortune year marker helper`
- `a240782` `feat extend fortune year markers`
- 이번 라운드 커밋 예정: marker `fullText` 해설층 추가

### 6. 궁합 G-code 및 find_yong 결정 트리 포팅

- `yongsinDecisionTree.ts`
  - PHP `find_yong()` 결정 트리를 TypeScript로 완전히 포팅
  - PHP 원본의 fall-through 버그(break 누락)를 수정하여 정합성 확보
- `legacyCompatibility.ts` 확장
  - `G003` (기본 궁합 성향): 십이운성 기반
  - `G012` (세부 궁합 분석): 일지 기반
  - `G019` (별자리 궁합): 서양 별자리 기반
  - `G026` (띠 궁합): 12×12 띠 조합 역설계
  - `G028` (사상체질 궁합): 사상체질 pair 정규화
- `lib/schemas/birth-info.ts`
  - `sasangConstitution` 필드 추가 (ty, sy, tu, su)

관련 커밋:

- `docs(saju): update handoff, port-status, and roadmap for decision tree and G-codes`

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

2026-03-08 기준 profile sweep 요약:

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
- `ten_year_fortune_cycle`: `2/2`

현재 `next_mflow` 기준 남은 대형 기능 blocker는 없다. 남은 일은 결과 정합성을 해치지 않으면서 `temp_03`, `cut_tot`, `serial_no`, `choie_data` 같은 레거시 중간값을 의미 있는 구조로 바꾸는 유지보수성 작업이다.

## Current Assessment

현재 상태는 다음과 같이 볼 수 있다.

- 3.0.0 응답 구조 포팅은 완료됐다.
- SQL 기반 원문 데이터와 주요 PHP 계산 흐름은 `next_mflow`와 `saju-core-lib` 양쪽에 반영됐다.
- profile sweep 기준 사용자 노출 경로는 모두 복구됐다.
- legacyCompatibility 모듈이 21개 builder를 4개 family module로 분해되어 유지보수성이 크게 개선됐다.
- S014 메타데이터가 findYong auxiliary + secondary/tertiary profile로 확장되어 향후 분석 확장이 용이해졌다.
- 호환성 커버리지 매트릭스 문서로 PHP/TS 구현 현황이 명확히 정리됐다.
- 다음 단계의 핵심은 "정답을 맞히는 것"이 아니라 "정답을 유지보수 가능하게 설명하는 것"이다.

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
- `fortune year marker` family
  - `fortuneYearMarkers.ts`로 `천덕귀인`, `월덕귀인`, `천덕합`, `월덕합`, `생기`, `천의` 규칙 분리
  - compact insight와 full text explanation을 같이 제공하도록 구조 확장
- `fortune timeline annotation` family
  - `fortuneTimelineAnnotations.ts`로 `fortune year marker` 외에 `양인`, `공망`, `십이신살` 설명까지 같은 계층으로 확장
  - `ten_year_fortune_cycle`의 `oneLineSummary`와 `fullText`가 이제 marker뿐 아니라 timeline에 실제 표시되는 표식 전체를 설명
- synthetic profile assembly
  - `greatFortuneProfiles.ts`에서 `ten_year_fortune_cycle`을 synthetic profile로 조립
  - marker 규칙과 marker 설명을 `oneLineSummary`/`fullText`에 연결
- `S014` provenance
  - `elementRoleProfiles.ts`가 이제 `toC_yongsin_01`의 source title/number와 primary-secondary-tertiary role snapshot을 같이 반환
  - 현재 남은 hard case가 `S014 result assembly`가 아니라 `yong/hee/kee/goo role derivation`임을 코드에서 추적 가능하게 정리

즉 현재는 profile 결과 복구가 아니라 “family별 key builder와 lookup 단계 분리”가 실제 코드 구조에 반영되는 단계다.

## 7. legacyCompatibility 폴더 구조 분해 및 family module 추출

2026-03-08 기준 legacyCompatibility 모듈 재구성 완료:

- **T4**: legacyCompatibility 폴더 구조 생성 (`_legacy.ts` + `index.ts` barrel)
- **T5**: legacyUtilities.ts 추출 (39개 상수/헬퍼)
- **T6**: legacyDataReaders.ts 추출 (18개 reader 함수)
- **T8**: legacyBasicCompatibility.ts 추출 (5개 builder: G003, G012, T010, G023, G022)
- **T9**: legacyTimingInsights.ts 추출 (6개 builder: G001, G033, G004-G007, G034, Y004, Y001)
- **T10**: legacyZodiacInsights.ts 추출 (3개 builder: G019, G026, G028)
- **T11**: legacySpouseInsights.ts 추출 (7개 builder: G030, G031, G024, G032, G016, G020, Y003)
- **T12**: barrel 완전성 확인 + `_legacy.ts` 제거

결과:
- 21개 legacy compatibility builder를 4개 family module로 분해
- 모든 builder가 의미 있는 family 경계로 정리됨
- 기존 import path (`@/lib/saju-core/saju/legacyCompatibility`) 유지 (barrel 호환성)
- 테스트 275개 통과, TypeScript clean

관련 커밋:
- `docs(saju): update handoff, port-status, and roadmap for decision tree and G-codes`

## 8. S014 metadata enrichment: findYong auxiliary + secondary/tertiary profile exposure

2026-03-08 기준 S014 메타데이터 확장 완료:

- **T4**: `fortuneCalculatorBase.ts`에서 S014 컨텍스트 구성 시 `findYong()` auxiliary 결과를 메타데이터로 노출
  - `findYong_codes`: 5개 코드 (auxiliary)
  - `findYong_elements`: 5개 요소 (auxiliary)
  - `findYong_source: "auxiliary"` — primary/auxiliary provenance 명시
- **elementRoleProfiles.ts**: `getElementRoleProfile()` 호출 시 primary/secondary/tertiary snapshot 함께 반환
  - `role_profile_primary`: 현재 production 사용 (usefulCode, favorableCode 등)
  - `role_profile_secondary`: 메타데이터 확장용 (T13/T14에서 참조 가능)
  - `role_profile_tertiary`: 추가 분석용 (향후 확장)
- **source-of-truth 정책 유지**: toC_yongsin_01 primary, findYong auxiliary로 명시적 분리

## 9. 호환성 커버리지 매트릭스 문서 생성

2026-03-08 기준 `docs/compatibility-coverage-matrix.md` 생성 완료:

- **목적**: PHP 원본 ↔ TS 구현 커버리지 현황 및 유지/폐기/보류 판단
- **범위**: 6개 패밀리(G/Y/T/S/F/J) 전체, 238개 테이블 행
- **판단 기준**: 남길 것 / 보류 / 접을 것 3분류
- **핵심 발견**:
  - `combinations.ts` 참조 ≠ 계산 로직 완료 (구분 필수)
  - G/Y 패밀리: legacyCompatibility에서 완전 구현 → 전량 남길 것 (23개)
  - S 패밀리: tableCatalog 등록(~43개)은 남길 것, combinations 참조만(~37개)은 보류
  - F 패밀리: F011만 활성, 나머지 10개 접을 것
  - J 패밀리: 9개 보류, 28개 접을 것 (대부분 TS 미참조)
  - 전체: 남길 것 ~70 / 보류 ~55 / 접을 것 ~64 (총 ~189개)

## Recommended Next Steps

실행 계획은 `docs/saju-core-maintenance-roadmap.md`에서 관리한다.

핵심 원칙:

- 복구 가능한 데이터와 계산식은 먼저 확보한다.
- 그 위에서 레거시 중간값을 의미 있는 key builder와 lookup module로 분리한다.
- `../saju-core-lib`를 정본으로 정리하고, 안정화 후 `next_mflow`로 포팅한다.

## Notes

- `next_mflow`와 `../saju-core-lib`는 현재 일부 수정이 양쪽에 분산되어 있으므로, 앞으로도 원본 수정 후 포팅 방식을 유지하는 편이 좋다.
- `.codex/`는 개발 도구 산출물이므로 관리 대상에서 제외한다.
