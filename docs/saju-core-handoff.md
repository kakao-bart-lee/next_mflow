# Saju Core Migration Handoff

**Last Updated**: 2026-03-08
**Phase 3 Status**: ✅ 완료 (결정 트리 + G-code 궁합 5종)

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

## Phase 3 완료 내역 (2026-03-08)

### Track A: find_yong() 결정 트리 포팅

PHP `f_Saju.php:849-2687`의 `find_yong()` 함수를 `yongsinDecisionTree.ts`(912줄)로 완전히 포팅했다.

핵심 발견사항:
- PHP 원본에 `switch($hyung)` fall-through 버그가 있었다 (25개 case에 break 없음)
- TS 포팅 시 break를 추가하여 버그를 수정했다
- `toC_yongsin_01` lookup 테이블과의 교차 검증에서 불일치가 발생하는데, 이는 PHP 버그로 인한 예상된 결과이다
- 기존 `toC_yongsin_01` lookup 경로는 그대로 유지하고 병렬 경로로 추가했다

산출물:
- `lib/saju-core/saju/yongsinDecisionTree.ts` — 메인 결정 트리 (findYong 함수)
- `__tests__/lib/saju-core/yongsinDecisionTree.test.ts` — 10개 테스트

### Track B: 레거시 G-code 궁합 5종 포팅

5개의 G-code 빌더를 `legacyCompatibility.ts`에 추가했다.

| G-code | 함수 | 설명 | 키 형식 |
|--------|------|------|---------|
| G003 | `buildLegacyBasicCompatibilityInsight` | 십이운성 기반 기본 궁합 | "01"-"12" (패딩) |
| G012 | `buildLegacyDetailedCompatibilityInsight` | 일지 기반 세부 궁합 | "51"-"512" ("5"+index) |
| G019 | `buildLegacyZodiacCompatibilityInsight` | 서양 별자리 궁합 | 한글 별자리명 |
| G026 | `buildLegacyAnimalCompatibilityInsight` | 12×12 띠 궁합 (역설계) | (primary-1)*12+partner |
| G028 | `buildLegacySasangCompatibilityInsight` | 사상체질 궁합 | 10개 대칭 키 (ty,sy,tu,su) |

추가 변경:
- `lib/schemas/birth-info.ts`에 `sasangConstitution` 필드 추가 (ty/sy/tu/su)
- `app/api/saju/compatibility/route.ts`에 5개 insight 엔드포인트 연결
- `components/saju/compatibility-screen.tsx`에 사상체질 선택 UI + 5개 insight 카드 추가

산출물:
- `__tests__/lib/saju-core/legacyGCodes.test.ts` — 21개 테스트

### 커밋 이력 (8 commits)

| 커밋 | 메시지 |
|------|--------|
| `30a611b` | feat(saju): add legacy G003/G012/G019/G026 compatibility insights |
| `42e7006` | feat(saju): add legacy G028 sasang compatibility insight with pair normalization |
| `85aa784` | feat(saju): add sasangConstitution to BirthInfoSchema |
| `e41adf5` | feat(saju): port find_yong decision tree from PHP |
| `0518ce2` | feat(saju): wire all new G-code insights to compatibility API and add sasang UI |
| `94271c1` | test(saju): add decision tree cross-validation and G-code builder tests |
| `9a48cc2` | feat(saju): render new G-code insights in compatibility screen |
| `8b87e74` | docs(saju): update handoff, port-status, and roadmap for decision tree and G-codes |

### 검증 결과

- TypeScript: `npx tsc --noEmit` → 0 errors
- 테스트: 275 passed (32 test files), 0 failed
- 금지 패턴 없음: `as any`, `@ts-ignore`, `@ts-expect-error` 사용하지 않음
- 데이터 파일 미변경: `lib/saju-core/data/` 변경 없음
- `yongsinFlows.ts` 미변경

## 남은 일

이번 Phase 3에서 명시적으로 제외한 항목:

- T-code (T013~T063) 포팅
- Secondary/tertiary snapshot 소비
- Narrative explanation 생성
- `LegacyInsightCard` 컴포넌트 추출 (기술 부채)
- `readLegacyG0xxRecord` DRY 리팩터 (기술 부채)

이후 단계는 구조 개선이다:
- domain model 재명명
- table code를 adapter 뒤로 숨기기
- API/UI에서 레거시 코드 노출 축소

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
