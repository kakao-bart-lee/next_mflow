# find_yong 소비 구조 + Coverage 마감 + legacyCompatibility 분해

## TL;DR

> **Quick Summary**: 현대화 직전 3대 정리 작업 — findYong() dead code를 metadata에 연결하고, PHP 대비 커버리지 비교표를 만들고, 1,745줄 legacyCompatibility.ts를 6개 family 모듈로 분해한다.
> 
> **Deliverables**:
> - findYong() 결과(5 codes + 5 elements)가 S014 metadata에 보조 노출
> - secondary/tertiary ElementRoleSnapshot이 metadata에 확장 노출
> - 세 모듈(elementRoleProfiles, yongsinFlows, yongsinDecisionTree) 책임 경계 JSDoc 고정
> - `docs/compatibility-coverage-matrix.md` — PHP 테이블 코드 전수 매핑 + 남길 것/접을 것 판단
> - `legacyCompatibility/` 폴더 구조 (6 family 모듈 + barrel export)
> - 기존 146+ 테스트 전부 통과, tsc clean, build clean
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: T1 → T4 → T13 → T14

---

## Context

### Original Request
사용자가 요청한 3가지 작업:
1. **find_yong() 소비 경로 정리** — 세 모듈 책임 고정, decision tree 결과를 metadata에 보조 노출, secondary/tertiary 스냅샷 활성화
2. **compatibility coverage 마감** — PHP 화면 대비 커버리지 비교표 + 각 누락 항목에 "남길 것/접을 것" 판단 기준 문서화 (구현은 안 함)
3. **legacyCompatibility.ts 분해** — 1,745줄 파일을 family 단위로 분해 (폴더 + barrel export)

이 3가지가 끝나야 "진짜 현대화"로 넘어감.

### Interview Summary
**Key Discussions**:
- **용신 Source of Truth**: toC_yongsin_01 테이블이 정본. findYong()은 보조/비교용
- **findYong() 처분**: metadata에 보조 노출 (CalculationResult.metadata에 추가)
- **스냅샷 레이어**: secondary/tertiary를 metadata에 확장 노출
- **Coverage 범위**: 비교표 + 판단 기준 문서만 (T-code 등 누락 구현은 안 함)
- **분해 구조**: legacyCompatibility/ 폴더 + barrel export
- **테스트 전략**: Tests-after (기존 테스트 회귀 검증 후 필요시 추가)

**Research Findings**:
- findYong() (yongsinDecisionTree.ts:873)은 프로덕션 호출 0회 — 테스트에서만 사용
- findYong()의 yongToSipsin/yongChungan은 이미 S014 metadata에 존재하는 값과 동일 — 새 가치는 5 codes + 5 element labels뿐
- cross-validation 불일치: 5개 샘플 중 1개만 일치 (findYong vs toC_yongsin_01)
- legacyCompatibility.ts: 6개 family, 순환 의존 없음, 안전하게 분해 가능
- 기존 import 경로 소비자 3개: route.ts, fortuneInterpreter.test.ts, legacyGCodes.test.ts

### Metis Review
**Identified Gaps** (addressed):
- **메타데이터 노출 지점 갭**: CalculationResult.metadata는 FortuneResponse까지 자동 전파 안 됨 → Default 적용: buildS014Context()의 CalculationResult.metadata에 추가 (프론트엔드 전파는 현대화 단계)
- **findYong() 중복 필드**: yongToSipsin/yongChungan이 이미 metadata에 존재 → 5 codes + 5 elements만 추가, 중복 복제 금지
- **cross-validation 20% 일치율**: metadata에 source 라벨 필수 (`findYong_auxiliary` vs `toC_yongsin_01_primary`)
- **barrel 경로 유지**: legacyCompatibility.ts → legacyCompatibility/index.ts 전환 시 기존 import 유지 확인 필수
- **Task 순서**: Metis는 3→1→2 제안했으나, 실제로 3가지 작업은 독립적이므로 Wave 기반 병렬 실행으로 해결

---

## Work Objectives

### Core Objective
현대화 직전 3대 정리 작업을 완료하여, 이후 현대화 작업이 깨끗한 기반 위에서 진행될 수 있게 한다.

### Concrete Deliverables
- `lib/saju-core/saju/fortuneCalculatorBase.ts` — buildS014Context()에 findYong 보조 결과 + secondary/tertiary 스냅샷 추가
- `lib/saju-core/saju/yongsinDecisionTree.ts` — 모듈 책임 JSDoc 추가
- `lib/saju-core/saju/yongsinFlows.ts` — 모듈 책임 JSDoc 추가
- `lib/saju-core/saju/elementRoleProfiles.ts` — 모듈 책임 JSDoc 추가
- `docs/compatibility-coverage-matrix.md` — 전수 커버리지 비교표
- `lib/saju-core/saju/legacyCompatibility/` — 6 모듈 + barrel export
- `docs/saju-core-maintenance-roadmap.md` — 진행 상태 업데이트

### Definition of Done
- [x] `npx vitest run` — 146+ 테스트 전부 통과
- [x] `npx tsc --noEmit` — exit code 0
- [x] `npx next build` — exit code 0
- [x] findYong() 결과(5 codes + 5 elements)가 S014 CalculationResult.metadata에 존재
- [x] secondary/tertiary ElementRoleSnapshot이 metadata에 존재
- [x] `docs/compatibility-coverage-matrix.md` 존재, G/Y/T/S 코드 90+ 행
- [x] `legacyCompatibility/index.ts` barrel에서 39개 export 전부 re-export
- [x] 기존 `@/lib/saju-core/saju/legacyCompatibility` import 경로 변경 없음

### Must Have
- findYong()의 5 role codes + 5 element labels가 metadata에 노출
- secondary/tertiary snapshot이 metadata에 노출
- 세 모듈 책임 경계가 JSDoc으로 고정
- PHP 대비 커버리지 비교표 (Markdown)
- 비교표에 각 항목의 "남길 것/접을 것" 판단 + 근거
- legacyCompatibility.ts가 6개 family로 분해
- barrel export로 기존 import 경로 유지

### Must NOT Have (Guardrails)
- ❌ cross-validation 불일치 수정 (findYong vs toC_yongsin_01)
- ❌ FortuneResponse 스키마에 새 top-level 필드 추가 (ADR 없이)
- ❌ toC_yongsin_01의 primary source of truth 지위 변경
- ❌ findYong()의 내부 결정 로직(hyung 판정, Y/H derivation) 수정
- ❌ yongsinFlows의 기존 calculateYongToSipsin/calculateYongChungan 로직 수정
- ❌ 세 모듈의 기존 인터페이스 시그니처 변경
- ❌ 비교표에서 "접을 것"으로 판단한 항목을 실제 삭제
- ❌ 누락된 T-code 등의 실제 구현
- ❌ legacyCompatibility 분해 시 함수 시그니처/로직 변경
- ❌ legacyCompatibility 분해 시 새 helper 추가 또는 기존 helper 리팩토링
- ❌ findYong() metadata에 yongToSipsin/yongChungan 중복 노출 (이미 S014에 존재)
- ❌ AI slop: 과도한 주석, 불필요한 추상화, 제네릭 변수명

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (vitest)
- **Automated tests**: Tests-after (기존 회귀 검증 후 새 metadata 테스트 추가)
- **Framework**: vitest (bun test 호환)
- **Baseline**: 146+ 테스트 통과 + tsc clean + build clean

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **코드 변경**: Use Bash — vitest run, tsc --noEmit, next build
- **문서 작성**: Use Bash — grep for expected content, wc for line counts
- **모듈 분해**: Use Bash — ls for file structure, grep for import paths, vitest run

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation, 3 parallel):
├── Task 1: 세 모듈 책임 경계 JSDoc 고정 [quick]
├── Task 2: legacyCompatibility/ 폴더 구조 생성 + barrel [quick]
└── Task 3: PHP 테이블 코드 인벤토리 수집 [unspecified-low]

Wave 2 (After Wave 1 — core work, 4 parallel):
├── Task 4: findYong() + secondary/tertiary → metadata 연결 [deep] (depends: 1)
├── Task 5: legacyUtilities.ts 추출 [quick] (depends: 2)
├── Task 6: legacyDataReaders.ts 추출 [quick] (depends: 2)
└── Task 7: coverage 비교표 + 판단 기준 문서 작성 [writing] (depends: 3)

Wave 3 (After Wave 2 — family decomposition, 4 parallel):
├── Task 8: legacyBasicCompatibility.ts 추출 [quick] (depends: 5, 6)
├── Task 9: legacyTimingInsights.ts 추출 [quick] (depends: 5, 6)
├── Task 10: legacyZodiacInsights.ts 추출 [quick] (depends: 5, 6)
└── Task 11: legacySpouseInsights.ts 추출 [quick] (depends: 5, 6)

Wave 4 (After Wave 3 — finalization, 3 parallel):
├── Task 12: barrel 완전성 확인 + 원본 제거 [quick] (depends: 8-11)
├── Task 13: AGENTS.md + maintenance-roadmap.md 업데이트 [quick] (depends: 4, 12)
└── Task 14: 전체 회귀 검증 + tests-after [deep] (depends: 4, 12)

Wave FINAL (After ALL — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: T1 → T4 → T13 → T14 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 4 (Waves 2, 3)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 4 | 1 |
| 2 | — | 5, 6 | 1 |
| 3 | — | 7 | 1 |
| 4 | 1 | 13, 14 | 2 |
| 5 | 2 | 8, 9, 10, 11 | 2 |
| 6 | 2 | 8, 9, 10, 11 | 2 |
| 7 | 3 | — | 2 |
| 8 | 5, 6 | 12 | 3 |
| 9 | 5, 6 | 12 | 3 |
| 10 | 5, 6 | 12 | 3 |
| 11 | 5, 6 | 12 | 3 |
| 12 | 8, 9, 10, 11 | 13, 14 | 4 |
| 13 | 4, 12 | — | 4 |
| 14 | 4, 12 | — | 4 |
| F1-F4 | ALL | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **3** — T1 → `quick`, T2 → `quick`, T3 → `unspecified-low`
- **Wave 2**: **4** — T4 → `deep`, T5 → `quick`, T6 → `quick`, T7 → `writing`
- **Wave 3**: **4** — T8-T11 → `quick`
- **Wave 4**: **3** — T12 → `quick`, T13 → `quick`, T14 → `deep`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. 세 모듈 책임 경계 JSDoc 고정

  **What to do**:
  - `yongsinDecisionTree.ts` 파일 상단에 모듈-레벨 JSDoc 추가:
    - 책임: PHP find_yong() 포팅 — 팔자(八字) 분석 → 형(亨) 판정 → 용/희 결정 트리
    - 입력: 8개 pillar (yearStem~hourBranch)
    - 출력: 5 role codes + 5 element labels + yongToSipsin + yongChungan
    - Source of Truth 관계: "이 모듈의 결과는 보조용. 정본은 toC_yongsin_01 테이블 (elementRoleProfiles.ts 경유)"
    - cross-validation 불일치 사실 기록 (5개 중 1개 일치, 원인 미규명, 보고만)
  - `yongsinFlows.ts` 파일 상단에 모듈-레벨 JSDoc 추가:
    - 책임: 용신 코드 → 십신 변환, 천간 변환, 십이운성 계산
    - 소비자: fortuneCalculatorBase.ts (buildS014Context), yongsinDecisionTree.ts (findYong 내부)
    - Source of Truth: toC_yongsin_01 테이블의 usefulCode 기반
  - `elementRoleProfiles.ts` 파일 상단에 모듈-레벨 JSDoc 추가:
    - 책임: toC_yongsin_01 데이터 로드 → primary/secondary/tertiary ElementRoleSnapshot 생성 → 분류 함수 제공
    - 정본(正本): 이 모듈이 용신 데이터의 Source of Truth
    - primary: 현재 프로덕션 소비 중, secondary/tertiary: metadata 확장 노출 중 (Task 4에서 연결)

  **Must NOT do**:
  - 함수 시그니처 변경
  - 로직 변경
  - 새 함수 추가

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: JSDoc 주석 추가만, 3개 파일 상단에 블록 코멘트 작성
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `lib/saju-core/saju/genderedNarratives.ts:1-10` — 기존 helper 모듈의 JSDoc 스타일 참조
  - `lib/saju-core/saju/newYearSignals.ts:1-10` — 동일 패턴 JSDoc 스타일

  **API/Type References**:
  - `lib/saju-core/saju/yongsinDecisionTree.ts:10-34` — YongsinDecisionInput, YongsinDecisionResult 인터페이스
  - `lib/saju-core/saju/elementRoleProfiles.ts:12-44` — ElementRoleSnapshot, ElementRoleProfile 인터페이스
  - `lib/saju-core/saju/yongsinFlows.ts:1-92` — 전체 파일 (92줄, 3개 함수)

  **External References**:
  - `docs/saju-core-maintenance-roadmap.md:142-146` — S014 find_yong 관련 연구 노트

  **WHY Each Reference Matters**:
  - genderedNarratives/newYearSignals: 이 프로젝트의 모듈 JSDoc 컨벤션을 따르기 위함
  - 인터페이스들: JSDoc에 입출력 타입을 정확히 기술하기 위함
  - maintenance-roadmap: cross-validation 불일치, source of truth 관계를 정확히 기술하기 위함

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: JSDoc이 세 파일에 존재하고 책임 경계를 명시
    Tool: Bash (grep)
    Preconditions: Task 완료 후
    Steps:
      1. grep -c "@module" lib/saju-core/saju/yongsinDecisionTree.ts
      2. grep -c "@module" lib/saju-core/saju/yongsinFlows.ts
      3. grep -c "@module" lib/saju-core/saju/elementRoleProfiles.ts
      4. grep "Source of Truth" lib/saju-core/saju/yongsinDecisionTree.ts
      5. grep "정본" lib/saju-core/saju/elementRoleProfiles.ts
    Expected Result: 각 파일에 @module 1개 이상, "Source of Truth"/"정본" 키워드 존재
    Failure Indicators: grep 결과 0
    Evidence: .sisyphus/evidence/task-1-jsdoc-check.txt

  Scenario: 코드 변경 없음 확인
    Tool: Bash
    Preconditions: Task 완료 후
    Steps:
      1. npx tsc --noEmit
      2. npx vitest run __tests__/lib/saju-core/yongsinDecisionTree.test.ts
    Expected Result: tsc exit 0, 기존 테스트 전부 통과
    Failure Indicators: tsc 에러 또는 테스트 실패
    Evidence: .sisyphus/evidence/task-1-regression.txt
  ```

  **Commit**: YES (groups with 1)
  - Message: `docs(saju): add module responsibility JSDoc to yongsin modules`
  - Files: `yongsinDecisionTree.ts`, `yongsinFlows.ts`, `elementRoleProfiles.ts`
  - Pre-commit: `npx tsc --noEmit`

- [x] 2. legacyCompatibility/ 폴더 구조 생성 + barrel

  **What to do**:
  - `lib/saju-core/saju/legacyCompatibility/` 디렉토리 생성
  - 기존 `legacyCompatibility.ts`를 `legacyCompatibility/_legacy.ts`로 이동 (임시)
  - `legacyCompatibility/index.ts` barrel 파일 생성 — `_legacy.ts`에서 모든 39개 export를 re-export
  - **이 시점에서 vitest run 전체 실행** → 146+ 테스트 통과 확인 (barrel 경로 해결 검증)
  - 이 단계는 **순수 파일 이동 + barrel 생성만** — 아직 분할하지 않음

  **Must NOT do**:
  - 함수 로직 변경
  - export 시그니처 변경
  - 새 파일 생성 (index.ts, _legacy.ts 외)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 파일 이동 + barrel re-export 1개 작성
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `lib/saju-core/models/index.ts` — 이 프로젝트의 기존 barrel export 패턴 (selective re-export)
  - `lib/saju-core/index.ts` — 상위 레벨 barrel 패턴

  **API/Type References**:
  - `lib/saju-core/saju/legacyCompatibility.ts:1-10` — 현재 import 구조
  - `app/api/saju/compatibility/route.ts` — 소비자 #1 (21개 빌더 import)
  - `__tests__/lib/saju-core/legacyGCodes.test.ts:1-15` — 소비자 #2 (테스트 import)
  - `__tests__/lib/saju-core/fortuneInterpreter.test.ts` — 소비자 #3

  **WHY Each Reference Matters**:
  - models/index.ts: barrel 작성 컨벤션 확인
  - 소비자 3개: 이 파일들의 import 경로가 변경 없이 작동하는지 확인 필수

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: barrel 경로로 기존 import가 작동
    Tool: Bash
    Preconditions: 폴더 구조 생성 완료
    Steps:
      1. ls lib/saju-core/saju/legacyCompatibility/
      2. npx vitest run
      3. npx tsc --noEmit
    Expected Result: index.ts + _legacy.ts 존재, 146+ 테스트 통과, tsc clean
    Failure Indicators: import resolution 에러, 테스트 실패
    Evidence: .sisyphus/evidence/task-2-barrel-verify.txt

  Scenario: 소비자 import 경로 불변 확인
    Tool: Bash (grep)
    Preconditions: Task 완료 후
    Steps:
      1. grep "legacyCompatibility" app/api/saju/compatibility/route.ts
      2. grep "legacyCompatibility" __tests__/lib/saju-core/legacyGCodes.test.ts
    Expected Result: import 경로가 이전과 동일 (변경 없음)
    Failure Indicators: import 경로 변경됨
    Evidence: .sisyphus/evidence/task-2-import-unchanged.txt
  ```

  **Commit**: YES (groups with 2)
  - Message: `refactor(saju): create legacyCompatibility folder structure with barrel export`
  - Files: `legacyCompatibility/index.ts`, `legacyCompatibility/_legacy.ts`
  - Pre-commit: `npx vitest run`

- [x] 3. PHP 테이블 코드 인벤토리 수집

  **What to do**:
  - PHP 원본 경로 접근 확인: `ls /Users/bclaw/workspace/moonlit/db/www/UNSE_DATA/solve/`
  - PHP 소스에서 사용되는 모든 테이블 코드 추출 (G001~G034, Y001~Y004, T001~T063, S001~S110, F001~F011, J001~J010)
  - 접근 불가 시 대안: `lib/saju-core/saju/combinations.ts` + `legacyCompatibility.ts` + `dataLoader.ts`에서 사용되는 테이블 코드 목록 추출
  - 각 코드의 용도(한글명) 기록
  - 임시 인벤토리를 `.sisyphus/drafts/table-code-inventory.md`에 저장

  **Must NOT do**:
  - 코드 변경
  - 새 기능 구현

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 파일 읽기 + 목록 작성만, 로직 필요 없음
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `lib/saju-core/saju/combinations.ts` — 21개 fortune type의 S/F/J/T 코드 매핑
  - `lib/saju-core/saju/legacyCompatibility.ts` — G/Y/T 코드 reader 함수들 (readLegacyGxxxRecord 등)
  - `lib/saju-core/saju/tableCatalog.ts` — S코드 카탈로그 (S001~S110)

  **External References**:
  - `/Users/bclaw/workspace/moonlit/db/www/UNSE_DATA/solve/` — PHP 원본 (접근 가능 시)
  - `docs/saju-core-port-status.md` — 기존 포트 상태 문서

  **WHY Each Reference Matters**:
  - combinations.ts: S/F/J/T 코드의 정확한 목록 확보
  - legacyCompatibility.ts: G/Y/T 코드 목록 확보
  - PHP 원본: TS에는 없지만 PHP에는 있는 코드 발견

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 인벤토리가 G/Y/T/S 코드를 모두 포함
    Tool: Bash (grep)
    Preconditions: 인벤토리 작성 완료
    Steps:
      1. grep -c "^|" .sisyphus/drafts/table-code-inventory.md
      2. grep "G001" .sisyphus/drafts/table-code-inventory.md
      3. grep "S001" .sisyphus/drafts/table-code-inventory.md
      4. grep "T010" .sisyphus/drafts/table-code-inventory.md
    Expected Result: 행 수 80+, 각 코드 패밀리의 첫 항목 존재
    Failure Indicators: 행 수 부족, 특정 패밀리 누락
    Evidence: .sisyphus/evidence/task-3-inventory-check.txt
  ```

  **Commit**: NO (중간 산출물, Task 7에서 최종 문서화)

- [x] 4. findYong() + secondary/tertiary → S014 metadata 연결

  **What to do**:
  - `fortuneCalculatorBase.ts`의 `buildS014Context()` 메서드에서:
    1. `findYong()` 호출 추가 (YongsinDecisionInput을 기존 pillar 데이터에서 조립)
    2. findYong() 결과 중 **새 가치만** metadata에 추가:
       - `findYong_usefulCode`, `findYong_favorableCode`, `findYong_harmfulCode`, `findYong_adverseCode`, `findYong_reserveCode`
       - `findYong_usefulElement`, `findYong_favorableElement`, `findYong_harmfulElement`, `findYong_adverseElement`, `findYong_reserveElement`
       - `findYong_source: "auxiliary"` 라벨
    3. yongToSipsin/yongChungan은 **이미 존재하므로 중복 추가하지 않음**
    4. `role_profile_secondary`, `role_profile_tertiary`를 metadata에 추가 (기존 `role_profile_primary` 옆)
  - `yongsinDecisionTree.ts`에서 `findYong`을 import하는 경로 확인
  - **기존 S014 결과에 영향 없음을 검증**: 기존 metadata 필드는 그대로 유지

  **Must NOT do**:
  - findYong() 내부 로직 수정
  - 기존 calculateYongToSipsin/Chungan 호출 제거 또는 수정
  - FortuneResponse 스키마 변경
  - yongToSipsin/yongChungan 중복 추가
  - toC_yongsin_01 source of truth 변경

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: metadata 연결은 기존 흐름을 이해하고 정확히 삽입해야 함. buildS014Context()의 복잡한 컨텍스트 파악 필요
  - **Skills**: [`saju-debug`]
    - `saju-debug`: 사주 엔진 도메인 컨텍스트 로드 — 오행/십신 관련 버그 수정 전 반드시 필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: Tasks 13, 14
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `lib/saju-core/saju/fortuneCalculatorBase.ts:1558-1640` — buildS014Context() 메서드: 현재 metadata 생성 위치, `role_profile_primary` 추가 패턴
  - `lib/saju-core/saju/fortuneCalculatorBase.ts:1613-1615` — 기존 calculateYongToSipsin/Chungan/Woon12Daygi 호출 위치

  **API/Type References**:
  - `lib/saju-core/saju/yongsinDecisionTree.ts:10-34` — YongsinDecisionInput (8개 pillar 필드), YongsinDecisionResult (12 필드)
  - `lib/saju-core/saju/yongsinDecisionTree.ts:873-900` — findYong() 함수 시그니처와 반환값
  - `lib/saju-core/saju/elementRoleProfiles.ts:33-44` — ElementRoleProfile 인터페이스 (primary/secondary/tertiary)
  - `lib/saju-core/saju/elementRoleProfiles.ts:78-105` — getElementRoleProfile() — secondary/tertiary가 이미 로드되는 위치

  **Test References**:
  - `__tests__/lib/saju-core/yongsinDecisionTree.test.ts` — findYong() 호출 패턴
  - `__tests__/lib/saju-core/fortuneInterpreter.test.ts` — S014 컨텍스트 테스트 패턴

  **External References**:
  - `docs/saju-core-maintenance-roadmap.md:142-146` — S014 연구 노트, cross-validation 사실

  **WHY Each Reference Matters**:
  - fortuneCalculatorBase.ts:1558-1640: 정확한 삽입 위치 파악 (role_profile_primary 근처)
  - YongsinDecisionInput: findYong() 호출에 필요한 input 구조 확인 (pillar에서 추출 가능한지)
  - elementRoleProfiles.ts:78-105: secondary/tertiary가 이미 생성되는 곳 — metadata에 추가만 하면 됨
  - fortuneInterpreter.test.ts: 기존 S014 테스트가 깨지지 않는지 확인

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: findYong 보조 결과가 metadata에 존재
    Tool: Bash (vitest)
    Preconditions: Task 완료 후
    Steps:
      1. npx vitest run __tests__/lib/saju-core/fortuneInterpreter.test.ts
      2. grep "findYong" lib/saju-core/saju/fortuneCalculatorBase.ts
    Expected Result: 기존 테스트 통과 + findYong import/호출이 fortuneCalculatorBase에 존재
    Failure Indicators: 테스트 실패, findYong 참조 없음
    Evidence: .sisyphus/evidence/task-4-findyong-metadata.txt

  Scenario: secondary/tertiary 스냅샷이 metadata에 존재
    Tool: Bash (grep)
    Preconditions: Task 완료 후
    Steps:
      1. grep "role_profile_secondary" lib/saju-core/saju/fortuneCalculatorBase.ts
      2. grep "role_profile_tertiary" lib/saju-core/saju/fortuneCalculatorBase.ts
    Expected Result: 두 필드 모두 metadata 객체에 할당되는 라인 존재
    Failure Indicators: grep 결과 0
    Evidence: .sisyphus/evidence/task-4-snapshot-metadata.txt

  Scenario: 기존 S014 결과 불변
    Tool: Bash
    Preconditions: Task 완료 후
    Steps:
      1. npx vitest run
      2. npx tsc --noEmit
    Expected Result: 146+ 테스트 전부 통과, tsc clean
    Failure Indicators: 테스트 실패 또는 tsc 에러
    Evidence: .sisyphus/evidence/task-4-regression.txt

  Scenario: 중복 필드 없음 확인
    Tool: Bash (grep)
    Preconditions: Task 완료 후
    Steps:
      1. metadata 객체에서 yongToSipsin/yongChungan이 findYong_ 접두사로 중복 추가되었는지 확인
      2. grep -c "findYong_yongToSipsin\|findYong_yongChungan" lib/saju-core/saju/fortuneCalculatorBase.ts
    Expected Result: 0 (중복 없음)
    Failure Indicators: 1 이상 (중복 존재)
    Evidence: .sisyphus/evidence/task-4-no-duplicate.txt
  ```

  **Commit**: YES
  - Message: `feat(saju): expose findYong auxiliary + secondary/tertiary snapshots in S014 metadata`
  - Files: `fortuneCalculatorBase.ts`
  - Pre-commit: `npx vitest run && npx tsc --noEmit`

- [x] 5. legacyUtilities.ts 추출 (constants + helpers)

  **What to do**:
  - `legacyCompatibility/_legacy.ts`에서 다음을 `legacyCompatibility/legacyUtilities.ts`로 이동:
    - 모든 상수 (~줄 194-316): `BRANCH_INDEX`, `STEM_CODE_BY_KOREAN`, `FIVE_ELEMENT_FALLBACK`, `YEAR_ELEMENT_GROUPS`, `BRANCH_HARMONY_BY_KOREAN`, `HANJA_STEM_TO_KOREAN`, `HANJA_BRANCH_TO_KOREAN`, `SEXAGENARY_STEMS`, `SEXAGENARY_BRANCHES`, `SERIAL_TABLE_TITLES`, `STEMS_BY_ELEMENT`, `BRANCHES_BY_ELEMENT`, `STEM_HAP_PARTNER`, `BRANCH_HAP_PARTNER`, `BRANCH_CHUNG_PARTNER`
    - 모든 element/branch helpers (~줄 573-622, 698-799): `getYearBranchIndex`, `getDayBranchIndex`, `getStemElementLabel`, `getBranchElementLabel`, `normalizeElementLabel`, `getYearBranchCategory`, `rotateBranchForSamePair`, `resolveYearCodePair`, `resolveStemElement`, `resolveSpouseStarElement`, `resolveFiveElementByYearCode`, `resolveOuterCompatibilityElements`
    - 모든 sexagenary helpers (~줄 581-655): `getGregorianSexagenaryKey`, `getSexagenarySerial`, `resolveLunarYearGanji`
    - 모든 timezone helpers (~줄 530-571): `getCurrentMonthInTimezone`, `getCurrentYearInTimezone`, `getCurrentDayInTimezone`, `getCurrentMonthStemCode`
    - 복합 resolvers (~줄 657-696): `resolveLegacyRelationshipTimingTarget`
    - 기타: `toCalculationInput`, `adjustPartnerLifecycleStage`, `determineWesternZodiacName`, `normalizeSasangPair`, `SASANG_PRIORITY`
  - `_legacy.ts`에서 이동한 항목을 `legacyUtilities.ts`에서 import하도록 수정
  - barrel `index.ts`는 변경 불필요 (유틸은 내부 사용이므로 barrel에 노출하지 않아도 됨, 단 builder에서 import 필요한 것만 export)
  - `npx vitest run` 통과 확인

  **Must NOT do**:
  - 함수 로직 변경
  - 함수 시그니처 변경
  - 새 함수 추가
  - 외부 import 경로 변경

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 코드 이동만, 로직 변경 없음
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6, 7)
  - **Blocks**: Tasks 8, 9, 10, 11
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `lib/saju-core/saju/legacyCompatibility.ts:194-316` — 추출 대상 상수 블록
  - `lib/saju-core/saju/legacyCompatibility.ts:530-799` — 추출 대상 helper 함수 블록

  **WHY Each Reference Matters**:
  - 정확한 줄 범위를 알아야 이동 시 누락 없이 추출 가능

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: legacyUtilities.ts 존재 + 테스트 통과
    Tool: Bash
    Preconditions: 추출 완료
    Steps:
      1. test -f lib/saju-core/saju/legacyCompatibility/legacyUtilities.ts && echo EXISTS
      2. npx vitest run
      3. npx tsc --noEmit
    Expected Result: 파일 존재, 146+ 테스트 통과, tsc clean
    Failure Indicators: 파일 없음, 테스트 실패
    Evidence: .sisyphus/evidence/task-5-utilities-extract.txt
  ```

  **Commit**: NO (Task 12에서 일괄 커밋)

- [x] 6. legacyDataReaders.ts 추출 (18 readers)

  **What to do**:
  - `legacyCompatibility/_legacy.ts`에서 모든 `readLegacy*Record()` 함수를 `legacyCompatibility/legacyDataReaders.ts`로 이동:
    - `readLegacyG001Record`, `readLegacyG003Record`, `readLegacyG012Record`, `readLegacyG016Record`, `readLegacyG019Record`, `readLegacyG020Record`, `readLegacyG022Record`, `readLegacyG023Record`, `readLegacyG024Record`, `readLegacyG026Record`, `readLegacyG028Record`, `readLegacyG030Record`, `readLegacyG031Record`, `readLegacyG032Record`, `readLegacyG034Record`
    - `readLegacySerialRecord`, `readLegacyY001Record`, `readLegacyY003Record`, `readLegacyY004Record`, `readLegacyT010Record`
  - 모든 reader는 `getDataLoader()`만 의존 — 외부 import 1개만 필요
  - `_legacy.ts`에서 이동한 reader를 `legacyDataReaders.ts`에서 import
  - `npx vitest run` 통과 확인

  **Must NOT do**:
  - reader 로직 변경
  - 새 reader 추가
  - dataLoader import 방식 변경

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 코드 이동만, 단순 leaf 함수들
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7)
  - **Blocks**: Tasks 8, 9, 10, 11
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `lib/saju-core/saju/legacyCompatibility.ts:344-528` — 주요 reader 블록 (G001~Y004)
  - `lib/saju-core/saju/legacyCompatibility.ts:1430-1437` — G003 reader
  - `lib/saju-core/saju/legacyCompatibility.ts:1485-1492` — G012 reader
  - `lib/saju-core/saju/legacyCompatibility.ts:1563-1570` — G019 reader
  - `lib/saju-core/saju/legacyCompatibility.ts:1638-1645` — G026 reader
  - `lib/saju-core/saju/legacyCompatibility.ts:1709-1716` — G028 reader

  **WHY Each Reference Matters**:
  - reader들이 파일 전체에 흩어져 있음 (344~1716). 줄 범위를 정확히 알아야 누락 방지

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: legacyDataReaders.ts 존재 + 테스트 통과
    Tool: Bash
    Preconditions: 추출 완료
    Steps:
      1. test -f lib/saju-core/saju/legacyCompatibility/legacyDataReaders.ts && echo EXISTS
      2. npx vitest run __tests__/lib/saju-core/legacyGCodes.test.ts
      3. npx tsc --noEmit
    Expected Result: 파일 존재, G-code 테스트 통과, tsc clean
    Failure Indicators: 파일 없음, 테스트 실패
    Evidence: .sisyphus/evidence/task-6-readers-extract.txt
  ```

  **Commit**: NO (Task 12에서 일괄 커밋)

- [x] 7. compatibility coverage 비교표 + 판단 기준 문서 작성

  **What to do**:
  - Task 3의 인벤토리를 기반으로 `docs/compatibility-coverage-matrix.md` 작성
  - 구조:
    ```
    ## G-codes (궁합)
    | 코드 | 한글명 | PHP 존재 | TS 구현 | 상태 | 판단 | 근거 |
    |------|--------|---------|---------|------|------|------|
    | G001 | 결혼운 흐름 | ✅ | ✅ | 포팅 완료 | 남길 것 | 프로덕션 사용 중 |
    | G002 | ... | ✅ | ❌ | 미포팅 | 접을 것 | PHP에서도 비활성 |
    
    ## Y-codes, T-codes, S-codes, F-codes, J-codes — 동일 구조
    ```
  - 각 항목에 판단(남길 것/접을 것/보류) + 근거 1줄 이상
  - "접을 것" 근거 예: "PHP에서도 미사용", "데이터 테이블 없음", "중복 기능"
  - "보류" 근거 예: "현대화 시 통합 가능", "데이터는 있으나 소비자 없음"
  - 문서 말미에 요약 통계: `전체 N개 / 포팅됨 M개 / 미포팅 K개 / 접을 것 L개`

  **Must NOT do**:
  - 코드 변경
  - 누락 코드 실제 구현
  - "접을 것" 항목 삭제

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: 순수 문서 작성 작업
  - **Skills**: [`saju-debug`]
    - `saju-debug`: 사주 도메인 용어(G/Y/T/S 코드 의미)를 정확히 기술하기 위한 컨텍스트

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: None
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `docs/saju-core-port-status.md` — 기존 포트 상태 문서 (형식 참조)
  - `.sisyphus/drafts/table-code-inventory.md` — Task 3에서 생성한 인벤토리 (입력)

  **API/Type References**:
  - `lib/saju-core/saju/combinations.ts` — S/F/J/T 코드 매핑 (21개 fortune type)
  - `lib/saju-core/saju/legacyCompatibility.ts` — G/Y/T 코드 builder/reader 목록
  - `lib/saju-core/saju/tableCatalog.ts` — S코드 카탈로그

  **WHY Each Reference Matters**:
  - port-status.md: 문서 형식/톤 참조
  - combinations.ts + legacyCompatibility.ts: TS측 구현 상태의 정확한 근거
  - tableCatalog.ts: S코드의 entryId와 title 매핑

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 비교표가 충분한 행 수를 포함
    Tool: Bash
    Preconditions: 문서 작성 완료
    Steps:
      1. test -f docs/compatibility-coverage-matrix.md && echo EXISTS
      2. grep -c "^|" docs/compatibility-coverage-matrix.md
      3. grep -c "남길 것\|접을 것\|보류" docs/compatibility-coverage-matrix.md
    Expected Result: 파일 존재, 행 90+, 판단 컬럼에 키워드 50+
    Failure Indicators: 파일 없음, 행 수 부족, 판단 누락
    Evidence: .sisyphus/evidence/task-7-coverage-doc.txt

  Scenario: 요약 통계 존재
    Tool: Bash (grep)
    Preconditions: 문서 작성 완료
    Steps:
      1. grep "전체.*개" docs/compatibility-coverage-matrix.md
      2. grep "포팅됨\|미포팅\|접을 것" docs/compatibility-coverage-matrix.md
    Expected Result: 요약 통계 섹션 존재
    Failure Indicators: 통계 섹션 없음
    Evidence: .sisyphus/evidence/task-7-summary-stats.txt
  ```

  **Commit**: YES
  - Message: `docs(saju): add PHP compatibility coverage matrix with keep/retire decisions`
  - Files: `docs/compatibility-coverage-matrix.md`
  - Pre-commit: none (문서만)

- [x] 8. legacyBasicCompatibility.ts 추출

  **What to do**:
  - `_legacy.ts`에서 다음 builder + interface를 `legacyCompatibility/legacyBasicCompatibility.ts`로 이동:
    - `buildLegacyBasicCompatibilityInsight` (1439-1474)
    - `buildLegacyDetailedCompatibilityInsight` (1494-1553)
    - `buildLegacyTypeProfileInsight` (1013-1035)
    - `buildLegacyOuterCompatibilityInsight` (1037-1059)
    - `buildLegacyTraditionalCompatibilityInsight` (1061-1091)
    - 관련 interface 5개: `LegacyBasicCompatibilityInsight`, `LegacyDetailedCompatibilityInsight`, `LegacyTypeProfileInsight`, `LegacyOuterCompatibilityInsight`, `LegacyTraditionalCompatibilityInsight`
  - helper/reader는 `legacyUtilities.ts`/`legacyDataReaders.ts`에서 import
  - barrel `index.ts`에서 이 모듈의 export를 re-export
  - `npx vitest run` 통과 확인

  **Must NOT do**: 함수 로직/시그니처 변경, 새 함수 추가

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10, 11)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 5, 6

  **References**:
  - `lib/saju-core/saju/legacyCompatibility.ts:1013-1091, 1439-1553` — 추출 대상 builder 블록
  - `lib/saju-core/saju/legacyCompatibility/legacyUtilities.ts` — helper import 소스 (Task 5에서 생성)
  - `lib/saju-core/saju/legacyCompatibility/legacyDataReaders.ts` — reader import 소스 (Task 6에서 생성)

  **Acceptance Criteria**:

  ```
  Scenario: 파일 존재 + 테스트 통과
    Tool: Bash
    Steps:
      1. test -f lib/saju-core/saju/legacyCompatibility/legacyBasicCompatibility.ts && echo EXISTS
      2. npx vitest run
      3. npx tsc --noEmit
    Expected Result: 파일 존재, 전체 테스트 통과, tsc clean
    Evidence: .sisyphus/evidence/task-8-basic-extract.txt
  ```

  **Commit**: NO (Task 12에서 일괄)

- [x] 9. legacyTimingInsights.ts 추출

  **What to do**:
  - `_legacy.ts`에서 다음을 `legacyCompatibility/legacyTimingInsights.ts`로 이동:
    - `buildLegacyMarriageFlowInsight` (915-953)
    - `buildLegacyMarriageTimingTableInsight` (1245-1341)
    - `buildLegacyFutureSpouseInsight` (1190-1243)
    - `buildLegacyRelationshipTimingInsight` (1343-1367)
    - `buildLegacyYearlyLoveCycleInsight` (1369-1400)
    - `buildLegacyLoveWeakPointInsight` (1402-1419)
    - 관련 interface 6개
  - 외부 의존: `elementRoleProfiles` (getElementRoleProfile), `yongsinFlows` (calculateWoon12Daygi)
  - helper/reader는 `legacyUtilities.ts`/`legacyDataReaders.ts`에서 import
  - barrel `index.ts`에서 re-export
  - `npx vitest run` 통과 확인

  **Must NOT do**: 함수 로직/시그니처 변경, 새 함수 추가

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 10, 11)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 5, 6

  **References**:
  - `lib/saju-core/saju/legacyCompatibility.ts:915-953, 1190-1419` — 추출 대상 builder 블록
  - `lib/saju-core/saju/elementRoleProfiles.ts` — 외부 의존 (getElementRoleProfile)
  - `lib/saju-core/saju/yongsinFlows.ts` — 외부 의존 (calculateWoon12Daygi)

  **Acceptance Criteria**:

  ```
  Scenario: 파일 존재 + 테스트 통과
    Tool: Bash
    Steps:
      1. test -f lib/saju-core/saju/legacyCompatibility/legacyTimingInsights.ts && echo EXISTS
      2. npx vitest run
      3. npx tsc --noEmit
    Expected Result: 파일 존재, 전체 테스트 통과, tsc clean
    Evidence: .sisyphus/evidence/task-9-timing-extract.txt
  ```

  **Commit**: NO (Task 12에서 일괄)

- [x] 10. legacyZodiacInsights.ts 추출

  **What to do**:
  - `_legacy.ts`에서 다음을 `legacyCompatibility/legacyZodiacInsights.ts`로 이동:
    - `buildLegacyAnimalCompatibilityInsight` (1647-1679)
    - `buildLegacyZodiacCompatibilityInsight` (1598-1625)
    - `buildLegacySasangCompatibilityInsight` (1718-1745)
    - 타입 `SasangConstitution`
    - 관련 interface 3개
  - helper/reader는 `legacyUtilities.ts`/`legacyDataReaders.ts`에서 import
  - barrel `index.ts`에서 re-export
  - `npx vitest run` 통과 확인

  **Must NOT do**: 함수 로직/시그니처 변경, 새 함수 추가

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9, 11)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 5, 6

  **References**:
  - `lib/saju-core/saju/legacyCompatibility.ts:1563-1745` — 추출 대상 builder 블록

  **Acceptance Criteria**:

  ```
  Scenario: 파일 존재 + 테스트 통과
    Tool: Bash
    Steps:
      1. test -f lib/saju-core/saju/legacyCompatibility/legacyZodiacInsights.ts && echo EXISTS
      2. npx vitest run __tests__/lib/saju-core/legacyGCodes.test.ts
      3. npx tsc --noEmit
    Expected Result: 파일 존재, G-code 테스트 통과 (G019/G026/G028 포함), tsc clean
    Evidence: .sisyphus/evidence/task-10-zodiac-extract.txt
  ```

  **Commit**: NO (Task 12에서 일괄)

- [x] 11. legacySpouseInsights.ts 추출

  **What to do**:
  - `_legacy.ts`에서 다음을 `legacyCompatibility/legacySpouseInsights.ts`로 이동:
    - `buildLegacySpouseCoreInsight` (955-1011)
    - `buildLegacyPartnerRoleInsight` (1154-1188)
    - `buildLegacyPartnerPersonalityInsight` (1127-1152)
    - `buildLegacyDestinyCoreInsight` (1093-1125)
    - `buildLegacyIntimacyInsight` (821-852)
    - `buildLegacyLoveStyleInsight` (854-884)
    - `buildLegacyBedroomInsight` (886-913)
    - 관련 interface 7개
  - 외부 의존: `elementRoleProfiles` (getElementRoleProfile, classifyElementRoleLabel, classifyBranchRoleLabel), `yongsinFlows` (calculateWoon12Daygi), `../utils` (extractHanja, extractKorean)
  - helper/reader는 `legacyUtilities.ts`/`legacyDataReaders.ts`에서 import
  - barrel `index.ts`에서 re-export
  - `npx vitest run` 통과 확인

  **Must NOT do**: 함수 로직/시그니처 변경, 새 함수 추가

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9, 10)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 5, 6

  **References**:
  - `lib/saju-core/saju/legacyCompatibility.ts:821-1011, 1093-1188` — 추출 대상 builder 블록
  - `lib/saju-core/saju/elementRoleProfiles.ts` — 외부 의존 (3 함수)
  - `lib/saju-core/saju/yongsinFlows.ts` — 외부 의존
  - `lib/saju-core/utils.ts` — 외부 의존 (extractHanja, extractKorean)

  **Acceptance Criteria**:

  ```
  Scenario: 파일 존재 + 테스트 통과
    Tool: Bash
    Steps:
      1. test -f lib/saju-core/saju/legacyCompatibility/legacySpouseInsights.ts && echo EXISTS
      2. npx vitest run
      3. npx tsc --noEmit
    Expected Result: 파일 존재, 전체 테스트 통과, tsc clean
    Evidence: .sisyphus/evidence/task-11-spouse-extract.txt
  ```

  **Commit**: NO (Task 12에서 일괄)

- [x] 12. barrel 완전성 확인 + 원본 _legacy.ts 제거

  **What to do**:
  - `_legacy.ts`가 비어있는지 확인 (모든 코드가 family 모듈로 이동됨)
  - `_legacy.ts` 삭제
  - `index.ts` barrel에서 6개 모듈의 export를 모두 re-export하는지 확인
  - 39개 export가 모두 barrel에서 나오는지 검증 (lsp_symbols 또는 grep)
  - `npx vitest run` + `npx tsc --noEmit` + `npx next build` 전체 통과 확인
  - 소비자 3개의 import 경로가 변경되지 않았는지 확인:
    - `app/api/saju/compatibility/route.ts`
    - `__tests__/lib/saju-core/legacyGCodes.test.ts`
    - `__tests__/lib/saju-core/fortuneInterpreter.test.ts`

  **Must NOT do**: 새 export 추가, 함수 변경, 테스트 수정

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential after Wave 3)
  - **Blocks**: Tasks 13, 14
  - **Blocked By**: Tasks 8, 9, 10, 11

  **References**:
  - `lib/saju-core/saju/legacyCompatibility/index.ts` — barrel 파일
  - `app/api/saju/compatibility/route.ts` — 소비자 #1
  - `__tests__/lib/saju-core/legacyGCodes.test.ts` — 소비자 #2
  - `__tests__/lib/saju-core/fortuneInterpreter.test.ts` — 소비자 #3

  **Acceptance Criteria**:

  ```
  Scenario: _legacy.ts 제거됨 + barrel 완전성
    Tool: Bash
    Steps:
      1. test ! -f lib/saju-core/saju/legacyCompatibility/_legacy.ts && echo REMOVED
      2. ls lib/saju-core/saju/legacyCompatibility/
      3. grep -c "export" lib/saju-core/saju/legacyCompatibility/index.ts
    Expected Result: _legacy.ts 없음, 7개 파일(index + 6 family), re-export 6줄 이상
    Evidence: .sisyphus/evidence/task-12-barrel-complete.txt

  Scenario: 전체 회귀 통과
    Tool: Bash
    Steps:
      1. npx vitest run
      2. npx tsc --noEmit
      3. npx next build
    Expected Result: 146+ 테스트 통과, tsc clean, build clean
    Failure Indicators: 어떤 커맨드라도 실패
    Evidence: .sisyphus/evidence/task-12-full-regression.txt

  Scenario: 소비자 import 불변
    Tool: Bash (grep)
    Steps:
      1. grep "legacyCompatibility" app/api/saju/compatibility/route.ts
      2. grep "legacyCompatibility" __tests__/lib/saju-core/legacyGCodes.test.ts
    Expected Result: import 경로가 barrel 전과 동일
    Evidence: .sisyphus/evidence/task-12-import-check.txt
  ```

  **Commit**: YES
  - Message: `refactor(saju): decompose legacyCompatibility into family modules with barrel export`
  - Files: `legacyCompatibility/` 전체
  - Pre-commit: `npx vitest run && npx tsc --noEmit`

- [x] 13. AGENTS.md + maintenance-roadmap.md 업데이트

  **What to do**:
  - `lib/saju-core/AGENTS.md`의 STRUCTURE 섹션에서 `legacyCompatibility.ts` 항목을 `legacyCompatibility/` 폴더 구조로 업데이트
  - `docs/saju-core-maintenance-roadmap.md`에 진행 상태 추가:
    - Priority 3 아래에 "Post-Priority: 현대화 준비 정리" 섹션 추가
    - findYong() metadata 보조 노출 완료
    - secondary/tertiary 스냅샷 metadata 확장 완료
    - legacyCompatibility 분해 완료
    - compatibility coverage 비교표 작성 완료
    - cross-validation 불일치 현황 (보고만, 수정 안 함)
  - `docs/saju-core-port-status.md`에 이번 작업 완료 상태 반영

  **Must NOT do**: 코드 변경, 과도한 문서 확장

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 12, 14)
  - **Blocks**: None
  - **Blocked By**: Tasks 4, 12

  **References**:
  - `lib/saju-core/AGENTS.md` — 현재 STRUCTURE 섹션
  - `docs/saju-core-maintenance-roadmap.md` — 현재 Progress Notes
  - `docs/saju-core-port-status.md` — 현재 포트 상태

  **Acceptance Criteria**:

  ```
  Scenario: 문서가 현재 구조를 반영
    Tool: Bash (grep)
    Steps:
      1. grep "legacyCompatibility/" lib/saju-core/AGENTS.md
      2. grep "현대화 준비\|findYong.*metadata\|분해 완료" docs/saju-core-maintenance-roadmap.md
    Expected Result: 폴더 구조 참조 + 진행 상태 키워드 존재
    Evidence: .sisyphus/evidence/task-13-docs-update.txt
  ```

  **Commit**: YES
  - Message: `docs(saju): update AGENTS.md and maintenance roadmap for decomposition`
  - Files: `AGENTS.md`, `saju-core-maintenance-roadmap.md`, `saju-core-port-status.md`

- [x] 14. 전체 회귀 검증 + tests-after 테스트 추가

  **What to do**:
  - 전체 회귀 검증:
    - `npx vitest run` — 146+ 테스트 전부 통과
    - `npx tsc --noEmit` — exit code 0
    - `npx next build` — exit code 0
  - tests-after 테스트 추가:
    - findYong() metadata 도달 확인 테스트: S014 CalculationResult를 생성하고 metadata에 `findYong_usefulCode`, `findYong_usefulElement`, `role_profile_secondary`, `role_profile_tertiary`가 존재하는지 assert
    - barrel import 테스트: `legacyCompatibility/index.ts`에서 21개 builder를 import하는 smoke 테스트
  - Task 3의 중간 산출물 정리: `.sisyphus/drafts/table-code-inventory.md` 삭제

  **Must NOT do**: 기존 테스트 수정, 코드 로직 변경

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: metadata 흐름을 이해하고 정확한 테스트 작성 필요
  - **Skills**: [`saju-debug`]
    - `saju-debug`: S014 컨텍스트의 metadata 구조를 이해하기 위한 도메인 컨텍스트

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 12, 13)
  - **Blocks**: None
  - **Blocked By**: Tasks 4, 12

  **References**:
  - `__tests__/lib/saju-core/fortuneInterpreter.test.ts` — 기존 S014 테스트 패턴
  - `__tests__/lib/saju-core/yongsinDecisionTree.test.ts` — findYong 테스트 패턴
  - `__tests__/lib/saju-core/legacyGCodes.test.ts` — G-code builder 테스트 패턴
  - `lib/saju-core/saju/fortuneCalculatorBase.ts:1558-1640` — metadata 생성 위치

  **Acceptance Criteria**:

  ```
  Scenario: 전체 회귀 + 새 테스트 통과
    Tool: Bash
    Steps:
      1. npx vitest run
      2. npx tsc --noEmit
      3. npx next build
    Expected Result: 모든 테스트 통과 (기존 146 + 새 테스트), tsc clean, build clean
    Failure Indicators: 어떤 커맨드라도 실패
    Evidence: .sisyphus/evidence/task-14-final-regression.txt

  Scenario: metadata 테스트가 findYong 보조 결과를 검증
    Tool: Bash (grep)
    Steps:
      1. grep "findYong_usefulCode\|findYong_usefulElement" __tests__/lib/saju-core/
      2. grep "role_profile_secondary\|role_profile_tertiary" __tests__/lib/saju-core/
    Expected Result: 새 테스트 파일에 해당 assertion 존재
    Failure Indicators: assertion 없음
    Evidence: .sisyphus/evidence/task-14-metadata-test.txt
  ```

  **Commit**: YES
  - Message: `test(saju): add metadata exposure tests for findYong auxiliary output`
  - Files: 테스트 파일
  - Pre-commit: `npx vitest run`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: barrel import works + metadata contains findYong results + coverage doc exists. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `docs(saju): add module responsibility JSDoc to yongsin modules` — yongsinDecisionTree.ts, yongsinFlows.ts, elementRoleProfiles.ts
- **Wave 2 (T4)**: `feat(saju): expose findYong auxiliary + secondary/tertiary snapshots in S014 metadata` — fortuneCalculatorBase.ts
- **Wave 2 (T7)**: `docs(saju): add PHP compatibility coverage matrix with keep/retire decisions` — docs/compatibility-coverage-matrix.md
- **Wave 2-3 (T5-T12)**: `refactor(saju): decompose legacyCompatibility into family modules with barrel export` — legacyCompatibility/
- **Wave 4 (T13)**: `docs(saju): update AGENTS.md and maintenance roadmap for decomposition` — AGENTS.md, maintenance-roadmap.md
- **Wave 4 (T14)**: `test(saju): add metadata exposure tests for findYong auxiliary output` — test files

---

## Success Criteria

### Verification Commands
```bash
npx vitest run                    # Expected: 146+ tests pass
npx tsc --noEmit                  # Expected: exit code 0
npx next build                    # Expected: exit code 0
ls lib/saju-core/saju/legacyCompatibility/  # Expected: index.ts + 6 family files
grep -c "export" lib/saju-core/saju/legacyCompatibility/index.ts  # Expected: 6+
test -f docs/compatibility-coverage-matrix.md && echo OK  # Expected: OK
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] All tests pass
- [x] findYong auxiliary in metadata
- [x] secondary/tertiary in metadata
- [x] Coverage matrix complete
- [x] legacyCompatibility decomposed
- [x] Barrel export maintains import paths
