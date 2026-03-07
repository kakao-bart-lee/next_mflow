import {
  getFortuneYearMarkerFullText,
  getFortuneYearMarkerInsight,
} from "./fortuneYearMarkers"
import { getSinsalMeanings } from "./twelveSinsal/utils"

const TIMELINE_EXTRA_TEXTS: Readonly<Record<string, { readonly briefText: string; readonly fullText: string }>> = {
  양인: {
    briefText: "기세가 강해지고 밀어붙이는 힘이 커지지만 충돌과 과격함도 함께 커질 수 있는 표식입니다.",
    fullText:
      "양인은 추진력과 결단이 크게 살아나는 대신, 힘이 과해지면 충돌과 과격함으로 번질 수 있는 표식입니다. 밀어붙여야 할 일에는 힘이 되지만, 관계와 판단에서는 강약 조절이 필요합니다.",
  },
  공망: {
    briefText: "기대한 만큼 실속이 붙지 않거나 허탈감이 생기기 쉬워 점검과 보완이 필요한 표식입니다.",
    fullText:
      "공망은 기대와 결과 사이에 빈틈이 생기기 쉬운 표식입니다. 계획이 쉽게 비거나 성과가 늦게 체감될 수 있으므로, 과한 기대를 줄이고 확인과 보완을 먼저 두는 편이 흐름을 안정시키는 데 유리합니다.",
  },
}

function normalizeTimelineLabel(label: string): string {
  return label.trim()
}

export function getFortuneTimelineAnnotationInsight(label: string): string | null {
  const normalizedLabel = normalizeTimelineLabel(label)
  const markerInsight = getFortuneYearMarkerInsight(normalizedLabel)
  if (markerInsight) {
    return markerInsight
  }

  const extraInsight = TIMELINE_EXTRA_TEXTS[normalizedLabel]?.briefText
  if (extraInsight) {
    return extraInsight
  }

  const sinsalMeaning = getSinsalMeanings()[normalizedLabel]
  if (sinsalMeaning) {
    return `${normalizedLabel}은 ${sinsalMeaning}입니다.`
  }

  return null
}

export function getFortuneTimelineAnnotationFullText(label: string): string | null {
  const normalizedLabel = normalizeTimelineLabel(label)
  const markerFullText = getFortuneYearMarkerFullText(normalizedLabel)
  if (markerFullText) {
    return markerFullText
  }

  const extraFullText = TIMELINE_EXTRA_TEXTS[normalizedLabel]?.fullText
  if (extraFullText) {
    return extraFullText
  }

  const sinsalMeaning = getSinsalMeanings()[normalizedLabel]
  if (sinsalMeaning) {
    return `${normalizedLabel}은 ${sinsalMeaning}으로 읽습니다. 연도 흐름에서 이 표식이 보이면 그 성향이 부각되는 시기로 해석합니다.`
  }

  return null
}
