# Mastra Integration Dev Status

**Last Updated**: 2026-03-06

## Overview

Mastra AI Framework integration for moonlit/next_mflow. Provides agents, workflows, and memory-backed chat for 사주/점성술 consultation.

## Architecture

```
lib/mastra/
├── index.ts              # Mastra instance + exports
├── model.ts              # LLM model factory (OpenAI)
├── storage.ts            # PostgresStore for memory persistence
├── personas.ts           # Agent persona definitions
├── mock-model.ts         # MOCK_LLM support
├── context-bundles.ts    # Intent classification + context bundles
├── agents/
│   ├── chat-agent.ts         # General chat agent with memory
│   ├── saju-agent.ts         # Saju specialist agent
│   ├── saju-master-agent.ts  # Saju master (debate mode)
│   ├── astrologer-agent.ts  # Astrology specialist
│   └── fortune-orchestrator.ts # Supervisor agent
└── workflows/
    └── fortune-workflow.ts   # Context-bundled fortune workflow
```

## Components

### Context Bundles ✅

| Bundle | Keywords | Fields |
|--------|----------|--------|
| career | 이직, 직업, 재물, 커리어 | 十神, 대운, 세운, MC, house_2/6/10 |
| love | 연애, 결혼, 궁합, 관계 | 일지, house_7, Venus, Moon |
| timing | 타이밍, 삼재, 사업, 시기 | 대운, 세운, Dasha, Transit |
| selfcare | 우울, 자아, 심리, 성격 | 일간, 월지, 오행, ASC, Moon |

### Agents ✅

| Agent | Purpose | Model |
|-------|---------|-------|
| chatAgent | General chat with memory | MASTRA_ASTROLOGY_MODEL |
| sajuAgent | Saju interpretation | MASTRA_SAJU_MODEL |
| sajuMasterAgent | Saju master (debate) | MASTRA_SAJU_MODEL |
| astrologerAgent | Astrology interpretation | MASTRA_ASTROLOGY_MODEL |
| fortuneOrchestrator | Supervisor (delegates to sajuMaster + astrologer) | MASTRA_SAJU_MODEL |

### Workflows ✅

| Workflow | Status | Description |
|----------|--------|-------------|
| fortune-workflow | ✅ Complete | Intent classification → Context bundle → Data fetch → LLM response |

## API Integration

### `/api/chat` ✅

- **Fallback Mode**: `chatAgent.stream()` - General purpose streaming chat
- **Workflow Mode**: `runFortuneWorkflow()` - Intent-classified, context-bundled responses

**Trigger Conditions**:
- `context.birthInfo` must be present
- Intent confidence >= 0.5 (keyword matching)

**Response Headers**:
- `X-Workflow-Mode: true` - Indicates workflow mode
- `X-Bundle-Id: career|love|timing|selfcare` - Used context bundle

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...

# Optional - Mastra
MASTRA_SAJU_MODEL=gpt-4o-mini
MASTRA_ASTROLOGY_MODEL=gpt-4o-mini
MASTRA_STORAGE_ID=mastra-storage
MOCK_LLM=true
```

## Dependencies

- `@mastra/core`: ^1.8.0
- `@mastra/memory`: ^1.5.2
- `@mastra/pg`: ^1.7.0

## Notes

- Workflow uses `chatAgent.generate()` (non-streaming) internally
- Streaming is simulated by sending full response at once
- Future: Implement true streaming in workflow for better UX
