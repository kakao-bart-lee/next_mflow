/**
 * 지장간(地支藏干) Calculator - Earth Branch Hidden Stems
 * Based on PHP reference implementation for traditional Korean fortune-telling
 *
 * This module calculates the hidden heavenly stems within earthly branches
 * and their corresponding ten gods (십신/十神) relationships.
 */

import { getSipsinForStem } from './constants';

/** 지장간 데이터 타입 (stem1, stem2, stem3) */
export type JijangganTuple = readonly [string, string, string];

/** 지장간 기둥별 데이터 */
export interface PillarJijanggan {
  stem1: string;
  stem1_sipsin: string;
  stem2: string;
  stem2_sipsin: string;
  stem3: string;
  stem3_sipsin: string;
}

/** 사주 사기둥의 지장간 전체 데이터 */
export interface FourPillarsJijanggan {
  year: PillarJijanggan;
  month: PillarJijanggan;
  day: PillarJijanggan;
  hour: PillarJijanggan;
}

/** 십신만 포함한 기둥별 데이터 */
export interface PillarSipsin {
  stem1_sipsin: string;
  stem2_sipsin: string;
  stem3_sipsin: string;
}

/** 사주 사기둥의 십신 전체 데이터 */
export interface FourPillarsSipsin {
  year: PillarSipsin;
  month: PillarSipsin;
  day: PillarSipsin;
  hour: PillarSipsin;
}

/**
 * Calculator for 지장간(地支藏干) - Earth Branch Hidden Stems
 *
 * Calculates the hidden heavenly stems within earthly branches and determines
 * the ten gods (십신/十神) relationships based on the day master (일간/日干).
 */
export class JijangganCalculator {
  /** Korean display to Korean character conversion */
  private static readonly DISPLAY_TO_KOREAN: Record<string, string> = {
    갑: '甲',
    을: '乙',
    병: '丙',
    정: '丁',
    무: '戊',
    기: '己',
    경: '庚',
    신: '辛',
    임: '壬',
    계: '癸',
  };

  /**
   * 지지별 지장간 데이터 (地支藏干)
   * 각 지지에 숨어있는 천간들을 3개까지 정의
   */
  private static readonly EARTHLY_BRANCH_HIDDEN_STEMS: Record<string, JijangganTuple> = {
    자: ['계', '', ''], // 子 - 癸
    축: ['기', '계', '신'], // 丑 - 己癸辛
    인: ['갑', '병', '무'], // 寅 - 甲丙戊
    묘: ['을', '', ''], // 卯 - 乙
    진: ['무', '을', '계'], // 辰 - 戊乙癸
    사: ['병', '무', '경'], // 巳 - 丙戊庚
    오: ['병', '기', '정'], // 午 - 丙己丁
    미: ['기', '정', '을'], // 未 - 己丁乙
    신: ['경', '임', '무'], // 申 - 庚壬戊
    유: ['신', '', ''], // 酉 - 辛
    술: ['무', '신', '정'], // 戌 - 戊辛丁
    해: ['임', '갑', ''], // 亥 - 壬甲
  };

  /** 십신 설명 */
  private static readonly SIPSIN_DESCRIPTIONS: Record<string, string> = {
    비견: '比肩 - 같은 기운, 동등한 관계',
    겁재: '劫財 - 재물을 빼앗는 기운',
    식신: '食神 - 표현과 재능의 기운',
    상관: '傷官 - 창의와 변화의 기운',
    편재: '偏財 - 유동적 재물의 기운',
    정재: '正財 - 안정적 재물의 기운',
    편관: '偏官 - 칠살, 강한 압박의 기운',
    정관: '正官 - 권위와 책임의 기운',
    편인: '偏印 - 편인수, 특별한 학문의 기운',
    정인: '正印 - 학문과 명예의 기운',
  };

  /** Cache for jijanggan lookups */
  private jijangganCache = new Map<string, JijangganTuple>();

  /** Cache for sipsin lookups */
  private sipsinCache = new Map<string, string>();

  /**
   * 지지에서 지장간을 추출
   *
   * @param branchDisplay - 지지 display format (e.g., '오', '미')
   * @returns Tuple of (stem1, stem2, stem3) - 지장간 3개 (빈 자리는 빈 문자열)
   */
  getJijangganFromBranch(branchDisplay: string): JijangganTuple {
    if (this.jijangganCache.has(branchDisplay)) {
      return this.jijangganCache.get(branchDisplay)!;
    }

    const result =
      JijangganCalculator.EARTHLY_BRANCH_HIDDEN_STEMS[branchDisplay] ?? (['', '', ''] as const);
    this.jijangganCache.set(branchDisplay, result);
    return result;
  }

  /**
   * 사주 사기둥의 지장간과 십신을 모두 계산
   *
   * @param dayMasterKorean - 일간 (Korean character, e.g., '甲')
   * @param yearBranch - 년지 (display format, e.g., '오')
   * @param monthBranch - 월지 (display format, e.g., '미')
   * @param dayBranch - 일지 (display format, e.g., '진')
   * @param hourBranch - 시지 (display format, e.g., '해')
   * @returns Dictionary with complete jijanggan and sipsin information
   */
  calculatePillarJijanggan(
    dayMasterKorean: string,
    yearBranch: string,
    monthBranch: string,
    dayBranch: string,
    hourBranch: string
  ): FourPillarsJijanggan {
    const calculateForBranch = (branch: string): PillarJijanggan => {
      const [stem1, stem2, stem3] = this.getJijangganFromBranch(branch);
      const sipsin1 = stem1 ? this.getSipsin(dayMasterKorean, stem1) : '';
      const sipsin2 = stem2 ? this.getSipsin(dayMasterKorean, stem2) : '';
      const sipsin3 = stem3 ? this.getSipsin(dayMasterKorean, stem3) : '';

      return {
        stem1,
        stem1_sipsin: sipsin1,
        stem2,
        stem2_sipsin: sipsin2,
        stem3,
        stem3_sipsin: sipsin3,
      };
    };

    return {
      year: calculateForBranch(yearBranch),
      month: calculateForBranch(monthBranch),
      day: calculateForBranch(dayBranch),
      hour: calculateForBranch(hourBranch),
    };
  }

  /**
   * Get the 십신(十神) relationship between day master and target stem
   *
   * @param dayMasterKorean - Day master in Korean character (e.g., '甲') or display (e.g., '갑')
   * @param targetStemDisplay - Target stem in display format (e.g., '갑')
   * @returns 십신 name (e.g., '비견', '겁재', etc.) or empty string if not found
   */
  getSipsin(dayMasterKorean: string, targetStemDisplay: string): string {
    const cacheKey = `${dayMasterKorean}:${targetStemDisplay}`;

    if (this.sipsinCache.has(cacheKey)) {
      return this.sipsinCache.get(cacheKey)!;
    }

    // constants.ts의 통합 십신 매핑 사용
    const result = getSipsinForStem(dayMasterKorean, targetStemDisplay);
    this.sipsinCache.set(cacheKey, result);
    return result;
  }

  /**
   * Calculate 십신 for all 지장간 positions
   *
   * @param dayMasterKorean - Day master in Korean character (e.g., '甲')
   * @param jijangganData - Dictionary containing jijanggan information for all pillars
   * @returns Dictionary with 십신 mappings for each position
   */
  calculateJijangganSipsin(
    dayMasterKorean: string,
    jijangganData: Partial<Record<string, Record<string, string>>>
  ): FourPillarsSipsin {
    const calculateForPillar = (pillarData?: Record<string, string>): PillarSipsin => {
      if (!pillarData) {
        return {
          stem1_sipsin: '',
          stem2_sipsin: '',
          stem3_sipsin: '',
        };
      }

      const result: PillarSipsin = {
        stem1_sipsin: '',
        stem2_sipsin: '',
        stem3_sipsin: '',
      };

      for (let i = 1; i <= 3; i++) {
        const stemKey = `stem${i}`;
        const sipsinKey = `stem${i}_sipsin` as keyof PillarSipsin;

        if (stemKey in pillarData) {
          const stemValue = pillarData[stemKey];
          if (stemValue && stemValue !== '') {
            result[sipsinKey] = this.getSipsin(dayMasterKorean, stemValue);
          }
        }
      }

      return result;
    };

    return {
      year: calculateForPillar(jijangganData.year),
      month: calculateForPillar(jijangganData.month),
      day: calculateForPillar(jijangganData.day),
      hour: calculateForPillar(jijangganData.hour),
    };
  }

  /**
   * Calculate 십신 for all 지장간 positions using tuple input format
   *
   * @param dayMasterKorean - Day master in Korean character (e.g., '甲')
   * @param yearJijanggan - Year 지장간 as (stem1, stem2, stem3) tuple
   * @param monthJijanggan - Month 지장간 as (stem1, stem2, stem3) tuple
   * @param dayJijanggan - Day 지장간 as (stem1, stem2, stem3) tuple
   * @param hourJijanggan - Hour 지장간 as (stem1, stem2, stem3) tuple
   * @returns Dictionary with comprehensive 십신 mappings
   */
  calculateComprehensiveJijangganSipsin(
    dayMasterKorean: string,
    yearJijanggan: JijangganTuple,
    monthJijanggan: JijangganTuple,
    dayJijanggan: JijangganTuple,
    hourJijanggan: JijangganTuple
  ): FourPillarsSipsin {
    // Convert tuple format to dictionary format
    const jijangganData = {
      year: {
        stem1: yearJijanggan[0] || '',
        stem2: yearJijanggan[1] || '',
        stem3: yearJijanggan[2] || '',
      },
      month: {
        stem1: monthJijanggan[0] || '',
        stem2: monthJijanggan[1] || '',
        stem3: monthJijanggan[2] || '',
      },
      day: {
        stem1: dayJijanggan[0] || '',
        stem2: dayJijanggan[1] || '',
        stem3: dayJijanggan[2] || '',
      },
      hour: {
        stem1: hourJijanggan[0] || '',
        stem2: hourJijanggan[1] || '',
        stem3: hourJijanggan[2] || '',
      },
    };

    return this.calculateJijangganSipsin(dayMasterKorean, jijangganData);
  }

  /**
   * Get description for a 십신 type
   *
   * @param sipsin - 십신 name (e.g., '비견', '겁재')
   * @returns Description string or empty string if not found
   */
  getSipsinDescription(sipsin: string): string {
    return JijangganCalculator.SIPSIN_DESCRIPTIONS[sipsin] ?? '';
  }

  /**
   * Validate input parameters
   *
   * @param dayMasterKorean - Day master Korean character
   * @param jijangganStems - List of jijanggan stems
   * @returns Tuple of [isValid, errorMessage]
   */
  validateInputs(dayMasterKorean: string, jijangganStems: string[]): [boolean, string] {
    // Validate day master (한글 또는 한자 천간)
    const validDayMasters = new Set([
      ...Object.keys(JijangganCalculator.DISPLAY_TO_KOREAN),
      ...Object.values(JijangganCalculator.DISPLAY_TO_KOREAN),
    ]);

    if (!validDayMasters.has(dayMasterKorean)) {
      return [false, `Invalid day master: ${dayMasterKorean}`];
    }

    // Validate stems (allow empty strings)
    const validStems = new Set([...Object.keys(JijangganCalculator.DISPLAY_TO_KOREAN), '']);

    for (const stem of jijangganStems) {
      if (!validStems.has(stem)) {
        return [false, `Invalid stem: ${stem}`];
      }
    }

    return [true, ''];
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.jijangganCache.clear();
    this.sipsinCache.clear();
  }
}

/**
 * Factory function to create a JijangganCalculator instance
 *
 * @returns Configured JijangganCalculator instance
 */
export function createJijangganCalculator(): JijangganCalculator {
  return new JijangganCalculator();
}
