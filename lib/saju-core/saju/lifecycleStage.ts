/**
 * 십이운성 (12 Lifecycle Stages) Calculator
 *
 * This module calculates the lifecycle stages for Korean fortune-telling (사주)
 * based on the day heavenly stem and earthly branches of year, month, day, and hour.
 *
 * Converted from PHP reference implementation.
 */

/** Lifecycle stages result for all four pillars */
export interface LifecycleStagesResult {
  year: string | null;
  month: string | null;
  day: string | null;
  hour: string | null;
}

/**
 * Calculator for 십이운성 (12 Lifecycle Stages) in Korean fortune-telling
 */
export class LifecycleStageCalculator {
  // 십이운성 lifecycle stages mapping
  // Each heavenly stem has its own cycle through the 12 earthly branches
  private readonly LIFECYCLE_STAGES: Record<string, Record<string, string>> = {
    // 甲 (Yang Wood)
    甲: {
      亥: '장생(長生)', // Birth/Longevity
      子: '목욕(沐浴)', // Bathing
      丑: '관대(冠帶)', // Crown/Belt
      寅: '건록(建祿)', // Official
      卯: '제왕(帝旺)', // Emperor
      辰: '쇠(衰)', // Decline
      巳: '병(病)', // Sickness
      午: '사(死)', // Death
      未: '묘(墓)', // Tomb
      申: '절(絶)', // Extinction
      酉: '태(胎)', // Womb
      戌: '양(養)', // Nurturing
    },

    // 乙 (Yin Wood)
    乙: {
      午: '장생(長生)',
      巳: '목욕(沐浴)',
      辰: '관대(冠帶)',
      卯: '건록(建祿)',
      寅: '제왕(帝旺)',
      丑: '쇠(衰)',
      子: '병(病)',
      亥: '사(死)',
      戌: '묘(墓)',
      酉: '절(絶)',
      申: '태(胎)',
      未: '양(養)',
    },

    // 丙 (Yang Fire)
    丙: {
      寅: '장생(長生)',
      卯: '목욕(沐浴)',
      辰: '관대(冠帶)',
      巳: '건록(建祿)',
      午: '제왕(帝旺)',
      未: '쇠(衰)',
      申: '병(病)',
      酉: '사(死)',
      戌: '묘(墓)',
      亥: '절(絶)',
      子: '태(胎)',
      丑: '양(養)',
    },

    // 丁 (Yin Fire)
    丁: {
      酉: '장생(長生)',
      申: '목욕(沐浴)',
      未: '관대(冠帶)',
      午: '건록(建祿)',
      巳: '제왕(帝旺)',
      辰: '쇠(衰)',
      卯: '병(病)',
      寅: '사(死)',
      丑: '묘(墓)',
      子: '절(絶)',
      亥: '태(胎)',
      戌: '양(養)',
    },

    // 戊 (Yang Earth)
    戊: {
      寅: '장생(長生)',
      卯: '목욕(沐浴)',
      辰: '관대(冠帶)',
      巳: '건록(建祿)',
      午: '제왕(帝旺)',
      未: '쇠(衰)',
      申: '병(病)',
      酉: '사(死)',
      戌: '묘(墓)',
      亥: '절(絶)',
      子: '태(胎)',
      丑: '양(養)',
    },

    // 己 (Yin Earth)
    己: {
      酉: '장생(長生)',
      申: '목욕(沐浴)',
      未: '관대(冠帶)',
      午: '건록(建祿)',
      巳: '제왕(帝旺)',
      辰: '쇠(衰)',
      卯: '병(病)',
      寅: '사(死)',
      丑: '묘(墓)',
      子: '절(絶)',
      亥: '태(胎)',
      戌: '양(養)',
    },

    // 庚 (Yang Metal)
    庚: {
      巳: '장생(長生)',
      午: '목욕(沐浴)',
      未: '관대(冠帶)',
      申: '건록(建祿)',
      酉: '제왕(帝旺)',
      戌: '쇠(衰)',
      亥: '병(病)',
      子: '사(死)',
      丑: '묘(墓)',
      寅: '절(絶)',
      卯: '태(胎)',
      辰: '양(養)',
    },

    // 辛 (Yin Metal)
    辛: {
      子: '장생(長生)',
      亥: '목욕(沐浴)',
      戌: '관대(冠帶)',
      酉: '건록(建祿)',
      申: '제왕(帝旺)',
      未: '쇠(衰)',
      午: '병(病)',
      巳: '사(死)',
      辰: '묘(墓)',
      卯: '절(絶)',
      寅: '태(胎)',
      丑: '양(養)',
    },

    // 壬 (Yang Water)
    壬: {
      申: '장생(長生)',
      酉: '목욕(沐浴)',
      戌: '관대(冠帶)',
      亥: '건록(建祿)',
      子: '제왕(帝旺)',
      丑: '쇠(衰)',
      寅: '병(病)',
      卯: '사(死)',
      辰: '묘(墓)',
      巳: '절(絶)',
      午: '태(胎)',
      未: '양(養)',
    },

    // 癸 (Yin Water)
    癸: {
      卯: '장생(長生)',
      寅: '목욕(沐浴)',
      丑: '관대(冠帶)',
      子: '건록(建祿)',
      亥: '제왕(帝旺)',
      戌: '쇠(衰)',
      酉: '병(病)',
      申: '사(死)',
      未: '묘(墓)',
      午: '절(絶)',
      巳: '태(胎)',
      辰: '양(養)',
    },
  };

  // 한글 이름과 한자 매핑 테이블
  // Note: '신' appears in both stems (辛) and branches (申)
  // Python dict overwrites, so the last value (申) wins
  private readonly KOREAN_TO_HANJA_MAP: Record<string, string> = {
    // 천간 (Heavenly Stems)
    갑: '甲',
    을: '乙',
    병: '丙',
    정: '丁',
    무: '戊',
    기: '己',
    경: '庚',
    // 신: '辛',  // Commented out due to duplicate key - '신' also maps to '申' below
    임: '壬',
    계: '癸',

    // 지지 (Earthly Branches)
    자: '子',
    축: '丑',
    인: '寅',
    묘: '卯',
    진: '辰',
    사: '巳',
    오: '午',
    미: '未',
    신: '申', // This wins in Python due to dict overwrite behavior
    유: '酉',
    술: '戌',
    해: '亥',
  };

  /**
   * 입력 문자열을 정규화하여 한자만 추출합니다.
   *
   * Examples:
   *   "경(庚)" -> "庚"
   *   "갑" -> "甲"
   *   "庚" -> "庚"
   *   "자(子)" -> "子"
   *
   * @param inputStr - 입력 문자열 (한글, 한자, 또는 한글(한자) 형태)
   * @returns 정규화된 한자 문자
   */
  normalizeInput(inputStr: string): string {
    if (!inputStr) {
      return inputStr;
    }

    // 괄호 안의 한자 추출: 경(庚) -> 庚
    const hanjaInParentheses = inputStr.match(/\(([一-龯]+)\)/);
    if (hanjaInParentheses && hanjaInParentheses[1]) {
      return hanjaInParentheses[1];
    }

    // 한글을 한자로 변환: 경 -> 庚
    const hanjaValue = this.KOREAN_TO_HANJA_MAP[inputStr];
    if (hanjaValue) {
      return hanjaValue;
    }

    // 이미 한자인 경우 그대로 반환
    if (/[一-龯]+/.test(inputStr)) {
      return inputStr;
    }

    return inputStr;
  }

  /**
   * Get the lifecycle stage for a given day heavenly stem and earthly branch.
   *
   * @param dayHeavenlyStem - The heavenly stem of the day (천간) - 한글, 한자, 또는 한글(한자) 형태 가능
   * @param earthlyBranch - The earthly branch to lookup (지지) - 한글, 한자, 또는 한글(한자) 형태 가능
   * @returns The lifecycle stage string, or null if not found
   */
  getLifecycleStage(dayHeavenlyStem: string, earthlyBranch: string): string | null {
    if (!dayHeavenlyStem || !earthlyBranch) {
      return null;
    }

    // 입력을 한자로 정규화
    const normalizedStem = this.normalizeInput(dayHeavenlyStem);
    const normalizedBranch = this.normalizeInput(earthlyBranch);

    const stemMapping = this.LIFECYCLE_STAGES[normalizedStem];
    if (!stemMapping) {
      return null;
    }

    return stemMapping[normalizedBranch] ?? null;
  }

  /**
   * Calculate lifecycle stages for all four pillars (year, month, day, hour).
   *
   * @param dayHeavenlyStem - The heavenly stem of the day - 한글, 한자, 또는 한글(한자) 형태 가능
   * @param yearEarthlyBranch - Earthly branch of the year pillar - 한글, 한자, 또는 한글(한자) 형태 가능
   * @param monthEarthlyBranch - Earthly branch of the month pillar - 한글, 한자, 또는 한글(한자) 형태 가능
   * @param dayEarthlyBranch - Earthly branch of the day pillar - 한글, 한자, 또는 한글(한자) 형태 가능
   * @param hourEarthlyBranch - Earthly branch of the hour pillar - 한글, 한자, 또는 한글(한자) 형태 가능
   * @returns Dictionary containing lifecycle stages for each pillar
   */
  calculateAllLifecycleStages(
    dayHeavenlyStem: string,
    yearEarthlyBranch: string,
    monthEarthlyBranch: string,
    dayEarthlyBranch: string,
    hourEarthlyBranch: string
  ): LifecycleStagesResult {
    return {
      year: this.getLifecycleStage(dayHeavenlyStem, yearEarthlyBranch),
      month: this.getLifecycleStage(dayHeavenlyStem, monthEarthlyBranch),
      day: this.getLifecycleStage(dayHeavenlyStem, dayEarthlyBranch),
      hour: this.getLifecycleStage(dayHeavenlyStem, hourEarthlyBranch),
    };
  }

  /**
   * Validate if the given heavenly stem is supported.
   *
   * @param stem - Heavenly stem to validate - 한글, 한자, 또는 한글(한자) 형태 가능
   * @returns True if valid, False otherwise
   */
  validateHeavenlyStem(stem: string): boolean {
    const normalizedStem = this.normalizeInput(stem);
    return normalizedStem in this.LIFECYCLE_STAGES;
  }

  /**
   * Validate if the given earthly branch is supported.
   *
   * @param branch - Earthly branch to validate - 한글, 한자, 또는 한글(한자) 형태 가능
   * @returns True if valid, False otherwise
   */
  validateEarthlyBranch(branch: string): boolean {
    const normalizedBranch = this.normalizeInput(branch);
    // Check if the branch exists in any of the heavenly stem mappings
    const earthlyBranches = new Set(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']);
    return earthlyBranches.has(normalizedBranch);
  }

  /**
   * Get a description of what each lifecycle stage represents.
   *
   * @param stageName - The lifecycle stage name
   * @returns Description of the stage, or null if not found
   */
  getLifecycleStageDescription(stageName: string): string | null {
    const descriptions: Record<string, string> = {
      '장생(長生)': 'Birth/Longevity - The beginning of life cycle, growth and vitality',
      '목욕(沐浴)': 'Bathing - Cleansing and preparation phase',
      '관대(冠帶)': 'Crown/Belt - Coming of age, taking responsibility',
      '건록(建祿)': 'Official - Establishing career and social position',
      '제왕(帝旺)': 'Emperor - Peak of power and influence',
      '쇠(衰)': 'Decline - Beginning of weakening phase',
      '병(病)': 'Sickness - Period of weakness and vulnerability',
      '사(死)': 'Death - End of active phase',
      '묘(墓)': 'Tomb - Storage and preservation phase',
      '절(絶)': 'Extinction - Complete ending and transformation',
      '태(胎)': 'Womb - Conception and preparation for new cycle',
      '양(養)': 'Nurturing - Development and growth in preparation',
    };
    return descriptions[stageName] ?? null;
  }
}

/**
 * Factory function to create a LifecycleStageCalculator instance
 */
export function createLifecycleStageCalculator(): LifecycleStageCalculator {
  return new LifecycleStageCalculator();
}
