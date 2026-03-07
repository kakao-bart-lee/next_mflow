import { describe, expect, it } from "vitest"
import {
  countSipsinCategories,
  deriveFullRoles,
  deriveYongHee,
  determineHyung,
  extractPaljayuk1Sipsin,
  extractPaljayukSipsin,
  findYong,
  type YongsinDecisionInput,
} from "@/lib/saju-core/saju/yongsinDecisionTree"

const VALID_SIPSIN = new Set(["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"])
const VALID_ELEMENTS = new Set(["비겁", "식상", "재성", "관살", "인성"])

const TEST_CASES: YongsinDecisionInput[] = [
  { yearStem: "甲", yearBranch: "子", monthStem: "丙", monthBranch: "寅", dayStem: "甲", dayBranch: "子", hourStem: "甲", hourBranch: "子" },
  { yearStem: "甲", yearBranch: "子", monthStem: "戊", monthBranch: "丑", dayStem: "乙", dayBranch: "丑", hourStem: "甲", hourBranch: "子" },
  { yearStem: "甲", yearBranch: "子", monthStem: "庚", monthBranch: "寅", dayStem: "丙", dayBranch: "寅", hourStem: "甲", hourBranch: "子" },
  { yearStem: "甲", yearBranch: "子", monthStem: "壬", monthBranch: "卯", dayStem: "丁", dayBranch: "卯", hourStem: "甲", hourBranch: "子" },
  { yearStem: "甲", yearBranch: "子", monthStem: "甲", monthBranch: "辰", dayStem: "戊", dayBranch: "辰", hourStem: "甲", hourBranch: "子" },
  { yearStem: "甲", yearBranch: "子", monthStem: "丙", monthBranch: "巳", dayStem: "己", dayBranch: "巳", hourStem: "甲", hourBranch: "子" },
  { yearStem: "甲", yearBranch: "子", monthStem: "戊", monthBranch: "午", dayStem: "庚", dayBranch: "午", hourStem: "甲", hourBranch: "子" },
  { yearStem: "甲", yearBranch: "子", monthStem: "庚", monthBranch: "未", dayStem: "辛", dayBranch: "未", hourStem: "甲", hourBranch: "子" },
  { yearStem: "甲", yearBranch: "子", monthStem: "壬", monthBranch: "申", dayStem: "壬", dayBranch: "申", hourStem: "甲", hourBranch: "子" },
  { yearStem: "甲", yearBranch: "子", monthStem: "甲", monthBranch: "酉", dayStem: "癸", dayBranch: "酉", hourStem: "甲", hourBranch: "子" },
]

describe("yongsinDecisionTree", () => {
  describe("extractPaljayukSipsin", () => {
    it("returns 7 values", () => {
      for (const testCase of TEST_CASES) {
        expect(extractPaljayukSipsin(testCase)).toHaveLength(7)
      }
    })

    it("all values are valid sipsin names or empty string", () => {
      for (const testCase of TEST_CASES) {
        const values = extractPaljayukSipsin(testCase)
        for (const value of values) {
          expect(value === "" || VALID_SIPSIN.has(value)).toBe(true)
        }
      }
    })
  })

  describe("extractPaljayuk1Sipsin", () => {
    it("returns 5 values", () => {
      for (const testCase of TEST_CASES) {
        expect(extractPaljayuk1Sipsin(testCase)).toHaveLength(5)
      }
    })
  })

  describe("countSipsinCategories", () => {
    it("inn/bi/sh/ja/kw sum equals input array length", () => {
      const paljayuk1 = ["편인", "비견", "식신", "편재", "편관"]
      const counts = countSipsinCategories(paljayuk1)
      const sum = counts.inn + counts.bi + counts.sh + counts.ja + counts.kw
      expect(sum).toBe(paljayuk1.length)
    })

    it("all counts are non-negative", () => {
      for (const testCase of TEST_CASES) {
        const counts = countSipsinCategories(extractPaljayuk1Sipsin(testCase))
        expect(counts.inn).toBeGreaterThanOrEqual(0)
        expect(counts.bi).toBeGreaterThanOrEqual(0)
        expect(counts.sh).toBeGreaterThanOrEqual(0)
        expect(counts.ja).toBeGreaterThanOrEqual(0)
        expect(counts.kw).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe("determineHyung", () => {
    it("returns 1-25 for all 25 sipsin group combinations", () => {
      const groups = ["편인", "비견", "식신", "편재", "편관"]
      for (const monthBranchSipsin of groups) {
        for (const dayBranchSipsin of groups) {
          const hyung = determineHyung(monthBranchSipsin, dayBranchSipsin)
          expect(hyung).toBeGreaterThanOrEqual(1)
          expect(hyung).toBeLessThanOrEqual(25)
        }
      }
    })
  })

  describe("deriveYongHee + deriveFullRoles", () => {
    it("returns valid element-role code set in range 1-5", () => {
      for (let hyung = 1; hyung <= 25; hyung += 1) {
        const { Y, H } = deriveYongHee(hyung, { inn: 1, bi: 1, sh: 1, ja: 1, kw: 1 })
        const roles = deriveFullRoles(Y, H)

        expect(roles.usefulCode).toBeGreaterThanOrEqual(1)
        expect(roles.usefulCode).toBeLessThanOrEqual(5)
        expect(roles.favorableCode).toBeGreaterThanOrEqual(1)
        expect(roles.favorableCode).toBeLessThanOrEqual(5)
        expect(roles.harmfulCode).toBeGreaterThanOrEqual(1)
        expect(roles.harmfulCode).toBeLessThanOrEqual(5)
        expect(roles.adverseCode).toBeGreaterThanOrEqual(1)
        expect(roles.adverseCode).toBeLessThanOrEqual(5)
        expect(roles.reserveCode).toBeGreaterThanOrEqual(1)
        expect(roles.reserveCode).toBeLessThanOrEqual(5)
      }
    })
  })

  describe("findYong", () => {
    it("returns valid codes (1-5) for all test cases", () => {
      for (const testCase of TEST_CASES) {
        const result = findYong(testCase)
        expect(result.usefulCode).toBeGreaterThanOrEqual(1)
        expect(result.usefulCode).toBeLessThanOrEqual(5)
        expect(result.favorableCode).toBeGreaterThanOrEqual(1)
        expect(result.favorableCode).toBeLessThanOrEqual(5)
        expect(result.harmfulCode).toBeGreaterThanOrEqual(1)
        expect(result.harmfulCode).toBeLessThanOrEqual(5)
        expect(result.adverseCode).toBeGreaterThanOrEqual(1)
        expect(result.adverseCode).toBeLessThanOrEqual(5)
        expect(result.reserveCode).toBeGreaterThanOrEqual(1)
        expect(result.reserveCode).toBeLessThanOrEqual(5)
      }
    })

    it("returns valid element names", () => {
      for (const testCase of TEST_CASES) {
        const result = findYong(testCase)
        expect(VALID_ELEMENTS.has(result.usefulElement)).toBe(true)
        expect(VALID_ELEMENTS.has(result.favorableElement)).toBe(true)
        expect(VALID_ELEMENTS.has(result.harmfulElement)).toBe(true)
        expect(VALID_ELEMENTS.has(result.adverseElement)).toBe(true)
        expect(VALID_ELEMENTS.has(result.reserveElement)).toBe(true)
      }
    })

    it("returns non-empty yongToSipsin and yongChungan", () => {
      for (const testCase of TEST_CASES) {
        const result = findYong(testCase)
        expect(result.yongToSipsin).toBeTruthy()
        expect(result.yongChungan).toBeTruthy()
      }
    })
  })
})
