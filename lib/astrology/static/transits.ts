import { PLANET_ORDER } from "./constants"
import type { AstrologyPosition, PlanetId } from "./types"

export interface TransitAspect {
  id: string
  type: "daily" | "weekly" | "special"
  headline: string
  planets: string
  sajuResonance: string
  body: string
  significance: "high" | "medium" | "low"
}

type AspectName = "conjunction" | "opposition" | "trine" | "square" | "sextile"

interface AspectRule {
  name: AspectName
  angle: number
  orb: number
  significance: TransitAspect["significance"]
}

interface AspectNarrative {
  headline: string
  body: string
}

const ASPECT_RULES: AspectRule[] = [
  { name: "conjunction", angle: 0, orb: 8, significance: "high" },
  { name: "opposition", angle: 180, orb: 8, significance: "high" },
  { name: "trine", angle: 120, orb: 6, significance: "medium" },
  { name: "square", angle: 90, orb: 6, significance: "medium" },
  { name: "sextile", angle: 60, orb: 4, significance: "low" },
]

const PLANET_SYMBOL: Record<PlanetId, string> = {
  SUN: "☉",
  MOON: "☽",
  MERCURY: "☿",
  VENUS: "♀",
  MARS: "♂",
  JUPITER: "♃",
  SATURN: "♄",
}

const SAJU_RESONANCE: Record<PlanetId, string> = {
  SUN: "식신",
  MOON: "편인",
  MERCURY: "편관",
  VENUS: "정재",
  MARS: "상관",
  JUPITER: "정인",
  SATURN: "비견",
}

const PLANET_KR: Record<PlanetId, string> = {
  SUN: "태양",
  MOON: "달",
  MERCURY: "수성",
  VENUS: "금성",
  MARS: "화성",
  JUPITER: "목성",
  SATURN: "토성",
}

const ASPECT_NARRATIVE: Record<AspectName, AspectNarrative> = {
  conjunction: {
    headline: "에너지가 한 점에 모이는 합의 흐름",
    body: "두 행성의 의도가 겹치며 추진력과 몰입이 강해집니다. 목표를 하나로 좁히면 성과 속도가 빨라집니다.",
  },
  opposition: {
    headline: "균형을 요구하는 대립의 축",
    body: "서로 다른 요구가 마주 보며 긴장을 만듭니다. 양쪽의 필요를 함께 인정하면 관계와 의사결정의 균형점이 열립니다.",
  },
  trine: {
    headline: "자연스럽게 이어지는 조화의 흐름",
    body: "에너지가 무리 없이 순환해 협업과 이해가 쉬워집니다. 익숙한 강점을 실전에서 확장하기 좋은 타이밍입니다.",
  },
  square: {
    headline: "성장을 촉발하는 긴장과 마찰",
    body: "현실 과제와 욕구가 충돌해 조정이 필요해집니다. 우선순위를 분명히 하면 압박이 실행력으로 전환됩니다.",
  },
  sextile: {
    headline: "작은 기회를 여는 연결의 신호",
    body: "부담이 적은 협력 포인트가 생기며 대화가 풀립니다. 짧은 시도와 제안이 예상 밖의 성과로 이어질 수 있습니다.",
  },
}

const SIGNIFICANCE_WEIGHT: Record<TransitAspect["significance"], number> = {
  high: 0,
  medium: 1,
  low: 2,
}

function normalizedAngularDistance(a: number, b: number): number {
  const absolute = Math.abs(a - b)
  return Math.min(absolute, 360 - absolute)
}

function findAspect(distance: number): { rule: AspectRule; orbDelta: number } | null {
  let bestMatch: { rule: AspectRule; orbDelta: number } | null = null

  for (const rule of ASPECT_RULES) {
    const orbDelta = Math.abs(distance - rule.angle)
    if (orbDelta > rule.orb) {
      continue
    }

    if (!bestMatch || orbDelta < bestMatch.orbDelta) {
      bestMatch = { rule, orbDelta }
    }
  }

  return bestMatch
}

function classifyTransitType(left: PlanetId, right: PlanetId): TransitAspect["type"] {
  if (left === "SUN" || left === "MOON" || right === "SUN" || right === "MOON") {
    return "daily"
  }

  if (left === "JUPITER" || left === "SATURN" || right === "JUPITER" || right === "SATURN") {
    return "weekly"
  }

  if (left === "VENUS" || right === "VENUS") {
    return "special"
  }

  return "daily"
}

function makeSajuResonance(left: PlanetId, right: PlanetId): string {
  return `${PLANET_KR[left]}(${SAJU_RESONANCE[left]})과 ${PLANET_KR[right]}(${SAJU_RESONANCE[right]})의 결이 맞물려, 십신 관점에서 역할 조정과 에너지 배분의 힌트를 줍니다.`
}

export function computeTransits(positions: Record<PlanetId, AstrologyPosition>): TransitAspect[] {
  const transits: Array<TransitAspect & { orbDelta: number }> = []

  for (let i = 0; i < PLANET_ORDER.length - 1; i += 1) {
    const leftPlanet = PLANET_ORDER[i]
    const leftPosition = positions[leftPlanet]

    for (let j = i + 1; j < PLANET_ORDER.length; j += 1) {
      const rightPlanet = PLANET_ORDER[j]
      const rightPosition = positions[rightPlanet]

      const distance = normalizedAngularDistance(leftPosition.lonDeg, rightPosition.lonDeg)
      const aspect = findAspect(distance)
      if (!aspect) {
        continue
      }

      const narrative = ASPECT_NARRATIVE[aspect.rule.name]

      transits.push({
        id: `${leftPlanet}-${aspect.rule.name}-${rightPlanet}`,
        type: classifyTransitType(leftPlanet, rightPlanet),
        headline: `${PLANET_KR[leftPlanet]}·${PLANET_KR[rightPlanet]} ${narrative.headline}`,
        planets: `${PLANET_SYMBOL[leftPlanet]} ${aspect.rule.name} ${PLANET_SYMBOL[rightPlanet]}`,
        sajuResonance: makeSajuResonance(leftPlanet, rightPlanet),
        body: narrative.body,
        significance: aspect.rule.significance,
        orbDelta: aspect.orbDelta,
      })
    }
  }

  transits.sort((a, b) => {
    const significanceDiff = SIGNIFICANCE_WEIGHT[a.significance] - SIGNIFICANCE_WEIGHT[b.significance]
    if (significanceDiff !== 0) {
      return significanceDiff
    }

    if (a.orbDelta !== b.orbDelta) {
      return a.orbDelta - b.orbDelta
    }

    return a.id.localeCompare(b.id)
  })

  return transits.map(({ orbDelta, ...transit }) => transit)
}
