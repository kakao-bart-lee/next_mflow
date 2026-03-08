# Saju Core Maintenance Roadmap

**Last Updated**: 2026-03-08

## Current Progress

- `Priority 1`
  - semantic naming 정리 완료
  - `temp_03 -> currentYearStemCode/new_year_signal` 흐름 반영 완료
  - `cut_tot -> tojeongTrigramCompositeKey` 흐름 반영 완료
- `Priority 2`
  - `Gendered narrative tables` helper 분리 완료
  - `New year signal tables` helper 분리 완료
  - `Tojeong trigram tables` helper 분리 완료
- `Priority 3`
  - `S014` semantic role profile 경계 분리 및 `find_yong` 결정 트리 포팅 완료
  - `F_Juyeok_trigram` helper 분리 및 family 연결 완료
  - `F_woonday/F_ohengSearch` helper 분리 완료
  - `fortune year marker` rules 및 explanation helper 분리 완료
  - `ten_year_fortune_cycle` synthetic profile 조립 완료
  - `G003/G012/G019/G026/G028` 궁합 G-code 포팅 완료

## Goal

최종 목표는 `saju-core-lib` 내부의 opaque한 legacy 흐름을 유지보수 가능한 구조로 재배치하는 것이다.

대표 대상:

- `S081`, `S085`, `T022`처럼 “컬럼은 다르지만 의미는 같은 narrative lookup”
- `temp_03`처럼 source는 있으나 변수명만 봐서는 의미를 알기 어려운 중간값
- `cut_tot`처럼 실제로는 명확한 계산식이 있지만 key 이름이 의미를 숨기고 있는 값

핵심 방향은 “정답 유지”보다 “정답을 설명 가능한 구조로 재조립”하는 것이다.

## Why Now

현재 `next_mflow` 기준 profile sweep는 녹색이다. 즉 결과 정합성을 비교할 기준선이 이미 있다.

이 시점에서 필요한 것은 새 기능 추가보다 아래 작업이다.

- legacy PHP의 의미 불명 변수명을 도메인 개념으로 치환
- 계산 단계, lookup 단계, profile assembly 단계를 분리
- 복구 근거가 있는 데이터와 수식을 provenance와 함께 남기기

## Recommended Order

1. 리팩터링에 직접 필요한 누락 복구를 먼저 한다.
2. 그 위에서 계산 흐름을 key builder와 lookup module로 분리한다.
3. 마지막에 여전히 근거가 부족한 hard case를 따로 다룬다.

즉 순서는 아래와 같다.

`선복구 -> 구조 리팩터링 -> hard case 복구`

## Priority 1

### Legacy Symbol Map 정리

먼저 아래 중간값의 정체를 코드와 문서에 동시에 고정한다.

- `temp_03`
  - PHP 기준 현재 날짜의 `mansedata.year_h`
  - 유지보수 이름 후보: `currentYearStemCode`
- `cut_tot`
  - 토정비결용 `상괘-중괘-하괘` 3자리 composite key
  - 유지보수 이름 후보: `tojeongTrigramCompositeKey`
- `serial_no`
  - 테이블별 의미가 다르므로 공용명으로 두지 않고 table family별 serial로 분리
- `choie_data`
  - 성별/월별 컬럼 선택 결과
  - 유지보수 이름 후보: `selectedNarrativeColumn`

### 산출물

- legacy symbol map 문서
- 코드 내 helper/function 이름 정리
- public config에서 모호한 expression field 이름 제거

## Priority 2

### Table Family 기준 재구성

아래 table family를 공통 패턴으로 묶는다.

1. Gendered narrative tables
- `S081`, `S085`, `T022`

공통 구조:
- lookup key 계산
- 성별 컬럼 선택
- narrative text 추출

2. New year signal tables
- `S095`, `S097`, `S098`, `S099`, `S100`, `S101`

공통 구조:
- 현재 연간 코드 계산
- 일간/시간과 조합
- monthly or single-record text 조립

3. Tojeong trigram tables
- `S103`, `S104`, `S106`, `S107`, `S108`, `S109`, `S110`

공통 구조:
- 현재 생일 기준 간지 보정
- `상괘-중괘-하괘` key 생성
- table lookup

### 산출물

- family별 key builder module
- family별 lookup adapter
- calculator factory는 조립 역할만 담당

### Progress Notes

- `Gendered narrative tables`
  - `genderedNarratives.ts`로 분리 완료
- `New year signal tables`
  - `newYearSignals.ts`로 분리 완료
- `Tojeong trigram tables`
  - `tojeongTrigrams.ts`로 분리 완료
  - `fortuneCalculatorBase`의 `calculateTojeongCutTotExpression` 본문 제거 후 helper 호출 형태로 전환 완료

## Priority 3

### Hard Case 분리

아래 항목은 별도 연구 대상으로 다룬다.

- `F_Juyeok_trigram`
- `F_woonday`
- `F_ohengSearch`
- `yong/hee/kee/goo` pipeline

여기서 앞의 세 family는 “hard case 연구”에서 “공통 helper로 승격 완료” 단계로 올라왔다. `yong/hee/kee/goo`의 deeper parity(find_yong 결정 트리) 포팅이 완료되었으며, 이제 실질적인 잔여 작업은 필요시 장문 설명층의 추가 확장이다.

이 그룹은 계산 로직 복원이 우선이며, 의미 있는 명칭 재배치는 그 다음 단계다.

### Current Research Notes

- `S014`
  - 전체 `find_yong()` 포팅 완료 (`yongsinDecisionTree.ts`)
  - PHP 원본의 fall-through 버그 수정 및 정합성 확보
  - `용신/희신/기신/구신`을 semantic role profile로 분리하고, 현재 운세 분류는 `supportive/adverse/neutral` bucket으로 다루는 경계가 적절하다.
  - 참조:
    - `/Users/bclaw/workspace/moonlit/db/www/UNSE_DATA/solve/f_Saju.php`
    - `/Users/bclaw/workspace/moonlit/db/www/_db2/toC_yongsin_01.sql`
- `F_Juyeok_trigram`
  - `juyeokTrigrams.ts`로 helper 분리 완료
  - 관련 family는 `F011`, `T039`, `J004`, `J005`, `J009`, `J010`
- `F_woonday` / `F_ohengSearch`
  - `legacyCycles.ts`로 helper 분리 완료
  - 현재 `S007/S008` 계열에서 shared helper 사용 중
- `fortune year markers`
  - `fortuneYearMarkers.ts`로 helper 분리 완료
  - 현재 `천덕귀인`, `월덕귀인`, `천덕합`, `월덕합`, `생기`, `천의` 지원
  - marker별 `briefText`와 `fullText`를 제공
  - `greatFortuneProfiles.ts`의 synthetic `ten_year_fortune_cycle` 경로와 연결 완료
  - `fortuneTimelineAnnotations.ts`로 `양인`, `공망`, `십이신살` 설명층까지 확장

## Recent Improvement Slice

이번 개선 라운드에서 정리된 내용:

1. `greatFortune` raw summary를 그대로 보여주던 경로를 synthetic `ten_year_fortune_cycle` profile로 대체
2. `fortune year marker` 규칙을 계산과 설명으로 나눠 helper화
3. `oneLineSummary`에는 compact insight를 유지
4. `fullText`에는 `연도별 표식 해설`을 붙여 실제 marker가 뜨는 연도와 장문 해설을 연결
5. timeline에 함께 노출되는 `양인`, `공망`, `십이신살`도 같은 explanation layer로 흡수
6. `S014`는 source row provenance를 남겨, 현재 남은 잔여 hard case가 role derivation인지 role consumption인지 구분 가능하게 정리

즉 이제 `ten_year_fortune_cycle`은 “계산 결과를 나열하는 표”가 아니라 “10년 창의 흐름과 표식 의미를 함께 설명하는 profile”로 바뀌었다.

## First Execution Slice

이번 라운드의 시작점은 아래다.

1. `saju-core-lib`에 `temp_03` 계열을 `new_year_signal/current_year_stem` 개념으로 포팅
2. `S081`, `S085`, `T022`의 모호한 expression field 이름을 의미 있는 이름으로 교체
3. 회귀 테스트로 “이름은 바뀌어도 결과는 유지”를 고정

## Source of Truth

- 정본 구현: `../saju-core-lib`
- 앱 통합 포팅: `next_mflow`
- 참조 원본: `/Users/bclaw/workspace/moonlit/db/www/UNSE_DATA/solve` 및 `/Users/bclaw/workspace/moonlit/db/www/_db1`

## Validation Rule

리팩터링 중에는 아래 조건을 모두 만족해야 한다.

- profile output은 기존과 동일하거나 더 설명 가능해야 한다.
- intermediate key는 계산 근거를 코드에서 추적할 수 있어야 한다.
- 가능한 경우 PHP reference와 JSON payload provenance를 함께 남긴다.

## Post-Priority: 현대화 준비 정리

Priority 1-3 완료 후 추가 정리 작업 상태:

### 완료 항목 (5개)

1. **findYong metadata auxiliary 노출 완료**
   - `yongsinDecisionTree.ts`에 @module JSDoc 추가
   - S014 컨텍스트에서 `findYong_*` 보조 필드 연결
   - source-of-truth 경계 명시 (primary: toC_yongsin_01, auxiliary: findYong)

2. **role_profile_secondary/tertiary metadata 확장 완료**
   - `elementRoleProfiles.ts`에서 3단계 스냅샷 생성 (primary/secondary/tertiary)
   - S014 metadata에 secondary/tertiary 노출
   - 후속 단계(T13/T14)에서 직접 참조 가능

3. **legacyCompatibility 분해 완료**
   - `_legacy.ts` 제거, 4개 패밀리 모듈로 완전 분해
   - legacySpouseInsights.ts (7 builders)
   - legacyTimingInsights.ts (6 builders)
   - legacyZodiacInsights.ts (3 builders)
   - legacyBasicCompatibility.ts (5 builders)
   - 지원 모듈: legacyDataReaders.ts (18 readers), legacyUtilities.ts (39 constants + helpers)

4. **compatibility-coverage-matrix.md 작성 완료**
   - 6개 패밀리(G/Y/T/S/F/J) 전체 커버, 238개 테이블 행
   - 판단 키워드: 남길 것 / 보류 / 접을 것 3분류
   - `combinations.ts` 참조 ≠ 계산 로직 완료 구분 명시

5. **cross-validation 불일치 보고-only 상태 명시**
   - yongsinDecisionTree.ts: 5 샘플 중 1 일치, 원인 미파악
   - 수정 미진행 (report-only, 향후 조사 대상)
