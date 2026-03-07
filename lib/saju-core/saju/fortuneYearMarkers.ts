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

  return markers
}
