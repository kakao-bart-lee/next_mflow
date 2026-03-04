import type { PlanetId, ZodiacSign } from "./types"

export const PLANET_ORDER: PlanetId[] = [
  "SUN",
  "MOON",
  "MERCURY",
  "VENUS",
  "MARS",
  "JUPITER",
  "SATURN",
]

export const ZODIAC_SIGNS: ZodiacSign[] = [
  "ARIES",
  "TAURUS",
  "GEMINI",
  "CANCER",
  "LEO",
  "VIRGO",
  "LIBRA",
  "SCORPIO",
  "SAGITTARIUS",
  "CAPRICORN",
  "AQUARIUS",
  "PISCES",
]

export const SIGN_LABEL: Record<ZodiacSign, string> = {
  ARIES: "Aries",
  TAURUS: "Taurus",
  GEMINI: "Gemini",
  CANCER: "Cancer",
  LEO: "Leo",
  VIRGO: "Virgo",
  LIBRA: "Libra",
  SCORPIO: "Scorpio",
  SAGITTARIUS: "Sagittarius",
  CAPRICORN: "Capricorn",
  AQUARIUS: "Aquarius",
  PISCES: "Pisces",
}

export const SIGN_LABEL_KO: Record<ZodiacSign, string> = {
  ARIES: "양자리",
  TAURUS: "황소자리",
  GEMINI: "쌍둥이자리",
  CANCER: "게자리",
  LEO: "사자자리",
  VIRGO: "처녀자리",
  LIBRA: "천칭자리",
  SCORPIO: "전갈자리",
  SAGITTARIUS: "사수자리",
  CAPRICORN: "염소자리",
  AQUARIUS: "물병자리",
  PISCES: "물고기자리",
}

export const SIGN_LABEL_JA: Record<ZodiacSign, string> = {
  ARIES: "おひつじ座",
  TAURUS: "おうし座",
  GEMINI: "ふたご座",
  CANCER: "かに座",
  LEO: "しし座",
  VIRGO: "おとめ座",
  LIBRA: "てんびん座",
  SCORPIO: "さそり座",
  SAGITTARIUS: "いて座",
  CAPRICORN: "やぎ座",
  AQUARIUS: "みずがめ座",
  PISCES: "うお座",
}

export const PLANET_LABEL: Record<PlanetId, string> = {
  SUN: "태양",
  MOON: "달",
  MERCURY: "수성",
  VENUS: "금성",
  MARS: "화성",
  JUPITER: "목성",
  SATURN: "토성",
}

export const BASE_LONGITUDE: Record<PlanetId, number> = {
  SUN: 340,
  MOON: 95,
  MERCURY: 322,
  VENUS: 15,
  MARS: 68,
  JUPITER: 62,
  SATURN: 345,
}

export const NAISARGIKA_BALA: Record<PlanetId, number> = {
  SUN: 60.0,
  MOON: 51.43,
  VENUS: 42.86,
  JUPITER: 34.29,
  MERCURY: 25.71,
  MARS: 17.14,
  SATURN: 8.57,
}

export const DOMICILE: Record<PlanetId, ZodiacSign[]> = {
  SUN: ["LEO"],
  MOON: ["CANCER"],
  MERCURY: ["GEMINI", "VIRGO"],
  VENUS: ["TAURUS", "LIBRA"],
  MARS: ["ARIES", "SCORPIO"],
  JUPITER: ["SAGITTARIUS", "PISCES"],
  SATURN: ["CAPRICORN", "AQUARIUS"],
}

export const EXALTATION: Record<PlanetId, ZodiacSign> = {
  SUN: "ARIES",
  MOON: "TAURUS",
  MERCURY: "VIRGO",
  VENUS: "PISCES",
  MARS: "CAPRICORN",
  JUPITER: "CANCER",
  SATURN: "LIBRA",
}

export const DETRIMENT: Record<PlanetId, ZodiacSign[]> = {
  SUN: ["AQUARIUS"],
  MOON: ["CAPRICORN"],
  MERCURY: ["SAGITTARIUS", "PISCES"],
  VENUS: ["ARIES", "SCORPIO"],
  MARS: ["TAURUS", "LIBRA"],
  JUPITER: ["GEMINI", "VIRGO"],
  SATURN: ["CANCER", "LEO"],
}

export const FALL: Record<PlanetId, ZodiacSign> = {
  SUN: "LIBRA",
  MOON: "SCORPIO",
  MERCURY: "PISCES",
  VENUS: "VIRGO",
  MARS: "CANCER",
  JUPITER: "CAPRICORN",
  SATURN: "ARIES",
}

export const TRIPLICITY_ELEMENT: Record<ZodiacSign, "FIRE" | "EARTH" | "AIR" | "WATER"> = {
  ARIES: "FIRE",
  LEO: "FIRE",
  SAGITTARIUS: "FIRE",
  TAURUS: "EARTH",
  VIRGO: "EARTH",
  CAPRICORN: "EARTH",
  GEMINI: "AIR",
  LIBRA: "AIR",
  AQUARIUS: "AIR",
  CANCER: "WATER",
  SCORPIO: "WATER",
  PISCES: "WATER",
}

export const TRIPLICITY_RULERS: Record<
  "FIRE" | "EARTH" | "AIR" | "WATER",
  { day: PlanetId; night: PlanetId; participating: PlanetId }
> = {
  FIRE: { day: "SUN", night: "JUPITER", participating: "SATURN" },
  EARTH: { day: "VENUS", night: "MOON", participating: "MARS" },
  AIR: { day: "SATURN", night: "MERCURY", participating: "JUPITER" },
  WATER: { day: "VENUS", night: "MARS", participating: "MOON" },
}

export const EGYPTIAN_TERMS: Record<ZodiacSign, Array<{ end: number; ruler: PlanetId }>> = {
  ARIES: [
    { end: 6, ruler: "JUPITER" },
    { end: 12, ruler: "VENUS" },
    { end: 20, ruler: "MERCURY" },
    { end: 25, ruler: "MARS" },
    { end: 30, ruler: "SATURN" },
  ],
  TAURUS: [
    { end: 8, ruler: "VENUS" },
    { end: 14, ruler: "MERCURY" },
    { end: 22, ruler: "JUPITER" },
    { end: 27, ruler: "SATURN" },
    { end: 30, ruler: "MARS" },
  ],
  GEMINI: [
    { end: 6, ruler: "MERCURY" },
    { end: 12, ruler: "JUPITER" },
    { end: 17, ruler: "VENUS" },
    { end: 24, ruler: "MARS" },
    { end: 30, ruler: "SATURN" },
  ],
  CANCER: [
    { end: 7, ruler: "MARS" },
    { end: 13, ruler: "VENUS" },
    { end: 19, ruler: "MERCURY" },
    { end: 26, ruler: "JUPITER" },
    { end: 30, ruler: "SATURN" },
  ],
  LEO: [
    { end: 6, ruler: "JUPITER" },
    { end: 11, ruler: "VENUS" },
    { end: 18, ruler: "SATURN" },
    { end: 24, ruler: "MERCURY" },
    { end: 30, ruler: "MARS" },
  ],
  VIRGO: [
    { end: 7, ruler: "MERCURY" },
    { end: 17, ruler: "VENUS" },
    { end: 21, ruler: "JUPITER" },
    { end: 28, ruler: "MARS" },
    { end: 30, ruler: "SATURN" },
  ],
  LIBRA: [
    { end: 6, ruler: "SATURN" },
    { end: 14, ruler: "MERCURY" },
    { end: 21, ruler: "JUPITER" },
    { end: 28, ruler: "VENUS" },
    { end: 30, ruler: "MARS" },
  ],
  SCORPIO: [
    { end: 7, ruler: "MARS" },
    { end: 11, ruler: "VENUS" },
    { end: 19, ruler: "MERCURY" },
    { end: 24, ruler: "JUPITER" },
    { end: 30, ruler: "SATURN" },
  ],
  SAGITTARIUS: [
    { end: 12, ruler: "JUPITER" },
    { end: 17, ruler: "VENUS" },
    { end: 21, ruler: "MERCURY" },
    { end: 26, ruler: "SATURN" },
    { end: 30, ruler: "MARS" },
  ],
  CAPRICORN: [
    { end: 7, ruler: "MERCURY" },
    { end: 14, ruler: "JUPITER" },
    { end: 22, ruler: "VENUS" },
    { end: 26, ruler: "SATURN" },
    { end: 30, ruler: "MARS" },
  ],
  AQUARIUS: [
    { end: 7, ruler: "MERCURY" },
    { end: 13, ruler: "VENUS" },
    { end: 20, ruler: "JUPITER" },
    { end: 25, ruler: "MARS" },
    { end: 30, ruler: "SATURN" },
  ],
  PISCES: [
    { end: 12, ruler: "VENUS" },
    { end: 16, ruler: "JUPITER" },
    { end: 19, ruler: "MERCURY" },
    { end: 28, ruler: "MARS" },
    { end: 30, ruler: "SATURN" },
  ],
}

export const CHALDEAN_FACES: Record<ZodiacSign, [PlanetId, PlanetId, PlanetId]> = {
  ARIES: ["MARS", "SUN", "VENUS"],
  TAURUS: ["MERCURY", "MOON", "SATURN"],
  GEMINI: ["JUPITER", "MARS", "SUN"],
  CANCER: ["VENUS", "MERCURY", "MOON"],
  LEO: ["SATURN", "JUPITER", "MARS"],
  VIRGO: ["SUN", "VENUS", "MERCURY"],
  LIBRA: ["MOON", "SATURN", "JUPITER"],
  SCORPIO: ["MARS", "SUN", "VENUS"],
  SAGITTARIUS: ["MERCURY", "MOON", "SATURN"],
  CAPRICORN: ["JUPITER", "MARS", "SUN"],
  AQUARIUS: ["VENUS", "MERCURY", "MOON"],
  PISCES: ["SATURN", "JUPITER", "MARS"],
}

export const PLANET_THEME: Record<PlanetId, { summary: string; caution: string; actions: string[] }> = {
  SUN: {
    summary: "정체성과 목표 의식이 선명해지는 흐름입니다.",
    caution: "과한 자기 확신은 주변 협력을 약화시킬 수 있습니다.",
    actions: ["오늘의 우선순위 1개를 명확히 선언해보세요", "리더십이 필요한 대화는 오전에 배치하세요"],
  },
  MOON: {
    summary: "감정의 미세한 변화와 관계 감수성이 커지는 날입니다.",
    caution: "기분 기복에 즉각 반응하면 판단이 흔들릴 수 있습니다.",
    actions: ["감정 상태를 짧게 메모해보세요", "가까운 사람에게 한 문장 안부를 보내세요"],
  },
  MERCURY: {
    summary: "정보 정리와 소통 효율이 올라가는 흐름입니다.",
    caution: "속도를 올릴수록 오해 가능성도 커집니다.",
    actions: ["핵심 메시지를 3줄로 정리해 전달하세요", "중요 결정 전 체크리스트를 1회 검토하세요"],
  },
  VENUS: {
    summary: "관계 조율과 가치 판단이 부드럽게 작동하는 시기입니다.",
    caution: "갈등 회피가 장기적으로 비용을 키울 수 있습니다.",
    actions: ["감사 표현 1회를 의식적으로 실행해보세요", "소비/시간 사용에서 우선순위를 재점검하세요"],
  },
  MARS: {
    summary: "실행력과 돌파 에너지가 상승하는 국면입니다.",
    caution: "속도만 앞서면 마찰과 소모가 커질 수 있습니다.",
    actions: ["미뤄둔 실행 과제를 20분만 착수해보세요", "논쟁성 대화는 근거 중심으로 짧게 끝내세요"],
  },
  JUPITER: {
    summary: "확장, 학습, 기회 탐색에 유리한 흐름입니다.",
    caution: "낙관 과잉은 리스크 확인을 누락시킬 수 있습니다.",
    actions: ["새로운 배움 1개를 오늘 일정에 넣어보세요", "중장기 목표를 1단계 구체화해보세요"],
  },
  SATURN: {
    summary: "구조화와 책임 강화가 성과로 이어지는 시기입니다.",
    caution: "완벽주의가 시작 자체를 지연시킬 수 있습니다.",
    actions: ["반복 업무를 표준화하는 규칙을 하나 만드세요", "장기 과제의 최소 실행 단위를 정의하세요"],
  },
}
