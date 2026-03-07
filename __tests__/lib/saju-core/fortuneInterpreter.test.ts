import { describe, expect, it } from "vitest"
import { FortuneTellerService } from "@/lib/saju-core/facade"
import {
  classifyBranchRoleLabel,
  classifyCurrentFortuneElement,
  classifyStemRoleLabel,
  getElementRoleProfile,
  summarizePillarRoleLabels,
} from "@/lib/saju-core/saju/elementRoleProfiles"
import { calculateYongToSipsin } from "@/lib/saju-core/saju/yongsinFlows"
import {
  getFortuneYearMarkerFullText,
  getFortuneYearMarkerInsight,
  resolveFortuneYearMarkers,
} from "@/lib/saju-core/saju/fortuneYearMarkers"
import {
  getFortuneTimelineAnnotationFullText,
  getFortuneTimelineAnnotationInsight,
} from "@/lib/saju-core/saju/fortuneTimelineAnnotations"
import {
  calculateJuyeokGanSerial,
  calculateJuyeokJiSerial,
  calculateJuyeokPairSerial,
} from "@/lib/saju-core/saju/juyeokTrigrams"
import { advanceLegacyCycle, getFiveElementGroup } from "@/lib/saju-core/saju/legacyCycles"
import { DatabaseResultRetriever } from "@/lib/saju-core/saju/fortuneInterpreter"
import {
  CalculatorType,
  GenderBasedCalculator,
} from "@/lib/saju-core/saju/fortuneCalculatorBase"
import { isSupportedProfileId } from "@/lib/saju-core/saju/fortuneProfiles"

const BASE_REQUEST = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  gender: "M" as const,
  timezone: "Asia/Seoul",
}

// ──────────────────────────────────────────────
// DatabaseResultRetriever
// ──────────────────────────────────────────────
describe("DatabaseResultRetriever", () => {
  it("prefixed keys can still be resolved by numeric metadata", () => {
    const retriever = new DatabaseResultRetriever({
      S087: {
        SS05: {
          num: 5,
          numerical: 0,
          data: "오늘의 총운 테스트",
        },
      },
    })

    expect(retriever.getResult("S087", "05")).toEqual(["오늘의 총운 테스트", "0"])
  })

  it("numeric expressions can fall back to the canonical suffixed key", () => {
    const retriever = new DatabaseResultRetriever({
      S088: {
        SS05: {
          num: 185,
          numerical: 0,
          data: "오늘의 애정운 테스트",
        },
        JSS05: {
          num: 230,
          numerical: 0,
          data: "다른 변형 텍스트",
        },
      },
    })

    expect(retriever.getResult("S088", "05")).toEqual(["오늘의 애정운 테스트", "0"])
  })

  it("exact key match takes priority over suffix fallback", () => {
    // "5"라는 정확한 키가 있으면 SS05보다 먼저 반환되어야 함
    const retriever = new DatabaseResultRetriever({
      S090: {
        "5": { num: 5, numerical: 3, data: "정확 매칭 텍스트" },
        SS05: { num: 5, numerical: 0, data: "접미사 매칭 텍스트" },
      },
    })

    expect(retriever.getResult("S090", "5")).toEqual(["정확 매칭 텍스트", "3"])
  })

  it("missing table returns empty strings", () => {
    // 존재하지 않는 테이블 조회 시 빈 값 반환
    const retriever = new DatabaseResultRetriever({ S087: {} })
    expect(retriever.getResult("NONEXISTENT", "05")).toEqual(["", ""])
  })

  it("missing key in dict structure returns empty strings", () => {
    // 키가 없고 접미사·메타데이터 모두 불일치할 때 빈 값 반환
    const retriever = new DatabaseResultRetriever({
      S091: {
        SS99: { num: 99, numerical: 0, data: "99번 텍스트" },
      },
    })

    expect(retriever.getResult("S091", "05")).toEqual(["", ""])
  })

  it("list-structure lookup matches DB_express via candidates", () => {
    // 배열 구조에서 DB_express가 후보 목록에 포함되면 매칭되어야 함
    const retriever = new DatabaseResultRetriever({
      S092: [
        { DB_express: "5", DB_data: "리스트 정확매칭", DB_numerical: "2" },
        { DB_express: "10", DB_data: "다른 항목", DB_numerical: "0" },
      ],
    })

    // "05" → 후보에 "5"도 포함 → DB_express "5" 항목이 매칭
    expect(retriever.getResult("S092", "05")).toEqual(["리스트 정확매칭", "2"])
  })

  it("list-structure returns empty strings when no match", () => {
    const retriever = new DatabaseResultRetriever({
      S093: [
        { DB_express: "99", DB_data: "없는 텍스트", DB_numerical: "0" },
      ],
    })

    expect(retriever.getResult("S093", "05")).toEqual(["", ""])
  })

  it("metadata fallback resolves via num field when all keys are non-numeric", () => {
    // 모든 키가 비숫자(SSYY 형태)이고 num 필드로만 식별 가능한 경우
    const retriever = new DatabaseResultRetriever({
      S094: {
        SSYY: { num: 5, numerical: 7, data: "메타데이터 폴백 텍스트" },
      },
    })

    // "5"는 숫자 → 메타데이터 폴백 허용 → num=5인 레코드 반환
    expect(retriever.getResult("S094", "5")).toEqual(["메타데이터 폴백 텍스트", "7"])
  })

  it("preferred columns are honored before generic data fields", () => {
    const retriever = new DatabaseResultRetriever({
      T022: {
        "07": {
          data: "기본 텍스트",
          DB_data_m: "남성 전용 텍스트",
          DB_data_w: "여성 전용 텍스트",
          numerical: 4,
        },
      },
    })

    expect(retriever.getResult("T022", "07", { preferredColumns: ["DB_data_w"] })).toEqual([
      "여성 전용 텍스트",
      "4",
    ])
    expect(retriever.getResult("T022", "07", { preferredColumns: ["DB_data_m"] })).toEqual([
      "남성 전용 텍스트",
      "4",
    ])
  })

  it("numeric expressions can resolve trailing-space keys for gendered tables", () => {
    const retriever = new DatabaseResultRetriever({
      S081: {
        "7 ": {
          data: "",
          DB_data_m: "남성 오행 보완 포인트",
          DB_data_w: "여성 오행 보완 포인트",
          numerical: 2,
        },
      },
    })

    expect(retriever.getResult("S081", "07", { preferredColumns: ["DB_data_w"] })).toEqual([
      "여성 오행 보완 포인트",
      "2",
    ])
  })
})

describe("GenderBasedCalculator", () => {
  it("selects the gender-specific source column when available", () => {
    const retriever = new DatabaseResultRetriever({
      T022: {
        "07": {
          data: "기본 텍스트",
          DB_data_m: "남성 전용 텍스트",
          DB_data_w: "여성 전용 텍스트",
          numerical: 9,
        },
      },
    })

    const calculator = new GenderBasedCalculator(
      {
        tableName: "T022",
        calculatorType: CalculatorType.GENDER_BASED,
        expressionFields: ["western_zodiac_number"],
        genderColumns: { M: "DB_data_m", F: "DB_data_w" },
      },
      retriever
    )

    const femaleResult = calculator.calculate({
      yearStem: "갑(甲)",
      yearBranch: "자(子)",
      monthStem: "갑(甲)",
      monthBranch: "자(子)",
      dayStem: "갑(甲)",
      dayBranch: "자(子)",
      hourStem: "갑(甲)",
      hourBranch: "자(子)",
      gender: "F",
      additionalData: { birth_date: "1980-07-30" },
    })

    const maleResult = calculator.calculate({
      yearStem: "갑(甲)",
      yearBranch: "자(子)",
      monthStem: "갑(甲)",
      monthBranch: "자(子)",
      dayStem: "갑(甲)",
      dayBranch: "자(子)",
      hourStem: "갑(甲)",
      hourBranch: "자(子)",
      gender: "남자",
      additionalData: { birth_date: "1980-07-30" },
    })

    expect(femaleResult.expression).toBe("07")
    expect(femaleResult.text).toBe("여성 전용 텍스트")
    expect(maleResult.text).toBe("남성 전용 텍스트")
    expect(maleResult.numerical).toBe("9")
  })

  it("supports semantic aliases for day stem keyed tables", () => {
    const retriever = new DatabaseResultRetriever({
      S081: {
        "01": {
          data: "",
          DB_data_m: "남성 오행 보완 포인트",
          DB_data_w: "여성 오행 보완 포인트",
          numerical: 2,
        },
      },
    })

    const calculator = new GenderBasedCalculator(
      {
        tableName: "S081",
        calculatorType: CalculatorType.GENDER_BASED,
        expressionFields: ["day_stem_index"],
        genderColumns: { M: "DB_data_m", F: "DB_data_w" },
      },
      retriever
    )

    const result = calculator.calculate({
      yearStem: "갑(甲)",
      yearBranch: "자(子)",
      monthStem: "갑(甲)",
      monthBranch: "자(子)",
      dayStem: "갑(甲)",
      dayBranch: "자(子)",
      hourStem: "갑(甲)",
      hourBranch: "자(子)",
      gender: "남자",
      additionalData: { birth_date: "1980-07-30" },
    })

    expect(result.expression).toBe("01")
    expect(result.text).toBe("남성 오행 보완 포인트")
    expect(result.numerical).toBe("2")
  })

  it("keeps legacy gendered narrative aliases working", () => {
    const retriever = new DatabaseResultRetriever({
      T022: {
        "07": {
          data: "기본 텍스트",
          DB_data_m: "남성 전용 텍스트",
          DB_data_w: "여성 전용 텍스트",
          numerical: 9,
        },
      },
    })

    const calculator = new GenderBasedCalculator(
      {
        tableName: "T022",
        calculatorType: CalculatorType.GENDER_BASED,
        expressionFields: ["combined_value"],
        genderColumns: { M: "DB_data_m", F: "DB_data_w" },
      },
      retriever
    )

    expect(
      calculator.calculate({
        yearStem: "갑(甲)",
        yearBranch: "자(子)",
        monthStem: "갑(甲)",
        monthBranch: "자(子)",
        dayStem: "갑(甲)",
        dayBranch: "자(子)",
        hourStem: "갑(甲)",
        hourBranch: "자(子)",
        gender: "F",
        additionalData: { birth_date: "1980-07-30" },
      }).expression
    ).toBe("07")
  })

  it("keeps legacy day stem aliases working", () => {
    const retriever = new DatabaseResultRetriever({
      S085: {
        "01": {
          data: "",
          DB_data_m: "남성 선천적기질운",
          DB_data_w: "여성 선천적기질운",
          numerical: 4,
        },
      },
    })

    const calculator = new GenderBasedCalculator(
      {
        tableName: "S085",
        calculatorType: CalculatorType.GENDER_BASED,
        expressionFields: ["day_stem_num"],
        genderColumns: { M: "DB_data_m", F: "DB_data_w" },
      },
      retriever
    )

    const result = calculator.calculate({
      yearStem: "갑(甲)",
      yearBranch: "자(子)",
      monthStem: "갑(甲)",
      monthBranch: "자(子)",
      dayStem: "갑(甲)",
      dayBranch: "자(子)",
      hourStem: "갑(甲)",
      hourBranch: "자(子)",
      gender: "남자",
      additionalData: { birth_date: "1980-07-30" },
    })

    expect(result.expression).toBe("01")
    expect(result.text).toBe("남성 선천적기질운")
    expect(result.numerical).toBe("4")
  })
})

describe("elementRoleProfiles", () => {
  it("classifies current fortune elements using semantic role buckets", () => {
    const profile = getElementRoleProfile("甲子")

    expect(classifyCurrentFortuneElement(profile.usefulCode, profile)).toBe("01")
    expect(classifyCurrentFortuneElement(profile.favorableCode, profile)).toBe("01")
    expect(classifyCurrentFortuneElement(profile.harmfulCode, profile)).toBe("02")
    expect(classifyCurrentFortuneElement(profile.adverseCode, profile)).toBe("02")

    const neutralCode = ["1", "2", "3", "4", "5"].find(
      (code) =>
        code !== profile.usefulCode &&
        code !== profile.favorableCode &&
        code !== profile.harmfulCode &&
        code !== profile.adverseCode
    )

    expect(neutralCode).toBeDefined()
    expect(classifyCurrentFortuneElement(neutralCode ?? "1", profile)).toBe("03")
    expect(profile.sourceTitleKey).toBe("甲子")
    expect(profile.primary.usefulElement).toBeTruthy()
    expect(profile.secondary.favorableElement).toBeTruthy()
    expect(classifyStemRoleLabel("丙", profile)).toBe("용신")
    expect(classifyBranchRoleLabel("辰", profile)).toBe("한신")
    expect(
      summarizePillarRoleLabels(
        {
          year: "甲",
          month: "乙",
          day: "丙",
          hour: "丁",
        },
        {
          year: "子",
          month: "丑",
          day: "寅",
          hour: "卯",
        },
        profile
      )
    ).toEqual({
      yearStemRole: "희신",
      yearBranchRole: "기신",
      monthStemRole: "희신",
      monthBranchRole: "한신",
      dayStemRole: "용신",
      dayBranchRole: "희신",
      hourStemRole: "용신",
      hourBranchRole: "희신",
    })
  })
})

describe("yongsinFlows", () => {
  it("derives S026-compatible yong_to_sipsin keys from pillar sipsin composition", () => {
    expect(
      calculateYongToSipsin({
        yearStem: "갑(甲)",
        yearBranch: "오(午)",
        monthStem: "병(丙)",
        monthBranch: "자(子)",
        dayStem: "갑(甲)",
        dayBranch: "인(寅)",
        hourStem: "정(丁)",
        hourBranch: "오(午)",
        gender: "M",
      })
    ).toBe("03")
  })
})

describe("juyeokTrigrams", () => {
  it("builds gan/ji/pair serials from the shared trigram mapping", () => {
    expect(calculateJuyeokGanSerial("갑", "오")).toBe("1")
    expect(calculateJuyeokJiSerial("오", "오")).toBe("1")
    expect(calculateJuyeokPairSerial("갑", "오", "오")).toBe("11")
  })
})

describe("legacyCycles", () => {
  it("keeps the legacy five-element grouping and cycle advance behavior", () => {
    expect(getFiveElementGroup("03")).toBe(1)
    expect(getFiveElementGroup("06")).toBe(2)
    expect(getFiveElementGroup("11")).toBe(3)
    expect(getFiveElementGroup("09")).toBe(4)
    expect(getFiveElementGroup("12")).toBe(5)

    expect(advanceLegacyCycle(15, 5, 10)).toBe(1)
    expect(advanceLegacyCycle(14, 10, 12)).toBe(1)
  })
})

describe("fortuneYearMarkers", () => {
  it("resolves cheondeok and cheondeokhap markers from legacy month/year rules", () => {
    expect(
      resolveFortuneYearMarkers({
        monthBranch: "子",
        targetYearStem: "甲",
        targetYearBranch: "巳",
      })
    ).toEqual(["천덕귀인", "천덕합"])
  })

  it("resolves woldeok and woldeokhap markers from legacy month/year rules", () => {
    expect(
      resolveFortuneYearMarkers({
        monthBranch: "寅",
        targetYearStem: "辛",
        targetYearBranch: "酉",
      })
    ).toEqual(["월덕합"])

    expect(
      resolveFortuneYearMarkers({
        monthBranch: "寅",
        targetYearStem: "丙",
        targetYearBranch: "戌",
      })
    ).toEqual(["월덕귀인", "생기"])
  })

  it("resolves saenggi and cheonui branch markers from legacy month/year rules", () => {
    expect(
      resolveFortuneYearMarkers({
        monthBranch: "子",
        targetYearStem: "庚",
        targetYearBranch: "申",
      })
    ).toEqual(["생기"])

    expect(
      resolveFortuneYearMarkers({
        monthBranch: "子",
        targetYearStem: "壬",
        targetYearBranch: "亥",
      })
    ).toEqual(["월덕귀인", "천의"])
  })

  it("provides compact explanatory insights for known markers", () => {
    expect(getFortuneYearMarkerInsight("천덕귀인")).toContain("도움")
    expect(getFortuneYearMarkerInsight("생기")).toContain("확장")
    expect(getFortuneYearMarkerInsight("없는표식")).toBeNull()
  })

  it("provides full explanatory text for known markers", () => {
    expect(getFortuneYearMarkerFullText("천덕귀인")).toContain("회복의 발판")
    expect(getFortuneYearMarkerFullText("천의")).toContain("생활 리듬")
    expect(getFortuneYearMarkerFullText("없는표식")).toBeNull()
  })
})

describe("fortuneTimelineAnnotations", () => {
  it("covers extra timeline labels beyond year markers", () => {
    expect(getFortuneTimelineAnnotationInsight("양인")).toContain("충돌")
    expect(getFortuneTimelineAnnotationFullText("공망")).toContain("기대와 결과 사이")
    expect(getFortuneTimelineAnnotationFullText("역마살(驛馬殺)")).toContain("이동")
    expect(getFortuneTimelineAnnotationFullText("없는표식")).toBeNull()
  })
})

// ──────────────────────────────────────────────
// isSupportedProfileId
// ──────────────────────────────────────────────
describe("isSupportedProfileId()", () => {
  it("'basic' is a supported profile ID", () => {
    expect(isSupportedProfileId("basic")).toBe(true)
  })

  it("'daily_fortune' is a supported profile ID", () => {
    expect(isSupportedProfileId("daily_fortune")).toBe(true)
  })

  it("'birth_season_fortune' is a supported profile ID", () => {
    expect(isSupportedProfileId("birth_season_fortune")).toBe(true)
  })

  it("unknown IDs return false", () => {
    expect(isSupportedProfileId("not_a_profile")).toBe(false)
    expect(isSupportedProfileId("")).toBe(false)
    expect(isSupportedProfileId("saju_10")).toBe(false)
  })
})

// ──────────────────────────────────────────────
// FortuneTellerService.getSajuFortune()
// ──────────────────────────────────────────────
describe("FortuneTellerService.getSajuFortune()", () => {
  it("daily_fortune profile entries are populated", () => {
    const service = new FortuneTellerService()
    const result = service.getSajuFortune(BASE_REQUEST, "daily_fortune")

    const entries = result.fortuneProfileResult?.sections.flatMap((section) => section.entries) ?? []

    expect(entries).toHaveLength(6)
    expect(entries.every((entry) => entry.fullText.trim().length > 0)).toBe(true)
  })

  it("dangsaju_lifetime_overview populates S128, S131, and S132", () => {
    const service = new FortuneTellerService()
    const result = service.getSajuFortune(BASE_REQUEST, "dangsaju_lifetime_overview")

    const entries = result.fortuneProfileResult?.sections.flatMap((section) => section.entries) ?? []
    const targetEntries = entries.filter((entry) => ["S128", "S131", "S132"].includes(entry.tableCode))

    expect(targetEntries).toHaveLength(3)
    expect(targetEntries.every((entry) => entry.fullText.trim().length > 0)).toBe(true)
  })

  it("misfortune_relief populates the S126 sal풀이 entry", () => {
    const service = new FortuneTellerService()
    const result = service.getSajuFortune(BASE_REQUEST, "misfortune_relief")

    const entries = result.fortuneProfileResult?.sections.flatMap((section) => section.entries) ?? []
    const s126Entry = entries.find((entry) => entry.tableCode === "S126")

    expect(s126Entry).toBeDefined()
    expect(s126Entry?.fullText.trim().length).toBeGreaterThan(0)
  })

  it("lifetime_overview populates the S014 current outlook entry", () => {
    const service = new FortuneTellerService()
    const result = service.getSajuFortune(BASE_REQUEST, "lifetime_overview")

    const entries = result.fortuneProfileResult?.sections.flatMap((section) => section.entries) ?? []
    const s014Entry = entries.find((entry) => entry.tableCode === "S014")

    expect(s014Entry).toBeDefined()
    expect(s014Entry?.fullText.trim().length).toBeGreaterThan(0)
    expect(s014Entry?.status).toBe("resolved")
    expect(s014Entry?.lookupKey).toBeTruthy()
  })

  it("new_year_fortune populates the S026 yongsin-to-sipsin entry", () => {
    const service = new FortuneTellerService()
    const result = service.getSajuFortune(BASE_REQUEST, "new_year_fortune")

    const entries = result.fortuneProfileResult?.sections.flatMap((section) => section.entries) ?? []
    const s026Entry = entries.find((entry) => entry.tableCode === "S026")

    expect(s026Entry).toBeDefined()
    expect(s026Entry?.status).toBe("resolved")
    expect(s026Entry?.lookupKey).toMatch(/^\d{2}$/)
    expect(s026Entry?.fullText.trim().length).toBeGreaterThan(0)
  })

  it("new_year_fortune populates restored S095~S101 entries", () => {
    const service = new FortuneTellerService()
    const result = service.getSajuFortune(BASE_REQUEST, "new_year_fortune")

    const entries = result.fortuneProfileResult?.sections.flatMap((section) => section.entries) ?? []
    const targetEntries = entries.filter((entry) =>
      ["S095", "S097", "S098", "S099", "S100", "S101"].includes(entry.tableCode)
    )
    const s101Entry = targetEntries.find((entry) => entry.tableCode === "S101")

    expect(targetEntries).toHaveLength(6)
    expect(targetEntries.every((entry) => entry.fullText.trim().length > 0)).toBe(true)
    expect(s101Entry?.fullText).toContain("1월")
    expect(s101Entry?.fullText).toContain("12월")
  })

  it("tojeong_yearly_fortune populates restored S106~S110 entries", () => {
    const service = new FortuneTellerService()
    const result = service.getSajuFortune(BASE_REQUEST, "tojeong_yearly_fortune")

    const entries = result.fortuneProfileResult?.sections.flatMap((section) => section.entries) ?? []
    const targetEntries = entries.filter((entry) =>
      ["S106", "S107", "S108", "S109", "S110"].includes(entry.tableCode)
    )
    const s110Entry = targetEntries.find((entry) => entry.tableCode === "S110")

    expect(targetEntries).toHaveLength(5)
    expect(targetEntries.every((entry) => entry.fullText.trim().length > 0)).toBe(true)
    expect(s110Entry?.fullText).toContain("1월")
    expect(s110Entry?.fullText).toContain("12월")
  })

  it("early_life_fortune populates the J023 ziwei career entry", () => {
    const service = new FortuneTellerService()
    const result = service.getSajuFortune(BASE_REQUEST, "early_life_fortune")

    const entries = result.fortuneProfileResult?.sections.flatMap((section) => section.entries) ?? []
    const j023Entry = entries.find((entry) => entry.tableCode === "J023")

    expect(j023Entry).toBeDefined()
    expect(j023Entry?.status).toBe("resolved")
    expect(j023Entry?.fullText.trim().length).toBeGreaterThan(0)
  })

  it("ten_year_fortune_cycle builds synthetic great-fortune sections", () => {
    const service = new FortuneTellerService()
    const result = service.getSajuFortune(BASE_REQUEST, "ten_year_fortune_cycle")

    const sections = result.fortuneProfileResult?.sections ?? []
    const entries = sections.flatMap((section) => section.entries)
    const timelineEntry = entries.find((entry) => entry.tableCode === "GF_TIMELINE")
    const periodsEntry = entries.find((entry) => entry.tableCode === "GF_PERIODS")

    expect(result.fortuneProfileResult?.profile.id).toBe("ten_year_fortune_cycle")
    expect(sections).toHaveLength(2)
    expect(timelineEntry?.status).toBe("resolved")
    expect(timelineEntry?.fullText).toContain("현재 기준")
    expect(timelineEntry?.fullText).toContain("천간 십성")
    expect(timelineEntry?.fullText).toContain("연도별 표식 해설")
    expect(periodsEntry?.status).toBe("resolved")
    expect(periodsEntry?.fullText).toContain("진행 방향")
    expect(periodsEntry?.fullText).toContain("현재 대운")
    expect(timelineEntry?.oneLineSummary.length ?? 0).toBeGreaterThan(0)
  })

  it("birth_season_fortune profile returns a result with sections", () => {
    // isSupportedProfileId 경로 → 프로필 ID로 직접 조회
    const service = new FortuneTellerService()
    const result = service.getSajuFortune(BASE_REQUEST, "birth_season_fortune")

    expect(result.fortuneProfileResult).toBeDefined()
    expect(result.fortuneProfileResult?.sections.length).toBeGreaterThan(0)
    expect(result.fortuneProfileResult?.profile.id).toBe("birth_season_fortune")
  })

  it("psychology_profile returns a result with sections", () => {
    const service = new FortuneTellerService()
    const result = service.getSajuFortune(BASE_REQUEST, "psychology_profile")

    expect(result.fortuneProfileResult).toBeDefined()
    expect(result.fortuneProfileResult?.profile.id).toBe("psychology_profile")
  })

  it("unknown profileId falls back to basic without throwing", () => {
    // 미지원 프로필 ID → enum 파싱 실패 → basic으로 폴백
    const service = new FortuneTellerService()
    expect(() => service.getSajuFortune(BASE_REQUEST, "totally_unknown_profile_xyz")).not.toThrow()
  })

  it("fortune_type in inputData is null when using direct profileId", () => {
    // profileId 경로 사용 시 fortune_type은 null로 설정됨
    const service = new FortuneTellerService()
    const result = service.getSajuFortune(BASE_REQUEST, "daily_fortune")

    expect(result.inputData.fortune_type).toBeNull()
    expect(result.inputData.fortune_type_description).toBeTruthy()
  })
})
