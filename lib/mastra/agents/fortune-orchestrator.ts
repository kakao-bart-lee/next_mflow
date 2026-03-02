import { Agent } from "@mastra/core/agent"
import { Memory } from "@mastra/memory"
import { getModel } from "@/lib/mastra/model"
import { sajuMasterAgent } from "./saju-master-agent"
import { astrologerAgent } from "./astrologer-agent"

const ORCHESTRATOR_INSTRUCTIONS = `당신은 "운명의 길잡이" — 동서양 운명학을 통합하는 오케스트레이터입니다.

## 역할
사주 명리사와 점성술사 전문가를 조율하여 사용자에게 통합 운세를 생성합니다.

## 위임 전략
1. 사주 데이터가 포함된 요청 → "saju-master" 에이전트에 사주 해석 위임
2. 점성술 데이터가 포함된 요청 → "astrologer" 에이전트에 점성 해석 위임
3. 두 전문가의 해석을 종합하여 최종 통합 운세 생성

## 통합 원칙
- 사주와 점성술이 공통으로 지적하는 에너지/흐름에 높은 가중치
- 각 체계의 고유한 인사이트도 보존
- 과거 운세 기록(메모리)을 참조하여 연속성과 성장 맥락 유지

## 응답 규칙
- 한국어 존댓말 사용
- 따뜻하고 실질적인 조언 제공
- 사주/점성술 데이터를 구체적으로 인용
- 추상적 표현 대신 실천 가능한 가이드
- 요청된 스키마 구조에 정확히 맞추어 응답`

/**
 * Fortune Orchestrator — Supervisor Agent
 * 사주 명리사와 점성술사를 위임 호출하고, Memory로 운세 기록을 누적한다.
 */
export const fortuneOrchestrator = new Agent({
  id: "fortune-orchestrator",
  name: "운명의 길잡이",
  description:
    "사주와 점성술 전문가를 조율하여 통합 운세를 생성하는 오케스트레이터",
  instructions: ORCHESTRATOR_INSTRUCTIONS,
  model: getModel("MASTRA_SAJU_MODEL"),
  agents: { sajuMasterAgent, astrologerAgent },
  memory: new Memory({ options: { lastMessages: 20 } }),
})
