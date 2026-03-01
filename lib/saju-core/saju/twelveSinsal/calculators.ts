/**
 * 12신살 계산기 클래스들
 * Calculator classes for 12 Spirit Killers
 */

import type { SinsalInput, BaseSinsalCalculator } from './types';
import { GilsinType } from './types';
import * as mappings from './mappings';

const {
  CHENEUL_GWIIN_MAPPING,
  CHENJU_GWIIN_MAPPING,
  CHENGUAN_GWIIN_MAPPING,
  CHENBOK_GWIIN_MAPPING,
  TAEGUK_GWIIN_MAPPING,
  WOLDUK_GWIIN_MAPPING,
  MUNCHANG_MAPPING,
  MUNGOK_MAPPING,
  GUANGUI_HAKGWAN_MAPPING,
  AMROK_MAPPING,
  GUMROK_MAPPING,
  HAKDANG_MAPPING,
  CHENE_MAPPING,
  GUEGANGSAL_MAPPING,
  BEKHOSAL_MAPPING,
  WONJINSAL_PAIRS,
  GUIMUNSAL_PAIRS,
  GONGMANG_MAPPING,
  HONGSAL_MAPPING,
  YANGINSAL_MAPPING,
  SANGMUNSAL_MAPPING,
  SUOKSAL_MAPPING,
  GEPGAKSAL_MAPPING,
  GOSINSAL_MAPPING,
  GUASUKSAL_MAPPING,
} = mappings;

/** 일간 기준 지지 매핑 계산기 (가장 일반적인 패턴) */
class DayStemBranchMappingCalculator implements BaseSinsalCalculator {
  constructor(
    private readonly mapping: Record<string, readonly string[]>,
    private readonly gilsinType: GilsinType,
    private readonly keyPrefix: string,
    private readonly includeHour: boolean = true
  ) {}

  calculate(inputData: SinsalInput): Record<string, string | null> {
    const branches = this.mapping[inputData.day_h] ?? [];
    const value = this.gilsinType;

    const result: Record<string, string | null> = {
      [`년${this.keyPrefix}`]: branches.includes(inputData.year_e) ? value : null,
      [`월${this.keyPrefix}`]: branches.includes(inputData.month_e) ? value : null,
      [`일${this.keyPrefix}`]: branches.includes(inputData.day_e) ? value : null,
    };

    if (this.includeHour) {
      result[`시${this.keyPrefix}`] = branches.includes(inputData.hour_e) ? value : null;
    }

    return result;
  }
}

/** 월지 기준 천간 매핑 계산기 (월덕귀인용) */
class MonthBranchStemMappingCalculator implements BaseSinsalCalculator {
  constructor(
    private readonly mapping: Readonly<Record<string, string>>,
    private readonly gilsinType: GilsinType,
    private readonly keyPrefix: string
  ) {}

  calculate(inputData: SinsalInput): Record<string, string | null> {
    const requiredStem = this.mapping[inputData.month_e];
    if (!requiredStem) {
      return {
        [`년${this.keyPrefix}`]: null,
        [`월${this.keyPrefix}`]: null,
        [`일${this.keyPrefix}`]: null,
        [`시${this.keyPrefix}`]: null,
      };
    }

    const value = this.gilsinType;
    return {
      [`년${this.keyPrefix}`]: inputData.year_h === requiredStem ? value : null,
      [`월${this.keyPrefix}`]: inputData.month_h === requiredStem ? value : null,
      [`일${this.keyPrefix}`]: inputData.day_h === requiredStem ? value : null,
      [`시${this.keyPrefix}`]: inputData.hour_h === requiredStem ? value : null,
    };
  }
}

/** 단일 타겟 지지 매핑 계산기 */
class SingleTargetBranchCalculator implements BaseSinsalCalculator {
  constructor(
    private readonly mapping: Readonly<Record<string, string>>,
    private readonly gilsinType: GilsinType,
    private readonly keyPrefix: string,
    private readonly baseBranch: keyof SinsalInput,
    private readonly targetPositions: Array<keyof SinsalInput>
  ) {}

  calculate(inputData: SinsalInput): Record<string, string | null> {
    const baseValue = inputData[this.baseBranch] as string;
    const targetBranch = this.mapping[baseValue];

    if (!targetBranch) {
      const positionPrefixMap: Record<string, string> = { y: '년', m: '월', h: '시', d: '일' };
      const result: Record<string, string | null> = {};
      for (const pos of this.targetPositions) {
        const prefix = positionPrefixMap[pos.charAt(0)] ?? '일';
        result[`${prefix}${this.keyPrefix}`] = null;
      }
      return result;
    }

    const value = this.gilsinType;
    const result: Record<string, string | null> = {};
    const posPrefixMap: Record<string, string> = { year_e: '년', month_e: '월', day_e: '일', hour_e: '시' };

    for (const pos of this.targetPositions) {
      const prefix = posPrefixMap[pos as string] ?? pos.charAt(0);
      const branchValue = inputData[pos] as string;
      result[`${prefix}${this.keyPrefix}`] = targetBranch === branchValue ? value : null;
    }

    return result;
  }
}

/** 간지 조합 체크 계산기 */
class GanjiCombinationCalculator implements BaseSinsalCalculator {
  constructor(
    private readonly mapping: readonly string[],
    private readonly gilsinType: GilsinType,
    private readonly keyPrefix: string
  ) {}

  calculate(inputData: SinsalInput): Record<string, string | null> {
    const value = this.gilsinType;

    const yearGanji = inputData.year_h + inputData.year_e;
    const monthGanji = inputData.month_h + inputData.month_e;
    const dayGanji = inputData.day_h + inputData.day_e;
    const hourGanji = inputData.hour_h + inputData.hour_e;

    return {
      [`년${this.keyPrefix}`]: this.mapping.includes(yearGanji) ? value : null,
      [`월${this.keyPrefix}`]: this.mapping.includes(monthGanji) ? value : null,
      [`일${this.keyPrefix}`]: this.mapping.includes(dayGanji) ? value : null,
      [`시${this.keyPrefix}`]: this.mapping.includes(hourGanji) ? value : null,
    };
  }
}

/** 쌍 기반 계산기 (원진살, 귀문관살용) */
class PairBasedCalculator implements BaseSinsalCalculator {
  constructor(
    private readonly pairs: ReadonlyArray<readonly [string, string]>,
    private readonly gilsinType: GilsinType,
    private readonly keyPrefix: string
  ) {}

  calculate(inputData: SinsalInput): Record<string, string | null> {
    const dayE = inputData.day_e;
    const value = this.gilsinType;

    let resultY: string | null = null;
    let resultM: string | null = null;
    let resultH: string | null = null;

    for (const [pair1, pair2] of this.pairs) {
      if ((dayE === pair1 && inputData.year_e === pair2) || (dayE === pair2 && inputData.year_e === pair1)) {
        resultY = value;
      }
      if ((dayE === pair1 && inputData.month_e === pair2) || (dayE === pair2 && inputData.month_e === pair1)) {
        resultM = value;
      }
      if ((dayE === pair1 && inputData.hour_e === pair2) || (dayE === pair2 && inputData.hour_e === pair1)) {
        resultH = value;
      }
    }

    return {
      [`년${this.keyPrefix}`]: resultY,
      [`월${this.keyPrefix}`]: resultM,
      [`시${this.keyPrefix}`]: resultH,
    };
  }
}

/** 일주 기준 매핑 계산기 (공망살용) */
class IljuMappingCalculator implements BaseSinsalCalculator {
  constructor(
    private readonly mapping: Readonly<Record<string, readonly string[]>>,
    private readonly gilsinType: GilsinType,
    private readonly keyPrefix: string
  ) {}

  calculate(inputData: SinsalInput): Record<string, string | null> {
    const ilju = inputData.day_h + inputData.day_e;
    const branches = this.mapping[ilju] ?? [];
    const value = this.gilsinType;

    return {
      [`년${this.keyPrefix}`]: branches.includes(inputData.year_e) ? value : null,
      [`월${this.keyPrefix}`]: branches.includes(inputData.month_e) ? value : null,
      [`일${this.keyPrefix}`]: branches.includes(inputData.day_e) ? value : null,
      [`시${this.keyPrefix}`]: branches.includes(inputData.hour_e) ? value : null,
    };
  }
}

/** 성별 특화 계산기 (고신살/과숙살용) */
class GenderSpecificCalculator implements BaseSinsalCalculator {
  constructor(
    private readonly maleMapping: Readonly<Record<string, string>>,
    private readonly femaleMapping: Readonly<Record<string, string>>,
    private readonly maleType: GilsinType,
    private readonly femaleType: GilsinType
  ) {}

  calculate(inputData: SinsalInput): Record<string, string | null> {
    const isMale = (inputData.gender ?? 'M').toUpperCase() === 'M';

    const mapping = isMale ? this.maleMapping : this.femaleMapping;
    const gilsinType = isMale ? this.maleType : this.femaleType;
    const key = isMale ? '고신살' : '과숙살';

    const targetBranch = mapping[inputData.year_e];
    const result = targetBranch && targetBranch === inputData.month_e ? gilsinType : null;

    return { [key]: result };
  }
}

/**
 * Create all calculator instances
 * 모든 계산기 인스턴스 생성
 */
export function createCalculators(): Record<string, BaseSinsalCalculator> {
  return {
    // Pattern 1: 일간 기준 지지 매핑
    cheneul_gwiin: new DayStemBranchMappingCalculator(
      CHENEUL_GWIIN_MAPPING,
      GilsinType.CHENEUL_GWIIN,
      '천을'
    ),
    chenju_gwiin: new DayStemBranchMappingCalculator(
      CHENJU_GWIIN_MAPPING,
      GilsinType.CHENJU_GWIIN,
      '천주'
    ),
    chenguan_gwiin: new DayStemBranchMappingCalculator(
      CHENGUAN_GWIIN_MAPPING,
      GilsinType.CHENGUAN_GWIIN,
      '천관'
    ),
    chenbok_gwiin: new DayStemBranchMappingCalculator(
      CHENBOK_GWIIN_MAPPING,
      GilsinType.CHENBOK_GWIIN,
      '천복'
    ),
    taeguk_gwiin: new DayStemBranchMappingCalculator(
      TAEGUK_GWIIN_MAPPING,
      GilsinType.TAEGUK_GWIIN,
      '태극'
    ),
    munchang: new DayStemBranchMappingCalculator(MUNCHANG_MAPPING, GilsinType.MUNCHANG, '문창'),
    mungok: new DayStemBranchMappingCalculator(MUNGOK_MAPPING, GilsinType.MUNGOK, '문곡'),
    guangui_hakgwan: new DayStemBranchMappingCalculator(
      GUANGUI_HAKGWAN_MAPPING,
      GilsinType.GUANGUI_HAKGWAN,
      '관귀'
    ),
    amrok: new DayStemBranchMappingCalculator(AMROK_MAPPING, GilsinType.AMROK, '암록'),
    gumrok: new DayStemBranchMappingCalculator(GUMROK_MAPPING, GilsinType.GUMROK, '금여록', false),
    hakdang: new DayStemBranchMappingCalculator(HAKDANG_MAPPING, GilsinType.HAKDANG, '학당'),
    hongsal: new DayStemBranchMappingCalculator(HONGSAL_MAPPING, GilsinType.HONGSAL, '홍염살'),
    yanginsal: new DayStemBranchMappingCalculator(YANGINSAL_MAPPING, GilsinType.YANGINSAL, '양인살'),

    // Pattern 2: 월지 기준 천간 매핑
    wolduk_gwiin: new MonthBranchStemMappingCalculator(
      WOLDUK_GWIIN_MAPPING,
      GilsinType.WOLDUK_GWIIN,
      '월덕'
    ),

    // Pattern 3: 단일 타겟 지지 매핑
    chene: new SingleTargetBranchCalculator(CHENE_MAPPING, GilsinType.CHENE, '천의', 'month_e', [
      'year_e',
      'day_e',
      'hour_e',
    ]),
    sangmunsal: new SingleTargetBranchCalculator(
      SANGMUNSAL_MAPPING,
      GilsinType.SANGMUNSAL,
      '상문살',
      'day_e',
      ['year_e', 'month_e', 'hour_e']
    ),
    suoksal: new SingleTargetBranchCalculator(
      SUOKSAL_MAPPING,
      GilsinType.SUOKSAL,
      '수옥살',
      'day_e',
      ['year_e', 'month_e', 'hour_e']
    ),
    gepgaksal: new SingleTargetBranchCalculator(
      GEPGAKSAL_MAPPING,
      GilsinType.GEPGAKSAL,
      '급각살',
      'month_e',
      ['year_e', 'day_e', 'hour_e']
    ),

    // Pattern 4: 간지 조합 체크
    guegangsal: new GanjiCombinationCalculator(GUEGANGSAL_MAPPING, GilsinType.GUEGANGSAL, '괴강살'),
    bekhosal: new GanjiCombinationCalculator(BEKHOSAL_MAPPING, GilsinType.BEKHOSAL, '백호살'),

    // Pattern 5: 쌍 기반
    wonjinsal: new PairBasedCalculator(WONJINSAL_PAIRS, GilsinType.WONJINSAL, '원진살'),
    guimunsal: new PairBasedCalculator(GUIMUNSAL_PAIRS, GilsinType.GUIMUNSAL, '귀문관살'),

    // Pattern 6: 일주 기준
    gongmangsal: new IljuMappingCalculator(GONGMANG_MAPPING, GilsinType.GONGMANGSAL, '공망살'),

    // Pattern 7: 성별 특화
    gender_specific: new GenderSpecificCalculator(
      GOSINSAL_MAPPING,
      GUASUKSAL_MAPPING,
      GilsinType.GOSINSAL,
      GilsinType.GUASUKSAL
    ),
  };
}
