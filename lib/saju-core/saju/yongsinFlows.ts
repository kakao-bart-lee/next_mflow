import { extractHanja } from "../utils"
import { getSipsinForBranch, getSipsinForStem } from "./constants"
import type { CalculationInput } from "./fortuneCalculatorBase"
import { getElementRoleProfile } from "./elementRoleProfiles"

const YONG_TO_SIPSIN_PAIR_BY_USEFUL_CODE: Readonly<
  Record<string, { readonly main: string; readonly secondary: string; readonly resolvedCode: string; readonly crowdedCode: string }>
> = {
  "1": { main: "비견", secondary: "겁재", resolvedCode: "01", crowdedCode: "02" },
  "2": { main: "식신", secondary: "상관", resolvedCode: "03", crowdedCode: "04" },
  "3": { main: "정재", secondary: "편재", resolvedCode: "06", crowdedCode: "05" },
  "4": { main: "정관", secondary: "편관", resolvedCode: "08", crowdedCode: "07" },
  "5": { main: "정인", secondary: "편인", resolvedCode: "10", crowdedCode: "09" },
}

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
