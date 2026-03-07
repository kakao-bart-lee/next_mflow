type MixedMarkerRule = {
  readonly stem?: string
  readonly branch?: string
}

type FortuneYearMarkerInput = {
  readonly monthBranch: string
  readonly targetYearStem: string
  readonly targetYearBranch: string
}

type FortuneYearMarkerText = {
  readonly briefText: string
  readonly fullText: string
}

const MARKER_TEXTS: Readonly<Record<string, FortuneYearMarkerText>> = {
  천덕귀인: {
    briefText: '흉한 기운을 누그러뜨리고 뜻밖의 도움과 보호를 기대할 수 있는 길한 표식입니다.',
    fullText:
      '천덕귀인은 연운에서 거친 흐름을 완충해 주는 보호 표식으로 봅니다. 일이 꼬이더라도 사람의 도움이나 환경의 완충 작용이 붙기 쉬워 손실을 줄이고 회복의 발판을 만들 가능성이 커집니다.',
  },
  월덕귀인: {
    briefText: '명예와 재물 쪽의 도움을 받아 일을 부드럽게 풀기 쉬운 길한 표식입니다.',
    fullText:
      '월덕귀인은 사회적 평판과 대인 협력에서 순풍이 붙는 표식입니다. 혼자 밀어붙이기보다 주변과 호흡을 맞출수록 실무와 재물 흐름이 부드럽게 이어지고, 막히던 일도 설득과 조율로 풀리기 쉬워집니다.',
  },
  천덕합: {
    briefText: '기대한 것보다 나은 성과를 얻고 흉한 일도 완화되기 쉬운 호운의 표식입니다.',
    fullText:
      '천덕합은 흉한 일을 정면 돌파하기보다 좋은 쪽으로 봉합하고 전환하는 힘이 붙는 표식입니다. 기대보다 결과가 안정적으로 수습되거나, 불리한 조건에서도 실익을 챙길 여지가 커집니다.',
  },
  월덕합: {
    briefText: '대인운과 실행력이 부드럽게 이어져 좋은 기회를 현실 성과로 연결하기 쉬운 표식입니다.',
    fullText:
      '월덕합은 사람과 기회가 실제 결과로 이어지는 연결력이 강해지는 표식입니다. 인연, 협업, 제안이 실무 성과로 이어질 가능성이 높아지고, 추진 과정의 마찰을 줄이며 자연스럽게 판을 만들어 갑니다.',
  },
  생기: {
    briefText: '새로운 일의 기운이 살아나 움직임과 확장에 힘이 붙는 표식입니다.',
    fullText:
      '생기는 정체된 흐름을 깨고 새 판을 열기 좋은 표식입니다. 시작, 확장, 이동, 관계의 재가동처럼 앞으로 뻗어 나가는 일에 힘이 붙고, 멈춰 있던 분위기를 다시 살려내는 작용을 기대할 수 있습니다.',
  },
  천의: {
    briefText: '몸과 생활의 균형을 회복하고 회복력과 보호를 기대할 수 있는 표식입니다.',
    fullText:
      '천의는 몸과 생활 리듬을 추스르고 보호를 받기 쉬운 표식입니다. 과로와 소모를 줄이고 건강, 생활 안정, 회복 과정에 신경을 쓰면 손상된 흐름을 다시 정리하는 데 도움이 됩니다.',
  },
}

const CHEONDEOK_RULES: Readonly<Record<string, MixedMarkerRule>> = {
  子: { branch: '巳' },
  丑: { stem: '庚' },
  寅: { stem: '丁' },
  卯: { branch: '申' },
  辰: { stem: '壬' },
  巳: { branch: '申' },
  午: { branch: '亥' },
  未: { stem: '甲' },
  申: { stem: '癸' },
  酉: { branch: '寅' },
  戌: { stem: '丙' },
  亥: { stem: '乙' },
}

const WOLDEOK_RULES: Readonly<Record<string, MixedMarkerRule>> = {
  子: { stem: '壬' },
  丑: { stem: '庚' },
  寅: { stem: '丙' },
  卯: { stem: '甲' },
  辰: { stem: '壬' },
  巳: { stem: '庚' },
  午: { stem: '丙' },
  未: { stem: '甲' },
  申: { stem: '壬' },
  酉: { stem: '庚' },
  戌: { stem: '丙' },
  亥: { stem: '甲' },
}

const CHEONDEOKHAP_RULES: Readonly<Record<string, MixedMarkerRule>> = {
  子: { stem: '甲' },
  丑: { stem: '乙' },
  寅: { stem: '壬' },
  卯: { branch: '巳' },
  辰: { stem: '丁' },
  巳: { stem: '丙' },
  午: { branch: '寅' },
  未: { stem: '己' },
  申: { branch: '戌' },
  酉: { branch: '亥' },
  戌: { stem: '辛' },
  亥: { stem: '庚' },
}

const WOLDEOKHAP_RULES: Readonly<Record<string, MixedMarkerRule>> = {
  子: { stem: '丁' },
  丑: { stem: '乙' },
  寅: { stem: '辛' },
  卯: { branch: '巳' },
  辰: { stem: '丁' },
  巳: { stem: '乙' },
  午: { stem: '辛' },
  未: { branch: '巳' },
  申: { stem: '丁' },
  酉: { stem: '乙' },
  戌: { stem: '辛' },
  亥: { branch: '巳' },
}

const SAENGGI_RULES: Readonly<Record<string, string>> = {
  寅: '戌',
  卯: '亥',
  辰: '子',
  巳: '丑',
  午: '寅',
  未: '卯',
  申: '辰',
  酉: '巳',
  戌: '午',
  亥: '未',
  子: '申',
  丑: '酉',
}

const CHEONUI_RULES: Readonly<Record<string, string>> = {
  寅: '丑',
  卯: '寅',
  辰: '卯',
  巳: '辰',
  午: '巳',
  未: '午',
  申: '未',
  酉: '申',
  戌: '酉',
  亥: '戌',
  子: '亥',
  丑: '子',
}

function matchesMixedRule(input: FortuneYearMarkerInput, rule: MixedMarkerRule | undefined): boolean {
  if (!rule) {
    return false
  }

  return (
    (rule.stem !== undefined && rule.stem === input.targetYearStem) ||
    (rule.branch !== undefined && rule.branch === input.targetYearBranch)
  )
}

export function resolveFortuneYearMarkers(input: FortuneYearMarkerInput): string[] {
  const markers: string[] = []

  if (matchesMixedRule(input, CHEONDEOK_RULES[input.monthBranch])) {
    markers.push('천덕귀인')
  }
  if (matchesMixedRule(input, WOLDEOK_RULES[input.monthBranch])) {
    markers.push('월덕귀인')
  }
  if (matchesMixedRule(input, CHEONDEOKHAP_RULES[input.monthBranch])) {
    markers.push('천덕합')
  }
  if (matchesMixedRule(input, WOLDEOKHAP_RULES[input.monthBranch])) {
    markers.push('월덕합')
  }
  if (SAENGGI_RULES[input.monthBranch] === input.targetYearBranch) {
    markers.push('생기')
  }
  if (CHEONUI_RULES[input.monthBranch] === input.targetYearBranch) {
    markers.push('천의')
  }

  return markers
}

export function getFortuneYearMarkerInsight(marker: string): string | null {
  return MARKER_TEXTS[marker]?.briefText ?? null
}

export function getFortuneYearMarkerFullText(marker: string): string | null {
  return MARKER_TEXTS[marker]?.fullText ?? null
}
