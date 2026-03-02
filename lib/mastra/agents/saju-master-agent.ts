import { Agent } from "@mastra/core/agent"
import type { FortuneResponse } from "@/lib/saju-core"
import { SAJU_MASTER_PERSONA } from "@/lib/mastra/personas"
import { getModel } from "@/lib/mastra/model"

export type DebatePhase = "initial" | "rebuttal"

export { SAJU_MASTER_PERSONA }

/**
 * 사주 명리사 에이전트 — stateless 전문가
 * 오케스트레이터(fortuneOrchestrator) 또는 토론 오케스트레이터(run-debate.ts)에 의해 호출.
 */
export const sajuMasterAgent = new Agent({
  id: "saju-master",
  name: "사주 명리사",
  description: "사주팔자 데이터를 분석하여 오행/십신/운세를 해석하는 전문가",
  instructions: SAJU_MASTER_PERSONA,
  model: getModel("MASTRA_SAJU_MODEL"),
})

/**
 * 사주 명리사의 턴별 컨텍스트 빌더
 * - initial: 사주 데이터 기반 초기 해석
 * - rebuttal: 점성술사 해석에 대한 반론/동의/보완
 */
export function buildSajuMasterContext(
  sajuResult: FortuneResponse,
  phase: DebatePhase,
  opponentText?: string,
): string {
  const pillars = sajuResult.sajuData.pillars
  const lines: string[] = []

  lines.push("## 사주 데이터")
  lines.push(`- 년주: ${pillars.년.천간} ${pillars.년.지지} (오행: ${pillars.년.오행.천간}/${pillars.년.오행.지지})`)
  lines.push(`- 월주: ${pillars.월.천간} ${pillars.월.지지} (오행: ${pillars.월.오행.천간}/${pillars.월.오행.지지})`)
  lines.push(`- 일주: ${pillars.일.천간} ${pillars.일.지지} (오행: ${pillars.일.오행.천간}/${pillars.일.오행.지지})`)
  lines.push(`- 시주: ${pillars.시.천간} ${pillars.시.지지} (오행: ${pillars.시.오행.천간}/${pillars.시.오행.지지})`)

  // 십이운성
  lines.push(`\n## 십이운성`)
  lines.push(`년: ${pillars.년.십이운성}, 월: ${pillars.월.십이운성}, 일: ${pillars.일.십이운성}, 시: ${pillars.시.십이운성}`)

  // 신살
  const allSinsal = [
    ...pillars.년.신살,
    ...pillars.월.신살,
    ...pillars.일.신살,
    ...pillars.시.신살,
  ]
  if (allSinsal.length > 0) {
    lines.push(`\n## 신살: ${allSinsal.join(", ")}`)
  }

  // 기본정보
  lines.push(`\n## 기본정보`)
  lines.push(`- 양력: ${sajuResult.sajuData.basicInfo.solarDate}`)
  lines.push(`- 음력: ${sajuResult.sajuData.basicInfo.lunarDate}`)

  // 십신/신약신강 (있으면 추가)
  if (sajuResult.sipsin) {
    lines.push(`\n## 십신 분석`)
    lines.push(JSON.stringify(sajuResult.sipsin))
  }
  if (sajuResult.sinyakSingang) {
    lines.push(`\n## 신약신강`)
    lines.push(JSON.stringify(sajuResult.sinyakSingang))
  }

  // Phase별 지시
  if (phase === "initial") {
    const today = new Date().toLocaleDateString("ko-KR", {
      year: "numeric", month: "long", day: "numeric", weekday: "long",
    })
    lines.push(`\n## 오늘: ${today}`)
    lines.push("위 사주 데이터를 근거로 이 사람의 현재 운세와 핵심 기운을 해석해주세요.")
    lines.push("구체적인 데이터를 인용하며, 실질적인 조언을 포함하세요.")
  } else {
    lines.push(`\n## 점성술사의 해석`)
    lines.push(opponentText ?? "")
    lines.push("\n위 점성술사의 해석을 읽고:")
    lines.push("1. 명리학 관점에서 동의하는 부분과 그 이유")
    lines.push("2. 보완하거나 다른 시각을 제시할 부분")
    lines.push("3. 동서양 운명학이 교차하는 흥미로운 지점")
    lines.push("을 명리학적 근거와 함께 서술해주세요.")
  }

  return lines.join("\n")
}
