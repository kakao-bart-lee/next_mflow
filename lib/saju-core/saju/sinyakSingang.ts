/**
 * Sinyak-Singang Analysis Module (신약신강 분석)
 *
 * This module handles the analysis of the strength and weakness of the day stem (일간)
 * in Korean four-pillar astrology by calculating the power of five elements (五行).
 *
 * Converted from PHP sinyaksingang.php
 */

/** 오행 종류 */
export enum ElementType {
  WOOD = '목(목)', // 목 - 목
  FIRE = '화(화)', // 화 - 화
  EARTH = '토(토)', // 토 - 토
  METAL = '금(금)', // 금 - 금
  WATER = '수(수)', // 수 - 수
}

/** 신약신강 종류 */
export enum StrengthType {
  STRONG = '신강(身강)', // 신강 - 일간이 강함
  WEAK = '신약(身약)', // 신약 - 일간이 약함
}

/** 오행별 세력 */
export class ElementPower {
  wood_power: number = 0.0; // 목의 세력
  fire_power: number = 0.0; // 화의 세력
  earth_power: number = 0.0; // 토의 세력
  metal_power: number = 0.0; // 금의 세력
  water_power: number = 0.0; // 수의 세력

  constructor(init?: Partial<ElementPower>) {
    if (init) {
      Object.assign(this, init);
    }
  }

  /** 전체 오행 세력 합계 */
  getTotalPower(): number {
    return this.wood_power + this.fire_power + this.earth_power + this.metal_power + this.water_power;
  }

  /** 특정 오행의 세력 반환 */
  getElementPower(element: string): number {
    const elementMap: Record<string, number> = {
      목: this.wood_power,
      화: this.fire_power,
      토: this.earth_power,
      금: this.metal_power,
      수: this.water_power,
    };
    return elementMap[element] ?? 0.0;
  }
}

/** 신약신강 분석 결과 */
export interface SinyakSingangResult {
  element_powers: ElementPower; // 오행별 세력
  day_stem_element: string; // 일간의 오행
  supporting_power: number; // 일간을 돕는 세력
  total_power: number; // 총 세력
  strength_type: string; // 신강/신약 판정
  strength_score: number; // 강약 점수 (0-100)
}

/** Element type strings */
type ElementTypeString =
  | 'wood'
  | 'fire'
  | 'earth'
  | 'metal'
  | 'water'
  | 'earth_wood'
  | 'earth_fire'
  | 'earth_metal'
  | 'earth_water';

/** Season type */
type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * 신약신강 분석기
 */
export class SinyakSingangAnalyzer {
  // 계절별 그룹 정의
  private readonly seasonGroups: Record<SeasonType, string[]> = {
    spring: ['인', '묘', '진'], // 봄 - 목이 왕성
    summer: ['사', '오', '미'], // 여름 - 화가 왕성
    autumn: ['신', '유', '술'], // 가을 - 금이 왕성
    winter: ['해', '자', '축'], // 겨울 - 수가 왕성
  };

  // 지지별 오행 매핑
  private readonly branchElements: Record<string, ElementTypeString> = {
    자: 'water',
    해: 'water',
    인: 'wood',
    묘: 'wood',
    사: 'fire',
    오: 'fire',
    신: 'metal',
    유: 'metal',
    진: 'earth_wood', // 토+목
    미: 'earth_fire', // 토+화
    술: 'earth_metal', // 토+금
    축: 'earth_water', // 토+수
  };

  // 천간별 오행 매핑
  private readonly stemElements: Record<string, ElementTypeString> = {
    갑: 'wood',
    을: 'wood',
    병: 'fire',
    정: 'fire',
    무: 'earth',
    기: 'earth',
    경: 'metal',
    신: 'metal',
    임: 'water',
    계: 'water',
  };

  // 일간별 상생 관계 (일간을 돕는 오행)
  private readonly supportingElements: Record<string, ElementTypeString[]> = {
    갑: ['wood', 'water'], // 목간은 목+수가 도움
    을: ['wood', 'water'],
    병: ['fire', 'wood'], // 화간은 화+목이 도움
    정: ['fire', 'wood'],
    무: ['earth', 'fire'], // 토간은 토+화가 도움
    기: ['earth', 'fire'],
    경: ['metal', 'earth'], // 금간은 금+토가 도움
    신: ['metal', 'earth'],
    임: ['water', 'metal'], // 수간은 수+금이 도움
    계: ['water', 'metal'],
  };

  /** 지지로 계절 그룹 찾기 */
  private getSeasonGroup(branch: string): SeasonType | null {
    for (const [season, branches] of Object.entries(this.seasonGroups)) {
      if (branches.includes(branch)) {
        return season as SeasonType;
      }
    }
    return null;
  }

  /** 오행별 세력 추가 */
  private addElementPower(
    powers: ElementPower,
    elementType: ElementTypeString,
    powerValue: number,
    earthBonus: number = 0.0
  ): void {
    if (elementType === 'wood') {
      powers.wood_power += powerValue;
    } else if (elementType === 'fire') {
      powers.fire_power += powerValue;
    } else if (elementType === 'earth') {
      powers.earth_power += powerValue;
    } else if (elementType === 'metal') {
      powers.metal_power += powerValue;
    } else if (elementType === 'water') {
      powers.water_power += powerValue;
    } else if (elementType === 'earth_wood') {
      powers.wood_power += powerValue;
      powers.earth_power += earthBonus;
    } else if (elementType === 'earth_fire') {
      powers.fire_power += powerValue;
      powers.earth_power += earthBonus;
    } else if (elementType === 'earth_metal') {
      powers.metal_power += powerValue;
      powers.earth_power += earthBonus;
    } else if (elementType === 'earth_water') {
      powers.water_power += powerValue;
      powers.earth_power += earthBonus;
    }
  }

  /**
   * 지지 세력 계산
   */
  calculateEarthlyBranchPowers(
    yearBranch: string,
    monthBranch: string,
    dayBranch: string,
    hourBranch: string
  ): ElementPower {
    const powers = new ElementPower();

    // 년지, 일지, 시지와 월지의 상호작용 계산 (사계절 영향)
    const branches: Record<string, string> = {
      year: yearBranch,
      day: dayBranch,
      hour: hourBranch,
    };

    const allBranches = Object.values(this.seasonGroups).flat();

    for (const [pillar, branch] of Object.entries(branches)) {
      const monthSeason = this.getSeasonGroup(monthBranch);
      const branchSeason = allBranches.includes(branch) ? this.getSeasonGroup(branch) : null;

      // 토지 (진미술축) 특별 계산
      if (['진', '미', '술', '축'].includes(branch)) {
        if (monthSeason === 'spring' && branch === '진') {
          // 목토
          this.addElementPower(powers, 'wood', 0.7, 0.3);
        } else if (monthSeason === 'summer' && branch === '진') {
          this.addElementPower(powers, 'wood', 0.5, 0.5);
        } else if (monthSeason === 'autumn' && branch === '진') {
          this.addElementPower(powers, 'wood', 0.3, 0.7);
        } else if (monthSeason === 'winter' && branch === '진') {
          this.addElementPower(powers, 'wood', 0.5, 0.5);
        } else if (monthSeason === 'spring' && branch === '미') {
          // 화토
          this.addElementPower(powers, 'fire', 0.5, 0.5);
        } else if (monthSeason === 'summer' && branch === '미') {
          this.addElementPower(powers, 'fire', 0.7, 0.3);
        } else if (monthSeason === 'autumn' && branch === '미') {
          this.addElementPower(powers, 'fire', 0.5, 0.5);
        } else if (monthSeason === 'winter' && branch === '미') {
          this.addElementPower(powers, 'fire', 0.3, 0.7);
        } else if (monthSeason === 'spring' && branch === '술') {
          // 금토
          this.addElementPower(powers, 'metal', 0.3, 0.7);
        } else if (monthSeason === 'summer' && branch === '술') {
          this.addElementPower(powers, 'metal', 0.5, 0.5);
        } else if (monthSeason === 'autumn' && branch === '술') {
          this.addElementPower(powers, 'metal', 0.7, 0.3);
        } else if (monthSeason === 'winter' && branch === '술') {
          this.addElementPower(powers, 'metal', 0.5, 0.5);
        } else if (monthSeason === 'spring' && branch === '축') {
          // 수토
          this.addElementPower(powers, 'water', 0.5, 0.5);
        } else if (monthSeason === 'summer' && branch === '축') {
          this.addElementPower(powers, 'water', 0.3, 0.7);
        } else if (monthSeason === 'autumn' && branch === '축') {
          this.addElementPower(powers, 'water', 0.5, 0.5);
        } else if (monthSeason === 'winter' && branch === '축') {
          this.addElementPower(powers, 'water', 0.7, 0.3);
        }
      } else {
        // 일반 지지의 경우 1.0 추가
        const elementType = this.branchElements[branch] ?? 'earth';
        this.addElementPower(powers, elementType, 1.0);
      }
    }

    // 월지 자체의 세력 (더 강한 영향)
    if (['진', '미', '술', '축'].includes(monthBranch)) {
      // 토지는 각각 0.84 + 0.36 구성
      if (monthBranch === '진') {
        this.addElementPower(powers, 'wood', 0.84, 0.36);
      } else if (monthBranch === '미') {
        this.addElementPower(powers, 'fire', 0.84, 0.36);
      } else if (monthBranch === '술') {
        this.addElementPower(powers, 'metal', 0.84, 0.36);
      } else if (monthBranch === '축') {
        this.addElementPower(powers, 'water', 0.84, 0.36);
      }
    } else {
      // 일반 지지는 1.2 추가
      const elementType = this.branchElements[monthBranch] ?? 'earth';
      this.addElementPower(powers, elementType, 1.2);
    }

    return powers;
  }

  /**
   * 천간 세력 계산
   */
  calculateHeavenlyStemPowers(
    yearStem: string,
    monthStem: string,
    dayStem: string,
    hourStem: string
  ): ElementPower {
    const powers = new ElementPower();

    // 일간을 제외한 천간들 (년, 월, 시간)
    const stems = [yearStem, monthStem, hourStem];

    for (const stem of stems) {
      const elementType = this.stemElements[stem] ?? 'earth';
      this.addElementPower(powers, elementType, 0.2);
    }

    return powers;
  }

  /**
   * 종합 신약신강 분석
   *
   * @param yearStem - 년간
   * @param yearBranch - 년지
   * @param monthStem - 월간
   * @param monthBranch - 월지
   * @param dayStem - 일간 (분석 대상)
   * @param dayBranch - 일지
   * @param hourStem - 시간
   * @param hourBranch - 시지
   * @returns SinyakSingangResult with analysis results
   */
  analyzeSinyakSingang(
    yearStem: string,
    yearBranch: string,
    monthStem: string,
    monthBranch: string,
    dayStem: string,
    dayBranch: string,
    hourStem: string,
    hourBranch: string
  ): SinyakSingangResult {
    // 지지 세력 계산
    const branchPowers = this.calculateEarthlyBranchPowers(yearBranch, monthBranch, dayBranch, hourBranch);

    // 천간 세력 계산
    const stemPowers = this.calculateHeavenlyStemPowers(yearStem, monthStem, dayStem, hourStem);

    // 전체 오행 세력 통합
    const elementPowers = new ElementPower({
      wood_power: branchPowers.wood_power + stemPowers.wood_power,
      fire_power: branchPowers.fire_power + stemPowers.fire_power,
      earth_power: branchPowers.earth_power + stemPowers.earth_power,
      metal_power: branchPowers.metal_power + stemPowers.metal_power,
      water_power: branchPowers.water_power + stemPowers.water_power,
    });

    // 일간의 오행 파악
    const dayStemElement = this.getDayStemElementName(dayStem);

    // 일간을 돕는 세력 계산
    const supportingPower = this.calculateSupportingPower(dayStem, elementPowers);

    const totalPower = supportingPower;

    // 신강/신약 판정 (1.2 기준)
    let strengthType: string;
    if (totalPower > 1.2) {
      strengthType = StrengthType.STRONG;
    } else {
      strengthType = StrengthType.WEAK;
    }

    // 강약 점수 계산 (0-100)
    const strengthScore = Math.min(100, totalPower * 50);

    return {
      element_powers: elementPowers,
      day_stem_element: dayStemElement,
      supporting_power: supportingPower,
      total_power: totalPower,
      strength_type: strengthType,
      strength_score: strengthScore,
    };
  }

  /** 일간의 오행명 반환 */
  private getDayStemElementName(dayStem: string): string {
    const elementNames: Record<string, string> = {
      wood: '목',
      fire: '화',
      earth: '토',
      metal: '금',
      water: '수',
    };
    const elementType = this.stemElements[dayStem] ?? 'earth';
    return elementNames[elementType] ?? '토';
  }

  /** 일간을 돕는 세력 계산 */
  private calculateSupportingPower(dayStem: string, powers: ElementPower): number {
    const supportingElements = this.supportingElements[dayStem] ?? [];
    let totalSupporting = 0.0;

    for (const element of supportingElements) {
      if (element === 'wood') {
        totalSupporting += powers.wood_power;
      } else if (element === 'fire') {
        totalSupporting += powers.fire_power;
      } else if (element === 'earth') {
        totalSupporting += powers.earth_power;
      } else if (element === 'metal') {
        totalSupporting += powers.metal_power;
      } else if (element === 'water') {
        totalSupporting += powers.water_power;
      }
    }

    return totalSupporting;
  }
}

/** 신약신강 분석 결과를 문자열로 포맷팅 */
export function formatSinyakSingangResult(result: SinyakSingangResult): string {
  let output = '=== 신약신강 분석 결과 ===\n';

  output += `일간 오행: ${result.day_stem_element}\n`;
  output += `강약 판정: ${result.strength_type}\n`;
  output += `총 세력: ${result.total_power.toFixed(2)}\n`;
  output += `강약 점수: ${result.strength_score.toFixed(1)}점/100점\n\n`;

  output += '=== 오행별 세력 ===\n';
  output += `목의 세력: ${result.element_powers.wood_power.toFixed(2)}\n`;
  output += `화의 세력: ${result.element_powers.fire_power.toFixed(2)}\n`;
  output += `토의 세력: ${result.element_powers.earth_power.toFixed(2)}\n`;
  output += `금의 세력: ${result.element_powers.metal_power.toFixed(2)}\n`;
  output += `수의 세력: ${result.element_powers.water_power.toFixed(2)}\n`;

  return output;
}

/** 오행 균형 분석 */
export interface ElementBalanceAnalysis {
  strongest: string;
  weakest: string;
  balance_status: string;
}

export function getElementBalanceAnalysis(powers: ElementPower): ElementBalanceAnalysis {
  const elements: Record<string, number> = {
    목: powers.wood_power,
    화: powers.fire_power,
    토: powers.earth_power,
    금: powers.metal_power,
    수: powers.water_power,
  };

  // 가장 강한/약한 오행 찾기
  const entries = Object.entries(elements);
  const maxElement = entries.reduce((max, current) => (current[1] > max[1] ? current : max));
  const minElement = entries.reduce((min, current) => (current[1] < min[1] ? current : min));

  return {
    strongest: `${maxElement[0]} (${maxElement[1].toFixed(2)})`,
    weakest: `${minElement[0]} (${minElement[1].toFixed(2)})`,
    balance_status: maxElement[1] - minElement[1] < 1.0 ? '균형' : '불균형',
  };
}
