type MixedMarkerRule = {
  readonly stem?: string
  readonly branch?: string
}

type FortuneYearMarkerInput = {
  readonly monthBranch: string
  readonly targetYearStem: string
  readonly targetYearBranch: string
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
