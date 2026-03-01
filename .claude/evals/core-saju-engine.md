# EVAL: core-saju-engine

> 사주 핵심 계산 엔진의 정확성과 안정성을 검증하는 eval입니다.
> 천간지지·오행·십신 계산은 비즈니스 핵심 로직이므로 회귀 테스트가 필수입니다.

---

## REGRESSION EVALS (기존 테스트)

기준점: `826f2f7` / 53 passed

| Test | Status | 파일 |
|------|--------|------|
| 갑자일주 계산 성공 | PASS | `__tests__/lib/saju-core/facade.test.ts` |
| 일주 천간/지지 한자 포함 문자열 반환 | PASS | |
| 오행 정보 유효값 반환 | PASS | |
| currentAge 파라미터 오류 없음 | PASS | |
| 잘못된 날짜 형식 → 에러 발생 | PASS | |
| 4개 기둥(년/월/일/시) 모두 포함 | PASS | |
| BirthInfoSchema 유효성 (14개) | PASS | `__tests__/lib/schemas/birth-info.test.ts` |

**Regression 목표**: `pass^k = 100%` (매번 통과 필수)

---

## CAPABILITY EVALS (신규 기능 시 추가)

### [CAPABILITY EVAL: saju-time-unknown]
Task: 시간 미상(isTimeUnknown=true)일 때 시주 없이도 3기둥 정상 계산
Success Criteria:
  - [ ] pillars.시 가 null 또는 undefined
  - [ ] pillars.년/월/일 은 정상 값
  - [ ] API 에러 없이 200 반환

### [CAPABILITY EVAL: gunghap-analysis]
Task: 두 사람의 사주로 궁합 점수 및 상세 분석 반환
Success Criteria:
  - [ ] 0~100 범위의 궁합 점수
  - [ ] 오행 균형 분석 포함
  - [ ] API `/api/saju/gunghap` 라우트 존재

---

## GRADER

```bash
# Code-based grader: 단위 테스트 통과 여부
cd /Users/bart/workspace/talelapse/next-mflow
npx vitest run __tests__/lib/saju-core/ __tests__/lib/schemas/ && echo "PASS" || echo "FAIL"
```

---

## 메트릭 기준

| 메트릭 | 목표 |
|--------|------|
| Regression pass^3 | 100% |
| Capability pass@3 | > 90% |
| 엔진 실행 시간 | < 100ms (갑자일주 기준) |
