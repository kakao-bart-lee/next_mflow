import { getDataLoader } from "./dataLoader"

const ELEMENT_CODE_BY_HANJA: Record<string, string> = {
  木: "1",
  火: "2",
  土: "3",
  "金": "4",
  金: "4",
  水: "5",
}

export interface ElementRoleProfile {
  readonly usefulCode: string
  readonly favorableCode: string
  readonly harmfulCode: string
  readonly adverseCode: string
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

  return {
    usefulCode: ELEMENT_CODE_BY_HANJA[String(record.yo1 ?? "")] ?? "1",
    favorableCode: ELEMENT_CODE_BY_HANJA[String(record.he1 ?? "")] ?? "1",
    harmfulCode: ELEMENT_CODE_BY_HANJA[String(record.gi1 ?? "")] ?? "1",
    adverseCode: ELEMENT_CODE_BY_HANJA[String(record.gu1 ?? "")] ?? "1",
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
