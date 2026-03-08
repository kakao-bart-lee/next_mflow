# toC_yongsin_01 vs find_yong() Cross-Validation

## Summary
- Tested: 5 일주(일간+월지)
- TS usefulCode source: `getElementRoleProfile(titleKey).usefulCode` (worktree 실행)
- PHP find_yong 판정: **현재 코드 그대로면 switch fall-through 발생**(break 부재)
- Match (단일값 기준): **0/5 확정 불가**
  - 이유: PHP 현재 구현은 `hyung`과 무관하게 마지막 `case 25` 분기로 덮어쓰기되며, 이 분기는 `inn/bi/sh/ja/inbi`(=연/월/시 오행관계 카운트)에 의존함.
  - 즉, TS의 2차원 키(`일간+월지`)만으로 PHP 단일 `$Y`를 고정할 수 없음.

## Inputs / Evidence

### PHP 결정 트리 핵심
- `find_yong()` 정의: `f_Saju.php:849`
- 십성 추출: `paljayuk[0..6]`, `paljayuk1[0..4]` (`f_Saju.php:853-912`)
- 카운트: `inn/bi/sh/ja/kw`, `inbi=inn+bi` (`f_Saju.php:916-958`)
- `hyung`(1~25) 계산: 월지십성그룹 × 일지십성그룹 (`f_Saju.php:964-1096`)
- Y/H 결정 switch: `f_Saju.php:1098-1883`
  - **case 1~25 사이 break 없음** → fall-through

### TS 조회 로직
- `getElementRoleProfile(titleKey)`는 `toC_yongsin_01`에서 `title===titleKey` 검색 후 `yo1` 기반 `usefulCode` 산출 (`elementRoleProfiles.ts:78-104`)
- 오행→코드 매핑: 木=1, 火=2, 土=3, 金/金=4, 水=5 (`elementRoleProfiles.ts:3-10`)

### 실행 증거 (TS)
실행 명령:
```bash
node --import tsx -e "import mod from './lib/saju-core/saju/elementRoleProfiles.ts'; const { getElementRoleProfile } = mod; const keys=['甲寅','丙卯','戊午','庚酉','壬子']; for (const key of keys){ const p=getElementRoleProfile(key); console.log(key, p.usefulCode, p.primary.usefulElement); }"
```

출력:
```text
甲寅 2 火
丙卯 5 水
戊午 5 水
庚酉 2 火
壬子 3 土
```

## Manual Trace (PHP) — 5 representative cases

수동 추적은 `F_re_yukchin()` 규칙(`common/function.php:115-220`)으로 월지/일지 십성군을 먼저 산출하고, `hyung`까지 계산했다.

### 1) 甲子일주 + 월지寅 (titleKey=甲寅)
- 월지 寅 vs 일간 甲 → 比肩(비겁군)
- 일지 子 vs 일간 甲 → 正印(인성군)
- `hyung=6` (비겁×인성)

### 2) 丙寅일주 + 월지卯 (titleKey=丙卯)
- 월지 卯 vs 일간 丙 → 正印(인성군)
- 일지 寅 vs 일간 丙 → 偏印(인성군)
- `hyung=1` (인성×인성)

### 3) 戊辰일주 + 월지午 (titleKey=戊午)
- 월지 午 vs 일간 戊 → 正印(인성군)
- 일지 辰 vs 일간 戊 → 比肩(비겁군)
- `hyung=2` (인성×비겁)

### 4) 庚申일주 + 월지酉 (titleKey=庚酉)
- 월지 酉 vs 일간 庚 → 劫財(비겁군)
- 일지 申 vs 일간 庚 → 比肩(비겁군)
- `hyung=7` (비겁×비겁)

### 5) 壬戌일주 + 월지子 (titleKey=壬子)
- 월지 子 vs 일간 壬 → 劫財(비겁군)
- 일지 戌 vs 일간 壬 → 偏官(관살군)
- `hyung=10` (비겁×관살)

## Why single PHP `$Y` cannot be fixed from (일간+월지)

현재 PHP 코드에서 `switch($hyung)`는 break가 없어 결국 `case 25`까지 연속 실행된다. 최종 `$Y`는 마지막 `case 25` 로직 결과가 된다.

`case 25`는 아래 카운트에 의존:
- `inn`, `bi`, `sh`, `ja`, `inbi=inn+bi`

이 카운트들은 `paljayuk1[0..4]` (년간/년지/월간/시간/시지)에서 계산되며,
**월지(`paljayuk[3]`)와 일지(`paljayuk[4]`)는 포함되지 않는다.**

따라서 같은 `titleKey(일간+월지)`라도 연/월간/시 구성에 따라 `$Y`가 달라질 수 있다.

추론 가능한 `case 25`의 `$Y` 가능 집합:
- `{1,3,4,5}` (코드 2는 불가능)

## Cross-Validation Table

| 일주(일간+월지) | PHP 추적 (월지/일지→hyung) | PHP `$Y` (현재 코드) | TS usefulCode | Match | 원인 분류 | Notes |
|---|---|---|---:|---|---|---|
| 甲子 + 寅 (甲寅) | 比肩/正印 → hyung=6 | `case25`에 의해 `{1,3,4,5}` | 2 | ❌ | 트리 다른 버전 | fall-through 상태에선 2 불가능 |
| 丙寅 + 卯 (丙卯) | 正印/偏印 → hyung=1 | `{1,3,4,5}` | 5 | ⚠️ 조건부 | 입력 형식 차이 | 특정 연/시 카운트에서만 5 가능 |
| 戊辰 + 午 (戊午) | 正印/比肩 → hyung=2 | `{1,3,4,5}` | 5 | ⚠️ 조건부 | 입력 형식 차이 | TS는 2차원 키, PHP는 8자+카운트 의존 |
| 庚申 + 酉 (庚酉) | 劫財/比肩 → hyung=7 | `{1,3,4,5}` | 2 | ❌ | 트리 다른 버전 | fall-through 상태에선 2 불가능 |
| 壬戌 + 子 (壬子) | 劫財/偏官 → hyung=10 | `{1,3,4,5}` | 3 | ⚠️ 조건부 | 입력 형식 차이 | `inn=0,bi=0,sh>=3`일 때 3 가능 |

## PHP Fall-through Analysis

- `switch($hyung)` (`f_Saju.php:1098`)의 모든 `case` 블록(1~25)에 `break`가 없다.
- 결과적으로 `hyung=1`이어도 2,3,...,25 로직을 모두 거쳐 최종값이 마지막 분기로 덮어씌워진다.
- 관찰 결과:
  - 의도적 패턴(누적 계산)으로 보기 어려움: 각 case는 독립적 대체 규칙 형태이며, 이전 결과를 명시적으로 참조/누적하지 않음.
  - 따라서 **버그 가능성이 매우 높음**.

판정: **intentional 보다는 bug 쪽으로 강하게 기움**.

## Conclusion for Tasks 7-8

1. 현재 PHP 원문 그대로 해석하면 TS `toC_yongsin_01`의 `usefulCode`와 직접 1:1 대응 검증이 성립하지 않는다.
2. 불일치 원인은 주로 다음 2개:
   - **트리 다른 버전**: TS는 break가 있는 정상 결정 트리(또는 사전 계산본) 기반일 가능성
   - **입력 형식 차이**: TS는 `(일간+월지)` 키, PHP는 실질적으로 연/월간/시 포함한 카운트 의존
3. 이번 5개 샘플에서 **테이블 오류**를 단정할 근거는 부족하다.
