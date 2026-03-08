export function getFiveElementGroup(branchCode: string): number {
  switch (branchCode) {
    case "03":
    case "04":
      return 1
    case "06":
    case "07":
      return 2
    case "05":
    case "11":
    case "08":
    case "02":
      return 3
    case "09":
    case "10":
      return 4
    case "12":
    case "01":
    default:
      return 5
  }
}

export function advanceLegacyCycle(baseValue: number, currentYearBranchNumber: number, modulo: number): number {
  let value = (baseValue + currentYearBranchNumber) % modulo
  if (value === 0) {
    value = 1
  }
  return value
}
