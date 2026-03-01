/**
 * 12신살 계산기 메인 모듈
 * Main module for 12 Spirit Killers calculator
 */

import type { SinsalInput, BaseSinsalCalculator } from './types';
import { SamsapGroup } from './types';
import { createCalculators } from './calculators';
import { calculate12Sinsal } from './utils';
import { SAMSAP_GROUP_VALUES } from './mappings';

// Re-export types and enums
export * from './types';

// Re-export utilities
export * from './utils';

// Re-export mappings (for advanced users)
export * from './mappings';

/**
 * 종합 신살 분석기
 * Comprehensive Sinsal Analyzer
 */
export class ComprehensiveSinsalAnalyzer {
  private readonly calculators: Record<string, BaseSinsalCalculator>;

  constructor() {
    this.calculators = createCalculators();
  }

  /**
   * 종합 신살 분석 수행
   * Perform comprehensive sinsal analysis
   */
  analyze(
    yearH: string,
    monthH: string,
    dayH: string,
    hourH: string,
    yearE: string,
    monthE: string,
    dayE: string,
    hourE: string,
    gender: string = 'M'
  ): { 신살: Record<string, string | null>; 길신: Record<string, string | null> } {
    const inputData: SinsalInput = {
      year_h: yearH,
      month_h: monthH,
      day_h: dayH,
      hour_h: hourH,
      year_e: yearE,
      month_e: monthE,
      day_e: dayE,
      hour_e: hourE,
      gender,
    };

    // 12신살 계산
    const sinsalResult = calculate12Sinsal(dayE, monthE, yearE, hourE);

    // 모든 길신 계산
    const gilsinResult: Record<string, string | null> = {};
    for (const calculator of Object.values(this.calculators)) {
      const result = calculator.calculate(inputData);
      Object.assign(gilsinResult, result);
    }

    return {
      신살: sinsalResult,
      길신: gilsinResult,
    };
  }
}

/**
 * 12신살과 모든 길신을 종합적으로 계산 (레거시 호환 함수)
 * Calculate comprehensive sinsal (legacy compatibility function)
 */
export function calculateComprehensiveSinsal(
  yearH: string,
  monthH: string,
  dayH: string,
  hourH: string,
  yearE: string,
  monthE: string,
  dayE: string,
  hourE: string,
  gender: string = 'M'
): { 신살: Record<string, string | null>; 길신: Record<string, string | null> } {
  const analyzer = new ComprehensiveSinsalAnalyzer();
  return analyzer.analyze(yearH, monthH, dayH, hourH, yearE, monthE, dayE, hourE, gender);
}

/**
 * 삼합 그룹 정보를 반환
 * Get Samsap group information
 */
export function getSamsapInfo(): Record<string, readonly string[]> {
  return {
    '금국(巳酉丑)': SAMSAP_GROUP_VALUES[SamsapGroup.SA_YU_CHUK],
    '수국(申子辰)': SAMSAP_GROUP_VALUES[SamsapGroup.SHIN_JA_JIN],
    '목국(亥卯未)': SAMSAP_GROUP_VALUES[SamsapGroup.HAE_MYO_MI],
    '화국(寅午戌)': SAMSAP_GROUP_VALUES[SamsapGroup.IN_O_SUL],
  };
}

/**
 * Factory function to create analyzer
 * 신살 분석기 생성 팩토리 함수
 */
export function createSinsalAnalyzer(): ComprehensiveSinsalAnalyzer {
  return new ComprehensiveSinsalAnalyzer();
}
