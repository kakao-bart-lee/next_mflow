/**
 * @module elementRoleProfiles
 * @description
 * 용신 역할 프로필 로더 모듈 (정본/Source of Truth).
 * 
 * 책임:
 * - toC_yongsin_01 테이블에서 primary/secondary/tertiary 역할 프로필 로드
 * - 용신 코드(1-5)를 오행 요소(목화토금수)로 매핑
 * - 팔자 각 주(年月日時)의 역할 판정(용신/희신/기신/구신/한신)
 * 
 * 이 모듈이 정본(source of truth)입니다.
 * yongsinDecisionTree는 보조용 검증 모듈입니다.
 * 
 * @see yongsinDecisionTree - 보조 용신 결정 트리 (cross-validation용)
 * @see yongsinFlows - 용신→십신/천간/십이운성 매핑
 */

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

export type ElementRoleLabel = "용신" | "희신" | "기신" | "구신" | "한신" | null

export interface PillarRoleSummary {
  readonly yearStemRole: ElementRoleLabel
  readonly yearBranchRole: ElementRoleLabel
  readonly monthStemRole: ElementRoleLabel
  readonly monthBranchRole: ElementRoleLabel
  readonly dayStemRole: ElementRoleLabel
  readonly dayBranchRole: ElementRoleLabel
  readonly hourStemRole: ElementRoleLabel
  readonly hourBranchRole: ElementRoleLabel
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

function getStemElement(stemHanja: string): string | null {
  if (stemHanja === "甲" || stemHanja === "乙") return "木"
  if (stemHanja === "丙" || stemHanja === "丁") return "火"
  if (stemHanja === "戊" || stemHanja === "己") return "土"
  if (stemHanja === "庚" || stemHanja === "辛") return "金"
  if (stemHanja === "壬" || stemHanja === "癸") return "水"
  return null
}

function getBranchElement(branchHanja: string): string | null {
  if (branchHanja === "寅" || branchHanja === "卯") return "木"
  if (branchHanja === "巳" || branchHanja === "午") return "火"
  if (branchHanja === "申" || branchHanja === "酉") return "金"
  if (branchHanja === "亥" || branchHanja === "子") return "水"
  if (branchHanja === "辰" || branchHanja === "戌" || branchHanja === "丑" || branchHanja === "未") return "土"
  return null
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

export function classifyElementRoleLabel(targetElement: string, snapshot: ElementRoleSnapshot): ElementRoleLabel {
  if (snapshot.usefulElement === targetElement) return "용신"
  if (snapshot.favorableElement === targetElement) return "희신"
  if (snapshot.harmfulElement === targetElement) return "기신"
  if (snapshot.adverseElement === targetElement) return "구신"
  if (snapshot.reserveElement === targetElement) return "한신"
  return null
}

export function classifyStemRoleLabel(stemHanja: string, roleProfile: ElementRoleProfile): ElementRoleLabel {
  const element = getStemElement(stemHanja)
  return element ? classifyElementRoleLabel(element, roleProfile.primary) : null
}

export function classifyBranchRoleLabel(branchHanja: string, roleProfile: ElementRoleProfile): ElementRoleLabel {
  const element = getBranchElement(branchHanja)
  return element ? classifyElementRoleLabel(element, roleProfile.primary) : null
}

export function summarizePillarRoleLabels(
  stems: {
    readonly year: string
    readonly month: string
    readonly day: string
    readonly hour: string
  },
  branches: {
    readonly year: string
    readonly month: string
    readonly day: string
    readonly hour: string
  },
  roleProfile: ElementRoleProfile
): PillarRoleSummary {
  return {
    yearStemRole: classifyStemRoleLabel(stems.year, roleProfile),
    yearBranchRole: classifyBranchRoleLabel(branches.year, roleProfile),
    monthStemRole: classifyStemRoleLabel(stems.month, roleProfile),
    monthBranchRole: classifyBranchRoleLabel(branches.month, roleProfile),
    dayStemRole: classifyStemRoleLabel(stems.day, roleProfile),
    dayBranchRole: classifyBranchRoleLabel(branches.day, roleProfile),
    hourStemRole: classifyStemRoleLabel(stems.hour, roleProfile),
    hourBranchRole: classifyBranchRoleLabel(branches.hour, roleProfile),
  }
}
