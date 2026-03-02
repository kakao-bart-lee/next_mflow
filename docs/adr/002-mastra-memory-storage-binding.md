# ADR-002: Mastra Memory storage 연결 방식

- **날짜**: 2026-03-03
- **상태**: Accepted

## Context

`fortuneOrchestrator.generate()` 호출 시 다음 에러가 발생했다:

```
Error executing step workflow.execution-workflow.step.prepare-memory-step:
Error: Memory requires a storage provider to function.
Add a storage configuration to Memory or to your Mastra instance.
```

### 원인

Mastra `Agent`에 `Memory`가 설정되어 있어도, 에이전트가 **Mastra 인스턴스를 통해 등록**될 때만 `__registerMastra()`가 호출되어 storage가 연결된다.

```
new Mastra({ agents: { fortuneOrchestrator }, storage })
  └─ 내부적으로 각 agent.__registerMastra(mastra) 호출
       └─ agent.memory.setStorage(mastra.storage) 연결
```

`interpret-saju.ts`에서 `fortune-orchestrator.ts`를 **직접** import하면 Mastra 인스턴스 초기화 side effect가 발생하지 않아 `memory._storage = undefined` 상태로 실행된다.

```ts
// 문제: Mastra 인스턴스 bypass
import { fortuneOrchestrator } from "@/lib/mastra/agents/fortune-orchestrator"

// 해결: Mastra 인스턴스 초기화 포함
import { fortuneOrchestrator } from "@/lib/mastra"
```

### Mastra v1의 도메인 스토어 분리

Mastra v1에서 스토리지가 도메인별로 분리되었다:

| 클래스 | 역할 |
|--------|------|
| `LibSQLStore` | 범용 composite store (모든 도메인) — Mastra 인스턴스용 |
| `MemoryLibSQL` | Memory 도메인 전용 — Memory에 직접 전달할 때 사용 |

`Memory({ storage: LibSQLStore })`는 타입은 맞지만 Mastra 인스턴스 밖에서 사용하면 내부 `prepare-memory-step`이 실패한다.

## Decision

1. `fortune-orchestrator.ts`의 `Memory`에서 `storage` 파라미터를 제거한다 — Mastra 인스턴스의 storage를 상속받도록 위임
2. `interpret-saju.ts`에서 import 경로를 `@/lib/mastra`로 변경한다 — Mastra 인스턴스 초기화 side effect 포함

```ts
// fortune-orchestrator.ts
memory: new Memory({ options: { lastMessages: 20 } })
// storage 제거 → Mastra 인스턴스가 __registerMastra()로 자동 연결

// interpret-saju.ts
import { fortuneOrchestrator } from "@/lib/mastra"  // ← index.ts 경유
```

## Consequences

- Mastra 인스턴스에 등록된 에이전트는 반드시 `lib/mastra/index.ts`를 통해 import해야 한다
- 에이전트를 직접 파일 경로로 import하면 Memory storage가 연결되지 않아 런타임 에러 발생
- `lib/mastra/index.ts`가 모든 에이전트의 단일 진입점이 됨 (barrel export 역할)
- 순환 의존성 주의: `index.ts → agents/*.ts → index.ts` 구조는 금지
