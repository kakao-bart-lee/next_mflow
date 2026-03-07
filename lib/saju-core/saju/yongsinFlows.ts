import { extractHanja } from "../utils"
import { getSipsinForBranch, getSipsinForStem } from "./constants"
import type { CalculationInput } from "./fortuneCalculatorBase"
import { getElementRoleProfile } from "./elementRoleProfiles"
import { createLifecycleStageCalculator } from "./lifecycleStage"

const YONG_TO_SIPSIN_PAIR_BY_USEFUL_CODE: Readonly<
  Record<string, { readonly main: string; readonly secondary: string; readonly resolvedCode: string; readonly crowdedCode: string }>
> = {
  "1": { main: "비견", secondary: "겁재", resolvedCode: "01", crowdedCode: "02" },
  "2": { main: "식신", secondary: "상관", resolvedCode: "03", crowdedCode: "04" },
  "3": { main: "정재", secondary: "편재", resolvedCode: "06", crowdedCode: "05" },
  "4": { main: "정관", secondary: "편관", resolvedCode: "08", crowdedCode: "07" },
  "5": { main: "정인", secondary: "편인", resolvedCode: "10", crowdedCode: "09" },
}
const SIPSIN_LABEL_BY_YONG_CODE: Readonly<Record<string, string>> = {
  "01": "비견",
  "02": "겁재",
  "03": "식신",
  "04": "상관",
  "05": "편재",
  "06": "정재",
  "07": "편관",
  "08": "정관",
  "09": "편인",
  "10": "정인",
}
const HEAVENLY_STEM_SEQUENCE = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const
const LIFECYCLE_STAGE_INDEX: Readonly<Record<string, string>> = {
  "장생(長生)": "01",
  "목욕(沐浴)": "02",
  "관대(冠帶)": "03",
  "건록(建祿)": "04",
  "제왕(帝旺)": "05",
  "쇠(衰)": "06",
  "병(病)": "07",
  "사(死)": "08",
  "묘(墓)": "09",
  "절(絶)": "10",
  "태(胎)": "11",
  "양(養)": "12",
}

const lifecycleStageCalculator = createLifecycleStageCalculator()

function normalizeSipsinName(name: string): string {
  return name.trim()
}

export function calculateYongToSipsin(inputData: CalculationInput): string {
  const dayStemHanja = extractHanja(inputData.dayStem)
  const roleProfile = getElementRoleProfile(`${dayStemHanja}${extractHanja(inputData.monthBranch)}`)
  const defaultPair = YONG_TO_SIPSIN_PAIR_BY_USEFUL_CODE["1"]!
  const pair = YONG_TO_SIPSIN_PAIR_BY_USEFUL_CODE[roleProfile.usefulCode] ?? defaultPair

  const allSipsin = [
    getSipsinForStem(dayStemHanja, extractHanja(inputData.yearStem)),
    getSipsinForStem(dayStemHanja, extractHanja(inputData.monthStem)),
    getSipsinForStem(dayStemHanja, extractHanja(inputData.hourStem)),
    getSipsinForBranch(dayStemHanja, extractHanja(inputData.yearBranch)),
    getSipsinForBranch(dayStemHanja, extractHanja(inputData.monthBranch)),
    getSipsinForBranch(dayStemHanja, extractHanja(inputData.dayBranch)),
    getSipsinForBranch(dayStemHanja, extractHanja(inputData.hourBranch)),
  ].map(normalizeSipsinName)

  const mainCount = allSipsin.filter((value) => value === pair.main).length
  const secondaryCount = allSipsin.filter((value) => value === pair.secondary).length

  if ((mainCount === 1 || mainCount === 2) && secondaryCount === 0) {
    return pair.resolvedCode
  }
  if (mainCount !== 0 && mainCount !== 1 && mainCount !== 2) {
    return pair.crowdedCode
  }
  return pair.resolvedCode
}

export function calculateYongChungan(inputData: CalculationInput, yongToSipsin = calculateYongToSipsin(inputData)): string {
  const dayStemHanja = extractHanja(inputData.dayStem)
  const targetSipsin = SIPSIN_LABEL_BY_YONG_CODE[yongToSipsin]
  if (!targetSipsin) {
    return "01"
  }

  const targetIndex = HEAVENLY_STEM_SEQUENCE.findIndex((stemHanja) => getSipsinForStem(dayStemHanja, stemHanja) === targetSipsin)
  return String(targetIndex >= 0 ? targetIndex + 1 : 1).padStart(2, "0")
}

export function calculateWoon12Daygi(inputData: CalculationInput): string {
  const stage = lifecycleStageCalculator.getLifecycleStage(extractHanja(inputData.dayStem), extractHanja(inputData.dayBranch))
  return stage ? LIFECYCLE_STAGE_INDEX[stage] ?? "01" : "01"
}
