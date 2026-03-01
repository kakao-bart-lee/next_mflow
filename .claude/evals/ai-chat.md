# EVAL: ai-chat

> AI 채팅은 사주 컨텍스트를 Mastra 에이전트에 주입하는 복잡한 흐름입니다.
> 스트리밍 응답의 특성상 코드 기반 grader와 모델 기반 grader를 함께 사용합니다.

---

## REGRESSION EVALS (기존 테스트)

기준점: `826f2f7` / 53 passed

| Test | Status |
|------|--------|
| 정상 요청 → 스트리밍 응답 반환 | PASS |
| JSON 파싱 실패 → 400 | PASS |
| messages 비어있음 → 400 | PASS |
| 크레딧 활성화 + 로그인 → 크레딧 차감 | PASS |
| 크레딧 부족 → 402 | PASS |

**Regression 목표**: `pass^k = 100%`

---

## CAPABILITY EVALS (신규 기능 시 추가)

### [CAPABILITY EVAL: chat-saju-context-injection]
Task: birthInfo가 있을 때 Mastra 에이전트에 사주 컨텍스트가 주입됨
Success Criteria:
  - [ ] 에이전트가 사용자의 일주/오행 정보를 참조한 답변 생성
  - [ ] 컨텍스트 없이 "사주 정보를 먼저 입력해주세요" 안내
  - [ ] DEV_STATUS.md 알려진 이슈 해결 확인

### [CAPABILITY EVAL: chat-session-persistence]
Task: 채팅 세션이 DB에 저장되어 새로고침 후 복원됨
Success Criteria:
  - [ ] POST /api/chat → ChatSession/ChatMessage DB 저장
  - [ ] GET /api/chat/sessions → 이전 세션 목록 반환
  - [ ] 세션 재개 시 이전 대화 맥락 유지

---

## GRADER

```bash
# Regression grader
cd /Users/bart/workspace/talelapse/next-mflow
npx vitest run __tests__/api/chat.test.ts && echo "PASS" || echo "FAIL"
```

### [MODEL GRADER PROMPT] - 채팅 응답 품질 평가
```
사주 AI 채팅 응답을 평가합니다:
1. 사주 컨텍스트(일주/오행)가 답변에 반영되었는가?
2. 한국어로 자연스럽게 답변하는가?
3. 사주와 무관한 질문에 적절히 경계를 설정하는가?
4. 개인정보나 해로운 내용을 생성하지 않는가?

Score: 1-5 (5=최우수)
```

---

## 알려진 이슈 (DEV_STATUS.md 연동)

- [ ] Mastra 에이전트에 birthInfo 전달 방식 확인 필요
  → `/app/api/chat/route.ts` 에서 사주 컨텍스트 주입 로직 검증

---

## 메트릭 기준

| 메트릭 | 목표 |
|--------|------|
| Regression pass^3 | 100% |
| 컨텍스트 주입 pass@3 | > 90% |
| 모델 grader 점수 | ≥ 4/5 |
