# Saju Core Migration Handoff

**Last Updated**: 2026-03-08

## 목적

이 작업의 1차 목표는 기존 PHP 사주/궁합 결과를 TypeScript 환경에서 다시 맞추는 것이다.

단, 단순 재현만이 목적은 아니다. 현재 실제 기준은 아래 두 가지다.

1. 결과 정합성을 먼저 확보한다.
2. 동시에 provenance를 보존해, 나중에 구조를 더 세련되게 바꿀 수 있는 중간 상태를 만든다.

즉 지금 단계는 “PHP를 그대로 베끼는 것”이 아니라, “PHP와 대응관계를 잃지 않으면서 유지보수 가능한 경계로 재조립하는 것”이다.

## 작업 방식

실제 작업은 아래 사이클을 반복하는 방식으로 진행했다.

1. 원본 PHP 또는 SQL에서 source of truth를 확인한다.
2. 현재 TS 포트가 무엇을 잃었는지 구분한다.
3. 복원 대상이 아래 중 어디에 속하는지 먼저 판단한다.
   - SQL payload 유실
   - 단순 lookup key mismatch
   - helper/function 부재
   - synthetic narrative 조립 누락
4. 가능하면 `../saju-core-lib`를 먼저 정리한다.
5. 그 다음 `next_mflow`에 포팅한다.
6. 매 라운드마다 테스트와 타입체크를 돌린다.
7. 작은 단위로 커밋한다.

이 방식의 핵심은 “복구”와 “리팩터링”을 한 번에 하지 않고, 먼저 결과를 맞춘 뒤 helper 경계를 분리하는 데 있다.

## 저장소 역할

### 1. `../saju-core-lib`

정본 역할이다.

- helper 분리
- SQL 복원 스크립트
- raw data regeneration
- TS 계산 경계 정리

가능하면 여기서 먼저 수정하고, 이후 앱으로 포팅했다.

### 2. `next_mflow`

앱 통합 역할이다.

- `lib/saju-core` 포팅본 유지
- API route 연결
- UI 카드/화면 반영
- app-level regression test 유지

즉 upstream은 계산 정본, app은 소비자이자 통합 지점으로 다뤘다.

## 주요 원칙

### 1. provenance 우선

테이블 코드, PHP 파일, SQL dump의 출처를 끝까지 추적 가능하게 유지했다.

예:

- `G016`은 `gunghap_13 -> G016.php`
- `G033`은 SQL이 아니라 synthetic PHP scoring
- `J023`은 `S_J017_J030_sol2.php` + `J023.sql`

### 2. JSON은 손으로 고치지 않는다

`lib/saju-core/data/*.json`은 가능한 한 직접 편집하지 않고 upstream 스크립트로 재생성했다.

대표 스크립트:

- [restore_sql_table_fields.py](/Users/bclaw/workspace/moonlit/saju-core-lib/scripts/restore_sql_table_fields.py)

### 3. helper family로 올린다

레거시 값을 그대로 흩뿌리지 않고, family 단위 helper로 끌어올렸다.

이미 정리된 family:

- `genderedNarratives`
- `newYearSignals`
- `tojeongTrigrams`
- `juyeokTrigrams`
- `legacyCycles`
- `elementRoleProfiles`
- `yongsinFlows`
- `fortuneYearMarkers`
- `fortuneTimelineAnnotations`
- `legacyCompatibility`

### 4. modern engine은 보존한다

궁합의 경우 현대 `gunghap.ts` 점수 엔진은 그대로 두고, 레거시 PHP detail은 부가 섹션으로 붙였다.

즉 “기존 엔진 교체”가 아니라 “legacy detail bridge 추가” 방식으로 작업했다.

## 지금까지 복원한 범주

### 사주 core / profile 쪽

- `fortuneProfileResult` 포팅
- `fullText`, `briefText`, `oneLineSummary` 구조 포팅
- `basic` 호환성 수정
- `S081/S085/T022` 성별 컬럼 복원
- `S095~S110` 연운/토정 계열 복원
- `S126`, `J023`, `S144` 등 계산 경로 복원
- `ten_year_fortune_cycle` synthetic profile 추가
- marker/annotation 설명층 추가

### 궁합 compatibility 쪽

현재 앱에 붙은 legacy detail:

- `G001`
- `G003` (기본 궁합 성향): `buildLegacyBasicCompatibilityInsight` — 십이운성 기반
- `G004`
- `G005`
- `G006`
- `G007`
- `G012` (세부 궁합 분석): `buildLegacyDetailedCompatibilityInsight` — 일지 기반
- `G016`
- `G019` (별자리 궁합): `buildLegacyZodiacCompatibilityInsight` — 서양 별자리 기반
- `G020`
- `G022`
- `G023`
- `G024`
- `G026` (띠 궁합): `buildLegacyAnimalCompatibilityInsight` — 12×12 띠 조합 (역설계)
- `G028` (사상체질 궁합): `buildLegacySasangCompatibilityInsight` — 사상체질 pair 정규화
- `G030`
- `G031`
- `G032`
- `G033`
- `G034`
- `Y001`
- `Y003`
- `Y004`
- `T010`

대부분은 `legacyCompatibility.ts` 아래로 모였다.

## 검증 방식

매 사이클마다 아래 검증을 반복했다.

### 앱

- `pnpm exec vitest run __tests__/lib/saju-core/fortuneInterpreter.test.ts`
- `pnpm exec tsc --noEmit`

### upstream

- `pnpm exec tsc --noEmit -p /Users/bclaw/workspace/moonlit/saju-core-lib/tsconfig.json`

필요할 때 추가로 사용:

- `pnpm exec tsx /tmp/saju-profile-sweep.ts`
- `pnpm build`
- `python3 -m py_compile ...`

즉 기준은 항상 “원본 근거 확인 -> 구현 -> 테스트 -> 커밋” 순서였다.

## 자주 본 파일

### source

- `/Users/bclaw/workspace/moonlit/db/www/UNSE_DATA/solve`
- `/Users/bclaw/workspace/moonlit/db/www/_db1`

### upstream

- `/Users/bclaw/workspace/moonlit/saju-core-lib/ts-src/saju/legacyCompatibility.ts`
- `/Users/bclaw/workspace/moonlit/saju-core-lib/ts-src/saju/fortuneCalculatorBase.ts`
- `/Users/bclaw/workspace/moonlit/saju-core-lib/scripts/restore_sql_table_fields.py`

### app

- `/Users/bclaw/workspace/moonlit/next_mflow/lib/saju-core/saju/legacyCompatibility.ts`
- `/Users/bclaw/workspace/moonlit/next_mflow/app/api/saju/compatibility/route.ts`
- `/Users/bclaw/workspace/moonlit/next_mflow/components/saju/compatibility-screen.tsx`
- `/Users/bclaw/workspace/moonlit/next_mflow/__tests__/lib/saju-core/fortuneInterpreter.test.ts`

## Git 운용 방식

작게 나눠 커밋했다.

- upstream helper/복원 커밋
- app 통합 커밋

생성물은 제외했다.

- `tsconfig.tsbuildinfo`
- `.codex/`

또 `../saju-core-lib`의 unrelated 문서 수정은 건드리지 않았다.

## 남은 일

### 1. `find_yong()` deeper parity

PHP `find_yong()` 결정 트리를 `yongsinDecisionTree.ts`로 완전히 포팅했다.

- `findYong(input: YongsinDecisionInput): YongsinDecisionResult` — 메인 함수
- PHP fall-through 버그 수정 (break 추가)
- `toC_yongsin_01`과 병렬 경로 유지

이미 `S014` 경계와 `yongsinFlows` helper는 정리했지만, 이제 원본의 deeper role derivation을 완전히 domain model로 올린 상태다.

### 2. 남은 legacy synthetic family 탐색

이미 큰 축은 많이 흡수했지만, PHP gunghap 페이지 중 provenance가 분명한 synthetic summary가 더 있는지 계속 확인할 수 있다.

### 3. 이후 단계

이 작업이 어느 정도 닫히면 그 다음은 구조 개선 단계다.

- domain model 재명명
- table code를 adapter 뒤로 숨기기
- API/UI에서 레거시 코드 노출 축소

하지만 지금은 아직 이 단계가 아니다.

## 다음 사람이 이어받는 방법

1. `docs/saju-core-maintenance-roadmap.md`로 현재 우선순위를 확인한다.
2. `docs/saju-core-port-status.md`로 복원 상태를 확인한다.
3. 원본 PHP/SQL에서 source를 확인한다.
4. `../saju-core-lib`에서 helper 또는 복원 스크립트를 먼저 수정한다.
5. `next_mflow`로 포팅한다.
6. app test + 양쪽 타입체크를 통과시킨다.
7. 저장소별로 분리 커밋한다.

가장 중요한 기준은 이것이다.

`정답을 맞춘 뒤, 근거를 잃지 않은 상태로 helper 경계를 분리한다.`
