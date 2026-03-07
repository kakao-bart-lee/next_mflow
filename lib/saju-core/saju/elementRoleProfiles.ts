import { getDataLoader } from "./dataLoader"

const ELEMENT_CODE_BY_HANJA: Record<string, string> = {
  木: "1",
  火: "2",
  土: "3",
  "金": "4",
  金: "4",
  水: "5",
}

export interface ElementRoleSnapshot {
  readonly usefulElement: string
  readonly favorableElement: string
  readonly harmfulElement: string
  readonly adverseElement: string
  readonly reserveElement: string
}

export interface ElementRoleProfile {
  readonly sourceTitleKey: string
  readonly sourceNumber: string
  readonly usefulCode: string
  readonly favorableCode: string
  readonly harmfulCode: string
  readonly adverseCode: string
  readonly reserveCode: string
  readonly primary: ElementRoleSnapshot
  readonly secondary: ElementRoleSnapshot
  readonly tertiary: ElementRoleSnapshot
}

function buildElementRoleSnapshot(record: Record<string, unknown>, suffix: "1" | "2" | "3"): ElementRoleSnapshot {
  return {
    usefulElement: String(record[`yo${suffix}`] ?? ""),
    favorableElement: String(record[`he${suffix}`] ?? ""),
    harmfulElement: String(record[`gi${suffix}`] ?? ""),
    adverseElement: String(record[`gu${suffix}`] ?? ""),
    reserveElement: String(record[`ha${suffix}`] ?? ""),
  }
}

function getElementCode(hanja: string): string {
  return ELEMENT_CODE_BY_HANJA[hanja] ?? "1"
}

export function getElementRoleProfile(titleKey: string): ElementRoleProfile {
  const etcTables = getDataLoader().loadEtcTables() as Record<string, unknown>
  const rows = Array.isArray(etcTables.toC_yongsin_01) ? etcTables.toC_yongsin_01 : []
  const record = rows.find(
    (row): row is Record<string, unknown> =>
      typeof row === "object" && row !== null && typeof row.title === "string" && row.title === titleKey
  )
  if (!record) {
    throw new Error(`yongsin reference is unavailable for ${titleKey}`)
  }

  const primary = buildElementRoleSnapshot(record, "1")
  const secondary = buildElementRoleSnapshot(record, "2")
  const tertiary = buildElementRoleSnapshot(record, "3")

  return {
    sourceTitleKey: titleKey,
    sourceNumber: String(record.number ?? ""),
    usefulCode: getElementCode(primary.usefulElement),
    favorableCode: getElementCode(primary.favorableElement),
    harmfulCode: getElementCode(primary.harmfulElement),
    adverseCode: getElementCode(primary.adverseElement),
    reserveCode: getElementCode(primary.reserveElement),
    primary,
    secondary,
    tertiary,
  }
}

export function classifyCurrentFortuneElement(
  targetElementCode: string,
  roleProfile: ElementRoleProfile
): "01" | "02" | "03" {
  if (roleProfile.usefulCode === targetElementCode || roleProfile.favorableCode === targetElementCode) {
    return "01"
  }
  if (roleProfile.harmfulCode === targetElementCode || roleProfile.adverseCode === targetElementCode) {
    return "02"
  }
  return "03"
}
