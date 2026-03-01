/**
 * Character Mapping Utility for Cross-Verification
 * lunar-javascript(Chinese chars) ↔ saju-core(Korean display) 변환 유틸
 *
 * 용도: 외부 라이브러리(lunar-javascript)와 saju-core 계산 결과 비교 검증
 */

import {
  KOREAN_STEM_TO_DISPLAY,
  KOREAN_BRANCH_TO_DISPLAY,
} from '../saju/constants'
import { extractHanja, extractKorean } from '../utils'

// =============================================================================
// Reverse mappings: Korean display → Chinese character
// =============================================================================

/** 한글 천간 → 한자 천간 (e.g., '갑' → '甲') */
const KOREAN_DISPLAY_TO_CHINESE_STEM: Record<string, string> = Object.fromEntries(
  Object.entries(KOREAN_STEM_TO_DISPLAY).map(([chinese, korean]) => [korean, chinese])
)

/** 한글 지지 → 한자 지지 (e.g., '자' → '子') */
const KOREAN_DISPLAY_TO_CHINESE_BRANCH: Record<string, string> = Object.fromEntries(
  Object.entries(KOREAN_BRANCH_TO_DISPLAY).map(([chinese, korean]) => [korean, chinese])
)

// =============================================================================
// Conversion functions
// =============================================================================

/** Chinese stem character → Korean display (甲 → 갑) */
export function chineseStemToKorean(chinese: string): string {
  return KOREAN_STEM_TO_DISPLAY[chinese] ?? chinese
}

/** Chinese branch character → Korean display (子 → 자) */
export function chineseBranchToKorean(chinese: string): string {
  return KOREAN_BRANCH_TO_DISPLAY[chinese] ?? chinese
}

/** Korean stem display → Chinese character (갑 → 甲) */
export function koreanStemToChinese(korean: string): string {
  return KOREAN_DISPLAY_TO_CHINESE_STEM[korean] ?? korean
}

/** Korean branch display → Chinese character (자 → 子) */
export function koreanBranchToChinese(korean: string): string {
  return KOREAN_DISPLAY_TO_CHINESE_BRANCH[korean] ?? korean
}

// =============================================================================
// Pillar comparison types
// =============================================================================

export interface PillarComparison {
  position: '년' | '월' | '일' | '시'
  sajuCore: { stem: string; branch: string }
  lunarJs: { stem: string; branch: string }
  stemMatch: boolean
  branchMatch: boolean
  match: boolean
}

export interface VerificationResult {
  birthDate: string
  birthTime: string
  gender: string
  pillars: PillarComparison[]
  allMatch: boolean
  summary: string
}

// =============================================================================
// Comparison functions
// =============================================================================

/**
 * saju-core의 포맷된 천간/지지 문자열에서 한자를 추출하여 비교
 * saju-core format: "갑(甲)" → hanja: "甲"
 * lunar-javascript format: "甲" (pure Chinese)
 */
export function comparePillarComponent(
  sajuCoreFormatted: string,
  lunarJsChinese: string
): boolean {
  const sajuHanja = extractHanja(sajuCoreFormatted)
  return sajuHanja === lunarJsChinese
}

/**
 * Parse saju-core pillar output into components
 * "갑(甲)" → { korean: "갑", chinese: "甲" }
 */
export function parseSajuCorePillar(formatted: string): {
  korean: string
  chinese: string
} {
  return {
    korean: extractKorean(formatted),
    chinese: extractHanja(formatted),
  }
}

/**
 * Build a full pillar comparison between saju-core and lunar-javascript
 */
export function buildPillarComparison(
  position: '년' | '월' | '일' | '시',
  sajuCoreStem: string,
  sajuCoreBranch: string,
  lunarJsStem: string,
  lunarJsBranch: string
): PillarComparison {
  const sajuStem = parseSajuCorePillar(sajuCoreStem)
  const sajuBranch = parseSajuCorePillar(sajuCoreBranch)

  const stemMatch = sajuStem.chinese === lunarJsStem
  const branchMatch = sajuBranch.chinese === lunarJsBranch

  return {
    position,
    sajuCore: {
      stem: `${sajuStem.korean}(${sajuStem.chinese})`,
      branch: `${sajuBranch.korean}(${sajuBranch.chinese})`,
    },
    lunarJs: {
      stem: `${chineseStemToKorean(lunarJsStem)}(${lunarJsStem})`,
      branch: `${chineseBranchToKorean(lunarJsBranch)}(${lunarJsBranch})`,
    },
    stemMatch,
    branchMatch,
    match: stemMatch && branchMatch,
  }
}

/**
 * Format comparison result as readable string for test output
 */
export function formatComparisonSummary(result: VerificationResult): string {
  const lines = [
    `[${result.allMatch ? '✅ MATCH' : '❌ MISMATCH'}] ${result.birthDate} ${result.birthTime} (${result.gender})`,
  ]

  for (const p of result.pillars) {
    const status = p.match ? '✓' : '✗'
    lines.push(
      `  ${status} ${p.position}주: saju-core=${p.sajuCore.stem}${p.sajuCore.branch} | lunar-js=${p.lunarJs.stem}${p.lunarJs.branch}`
    )
  }

  return lines.join('\n')
}
