import { Agent } from "@mastra/core/agent"
import type { AstrologyStaticResult } from "@/lib/astrology/static/types"
import type { DebatePhase } from "./saju-master-agent"
import { ASTROLOGER_PERSONA } from "@/lib/mastra/personas"
import { getModel } from "@/lib/mastra/model"

export { ASTROLOGER_PERSONA }

/**
 * 점성술사 에이전트 — stateless 전문가
 * 오케스트레이터(fortuneOrchestrator) 또는 토론 오케스트레이터(run-debate.ts)에 의해 호출.
 */
export const astrologerAgent = new Agent({
  id: "astrologer",
  name: "점성술사",
  description: "행성 배치와 하우스를 분석하여 점성술적 운세를 해석하는 전문가",
  instructions: ASTROLOGER_PERSONA,
  model: getModel("MASTRA_ASTROLOGY_MODEL"),
})

/**
 * 점성술사의 턴별 컨텍스트 빌더
 * - initial: 점성술 데이터 기반 초기 해석
 * - rebuttal: 사주 명리사 해석에 대한 반론/동의/보완
 */
export function buildAstrologerContext(
  astrologyResult: AstrologyStaticResult,
  phase: DebatePhase,
  opponentText?: string,
): string {
  const lines: string[] = []

  // 행성 배치
  lines.push("## 행성 배치")
  const positions = astrologyResult.positions
  for (const planetId of astrologyResult.ranking) {
    const pos = positions[planetId]
    if (!pos) continue
    lines.push(
      `- ${pos.planet}: ${pos.signLabel}(${pos.sign}) ${pos.degreeInSign.toFixed(1)}°` +
      (pos.house ? ` [${pos.house}H]` : ""),
    )
  }

  // 주야 차트
  lines.push(`\n## 차트 유형: ${astrologyResult.isDayChart ? "주간 차트(Day Chart)" : "야간 차트(Night Chart)"}`)

  // 행성 영향력 랭킹
  lines.push(`\n## 행성 영향력 (finalScore 순)`)
  for (const planetId of astrologyResult.ranking) {
    const inf = astrologyResult.influences[planetId]
    if (!inf) continue
    lines.push(`- ${inf.planet}: ${inf.finalScore.toFixed(1)}점 — ${inf.interpretation}`)
  }

  // 오늘의 통찰
  const today = astrologyResult.today
  lines.push(`\n## 오늘의 점성술 통찰`)
  lines.push(`- 지배 행성: ${today.dominantPlanet}`)
  lines.push(`- 헤드라인: ${today.headline}`)
  lines.push(`- 요약: ${today.summary}`)
  if (today.tags.length > 0) lines.push(`- 태그: ${today.tags.join(", ")}`)

  // 입력 등급
  lines.push(`\n## 데이터 정확도: ${astrologyResult.assumptions.inputGrade} (시간 정밀도: ${astrologyResult.assumptions.timeAccuracy})`)

  // Phase별 지시
  if (phase === "initial") {
    lines.push("\n위 점성술 데이터를 근거로 이 사람의 현재 우주적 에너지와 운세를 해석해주세요.")
    lines.push("구체적인 행성 배치와 점수를 인용하며, 실질적인 조언을 포함하세요.")
  } else {
    lines.push(`\n## 사주 명리사의 해석`)
    lines.push(opponentText ?? "")
    lines.push("\n위 사주 명리사의 해석을 읽고:")
    lines.push("1. 점성학적 관점에서 동의하는 부분과 그 이유")
    lines.push("2. 보완하거나 다른 시각을 제시할 부분")
    lines.push("3. 동서양 운명학이 교차하는 흥미로운 지점")
    lines.push("을 점성학적 근거와 함께 서술해주세요.")
  }

  return lines.join("\n")
}
