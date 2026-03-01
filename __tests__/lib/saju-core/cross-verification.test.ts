/**
 * Cross-Verification Tests: saju-core vs lunar-javascript
 *
 * 사주 계산 정확도를 외부 라이브러리(lunar-javascript)와 비교 검증합니다.
 * lunar-javascript는 검증 전용(devDependency)으로 사용됩니다.
 *
 * 비교 방식:
 * - saju-core: FortuneTellerService.calculateSaju() → "갑(甲)" 형식
 * - lunar-javascript: Solar.fromYmdHms().getLunar().getEightChar() → "甲" 형식
 * - 한자 추출 후 비교 (extractHanja로 사주-core 출력에서 한자만 추출)
 */
import { describe, it, expect } from "vitest"
import { FortuneTellerService } from "@/lib/saju-core/facade"
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Solar } = require("lunar-javascript")
import {
  buildPillarComparison,
  formatComparisonSummary,
  type VerificationResult,
} from "@/lib/saju-core/test-utils/character-mapping"

const service = new FortuneTellerService()

// =============================================================================
// Test case definitions
// =============================================================================

interface TestCase {
  label: string
  birthDate: string
  birthTime: string
  gender: "M" | "F"
  /** 사주-core와 lunar-javascript 결과가 일치할 것으로 기대 */
  expectMatch: boolean
  /** 불일치 시 사유 */
  mismatchReason?: string
}

/**
 * 다양한 생년월일시 테스트 케이스 — 10개 이상
 *
 * 주의: 두 라이브러리 간 차이가 발생할 수 있는 케이스:
 * - 절입일(solar term entry) 근처 날짜: 월주 결정 기준 차이 가능
 * - 자시(23:00~01:00): 일주 경계 처리 차이 가능
 * - 시주 경계(홀수 시): 시주 천간 배정 차이 가능
 */
const TEST_CASES: TestCase[] = [
  {
    label: "1993년 10월 8일 오후 — 기본 검증 케이스",
    birthDate: "1993-10-08",
    birthTime: "14:37",
    gender: "M",
    expectMatch: true,
  },
  {
    label: "1990년 1월 15일 오후 — 입춘 전 (전년도 연주 적용)",
    birthDate: "1990-01-15",
    birthTime: "14:30",
    gender: "F",
    expectMatch: true,
  },
  {
    label: "1984년 2월 4일 정오 — 입춘일 (절입 경계)",
    birthDate: "1984-02-04",
    birthTime: "12:00",
    gender: "M",
    expectMatch: true,
  },
  {
    label: "2000년 6월 15일 오전 — 밀레니엄 연도",
    birthDate: "2000-06-15",
    birthTime: "09:30",
    gender: "M",
    expectMatch: true,
  },
  {
    label: "1985년 6월 15일 아침 — 표준 중간 날짜",
    birthDate: "1985-06-15",
    birthTime: "08:00",
    gender: "F",
    expectMatch: true,
  },
  {
    label: "1970년 3월 15일 새벽 — 오래된 날짜",
    birthDate: "1970-03-15",
    birthTime: "06:00",
    gender: "M",
    expectMatch: true,
  },
  {
    label: "1995년 8월 20일 저녁 — 유시(酉時)",
    birthDate: "1995-08-20",
    birthTime: "18:00",
    gender: "M",
    expectMatch: true,
  },
  {
    label: "1988년 4월 10일 새벽 — 인시(寅時) 중간",
    birthDate: "1988-04-10",
    birthTime: "04:00",
    gender: "F",
    expectMatch: true,
  },
  {
    label: "2005년 11월 22일 밤 — 해시(亥時)",
    birthDate: "2005-11-22",
    birthTime: "22:00",
    gender: "M",
    expectMatch: true,
  },
  {
    label: "1975년 9월 1일 정오 — 오시(午時)",
    birthDate: "1975-09-01",
    birthTime: "12:00",
    gender: "F",
    expectMatch: true,
  },
  {
    label: "2010년 2월 14일 아침 — 입춘 후 (진시 중간)",
    birthDate: "2010-02-14",
    birthTime: "08:00",
    gender: "M",
    expectMatch: true,
  },
  {
    label: "1960년 7월 7일 오후 — 경자년 신시(申時) 중간",
    birthDate: "1960-07-07",
    birthTime: "16:00",
    gender: "M",
    expectMatch: true,
  },
]

// =============================================================================
// Helper: Get lunar-javascript eight characters
// =============================================================================

interface LunarJsPillars {
  yearGan: string
  yearZhi: string
  monthGan: string
  monthZhi: string
  dayGan: string
  dayZhi: string
  timeGan: string
  timeZhi: string
}

function getLunarJsPillars(
  birthDate: string,
  birthTime: string
): LunarJsPillars {
  const [year, month, day] = birthDate.split("-").map(Number)
  const [hour, minute] = birthTime.split(":").map(Number)

  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0)
  const eightChar = solar.getLunar().getEightChar()

  return {
    yearGan: eightChar.getYearGan(),
    yearZhi: eightChar.getYearZhi(),
    monthGan: eightChar.getMonthGan(),
    monthZhi: eightChar.getMonthZhi(),
    dayGan: eightChar.getDayGan(),
    dayZhi: eightChar.getDayZhi(),
    timeGan: eightChar.getTimeGan(),
    timeZhi: eightChar.getTimeZhi(),
  }
}

// =============================================================================
// Helper: Build verification result
// =============================================================================

function verifyDate(tc: TestCase): VerificationResult {
  // 1. saju-core calculation
  const sajuResult = service.calculateSaju({
    birthDate: tc.birthDate,
    birthTime: tc.birthTime,
    gender: tc.gender,
    timezone: "Asia/Seoul",
  })
  const pillars = sajuResult.sajuData.pillars

  // 2. lunar-javascript calculation
  const lunar = getLunarJsPillars(tc.birthDate, tc.birthTime)

  // 3. Build comparisons for each pillar
  const comparisons = [
    buildPillarComparison("년", pillars.년.천간, pillars.년.지지, lunar.yearGan, lunar.yearZhi),
    buildPillarComparison("월", pillars.월.천간, pillars.월.지지, lunar.monthGan, lunar.monthZhi),
    buildPillarComparison("일", pillars.일.천간, pillars.일.지지, lunar.dayGan, lunar.dayZhi),
    buildPillarComparison("시", pillars.시.천간, pillars.시.지지, lunar.timeGan, lunar.timeZhi),
  ]

  const allMatch = comparisons.every((c) => c.match)

  return {
    birthDate: tc.birthDate,
    birthTime: tc.birthTime,
    gender: tc.gender,
    pillars: comparisons,
    allMatch,
    summary: allMatch ? "ALL MATCH" : "MISMATCH DETECTED",
  }
}

// =============================================================================
// Tests
// =============================================================================

describe("Cross-Verification: saju-core vs lunar-javascript", () => {
  describe("사주팔자 기둥 비교 (Four Pillars comparison)", () => {
    for (const tc of TEST_CASES) {
      it(tc.label, () => {
        const result = verifyDate(tc)
        const summary = formatComparisonSummary(result)

        if (tc.expectMatch) {
          // 일치를 기대하는 케이스: 모든 기둥이 일치해야 함
          for (const pillar of result.pillars) {
            expect(
              pillar.stemMatch,
              `${pillar.position}주 천간 불일치: saju-core=${pillar.sajuCore.stem} vs lunar-js=${pillar.lunarJs.stem}\n${summary}`
            ).toBe(true)
            expect(
              pillar.branchMatch,
              `${pillar.position}주 지지 불일치: saju-core=${pillar.sajuCore.branch} vs lunar-js=${pillar.lunarJs.branch}\n${summary}`
            ).toBe(true)
          }
        } else {
          // 불일치가 예상되는 케이스: 결과만 기록
          // eslint-disable-next-line no-console
          console.log(`[KNOWN DIFFERENCE] ${tc.mismatchReason}\n${summary}`)
        }
      })
    }
  })

  describe("개별 기둥 정확도 (Individual pillar accuracy)", () => {
    it("년주(年柱) — 입춘 전후로 정확히 전환된다", () => {
      // 2010-02-04 입춘 이전 → 2009년(기축) 연주
      // 2010-02-04 입춘 이후 → 2010년(경인) 연주
      const beforeIpchun = verifyDate({
        label: "",
        birthDate: "2010-02-03",
        birthTime: "12:00",
        gender: "M",
        expectMatch: true,
      })
      const afterIpchun = verifyDate({
        label: "",
        birthDate: "2010-02-14",
        birthTime: "12:00",
        gender: "M",
        expectMatch: true,
      })

      // 두 날짜의 년주가 달라야 함
      expect(beforeIpchun.pillars[0].sajuCore.stem).not.toBe(
        afterIpchun.pillars[0].sajuCore.stem
      )
    })

    it("일주(日柱) — 매일 순차적으로 변경된다", () => {
      const day1 = verifyDate({
        label: "",
        birthDate: "2000-01-01",
        birthTime: "12:00",
        gender: "M",
        expectMatch: true,
      })
      const day2 = verifyDate({
        label: "",
        birthDate: "2000-01-02",
        birthTime: "12:00",
        gender: "M",
        expectMatch: true,
      })

      // 연속 이틀의 일주가 달라야 함
      const day1Stem = day1.pillars[2].sajuCore.stem
      const day2Stem = day2.pillars[2].sajuCore.stem
      expect(day1Stem).not.toBe(day2Stem)
    })

    it("시주(時柱) — 시간대별로 정확하게 구분된다", () => {
      // 같은 날 다른 시간
      const morning = verifyDate({
        label: "",
        birthDate: "2000-06-15",
        birthTime: "06:00",
        gender: "M",
        expectMatch: true,
      })
      const evening = verifyDate({
        label: "",
        birthDate: "2000-06-15",
        birthTime: "18:00",
        gender: "M",
        expectMatch: true,
      })

      // 아침과 저녁의 시주가 달라야 함
      expect(morning.pillars[3].sajuCore.stem).not.toBe(
        evening.pillars[3].sajuCore.stem
      )
    })
  })

  describe("시진 경계 처리 차이 (Hour boundary convention)", () => {
    /**
     * saju-core와 lunar-javascript는 시진(時辰) 경계 처리가 다름:
     * - saju-core: 경계 시각을 이전 시진에 포함 (e.g., 07:00 → 묘시)
     * - lunar-javascript: 경계 시각을 다음 시진에 포함 (e.g., 07:00 → 진시)
     *
     * 이는 전통 명리학에서도 학파별로 견해가 다른 부분입니다.
     * 홀수시(01,03,05,07,09,11,13,15,17,19,21,23)가 경계입니다.
     */
    const BOUNDARY_HOURS = ["03:00", "07:00", "15:00"]

    for (const time of BOUNDARY_HOURS) {
      it(`${time} 경계에서 년/월/일주는 일치하고 시주만 차이난다`, () => {
        const result = verifyDate({
          label: "",
          birthDate: "2000-06-15",
          birthTime: time,
          gender: "M",
          expectMatch: false,
        })

        // 년/월/일주는 반드시 일치
        expect(result.pillars[0].match).toBe(true) // 년주
        expect(result.pillars[1].match).toBe(true) // 월주
        expect(result.pillars[2].match).toBe(true) // 일주

        // 시주는 경계 처리 차이로 불일치 가능
        // 불일치해도 정상 — 두 시스템의 convention 차이
      })
    }
  })

  describe("통계 요약 (Statistical summary)", () => {
    it("전체 테스트 케이스 중 매칭 비율이 80% 이상이다", () => {
      let totalPillars = 0
      let matchingPillars = 0

      for (const tc of TEST_CASES) {
        const result = verifyDate(tc)
        for (const pillar of result.pillars) {
          totalPillars++
          if (pillar.match) matchingPillars++
        }
      }

      const matchRate = (matchingPillars / totalPillars) * 100
      // eslint-disable-next-line no-console
      console.log(
        `\n📊 Cross-verification: ${matchingPillars}/${totalPillars} pillars match (${matchRate.toFixed(1)}%)`
      )

      // 최소 80% 이상 일치해야 함 (절입 경계 차이 허용)
      expect(matchRate).toBeGreaterThanOrEqual(80)
    })
  })
})
