/**
 * Context Bundles — 질문 의도 기반 데이터 모듈화
 *
 * 4가지 번들(Career, Love, Timing, Selfcare)별로 필요한 데이터만 LLM에 주입하여
 * 토큰 낭비와 환각을 방지합니다.
 */

import { z } from "zod"

/** 컨텍스트 번들 타입 */
export type ContextBundleId = "career" | "love" | "timing" | "selfcare"

/**
 * 각 번들이 요구하는 데이터 필드
 * SajuResult, AstrologyStaticResult, ZiweiResult의 서브셋
 */
export const ContextBundleSchemas = {
  career: {
    id: "career" as const,
    name: "커리어 / 재물 / 진로",
    description: "이직, 적성, 돈 모으기, 진로 관련 질문",
    sajuFields: [
      "十神_재성",
      "十神_관성",
      "十神_편재",
      "十神_정재",
      "신살_역마",
      "신살_화개",
      "대운",
      "세운",
      "월운",
    ],
    astrologyFields: [
      "MC",
      "house_2",
      "house_6",
      "house_10",
      "nakshatra",
      "profectionYear",
    ],
    ziweiFields: ["관록궁", "재백궁"],
    keywords: [
      "이직",
      "직업",
      "진로",
      "재물",
      "돈",
      "커리어",
      "취업",
      "승진",
      "창업",
      "사업",
    ],
    persona: `당신은 현실적이고 전략적인 커리어 코치 및 재무 컨설턴트입니다.
- 사주의 십신(재성/관성), 신살(역마, 화개) 데이터를 바탕으로 직업적 강점 분석
- 점성술의 MC, 2/6/10 하우스를 바탕으로 재물/노동/커리어 흐름 해석
- 구체적인 액션 아이템과 시기 제안
- 한국어 존댓말, 따뜻하면서도 명확한 어조`,
  },
  love: {
    id: "love" as const,
    name: "연애 / 파트너십 / 인간관계",
    description: "연애운, 결혼, 상대방 궁합, 인간관계 관련 질문",
    sajuFields: [
      "일지",
      "월지",
      "十神_관성",
      "十神_재성",
      "일지_형충",
      "월지_형충",
    ],
    astrologyFields: [
      "house_7",
      "venus",
      "moon",
      "aspects",
      "descendant",
    ],
    ziweiFields: ["夫妻宮", "福德宮"],
    keywords: [
      "연애",
      "사랑",
      " 결혼",
      "배우자",
      "궁합",
      "상대방",
      "짝",
      "커플",
      "이별",
      "관계",
    ],
    persona: `당신은 공감 능력이 뛰어나며 객관적 피드백을 제공하는 관계 심리 상담사입니다.
- 사주의 일지(배우자궁), 십신, 형충파해 데이터를 바탕으로 관계 패턴 분석
- 점성술의 7하우스, 금성, 달을 바탕으로 사랑의 방식과 감정적 안정 해석
- 관계에서의 강점과 도전 과제 명확히 제시
- 한국어 존댓말, 따뜻하고 공감하는 어조`,
  },
  timing: {
    id: "timing" as const,
    name: "타이밍 / 운의 흐름 / 중대 결정",
    description: "시작 시기, 삼재, 사업, 이사, 중대 결정 관련 질문",
    sajuFields: [
      "대운",
      "세운",
      "월운",
      "일주",
      "년주",
      "형충파해",
    ],
    astrologyFields: [
      "dasha",
      "transits",
      "progressions",
      "profectionYear",
    ],
    ziweiFields: ["大限", "時運動"],
    keywords: [
      "타이밍",
      "시작",
      "삼재",
      "사업",
      "이사",
      "시작",
      "분기",
      "때",
      " 시기",
      "운",
      "흐름",
      "결정",
    ],
    persona: `당신은 명확한 시기를 짝어주고 리스크 매니지먼트를 돕는 전략적 타임키퍼입니다.
- 사주的大運/세운/月運을 바탕으로 10년/연간 흐름 분석
- 점성술의 Dasha, Transit, Profection을 바탕으로 인생 챕터 타이밍 해석
- 위험 요인과 기회 요인 모두 명확히 제시
- 한국어 존댓말, 명확하면서도 안전한 어조`,
  },
  selfcare: {
    id: "selfcare" as const,
    name: "자아 탐구 / 멘탈 케어",
    description: "우울, 무기력, 자기 이해, 본모습 관련 질문",
    sajuFields: [
      "일간",
      "월지",
      "오행",
      "십이운성",
      "오행_불균형",
    ],
    astrologyFields: [
      "ASC",
      "moon",
      "essentialDignity",
      "debilitation",
      "house_1",
      "house_4",
      "house_12",
    ],
    ziweiFields: ["命宮", "田宅宮"],
    keywords: [
      "우울",
      "무기력",
      "본모습",
      "나",
      "자아",
      "탐구",
      "멘탈",
      "심리",
      "스트레스",
      "izu",
      "성격",
      "본성",
    ],
    persona: `당신은 명리학을 도구로 삼아 깊은 내면을 다독이는 심리 치료사입니다.
- 사주의 일간/월지/오행 불균형 데이터를 바탕으로 본질과 환경적 영향 분석
- 점성술의 ASC, 달, Essential Dignity를 바탕으로 내면의 아이와 결핍 요소 해석
- 오행 과다(예: 수기운 과다)에 따른 우울감 등 신체적 연관성 언급
- 한국어 존댓말, 치유적이고 공감하는 어조`,
  },
} as const

/** 의도 분류 결과 */
export const IntentClassificationSchema = z.object({
  bundleId: z.enum(["career", "love", "timing", "selfcare"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
})

export type IntentClassification = z.infer<typeof IntentClassificationSchema>

/**
 * 키워드 기반 의도 분류 (LLM 없이 빠른 분류)
 * 추후 LLM 기반 분류로 확장 가능
 */
export function classifyIntentByKeywords(
  userMessage: string
): IntentClassification {
  const message = userMessage.toLowerCase()
  const scores: Record<ContextBundleId, number> = {
    career: 0,
    love: 0,
    timing: 0,
    selfcare: 0,
  }

  // 키워드 매칭
  for (const [bundleId, bundle] of Object.entries(ContextBundleSchemas)) {
    const id = bundleId as ContextBundleId
    for (const keyword of bundle.keywords) {
      if (message.includes(keyword.toLowerCase())) {
        scores[id] += 1
      }
    }
  }

  // 가장 높은 점수의 번들 선택
  let maxBundle: ContextBundleId = "selfcare" // 기본값
  let maxScore = -1

  for (const [bundleId, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      maxBundle = bundleId as ContextBundleId
    }
  }

  const confidence = maxScore === 0 ? 0.3 : Math.min(0.9, 0.5 + maxScore * 0.15)

  return {
    bundleId: maxBundle,
    confidence,
    reasoning: `키워드 매칭: ${maxBundle} (점수: ${maxScore})`,
  }
}

/**
 * 번들에 해당하는 데이터 필드만 추출
 */
export function extractBundleData<
  T extends { [key: string]: unknown },
  B extends ContextBundleId
>(
  fullData: T,
  bundleId: B
): Partial<T> {
  const bundle = ContextBundleSchemas[bundleId]
  const fields = [
    ...bundle.sajuFields,
    ...bundle.astrologyFields,
    ...bundle.ziweiFields,
  ] as (keyof T)[]

  const result: Partial<T> = {}
  for (const field of fields) {
    if (field in fullData) {
      result[field] = fullData[field]
    }
  }

  return result
}

/**
 * Context Bundle 타입 내보내기
 */
export type ContextBundle = (typeof ContextBundleSchemas)[keyof typeof ContextBundleSchemas]
