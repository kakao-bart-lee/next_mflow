import {
  KOREAN_BRANCH_TO_DISPLAY,
  KOREAN_STEM_TO_DISPLAY,
  SIPSIN_BRANCH_RELATIONS,
  SIPSIN_STEM_RELATIONS,
} from "./constants"
import type { CalculationInput } from "./fortuneCalculatorBase"
import { calculateYongChungan, calculateYongToSipsin } from "./yongsinFlows"

type YongsinCode = 1 | 2 | 3 | 4 | 5

export interface YongsinDecisionInput {
  readonly yearStem: string
  readonly yearBranch: string
  readonly monthStem: string
  readonly monthBranch: string
  readonly dayStem: string
  readonly dayBranch: string
  readonly hourStem: string
  readonly hourBranch: string
}

export interface YongsinDecisionResult {
  readonly usefulCode: YongsinCode
  readonly favorableCode: YongsinCode
  readonly harmfulCode: YongsinCode
  readonly adverseCode: YongsinCode
  readonly reserveCode: YongsinCode
  readonly usefulElement: string
  readonly favorableElement: string
  readonly harmfulElement: string
  readonly adverseElement: string
  readonly reserveElement: string
  readonly yongToSipsin: string
  readonly yongChungan: string
}

const SIPSIN_HANJA_TO_KOREAN: Readonly<Record<string, string>> = {
  比肩: "비견",
  劫財: "겁재",
  食神: "식신",
  傷官: "상관",
  偏財: "편재",
  正財: "정재",
  偏官: "편관",
  正官: "정관",
  偏印: "편인",
  正印: "정인",
}

const INN_GROUP = new Set(["편인", "정인"])
const BI_GROUP = new Set(["비견", "겁재"])
const SH_GROUP = new Set(["식신", "상관"])
const JA_GROUP = new Set(["편재", "정재"])
const KW_GROUP = new Set(["편관", "정관"])
const SIPSIN_GROUP: Readonly<Record<string, number>> = {
  편인: 0,
  정인: 0,
  비견: 1,
  겁재: 1,
  식신: 2,
  상관: 2,
  편재: 3,
  정재: 3,
  편관: 4,
  정관: 4,
}
const CODE_TO_ELEMENT: Readonly<Record<YongsinCode, string>> = {
  1: "비겁",
  2: "식상",
  3: "재성",
  4: "관살",
  5: "인성",
}

function normalizeSipsinName(value: string): string {
  const trimmed = value.trim()
  return SIPSIN_HANJA_TO_KOREAN[trimmed] ?? trimmed
}

function toDisplayStem(stemHanja: string): string {
  return KOREAN_STEM_TO_DISPLAY[stemHanja] ?? stemHanja
}

function toDisplayBranch(branchHanja: string): string {
  return KOREAN_BRANCH_TO_DISPLAY[branchHanja] ?? branchHanja
}

function getStemSipsin(dayStemHanja: string, targetStemHanja: string): string {
  const dayStemDisplay = toDisplayStem(dayStemHanja)
  const targetStemDisplay = toDisplayStem(targetStemHanja)
  return normalizeSipsinName(SIPSIN_STEM_RELATIONS[dayStemDisplay]?.[targetStemDisplay] ?? "")
}

function getBranchSipsin(dayStemHanja: string, targetBranchHanja: string): string {
  const dayStemDisplay = toDisplayStem(dayStemHanja)
  const targetBranchDisplay = toDisplayBranch(targetBranchHanja)
  return normalizeSipsinName(SIPSIN_BRANCH_RELATIONS[dayStemDisplay]?.[targetBranchDisplay] ?? "")
}

export function extractPaljayukSipsin(input: YongsinDecisionInput): string[] {
  return [
    getStemSipsin(input.dayStem, input.yearStem),
    getBranchSipsin(input.dayStem, input.yearBranch),
    getStemSipsin(input.dayStem, input.monthStem),
    getBranchSipsin(input.dayStem, input.monthBranch),
    getBranchSipsin(input.dayStem, input.dayBranch),
    getBranchSipsin(input.dayStem, input.hourStem),
    getBranchSipsin(input.dayStem, input.hourBranch),
  ]
}

export function extractPaljayuk1Sipsin(input: YongsinDecisionInput): string[] {
  return [
    getStemSipsin(input.dayStem, input.yearStem),
    getBranchSipsin(input.dayStem, input.yearBranch),
    getBranchSipsin(input.dayStem, input.monthStem),
    getBranchSipsin(input.dayStem, input.hourStem),
    getBranchSipsin(input.dayStem, input.hourBranch),
  ]
}

export function countSipsinCategories(paljayuk1: string[]): {
  inn: number
  bi: number
  sh: number
  ja: number
  kw: number
} {
  let inn = 0
  let bi = 0
  let sh = 0
  let ja = 0
  let kw = 0

  for (const raw of paljayuk1) {
    const sipsin = normalizeSipsinName(raw)
    if (INN_GROUP.has(sipsin)) {
      inn += 1
    }
    if (BI_GROUP.has(sipsin)) {
      bi += 1
    }
    if (SH_GROUP.has(sipsin)) {
      sh += 1
    }
    if (JA_GROUP.has(sipsin)) {
      ja += 1
    }
    if (KW_GROUP.has(sipsin)) {
      kw += 1
    }
  }

  return { inn, bi, sh, ja, kw }
}

function toYongsinCode(value: number): YongsinCode {
  if (value >= 1 && value <= 5) {
    return value as YongsinCode
  }
  return 1
}

function wrapCode(value: number): YongsinCode {
  const wrapped = ((value - 1 + 5) % 5) + 1
  return toYongsinCode(wrapped)
}

function toCalculationInput(input: YongsinDecisionInput): CalculationInput {
  return {
    ...input,
    gender: "M",
  }
}

export function determineHyung(monthBranchSipsin: string, dayBranchSipsin: string): number {
  const monthGroup = SIPSIN_GROUP[normalizeSipsinName(monthBranchSipsin)] ?? 0
  const dayGroup = SIPSIN_GROUP[normalizeSipsinName(dayBranchSipsin)] ?? 0
  return monthGroup * 5 + dayGroup + 1
}

export function deriveYongHee(
  hyung: number,
  counts: { inn: number; bi: number; sh: number; ja: number; kw: number }
): { Y: YongsinCode; H: YongsinCode } {
  const { inn, bi, sh, ja, kw } = counts
  const inbi = inn + bi

  let Y = 1
  let H = 2

  switch (hyung) {
    case 1:
      if (inbi >= 1) {
        if (ja >= 3) {
          if (kw > 0) {
            Y = 4
            H = 3
          } else {
            Y = 3
            H = 2
          }
        } else if (sh > 0) {
          Y = 2
          H = 3
        } else if (kw > 0) {
          Y = 4
          H = 3
        } else if (ja > 0) {
          Y = 3
          H = 2
        } else {
          Y = 5
          H = 1
        }
      } else {
        Y = 5
        H = 1
      }
      break

    case 2:
      if (inbi >= 1) {
        if (sh > 0) {
          Y = 2
          H = 3
        } else if (ja > 0) {
          Y = 3
          H = 2
        } else if (kw > 0) {
          Y = 4
          H = 3
        } else {
          Y = 5
          H = 1
        }
      } else {
        Y = 5
        H = 1
      }
      break

    case 3:
      if (inbi >= 3) {
        if (ja >= 2) {
          Y = 3
          H = 2
        } else {
          Y = 2
          H = 3
        }
      } else if (ja >= 2) {
        if (bi > 0) {
          Y = 1
          H = 5
        } else {
          Y = 5
          H = 1
        }
      } else {
        Y = 5
        H = 1
      }
      break

    case 4:
      if (inbi >= 3) {
        if (sh > 0) {
          Y = 2
          H = 3
        } else if (kw >= 2) {
          Y = 4
          H = 3
        } else {
          Y = 3
          H = 2
        }
      } else if (ja >= 2) {
        if (bi > 0) {
          Y = 1
          H = 5
        } else {
          Y = 5
          H = 1
        }
      } else {
        Y = 5
        H = 1
      }
      break

    case 5:
      if (inbi >= 3) {
        if (ja > 0) {
          Y = 4
          H = 3
        } else if (sh > 0) {
          Y = 2
          H = 3
        } else {
          Y = 4
          H = 3
        }
      } else if (ja >= 3) {
        if (bi > 0) {
          Y = 1
          H = 5
        } else {
          Y = 5
          H = 1
        }
      } else {
        Y = 5
        H = 1
      }
      break

    case 6:
      if (inbi >= 1) {
        if (sh > 0) {
          Y = 2
          H = 3
        } else if (ja > 0) {
          Y = 3
          H = 2
        } else if (kw > 0) {
          Y = 4
          H = 3
        } else {
          Y = 1
          H = 5
        }
      } else if (kw >= 3) {
        Y = 5
        H = 1
      } else if (ja >= 3) {
        Y = 1
        H = 5
      } else {
        Y = 5
        H = 1
      }
      break

    case 7:
      if (inbi >= 1) {
        if (sh > 0) {
          Y = 2
          H = 3
        } else if (kw > 0) {
          Y = 4
          H = 3
        } else if (ja > 0) {
          Y = 3
          H = 2
        } else {
          Y = 1
          H = 5
        }
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else {
        Y = 1
        H = 5
      }
      break

    case 8:
      if (inbi >= 3) {
        Y = 2
        H = 3
      } else if (kw >= 2) {
        if (inn > 0) {
          Y = 5
          H = 1
        } else {
          Y = 1
          H = 5
        }
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else {
        Y = 1
        H = 5
      }
      break

    case 9:
      if (inbi >= 2) {
        if (kw > 0) {
          Y = 4
          H = 3
        } else if (sh > 0) {
          Y = 2
          H = 3
        } else {
          Y = 3
          H = 2
        }
      } else if (ja >= 2) {
        Y = 1
        H = 5
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else {
        Y = 1
        H = 5
      }
      break

    case 10:
      if (inbi >= 3) {
        if (ja > 0) {
          Y = 4
          H = 3
        } else if (sh > 0) {
          if (inn >= 3) {
            Y = 4
            H = 3
          } else {
            Y = 2
            H = 3
          }
        } else {
          Y = 4
          H = 3
        }
      } else if (kw >= 2) {
        if (inn > 0) {
          Y = 5
          H = 1
        } else {
          Y = 1
          H = 5
        }
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else {
        Y = 1
        H = 5
      }
      break

    case 11:
      if (inbi >= 3) {
        if (inn >= 2) {
          if (ja > 0) {
            Y = 3
            H = 2
          } else {
            Y = 2
            H = 3
          }
        } else {
          Y = 2
          H = 3
        }
      } else {
        Y = 5
        H = 1
      }
      break

    case 12:
      if (inbi >= 3) {
        if (inn >= 2) {
          if (ja > 0) {
            Y = 3
            H = 2
          } else {
            Y = 2
            H = 3
          }
        } else {
          Y = 2
          H = 3
        }
      } else if (ja >= 2) {
        Y = 1
        H = 5
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else {
        Y = 1
        H = 5
      }
      break

    case 13:
      if (inbi >= 5) {
        Y = 2
        H = 3
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else if (bi > 0) {
        Y = 1
        H = 5
      } else if (ja > 0) {
        Y = 3
        H = 2
      } else {
        Y = 2
        H = 3
      }
      break

    case 14:
      if (inbi >= 5) {
        Y = 2
        H = 3
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else if (bi > 0) {
        Y = 1
        H = 5
      } else if (kw >= 3) {
        Y = 3
        H = 4
      } else {
        Y = 2
        H = 3
      }
      break

    case 15:
      if (inbi >= 5) {
        Y = 2
        H = 3
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else if (bi > 0) {
        if (bi >= 2) {
          Y = 1
          H = 5
        } else if (ja > 0) {
          Y = 3
          H = 2
        } else {
          Y = 2
          H = 3
        }
      } else if (ja > 0) {
        Y = 3
        H = 2
      } else if (kw >= 4) {
        Y = 4
        H = 3
      } else {
        Y = 2
        H = 3
      }
      break

    case 16:
      if (inbi >= 3) {
        if (sh > 0) {
          Y = 3
          H = 2
        } else if (kw > 0) {
          Y = 4
          H = 3
        } else {
          Y = 3
          H = 4
        }
      } else if (ja >= 2) {
        if (bi > 0) {
          Y = 1
          H = 5
        } else {
          Y = 5
          H = 1
        }
      } else {
        Y = 5
        H = 1
      }
      break

    case 17:
      if (bi >= 3) {
        if (sh > 0) {
          Y = 2
          H = 3
        } else if (kw > 0) {
          Y = 4
          H = 3
        } else {
          Y = 3
          H = 2
        }
      } else if (bi >= 2) {
        Y = 1
        H = 5
      } else if (inn > 0) {
        if (inn >= 2) {
          Y = 5
          H = 1
        } else {
          Y = 1
          H = 5
        }
      } else if (bi > 0) {
        Y = 1
        H = 5
      } else if (kw >= 3) {
        Y = 4
        H = 3
      } else {
        Y = 1
        H = 5
      }
      break

    case 18:
      if (inbi >= 5) {
        Y = 2
        H = 3
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else if (bi > 0) {
        Y = 1
        H = 5
      } else if (kw >= 3) {
        Y = 3
        H = 4
      } else {
        Y = 2
        H = 3
      }
      break

    case 19:
      if (inbi >= 4) {
        if (bi >= 3) {
          if (sh > 0) {
            Y = 2
            H = 3
          } else {
            Y = 3
            H = 4
          }
        } else {
          Y = 3
          H = 4
        }
      } else if (bi > 0) {
        Y = 1
        H = 5
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else if (kw >= 3) {
        Y = 4
        H = 3
      } else {
        Y = 3
        H = 4
      }
      break

    case 20:
      if (inbi >= 5) {
        if (inn >= 3) {
          Y = 3
          H = 2
        } else {
          Y = 4
          H = 3
        }
      } else if (inn >= 2) {
        Y = 5
        H = 1
      } else if (bi >= 2) {
        if (inn > 0) {
          Y = 5
          H = 1
        } else {
          Y = 1
          H = 5
        }
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else if (ja >= 3) {
        Y = 3
        H = 4
      } else if (kw >= 3) {
        Y = 4
        H = 3
      } else {
        Y = 3
        H = 4
      }
      break

    case 21:
      if (inbi >= 3) {
        if (sh >= 2) {
          if (ja > 0) {
            Y = 3
            H = 2
          } else {
            Y = 4
            H = 3
          }
        } else if (inn >= 3) {
          if (ja > 0) {
            Y = 3
            H = 4
          } else {
            Y = 4
            H = 3
          }
        } else {
          Y = 4
          H = 3
        }
      } else {
        Y = 5
        H = 1
      }
      break

    case 22:
      if (inbi >= 3) {
        Y = 4
        H = 3
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else {
        Y = 1
        H = 5
      }
      break

    case 23:
      if (inbi >= 5) {
        if (bi >= 3) {
          Y = 2
          H = 3
        } else {
          Y = 4
          H = 3
        }
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else if (bi > 0) {
        Y = 1
        H = 5
      } else if (sh >= 2) {
        Y = 2
        H = 3
      } else {
        Y = 4
        H = 3
      }
      break

    case 24:
      if (inbi >= 5) {
        if (inn >= 3) {
          Y = 3
          H = 4
        } else {
          Y = 4
          H = 3
        }
      } else if (inn >= 2) {
        Y = 5
        H = 1
      } else if (bi >= 2) {
        if (inn > 0) {
          Y = 5
          H = 1
        } else {
          Y = 1
          H = 5
        }
      } else if (inn > 0) {
        Y = 5
        H = 1
      } else if (ja >= 3) {
        Y = 3
        H = 4
      } else if (kw >= 3) {
        Y = 4
        H = 3
      } else {
        Y = 3
        H = 4
      }
      break

    case 25:
      if (inbi >= 5) {
        Y = 4
        H = 3
      } else if (inn > 0) {
        if (inn >= 2) {
          Y = 5
          H = 1
        } else if (ja > 0) {
          if (bi > 0) {
            Y = 5
            H = 1
          } else {
            Y = 4
            H = 3
          }
        } else {
          Y = 5
          H = 1
        }
      } else if (bi > 0) {
        if (bi >= 2) {
          Y = 1
          H = 5
        } else {
          Y = 4
          H = 3
        }
      } else if (sh >= 3) {
        Y = 3
        H = 4
      } else {
        Y = 4
        H = 3
      }
      break

    default:
      Y = 1
      H = 2
      break
  }

  return { Y: toYongsinCode(Y), H: toYongsinCode(H) }
}

export function deriveFullRoles(Y: YongsinCode, H: YongsinCode): {
  usefulCode: YongsinCode
  favorableCode: YongsinCode
  harmfulCode: YongsinCode
  adverseCode: YongsinCode
  reserveCode: YongsinCode
  usefulElement: string
  favorableElement: string
  harmfulElement: string
  adverseElement: string
  reserveElement: string
} {
  const usefulCode = Y
  const favorableCode = H
  const harmfulCode = wrapCode(Y + 3)
  const adverseCode = wrapCode(H + 3)
  const reserveCode = toYongsinCode(15 - (usefulCode + favorableCode + harmfulCode + adverseCode))

  return {
    usefulCode,
    favorableCode,
    harmfulCode,
    adverseCode,
    reserveCode,
    usefulElement: CODE_TO_ELEMENT[usefulCode],
    favorableElement: CODE_TO_ELEMENT[favorableCode],
    harmfulElement: CODE_TO_ELEMENT[harmfulCode],
    adverseElement: CODE_TO_ELEMENT[adverseCode],
    reserveElement: CODE_TO_ELEMENT[reserveCode],
  }
}

export function findYong(input: YongsinDecisionInput): YongsinDecisionResult {
  const paljayuk = extractPaljayukSipsin(input)
  const paljayuk1 = extractPaljayuk1Sipsin(input)
  const counts = countSipsinCategories(paljayuk1)

  const hyung = determineHyung(paljayuk[3] ?? "", paljayuk[4] ?? "")
  const { Y, H } = deriveYongHee(hyung, counts)
  const roles = deriveFullRoles(Y, H)

  const yongsinInput = toCalculationInput(input)
  const yongToSipsin = calculateYongToSipsin(yongsinInput)
  const yongChungan = calculateYongChungan(yongsinInput, yongToSipsin)

  return {
    usefulCode: roles.usefulCode,
    favorableCode: roles.favorableCode,
    harmfulCode: roles.harmfulCode,
    adverseCode: roles.adverseCode,
    reserveCode: roles.reserveCode,
    usefulElement: roles.usefulElement,
    favorableElement: roles.favorableElement,
    harmfulElement: roles.harmfulElement,
    adverseElement: roles.adverseElement,
    reserveElement: roles.reserveElement,
    yongToSipsin,
    yongChungan,
  }
}
