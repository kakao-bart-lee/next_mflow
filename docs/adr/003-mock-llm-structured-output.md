# ADR-003: MOCK_LLM structured output 처리 방식

- **날짜**: 2026-03-03
- **상태**: Accepted

## Context

로컬 개발 환경에서는 `MOCK_LLM=true`를 기본으로 사용한다 (API 비용 절감, 빠른 UI 개발).

`MockLanguageModelV3`는 항상 `{}` 빈 객체를 반환하도록 설계되어 있다. 채팅 스트리밍(plain text)에서는 문제없지만, structured output을 요구하는 운세 해석 API(`/api/saju/interpret`)에서는 Zod schema 검증이 즉시 실패한다:

```
Error: Structured output validation failed
✖ Required → at theme
✖ Required → at days
✖ Required → at aiRecap
✖ Required → at prompt
details: { value: '{}' }
provider: 'mock-provider'
```

### SDK/프레임워크 레벨 해결책 부재

| 방법 | 가능 여부 | 이유 |
|------|-----------|------|
| `MockLanguageModelV3` schema 인식 | ❌ | schema-agnostic 설계 |
| Mastra `structuredOutput` 검증 skip | ❌ | 옵션 없음 |
| AI SDK experimental fallback | ❌ | mock에 적용 불가 |

`MockLanguageModelV3`는 AI SDK의 **LLM 레이어 단위 테스트**를 위한 도구다. Zod schema 검증은 그 위의 **비즈니스 로직 레이어**에서 발생하므로 mock이 이를 우회할 수 없다.

## Decision

`interpret-saju.ts`의 use-case 레이어에서 `MOCK_LLM=true`일 때 LLM 호출 전에 스키마를 만족하는 fixture 데이터를 즉시 반환한다.

```ts
// interpret-saju.ts
if (process.env.MOCK_LLM === "true") {
  const data =
    type === "daily"   ? MOCK_DAILY
    : type === "weekly"  ? buildMockWeekly(weekStartDate)
    : MOCK_DECISION;
  return { success: true, data } as InterpretResult<T>;
}
```

- `mock-model.ts` 변경 없음 — 원래 역할(LLM 레이어 테스트) 유지
- `fortuneOrchestrator.generate()` 호출 코드 변경 없음
- fixture 데이터는 `[MOCK]` 접두어로 시각적으로 구분

## Consequences

- `MOCK_LLM=true` 환경에서 운세 해석 API가 정상 응답 반환 (에러 없음)
- UI 개발 시 실제 LLM 없이 전체 플로우 테스트 가능
- fixture 데이터가 스키마 변경 시 함께 업데이트되어야 함 (`WeeklyFortuneSchema` 등 변경 시 `buildMockWeekly()` 등도 수정 필요)
- 실제 LLM 동작 테스트가 필요하면 서버 실행 시 `MOCK_LLM` 환경변수를 생략하거나 명시적으로 `false`로 설정:

```bash
# 실제 LLM으로 개발 서버 실행
SKIP_AUTH=true npm run dev -- --port 4830
```
