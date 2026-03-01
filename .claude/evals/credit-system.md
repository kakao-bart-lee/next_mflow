# EVAL: credit-system

> 크레딧 시스템은 과금의 핵심입니다. 잔액 차감·충전·부족 처리에서
> 버그가 발생하면 수익에 직접 영향을 미칩니다.

---

## REGRESSION EVALS (기존 테스트)

기준점: `826f2f7` / 53 passed

| Test | Status |
|------|--------|
| CREDIT_COSTS.사주분석 = 2 | PASS |
| CREDIT_COSTS.채팅메시지 = 1 | PASS |
| isCreditEnabled() - 환경변수별 동작 | PASS (2개) |
| getBalance() - 레코드 있음/없음 | PASS (2개) |
| consumeCredit() - 잔액 충분/부족/0이하 | PASS (3개) |
| addCredit() - 추가 성공/0이하 에러 | PASS (2개) |
| analyzeSaju use-case - 크레딧 차감 시나리오 | PASS (7개) |
| API - 크레딧 부족 402 반환 | PASS |
| API - 관리자 크레딧 지급/차감 | PASS (6개) |

**Regression 목표**: `pass^k = 100%`

---

## CAPABILITY EVALS (신규 기능 시 추가)

### [CAPABILITY EVAL: subscription-auto-credit]
Task: 구독 갱신 시 플랜별 크레딧 자동 지급 (베이직=50, 프리미엄=200)
Success Criteria:
  - [ ] 갱신 날짜에 정확한 크레딧 지급
  - [ ] 이전 잔여분에 누적 (덮어쓰기 금지)
  - [ ] 트랜잭션 로그 기록

### [CAPABILITY EVAL: credit-history]
Task: 사용자별 크레딧 사용 내역 조회 API
Success Criteria:
  - [ ] GET /api/credits/history 응답 200
  - [ ] 사용 유형(분석/채팅/충전/관리자지급) 구분
  - [ ] 페이지네이션 지원 (limit/offset)

---

## GRADER

```bash
# Regression grader
cd /Users/bart/workspace/talelapse/next-mflow
npx vitest run __tests__/lib/credit-service.test.ts __tests__/lib/use-cases/ __tests__/api/admin.test.ts && echo "PASS" || echo "FAIL"

# Edge case: ENABLE_CREDIT_SYSTEM 환경변수 체크
grep -q "ENABLE_CREDIT_SYSTEM" lib/credit-service.ts && echo "환경변수 게이팅 존재: PASS" || echo "FAIL"
```

---

## 메트릭 기준

| 메트릭 | 목표 |
|--------|------|
| Regression pass^3 | 100% |
| 크레딧 차감 원자성 | DB 트랜잭션 보장 |
| 과차감 허용 | 절대 불가 (잔액 < 0 방지) |
