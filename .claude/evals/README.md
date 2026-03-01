# Eval Harness — next-mflow (talelapse 사주 서비스)

Eval-Driven Development(EDD) 프레임워크입니다.
새 기능을 추가하거나 리팩토링 전에 eval을 먼저 정의하세요.

## 빠른 실행

```bash
# 전체 regression eval 실행 (가장 중요)
npm run test:run

# 특정 도메인만
npx vitest run __tests__/lib/saju-core/     # 사주 엔진
npx vitest run __tests__/lib/credit-service.test.ts  # 크레딧
npx vitest run __tests__/api/chat.test.ts   # AI 채팅

# 커버리지 리포트
npm run test:coverage

# E2E (개발 서버 필요)
npm run test:e2e
```

## Eval 파일 목록

| 파일 | 도메인 | 설명 |
|------|--------|------|
| `core-saju-engine.md` | 사주 엔진 | 천간지지·오행·십신 계산 정확성 |
| `credit-system.md` | 크레딧 | 과금 로직 안정성 |
| `ai-chat.md` | AI 채팅 | Mastra 에이전트 + 스트리밍 |
| `baseline.json` | — | 현재 통과 기준 스냅샷 |

## 새 기능 추가 시 워크플로

```
1. Define  → .claude/evals/{feature}.md 에 success criteria 작성
2. Implement → 코드 작성
3. Evaluate  → npx vitest run 으로 검증
4. Report   → pass@k 기록 후 baseline.json 업데이트
```

## Pass@k 기준

| 유형 | 기준 |
|------|------|
| Regression (기존 기능) | pass^3 = 100% (매번 통과) |
| Capability (신규 기능) | pass@3 > 90% |
| E2E (통합) | pass@1 > 80% |

## 현재 베이스라인 (2026-03-02)

- 단위 테스트: **53 / 53 PASS**
- Git SHA: `826f2f7`
- 다음 eval 대상: 채팅 세션 지속성, 궁합 API, 구독 자동 크레딧
