/**
 * Fortune Calculator Base Classes
 * 사주 해설 계산기들의 기본 클래스
 */

import { extractKorean } from '../utils';
import { getSipsinForBranch, KOREAN_BRANCH_TO_DISPLAY } from './constants';
import { getDataLoader } from './dataLoader';
import {
  classifyBranchRoleLabel,
  classifyCurrentFortuneElement,
  classifyStemRoleLabel,
  getElementRoleProfile,
} from './elementRoleProfiles';
import {
  calculateGenderedNarrativeExpression,
  getWesternZodiacName,
  resolveGenderKey,
  resolveGenderedNarrativeExpressionKind,
} from './genderedNarratives';
import { calculateJuyeokGanSerial, calculateJuyeokJiSerial, calculateJuyeokPairSerial } from './juyeokTrigrams';
import { advanceLegacyCycle, getFiveElementGroup } from './legacyCycles';
import {
  calculateNewYearMonthlyExpression,
  calculateNewYearSignalExpression,
  calculateNewYearSignalWithHourExpression,
} from './newYearSignals';
import { calculateTojeongTrigramCompositeKey } from './tojeongTrigrams';
import { calculateWoon12Daygi, calculateYongChungan, calculateYongToSipsin } from './yongsinFlows';
import { createLifecycleStageCalculator } from './lifecycleStage';
import { calculateSinsal } from './twelveSinsal/utils';

const lifecycleStageCalculator = createLifecycleStageCalculator();
const LIFECYCLE_STAGE_INDEX: Record<string, number> = {
  '장생(長生)': 1,
  '목욕(沐浴)': 2,
  '관대(冠帶)': 3,
  '건록(建祿)': 4,
  '제왕(帝旺)': 5,
  '쇠(衰)': 6,
  '병(病)': 7,
  '사(死)': 8,
  '묘(墓)': 9,
  '절(絶)': 10,
  '태(胎)': 11,
  '양(養)': 12,
};
const BRANCHES_FROM_IN = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'] as const;
const SIPSIN_NUMBER_BY_NAME: Record<string, number> = {
  비견: 1,
  겁재: 2,
  식신: 3,
  상관: 4,
  편재: 5,
  정재: 6,
  편관: 7,
  정관: 8,
  편인: 9,
  정인: 10,
};
const ELEMENT_NUMBER_BY_CODE: Record<string, number> = {
  mok: 1,
  wha: 2,
  to: 3,
  gum: 4,
  su: 5,
};
const BRANCH_ELEMENT_NUMBER: Record<string, number> = {
  인: 1,
  묘: 1,
  사: 2,
  오: 2,
  진: 3,
  미: 3,
  술: 3,
  축: 3,
  신: 4,
  유: 4,
  해: 5,
  자: 5,
};
const CURRENT_DIRECTION_SERIAL_BY_BRANCH: Record<string, number> = {
  진: 1,
  인: 2,
  묘: 2,
  사: 3,
  오: 3,
  미: 4,
  술: 5,
  신: 6,
  유: 6,
  해: 7,
  자: 7,
  축: 8,
};
const SINSAL_TABLE_KEY_BY_LABEL: Record<string, string> = {
  '겁살(劫殺)': '겁살',
  '재살(災殺)': '재살',
  '천살(天殺)': '천살',
  '지살(地殺)': '지살',
  '도화살(桃花殺)': '도화',
  '월살(月殺)': '월살',
  '망신살(亡身殺)': '망신',
  '장성살(將星殺)': '장성',
  '반안살(攀鞍殺)': '반안',
  '역마살(驛馬殺)': '역마',
  '육해살(六害殺)': '육해',
  '화개살(華蓋殺)': '화개',
};
const SINSAL_DISP_TABLE_KEY_BY_LABEL: Record<string, string> = {
  '겁살(劫殺)': '겁살_disp',
  '재살(災殺)': '재살_disp',
  '천살(天殺)': '천살_disp',
  '지살(地殺)': '지살_disp',
  '도화살(桃花殺)': '연살_disp',
  '월살(月殺)': '월살_disp',
  '망신살(亡身殺)': '망신살_disp',
  '장성살(將星殺)': '장성살_disp',
  '반안살(攀鞍殺)': '반안살_disp',
  '역마살(驛馬殺)': '역마살_disp',
  '육해살(六害殺)': '육해살_disp',
  '화개살(華蓋殺)': '화개살_disp',
};
const BRANCHES_FROM_IN_DISPLAY = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'] as const;
const HEAVENLY_STEM_DISPLAY_BY_CODE: Record<string, string> = {
  A: '갑',
  B: '을',
  C: '병',
  D: '정',
  E: '무',
  F: '기',
  G: '경',
  H: '신',
  I: '임',
  J: '계',
};
const STEM_CODE_TO_HANJA: Record<string, string> = {
  A: '甲',
  B: '乙',
  C: '丙',
  D: '丁',
  E: '戊',
  F: '己',
  G: '庚',
  H: '辛',
  I: '壬',
  J: '癸',
};
const STEM_DISPLAY_TO_HANJA: Record<string, string> = Object.fromEntries(
  Object.entries(STEM_CODE_TO_HANJA).map(([code, hanja]) => [HEAVENLY_STEM_DISPLAY_BY_CODE[code] ?? '', hanja]).filter(([display]) => display)
) as Record<string, string>;
const BRANCH_NUMBER_TO_HANJA: Record<string, string> = {
  '01': '寅',
  '02': '卯',
  '03': '辰',
  '04': '巳',
  '05': '午',
  '06': '未',
  '07': '申',
  '08': '酉',
  '09': '戌',
  '10': '亥',
  '11': '子',
  '12': '丑',
};
const BRANCH_DISPLAY_TO_HANJA: Record<string, string> = {
  인: '寅',
  묘: '卯',
  진: '辰',
  사: '巳',
  오: '午',
  미: '未',
  신: '申',
  유: '酉',
  술: '戌',
  해: '亥',
  자: '子',
  축: '丑',
};
const CURRENT_YEAR_BRANCH_RULES: Record<number, { oh: string; ey: number }> = {
  1: { oh: '5', ey: 2 },
  2: { oh: '3', ey: 1 },
  3: { oh: '1', ey: 1 },
  4: { oh: '1', ey: 1 },
  5: { oh: '3', ey: 2 },
  6: { oh: '2', ey: 2 },
  7: { oh: '2', ey: 2 },
  8: { oh: '3', ey: 1 },
  9: { oh: '4', ey: 1 },
  10: { oh: '4', ey: 2 },
  11: { oh: '3', ey: 1 },
  12: { oh: '5', ey: 2 },
};
const ZIWEI_BRANCH_BY_SLOT = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'] as const;
const ZIWEI_JAMI_SLOT_BY_GUK: Record<string, readonly number[]> = {
  '水2局': [12, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 1, 1, 2, 2, 3],
  '木3局': [3, 12, 1, 4, 1, 2, 5, 2, 3, 6, 3, 4, 7, 4, 5, 8, 5, 6, 9, 6, 7, 10, 7, 8, 11, 8, 9, 12, 9, 10],
  '金4局': [10, 3, 12, 1, 11, 4, 1, 2, 12, 5, 2, 3, 1, 6, 3, 4, 2, 7, 4, 5, 3, 8, 5, 6, 4, 9, 6, 7, 5, 10],
  '土5局': [5, 10, 3, 12, 1, 6, 11, 4, 1, 2, 7, 12, 5, 2, 3, 8, 1, 6, 3, 4, 9, 2, 7, 4, 5, 10, 3, 8, 5, 6],
  '火6局': [8, 5, 10, 3, 12, 1, 9, 6, 11, 4, 1, 2, 10, 7, 12, 5, 2, 3, 11, 8, 1, 6, 3, 4, 12, 9, 2, 7, 4, 5],
};
const ZIWEI_GUK_BY_MYUNG_SLOT_AND_YEAR_GROUP: Record<number, readonly string[]> = {
  1: ['火6局', '土5局', '木3局', '金4局', '水2局'],
  2: ['火6局', '土5局', '木3局', '金4局', '水2局'],
  3: ['木3局', '金4局', '水2局', '火6局', '土5局'],
  4: ['木3局', '金4局', '水2局', '火6局', '土5局'],
  5: ['土5局', '木3局', '金4局', '水2局', '火6局'],
  6: ['土5局', '木3局', '金4局', '水2局', '火6局'],
  7: ['金4局', '水2局', '火6局', '土5局', '木3局'],
  8: ['金4局', '水2局', '火6局', '土5局', '木3局'],
  9: ['火6局', '土5局', '木3局', '金4局', '水2局'],
  10: ['火6局', '土5局', '木3局', '金4局', '水2局'],
  11: ['金4局', '水2局', '火6局', '土5局', '木3局'],
  12: ['金4局', '水2局', '火6局', '土5局', '木3局'],
};
const ZIWEI_YEAR_GROUP_INDEX_BY_STEM: Record<string, number> = {
  갑: 0,
  기: 0,
  을: 1,
  경: 1,
  병: 2,
  신: 2,
  정: 3,
  임: 3,
  무: 4,
  계: 4,
};
const ZIWEI_SAWHA_SUFFIX_BY_STEM_HANJA: Record<string, Readonly<Record<string, string>>> = {
  甲: { 염정: '록', 파군: '권', 무곡: '과', 태양: '기' },
  乙: { 천기: '록', 천량: '권', 자미: '과', 태음: '기' },
  丙: { 천동: '록', 천기: '권', 염정: '기' },
  丁: { 태음: '록', 천동: '권', 천기: '과', 거문: '기' },
  戊: { 탐랑: '록', 태음: '권', 천기: '기' },
  己: { 무곡: '록', 탐랑: '권', 천량: '과' },
  庚: { 태양: '록', 무곡: '권', 태음: '과', 천동: '기' },
  辛: { 거문: '록', 태양: '권' },
  壬: { 천량: '록', 자미: '권', 무곡: '기' },
  癸: { 파군: '록', 거문: '권', 태음: '과', 탐랑: '기' },
};
const ZIWEI_QUERY_STAR_ORDER = [
  '태음',
  '탐랑',
  '거문',
  '천상',
  '천량',
  '칠살',
  '파군',
  '염정',
  '천동',
  '무곡',
  '태양',
  '천기',
  '천부',
  '자미',
] as const;

type CurrentDateContext = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly daysInMonth: number;
  readonly dateCode: string;
  readonly hhmm: number;
};
type CurrentManseContext = CurrentDateContext & {
  readonly yearE: number;
  readonly dayE: number;
};

/**
 * 계산기 타입 열거형
 */
export enum CalculatorType {
  SIMPLE_QUERY = 'simple_query', // S045, S046 타입
  COMPLEX_CALCULATION = 'complex_calc', // S007, S063 타입
  GENDER_BASED = 'gender_based', // F013, T022 타입
  SEARCH_BASED = 'search_based', // F007, T013 타입
}

/**
 * 계산 입력 데이터
 */
export interface CalculationInput {
  readonly yearStem: string; // 년간 (천간)
  readonly yearBranch: string; // 년지 (지지)
  readonly monthStem: string; // 월간
  readonly monthBranch: string; // 월지
  readonly dayStem: string; // 일간
  readonly dayBranch: string; // 일지
  readonly hourStem: string; // 시간
  readonly hourBranch: string; // 시지
  readonly gender: string; // 성별 (M/F)
  readonly additionalData?: Record<string, unknown>; // 추가 데이터
}

/**
 * 계산 결과 데이터
 */
export interface CalculationResult {
  readonly tableName: string;
  readonly expression: string;
  readonly text: string;
  readonly numerical: string | null;
  readonly metadata: Record<string, unknown>;
}

/**
 * 계산기 설정
 */
export interface CalculatorConfig {
  readonly tableName: string;
  readonly calculatorType: CalculatorType;
  readonly expressionFields: readonly string[]; // 표현식에 사용할 필드들
  readonly genderColumns?: Record<string, string> | undefined; // 성별별 컬럼
  readonly calculationMethod?: string | undefined; // 계산 메서드명
  readonly additionalConfig?: Record<string, unknown> | undefined;
}

export interface DataRetrievalOptions {
  readonly preferredColumns?: readonly string[] | undefined;
}

/**
 * 데이터 조회 인터페이스
 */
export interface DataRetriever {
  getResult(tableName: string, expression: string, options?: DataRetrievalOptions): readonly [string, string];
}

/**
 * 사주 계산기 기본 인터페이스
 */
export interface FortuneCalculatorBase {
  readonly config: CalculatorConfig;
  calculateExpression(inputData: CalculationInput): string;
  calculate(inputData: CalculationInput): CalculationResult;
}

/**
 * 추상 계산기 베이스 클래스
 */
export abstract class AbstractFortuneCalculator implements FortuneCalculatorBase {
  constructor(
    public readonly config: CalculatorConfig,
    protected readonly dataRetriever: DataRetriever
  ) {}

  /**
   * DB 표현식 계산 (하위 클래스에서 구현)
   */
  abstract calculateExpression(inputData: CalculationInput): string;

  /**
   * 전체 계산 수행
   */
  calculate(inputData: CalculationInput): CalculationResult {
    const expression = this.calculateExpression(inputData);
    const [text, numerical] = this.retrieveData(expression);

    return {
      tableName: this.config.tableName,
      expression,
      text,
      numerical,
      metadata: this.getMetadata(inputData),
    };
  }

  /**
   * 데이터 조회
   */
  protected retrieveData(expression: string, options?: DataRetrievalOptions): readonly [string, string] {
    return this.dataRetriever.getResult(this.config.tableName, expression, options);
  }

  /**
   * 메타데이터 생성
   */
  protected getMetadata(inputData: CalculationInput): Record<string, any> {
    return {
      calculator_type: this.config.calculatorType,
      gender: inputData.gender,
    };
  }
}

/**
 * 단순 조회형 계산기 (S045, S046, F012 등)
 */
export class SimpleQueryCalculator extends AbstractFortuneCalculator {
  calculateExpression(inputData: CalculationInput): string {
    const fieldName = this.config.expressionFields[0];
    if (!fieldName) {
      throw new Error(`Missing expression field for ${this.config.tableName}`);
    }

    const lifecycleStageNumbers = this.getLifecycleStageNumbers(inputData);

    // 필드명에 따른 값 매핑
    const fieldValueMap: Record<string, number | string> = {
      year_stem_num: this.getStemNumber(inputData.yearStem),
      year_branch_num: this.getBranchNumber(inputData.yearBranch),
      year_branch_code_05: `05${this.getBranchNumber(inputData.yearBranch).toString().padStart(2, '0')}`,
      year_branch_org_num: this.getBranchOrgNumber(inputData.yearBranch),
      year_lifecycle_num: lifecycleStageNumbers.year,
      month_stem_num: this.getStemNumber(inputData.monthStem),
      month_branch_num: this.getBranchNumber(inputData.monthBranch),
      month_branch_org_num: this.getBranchOrgNumber(inputData.monthBranch),
      month_branch_sipsin_num: this.getBranchSipsinNumber(inputData.dayStem, inputData.monthBranch),
      month_lifecycle_num: lifecycleStageNumbers.month,
      day_stem_num: this.getStemNumber(inputData.dayStem),
      day_stem_name: this.getStemKorean(inputData.dayStem),
      day_stem_alpha: this.getStemAlpha(inputData.dayStem),
      day_stem_element: this.getStemElementCode(inputData.dayStem),
      day_stem_element_num: this.getStemElementNumber(inputData.dayStem),
      day_ganzhi_code: `${this.getStemAlpha(inputData.dayStem)}${this.getBranchNumber(inputData.dayBranch)
        .toString()
        .padStart(2, '0')}`,
      day_branch_num: this.getBranchNumber(inputData.dayBranch),
      day_branch_org_num: this.getBranchOrgNumber(inputData.dayBranch),
      day_branch_name: this.getBranchKorean(inputData.dayBranch),
      day_branch_sipsin_num: this.getBranchSipsinNumber(inputData.dayStem, inputData.dayBranch),
      day_branch_element_num: this.getBranchElementNumber(inputData.dayBranch),
      day_lifecycle_num: lifecycleStageNumbers.day,
      hour_branch_num: this.getBranchNumber(inputData.hourBranch),
      hour_branch_org_num: this.getBranchOrgNumber(inputData.hourBranch),
      hour_lifecycle_num: lifecycleStageNumbers.hour,
      social_element: this.getStemElementCode(inputData.dayStem),
      western_zodiac_num: this.getWesternZodiacNumber(inputData),
      personality_core_index: this.getPersonalityCoreIndex(inputData),
      interpersonal_index: this.getInterpersonalIndex(inputData),
      current_wealth_index: this.getCurrentWealthIndex(inputData),
      current_state_index: this.getCurrentStateIndex(inputData),
      current_half_year_index: this.getCurrentHalfYearIndex(inputData),
      current_end_year_index: this.getCurrentEndYearIndex(inputData),
      current_direction_serial: this.getCurrentDirectionSerial(inputData),
      current_direction_serial_plus_one: this.getCurrentDirectionSerialPlusOne(inputData),
      current_sinsal_key: this.getCurrentSinsalKey(inputData),
      yong_to_sibsin: calculateYongToSipsin(inputData),
      dangsaju_lifetime_index: this.getDangsajuLifetimeIndex(inputData),
      dangsaju_early_life_index: this.getDangsajuEarlyLifeIndex(inputData),
      dangsaju_middle_life_index: this.getDangsajuMiddleLifeIndex(inputData),
      dangsaju_late_life_index: this.getDangsajuLateLifeIndex(inputData),
      dangsaju_spouse_index: this.getDangsajuSpouseIndex(inputData),
      dangsaju_children_index: this.getDangsajuChildrenIndex(inputData),
      dangsaju_sibling_index: this.getDangsajuSiblingIndex(inputData),
      jumno_legacy: this.getJumno(inputData),
    };

    if (fieldName in fieldValueMap) {
      const value = fieldValueMap[fieldName];
      if (value !== undefined) {
        if (typeof value === 'string') {
          return value;
        }
        return value.toString().padStart(2, '0');
      }
    }

    if (fieldName === 'conflict_pattern') {
      return this.calculateConflictPattern(inputData);
    }

    if (fieldName === 'serial_number') {
      return this.calculateSerialNumber(inputData);
    }

    if (fieldName === 'juyeok_pair_serial') {
      return this.calculateJuyeokPairSerial(inputData);
    }

    throw new Error(`Unsupported calculation field: ${fieldName} for ${this.config.tableName}`);
  }

  /**
   * 지지를 번호로 변환
   */
  private getBranchNumber(branch: string): number {
    const branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

    // '인(寅)' -> '인' 추출
    const match = /^([가-힣]+)/.exec(branch);
    const branchKr = match ? match[1] : branch;

    const index = branches.indexOf(branchKr ?? '');
    return index >= 0 ? index + 1 : 1;
  }

  private getBranchOrgNumber(branch: string): number {
    const index = BRANCHES_FROM_IN.indexOf(this.getBranchKorean(branch) as (typeof BRANCHES_FROM_IN)[number]);
    return index >= 0 ? index + 1 : 1;
  }

  /**
   * 천간을 번호로 변환
   */
  private getStemNumber(stem: string): number {
    const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
    const match = /^([가-힣]+)/.exec(stem);
    const stemKr = match ? match[1] : stem;
    const index = stems.indexOf(stemKr ?? '');
    return index >= 0 ? index + 1 : 1;
  }

  private getStemKorean(stem: string): string {
    const match = /^([가-힣]+)/.exec(stem);
    return match ? match[1] ?? '갑' : stem || '갑';
  }

  private calculateConflictPattern(inputData: CalculationInput): string {
    const currentManse = this.getCurrentManseRow(inputData);
    const todayStemCode = typeof currentManse?.day_h === 'string' ? currentManse.day_h : '';
    const todayStemNumber = this.getStemNumberFromCode(todayStemCode);

    let todayStemGroup = 5;
    if (todayStemNumber === 1 || todayStemNumber === 2) todayStemGroup = 1;
    if (todayStemNumber === 3 || todayStemNumber === 4) todayStemGroup = 2;
    if (todayStemNumber === 5 || todayStemNumber === 6) todayStemGroup = 3;
    if (todayStemNumber === 7 || todayStemNumber === 8) todayStemGroup = 4;

    const currentYearBranchNumber = this.parseNumberField(currentManse?.year_e) ?? 1;
    const baseValue = Number.parseInt(`1${todayStemGroup}`, 10);
    const resolved = advanceLegacyCycle(baseValue, currentYearBranchNumber, 12);
    return resolved.toString().padStart(2, '0');
  }

  private getCurrentManseRow(inputData: CalculationInput): Record<string, unknown> | null {
    const currentDate = this.getCurrentDateContext(inputData);
    if (!currentDate) {
      return null;
    }

    const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>;
    return mansedata[currentDate.dateCode] ?? null;
  }

  private getStemNumberFromCode(stemCode: string): number {
    const codes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const index = codes.indexOf(String(stemCode ?? '').trim());
    return index >= 0 ? index + 1 : 10;
  }

  private calculateSerialNumber(inputData: CalculationInput): string {
    const currentManse = this.getCurrentManseRow(inputData);
    const currentDayBranchNumber = this.parseNumberField(currentManse?.day_e);
    if (!currentDayBranchNumber) {
      throw new Error(`Current day branch number is unavailable for ${this.config.tableName}`);
    }

    const birthDayBranch = this.branchOrgCodeToKorean(this.getBranchOrgNumber(inputData.dayBranch));
    const currentDayBranch = this.branchOrgCodeToKorean(currentDayBranchNumber);
    return calculateJuyeokJiSerial(birthDayBranch, currentDayBranch);
  }

  private branchOrgCodeToKorean(value: number): string {
    return BRANCHES_FROM_IN_DISPLAY[value - 1] ?? '축';
  }

  private calculateJuyeokPairSerial(inputData: CalculationInput): string {
    const currentManse = this.getCurrentManseRow(inputData);
    const currentDayBranchNumber = this.parseNumberField(currentManse?.day_e);
    if (!currentDayBranchNumber) {
      throw new Error(`Current day branch number is unavailable for ${this.config.tableName}`);
    }

    const birthDayStem = extractKorean(inputData.dayStem);
    const birthDayBranch = this.branchOrgCodeToKorean(this.getBranchOrgNumber(inputData.dayBranch));
    const currentDayBranch = this.branchOrgCodeToKorean(currentDayBranchNumber);

    return calculateJuyeokPairSerial(birthDayStem, birthDayBranch, currentDayBranch);
  }

  private getBranchKorean(branch: string): string {
    const match = /^([가-힣]+)/.exec(branch);
    return match ? match[1] ?? '자' : branch || '자';
  }

  private getStemAlpha(stem: string): string {
    const stemMap: Record<string, string> = {
      갑: 'A',
      을: 'B',
      병: 'C',
      정: 'D',
      무: 'E',
      기: 'F',
      경: 'G',
      신: 'H',
      임: 'I',
      계: 'J',
    };

    return stemMap[this.getStemKorean(stem)] ?? 'A';
  }

  private getStemElementCode(stem: string): string {
    const elementMap: Record<string, string> = {
      갑: 'mok',
      을: 'mok',
      병: 'wha',
      정: 'wha',
      무: 'to',
      기: 'to',
      경: 'gum',
      신: 'gum',
      임: 'su',
      계: 'su',
    };

    return elementMap[this.getStemKorean(stem)] ?? 'mok';
  }

  private getStemElementNumber(stem: string): number {
    return ELEMENT_NUMBER_BY_CODE[this.getStemElementCode(stem)] ?? 1;
  }

  private getBranchElementNumber(branch: string): number {
    return BRANCH_ELEMENT_NUMBER[this.getBranchKorean(branch)] ?? 1;
  }

  private getBranchSipsinNumber(dayStem: string, branch: string): number {
    const sipsin = getSipsinForBranch(dayStem, this.getBranchKorean(branch));
    return SIPSIN_NUMBER_BY_NAME[sipsin] ?? 1;
  }

  private getWesternZodiacNumber(inputData: CalculationInput): number {
    const birthDate = this.getBirthDateString(inputData);
    if (!birthDate) {
      return 1;
    }

    const [, monthText = '01', dayText = '01'] = birthDate.split('-');
    const month = Number.parseInt(monthText, 10);
    const day = Number.parseInt(dayText, 10);

    if ((month === 12 && day > 23) || (month === 1 && day < 21)) return 12;
    if ((month === 1 && day > 20) || (month === 2 && day < 20)) return 1;
    if ((month === 2 && day > 19) || (month === 3 && day < 21)) return 2;
    if ((month === 3 && day > 20) || (month === 4 && day < 21)) return 3;
    if ((month === 4 && day > 20) || (month === 5 && day < 22)) return 4;
    if ((month === 5 && day > 21) || (month === 6 && day < 22)) return 5;
    if ((month === 6 && day > 21) || (month === 7 && day < 24)) return 6;
    if ((month === 7 && day > 23) || (month === 8 && day < 24)) return 7;
    if ((month === 8 && day > 23) || (month === 9 && day < 24)) return 8;
    if ((month === 9 && day > 23) || (month === 10 && day < 24)) return 9;
    if ((month === 10 && day > 23) || (month === 11 && day < 23)) return 10;
    return 11;
  }

  private getPersonalityCoreIndex(inputData: CalculationInput): number {
    const yearBranchOrgNumber = this.getBranchOrgNumber(inputData.yearBranch);
    const multiplier =
      yearBranchOrgNumber === 1 || yearBranchOrgNumber === 3 || yearBranchOrgNumber === 5
        ? 1
        : yearBranchOrgNumber === 6 || yearBranchOrgNumber === 7 || yearBranchOrgNumber === 11
          ? 2
          : yearBranchOrgNumber === 2 || yearBranchOrgNumber === 4 || yearBranchOrgNumber === 9
            ? 3
            : 4;

    return yearBranchOrgNumber * multiplier;
  }

  private getCurrentWealthIndex(inputData: CalculationInput): string {
    const currentDate = this.getCurrentDateContext(inputData);
    const dayStemNumber = this.getStemNumber(inputData.dayStem);
    const currentHourCode = this.getCurrentHourOrgNumber(currentDate?.hhmm ?? null);
    return `${dayStemNumber.toString().padStart(2, '0')}${currentHourCode.toString().padStart(2, '0')}`;
  }

  private getInterpersonalIndex(inputData: CalculationInput): number {
    const currentManse = this.getCurrentManseContext(inputData);
    const currentMonth = currentManse?.month ?? this.getCurrentDateContext(inputData)?.month ?? 1;
    const currentYearBranch = currentManse?.yearE ?? 1;
    let baseValue = 14 - currentYearBranch;
    if (baseValue > 12) {
      baseValue -= 12;
    }

    let index = baseValue + currentMonth - 1 + 6;
    while (index > 12) {
      index -= 12;
    }

    return index;
  }

  private getCurrentStateIndex(inputData: CalculationInput): string {
    const currentManse = this.getCurrentManseContext(inputData);
    const birthHourOrgNumber = this.getBranchOrgNumber(inputData.hourBranch);
    const fallbackValue = birthHourOrgNumber + 1;

    if (!currentManse) {
      return fallbackValue.toString();
    }

    let stateIndex = birthHourOrgNumber + currentManse.dayE;
    if (birthHourOrgNumber === currentManse.daysInMonth) {
      stateIndex = 1;
    }

    return stateIndex.toString();
  }

  private getCurrentHalfYearIndex(inputData: CalculationInput): string {
    const currentManse = this.getCurrentManseContext(inputData);
    const yearBranchOrgNumber = this.getBranchOrgNumber(inputData.yearBranch);
    const monthBranchOrgNumber = this.getBranchOrgNumber(inputData.monthBranch);
    const dayBranchOrgNumber = this.getBranchOrgNumber(inputData.dayBranch);
    const birthHour = this.getBirthHour(inputData);
    let currentIndex = (yearBranchOrgNumber + monthBranchOrgNumber + dayBranchOrgNumber) % 24;

    if (birthHour > 0) {
      const hourOffset = Math.floor(birthHour / 2);
      currentIndex += inputData.gender === 'M' ? hourOffset : -hourOffset;
      if (currentIndex > 24) {
        currentIndex -= 24;
      } else if (currentIndex < 1) {
        currentIndex = 24 + currentIndex;
      }
    } else {
      currentIndex += inputData.gender === 'M' ? 1 : -1;
    }

    if (currentIndex < 1) {
      currentIndex = 1;
    }
    if (currentManse && yearBranchOrgNumber === currentManse.yearE) {
      currentIndex = 1;
    }

    return currentIndex.toString();
  }

  private getCurrentEndYearIndex(inputData: CalculationInput): string {
    const currentManse = this.getCurrentManseContext(inputData);
    const yearBranchOrgNumber = this.getBranchOrgNumber(inputData.yearBranch);
    if (!currentManse) {
      return yearBranchOrgNumber.toString();
    }

    const currentIndex = yearBranchOrgNumber === currentManse.yearE ? 1 : yearBranchOrgNumber + currentManse.yearE;
    return currentIndex.toString();
  }

  private getCurrentDirectionSerial(inputData: CalculationInput): number {
    return CURRENT_DIRECTION_SERIAL_BY_BRANCH[this.getBranchKorean(inputData.dayBranch)] ?? 8;
  }

  private getCurrentDirectionSerialPlusOne(inputData: CalculationInput): number {
    const serial = this.getCurrentDirectionSerial(inputData) + 1;
    return serial > 8 ? 1 : serial;
  }

  private getCurrentSinsalKey(inputData: CalculationInput): string {
    const currentLunarYearBranch = this.getCurrentLunarYearBranch(inputData);
    if (!currentLunarYearBranch) {
      throw new Error(`Current lunar year branch is unavailable for ${this.config.tableName}`);
    }

    const anchorBranch = this.shiftBranch(currentLunarYearBranch, -2);
    const sinsalLabel = calculateSinsal(this.getBranchKorean(inputData.dayBranch), anchorBranch);
    if (!sinsalLabel) {
      throw new Error(`Unable to derive current sinsal key for ${this.config.tableName}`);
    }

    const tableKey = SINSAL_TABLE_KEY_BY_LABEL[sinsalLabel];
    if (!tableKey) {
      throw new Error(`Unsupported sinsal label for ${this.config.tableName}: ${sinsalLabel}`);
    }

    return tableKey;
  }

  private getDangsajuEarlyLifeIndex(inputData: CalculationInput): string {
    return `01${this.getBranchOrgNumber(inputData.yearBranch).toString().padStart(2, '0')}`;
  }

  private getDangsajuLifetimeIndex(inputData: CalculationInput): string {
    return `04${this.getBranchOrgNumber(inputData.hourBranch).toString().padStart(2, '0')}`;
  }

  private getDangsajuMiddleLifeIndex(inputData: CalculationInput): string {
    return `02${this.getBranchOrgNumber(inputData.monthBranch).toString().padStart(2, '0')}`;
  }

  private getDangsajuLateLifeIndex(inputData: CalculationInput): string {
    return `03${this.getBranchOrgNumber(inputData.dayBranch).toString().padStart(2, '0')}`;
  }

  private getDangsajuSpouseIndex(inputData: CalculationInput): string {
    const total = this.calculateWrappedIndex(
      this.getBranchOrgNumber(inputData.monthBranch),
      this.getYearGroupedStart(this.getBranchOrgNumber(inputData.yearBranch), [12, 3, 6, 9])
    );
    return `07${total.toString().padStart(2, '0')}`;
  }

  private getDangsajuChildrenIndex(inputData: CalculationInput): string {
    const total = this.calculateWrappedIndex(
      this.getBranchOrgNumber(inputData.hourBranch),
      this.getYearGroupedStart(this.getBranchOrgNumber(inputData.yearBranch), [3, 6, 9, 12])
    );
    return `08${total.toString().padStart(2, '0')}`;
  }

  private getDangsajuSiblingIndex(inputData: CalculationInput): string {
    const total = this.calculateWrappedIndex(
      this.getBranchOrgNumber(inputData.hourBranch),
      this.getMonthGroupedStart(this.getBranchOrgNumber(inputData.monthBranch), [10, 7, 4, 1])
    );
    return `09${total.toString().padStart(2, '0')}`;
  }

  private getJumno(inputData: CalculationInput): number {
    const cachedJumno = inputData.additionalData?.jumno;
    if (typeof cachedJumno === 'number' && Number.isFinite(cachedJumno)) {
      return cachedJumno;
    }
    if (typeof cachedJumno === 'string') {
      const parsed = Number.parseInt(cachedJumno, 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    let jumno =
      this.getBranchOrgNumber(inputData.yearBranch) * this.getBranchOrgNumber(inputData.monthBranch) +
      this.getBranchOrgNumber(inputData.dayBranch);
    if (inputData.gender !== 'M') {
      jumno += 12;
    }
    if (jumno > 100) {
      jumno -= 100;
    }
    if (jumno === 0) {
      jumno = 100;
    }
    return jumno;
  }

  private calculateWrappedIndex(value: number, start: number): number {
    return ((value - start + 12) % 12) + 1;
  }

  private getYearGroupedStart(yearBranchOrgNumber: number, starts: readonly [number, number, number, number]): number {
    if (yearBranchOrgNumber === 12 || yearBranchOrgNumber === 4 || yearBranchOrgNumber === 8) {
      return starts[0];
    }
    if (yearBranchOrgNumber === 11 || yearBranchOrgNumber === 3 || yearBranchOrgNumber === 7) {
      return starts[1];
    }
    if (yearBranchOrgNumber === 2 || yearBranchOrgNumber === 6 || yearBranchOrgNumber === 10) {
      return starts[2];
    }
    return starts[3];
  }

  private getMonthGroupedStart(monthBranchOrgNumber: number, starts: readonly [number, number, number, number]): number {
    if (monthBranchOrgNumber === 1 || monthBranchOrgNumber === 5 || monthBranchOrgNumber === 9) {
      return starts[0];
    }
    if (monthBranchOrgNumber === 2 || monthBranchOrgNumber === 6 || monthBranchOrgNumber === 10) {
      return starts[1];
    }
    if (monthBranchOrgNumber === 3 || monthBranchOrgNumber === 7 || monthBranchOrgNumber === 11) {
      return starts[2];
    }
    return starts[3];
  }

  private getBirthDateString(inputData: CalculationInput): string | null {
    const birthDate = inputData.additionalData?.birth_date;
    return typeof birthDate === 'string' && birthDate ? birthDate : null;
  }

  private getBirthHour(inputData: CalculationInput): number {
    const birthTime = inputData.additionalData?.birth_time;
    if (typeof birthTime !== 'string') {
      return 0;
    }

    const [hourText] = birthTime.split(':');
    const hour = Number.parseInt(hourText ?? '0', 10);
    return Number.isFinite(hour) ? hour : 0;
  }

  private getTimezone(inputData: CalculationInput): string {
    const timezone = inputData.additionalData?.timezone;
    return typeof timezone === 'string' && timezone ? timezone : 'Asia/Seoul';
  }

  private getCurrentLunarYearBranch(inputData: CalculationInput): string | null {
    const currentDate = this.getCurrentDateContext(inputData);
    if (!currentDate) {
      return null;
    }

    const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>;
    const manse = mansedata[currentDate.dateCode];
    const rawBranch = typeof manse?.lunar_year_e === 'string' ? manse.lunar_year_e : manse?.umyear_e;
    if (typeof rawBranch !== 'string' || !rawBranch) {
      return null;
    }

    return KOREAN_BRANCH_TO_DISPLAY[rawBranch] ?? null;
  }

  private shiftBranch(branch: string, offset: number): string {
    const branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
    const index = branches.indexOf(branch);
    if (index === -1) {
      throw new Error(`Unsupported branch shift source for ${this.config.tableName}: ${branch}`);
    }

    return branches[(index + offset + branches.length) % branches.length] ?? branch;
  }

  private getCurrentHourOrgNumber(hhmm: number | null): number {
    if (hhmm === null) {
      return 11;
    }
    if (hhmm < 131 || hhmm >= 2331) return 11;
    if (hhmm < 331) return 12;
    if (hhmm < 531) return 1;
    if (hhmm < 731) return 2;
    if (hhmm < 931) return 3;
    if (hhmm < 1131) return 4;
    if (hhmm < 1331) return 5;
    if (hhmm < 1531) return 6;
    if (hhmm < 1731) return 7;
    if (hhmm < 1931) return 8;
    if (hhmm < 2131) return 9;
    return 10;
  }

  private getCurrentDateContext(inputData: CalculationInput): CurrentDateContext | null {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: this.getTimezone(inputData),
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      });
      const partMap = Object.fromEntries(
        formatter
          .formatToParts(new Date())
          .filter((part) => part.type !== 'literal')
          .map((part) => [part.type, part.value])
      );

      const year = Number.parseInt(String(partMap.year ?? '0'), 10);
      const month = Number.parseInt(String(partMap.month ?? '1'), 10);
      const day = Number.parseInt(String(partMap.day ?? '1'), 10);
      const hour = Number.parseInt(String(partMap.hour ?? '0'), 10);
      const minute = Number.parseInt(String(partMap.minute ?? '0'), 10);

      return {
        year,
        month,
        day,
        hour,
        minute,
        daysInMonth: new Date(Date.UTC(year, month, 0)).getUTCDate(),
        dateCode: `${year.toString().padStart(4, '0')}${month.toString().padStart(2, '0')}${day
          .toString()
          .padStart(2, '0')}`,
        hhmm: hour * 100 + minute,
      };
    } catch {
      return null;
    }
  }

  private getCurrentManseContext(inputData: CalculationInput): CurrentManseContext | null {
    const currentDate = this.getCurrentDateContext(inputData);
    if (!currentDate) {
      return null;
    }

    const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>;
    const manse = mansedata[currentDate.dateCode];
    if (!manse || typeof manse !== 'object') {
      return null;
    }

    const yearE = this.parseNumberField(manse.year_e);
    const dayE = this.parseNumberField(manse.day_e);
    if (!yearE || !dayE) {
      return null;
    }

    return {
      ...currentDate,
      yearE,
      dayE,
    };
  }

  private parseNumberField(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private getLifecycleStageNumbers(inputData: CalculationInput): Record<'year' | 'month' | 'day' | 'hour', number> {
    const stages = lifecycleStageCalculator.calculateAllLifecycleStages(
      inputData.dayStem,
      inputData.yearBranch,
      inputData.monthBranch,
      inputData.dayBranch,
      inputData.hourBranch
    );

    return {
      year: this.getLifecycleStageNumber(stages.year),
      month: this.getLifecycleStageNumber(stages.month),
      day: this.getLifecycleStageNumber(stages.day),
      hour: this.getLifecycleStageNumber(stages.hour),
    };
  }

  private getLifecycleStageNumber(stage: string | null): number {
    if (!stage) {
      return 1;
    }

    return LIFECYCLE_STAGE_INDEX[stage] ?? 1;
  }
}

/**
 * 복합 계산형 계산기 (S007, S063 등)
 */
export class ComplexCalculationCalculator extends AbstractFortuneCalculator {
  override calculate(inputData: CalculationInput): CalculationResult {
    if (this.config.calculationMethod === 'j023_ziwei_guanrok') {
      return this.calculateJ023Result(inputData);
    }
    if (this.config.calculationMethod === 's014_current_fortune') {
      return this.calculateS014Result(inputData);
    }
    if (this.config.calculationMethod === 's126_misfortune_relief') {
      return this.calculateS126Result(inputData);
    }
    if (this.config.calculationMethod === 's101_monthly_new_year_signal') {
      return this.calculateS101Result(inputData);
    }
    if (this.config.calculationMethod === 's110_tojeong_cut_tot_monthly') {
      return this.calculateMonthlyRecordResult(inputData);
    }

    return super.calculate(inputData);
  }

  calculateExpression(inputData: CalculationInput): string {
    const methodName = this.config.calculationMethod;

    if (methodName === 's063_calculation') {
      return this.calculateS063(inputData);
    }
    if (methodName === 's007_calculation') {
      return this.calculateS007(inputData);
    }

    if (methodName === 't010_multiplication') {
      return this.calculateT010(inputData);
    }

    if (methodName === 's008_calculation') {
      return this.calculateS008(inputData);
    }
    if (
      methodName === 's095_new_year_signal' ||
      methodName === 's098_new_year_signal' ||
      methodName === 's099_new_year_signal' ||
      methodName === 's100_new_year_signal'
    ) {
      return calculateNewYearSignalExpression(inputData);
    }
    if (methodName === 's097_new_year_signal') {
      return calculateNewYearSignalWithHourExpression(inputData);
    }
    if (methodName === 's101_monthly_new_year_signal') {
      return calculateNewYearMonthlyExpression(inputData, (stemKr) => this.stemToAlpha(stemKr));
    }
    if (
      methodName === 's103_tojeong_cut_tot' ||
      methodName === 's104_tojeong_cut_tot' ||
      methodName === 's106_tojeong_cut_tot' ||
      methodName === 's107_tojeong_cut_tot' ||
      methodName === 's108_tojeong_cut_tot' ||
      methodName === 's109_tojeong_cut_tot' ||
      methodName === 's110_tojeong_cut_tot_monthly'
    ) {
      return calculateTojeongTrigramCompositeKey(
        inputData,
        {
          getBirthDateParts: (value) => this.getBirthDateParts(value),
          getBirthHourValue: (value) => this.getBirthHourValue(value),
          getBirthLunarDateParts: (value) => this.getBirthLunarDateParts(value),
          getCurrentDateContext: (value) => this.getCurrentDateContext(value),
        },
        this.config.tableName
      );
    }

    if (methodName === 's014_current_fortune') {
      return this.calculateS014Expression(inputData);
    }

    if (methodName === 's126_misfortune_relief') {
      return this.calculateS126Expression(inputData);
    }

    if (methodName === 'j023_ziwei_guanrok') {
      return this.calculateJ023Expression(inputData);
    }

    if (methodName === 'f011_trigram') {
      return this.calculateF011(inputData);
    }

    throw new Error(`Unsupported calculation method: ${methodName ?? 'unknown'} for ${this.config.tableName}`);
  }

  /**
   * S063 특화 계산
   */
  private calculateS063(inputData: CalculationInput): string {
    // 천간/지지 추출 및 번호 변환
    const stemKr = extractKorean(inputData.yearStem);
    const branchKr = extractKorean(inputData.yearBranch);

    const stemNum = this.getStemNumber(stemKr);
    const branchNum = this.getBranchNumber(branchKr);

    // 성별 조정
    let adjustedBranch = branchNum;
    if (inputData.gender !== 'M') {
      adjustedBranch -= 1;
    }

    // 홀짝 조정
    const stemParity = stemNum % 2;
    const branchParity = adjustedBranch % 2;

    if (stemParity === 0 && branchParity === 1) {
      adjustedBranch -= 1;
    } else if (stemParity === 1 && branchParity === 0) {
      adjustedBranch -= 1;
    }

    // 범위 정규화
    while (adjustedBranch < 1) {
      adjustedBranch += 12;
    }

    // 알파벳 변환
    const alphaCode = this.stemToAlpha(stemKr);
    return `${alphaCode}${adjustedBranch.toString().padStart(2, '0')}`;
  }

  /**
   * S007 특화 계산
   */
  private calculateS007(inputData: CalculationInput): string {
    const currentDate = this.getCurrentDateContext(inputData);
    if (!currentDate) {
      throw new Error(`Current date context is unavailable for ${this.config.tableName}`);
    }

    const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>;
    const manse = mansedata[currentDate.dateCode];
    const currentYearStemCode = typeof manse?.year_h === 'string' ? manse.year_h : null;
    if (!currentYearStemCode) {
      throw new Error(`Current mansedata row is unavailable for ${this.config.tableName}`);
    }

    let baseValue = 14 - this.getStemNumberFromCode(currentYearStemCode);
    if (baseValue > 12) {
      baseValue -= 12;
    }

    let index = baseValue + currentDate.month - 1;
    if (index >= 12) {
      index %= 12;
    }
    if (index === 0) {
      index = 12;
    }

    return index.toString().padStart(2, '0');
  }

  private calculateT010(inputData: CalculationInput): string {
    const yearBranchOrgNumber = this.getBranchOrgNumber(extractKorean(inputData.yearBranch));
    const multiplier =
      yearBranchOrgNumber === 1 || yearBranchOrgNumber === 3 || yearBranchOrgNumber === 5
        ? 1
        : yearBranchOrgNumber === 6 || yearBranchOrgNumber === 7 || yearBranchOrgNumber === 11
          ? 2
          : yearBranchOrgNumber === 2 || yearBranchOrgNumber === 4 || yearBranchOrgNumber === 9
            ? 3
            : 4;

    return String(yearBranchOrgNumber * multiplier);
  }

  private calculateS008(inputData: CalculationInput): string {
    const currentDate = this.getCurrentDateContext(inputData);
    if (!currentDate) {
      throw new Error(`Current date is unavailable for ${this.config.tableName}`);
    }

    const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>;
    const manse = mansedata[currentDate.dateCode];
    if (!manse || typeof manse !== 'object') {
      throw new Error(`Current mansedata row is unavailable for ${this.config.tableName}`);
    }

    const currentDayBranchNumber = this.parseNumberField(manse.day_e);
    if (!currentDayBranchNumber) {
      throw new Error(`Current day branch number is unavailable for ${this.config.tableName}`);
    }

    const currentYearBranchNumber = this.parseNumberField(manse.year_e) ?? 1;
    const birthDayBranchNumber = this.getBranchOrgNumber(inputData.dayBranch);
    const birthOheng = getFiveElementGroup(birthDayBranchNumber.toString().padStart(2, '0'));
    const currentOheng = getFiveElementGroup(currentDayBranchNumber.toString().padStart(2, '0'));
    const baseValue = birthOheng * currentOheng;
    const resolved = advanceLegacyCycle(baseValue, currentYearBranchNumber, 10);
    return resolved.toString().padStart(2, '0');
  }

  private calculateF011(inputData: CalculationInput): string {
    const currentDate = this.getCurrentDateContext(inputData);
    if (!currentDate) {
      throw new Error(`Current date is unavailable for ${this.config.tableName}`);
    }

    const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>;
    const manse = mansedata[currentDate.dateCode];
    if (!manse || typeof manse !== 'object') {
      throw new Error(`Current mansedata row is unavailable for ${this.config.tableName}`);
    }

    const currentDayBranchNumber = this.parseNumberField(manse.day_e);
    if (!currentDayBranchNumber) {
      throw new Error(`Current day branch number is unavailable for ${this.config.tableName}`);
    }

    const birthDayStem = extractKorean(inputData.dayStem);
    const currentDayBranch = this.branchOrgCodeToKorean(currentDayBranchNumber);
    return calculateJuyeokGanSerial(birthDayStem, currentDayBranch);
  }

  private calculateS126Expression(inputData: CalculationInput): string {
    const birthYearBranch = extractKorean(inputData.yearBranch);
    const currentYearBranch = this.getCurrentManseBranch(inputData, 'year_e') ?? '미상';
    return `${birthYearBranch}-${currentYearBranch}`;
  }

  private calculateS126Result(inputData: CalculationInput): CalculationResult {
    const expression = this.calculateS126Expression(inputData);
    const textBlocks = this.buildS126TextBlocks(inputData);

    return {
      tableName: this.config.tableName,
      expression,
      text: textBlocks.join('\n\n'),
      numerical: null,
      metadata: {
        ...this.getMetadata(inputData),
        block_count: textBlocks.length,
      },
    };
  }

  private calculateJ023Expression(inputData: CalculationInput): string {
    const branch = this.getZiweiGuanrokBranch(inputData);
    const key = this.getZiweiJ023QueryKey(inputData);
    return `${branch}|${key}`;
  }

  private calculateJ023Result(inputData: CalculationInput): CalculationResult {
    const branch = this.getZiweiGuanrokBranch(inputData);
    const primaryKey = this.getZiweiJ023QueryKey(inputData);
    const fallbackKey = this.getZiweiJ023FallbackKey(inputData);
    const jTables = getDataLoader().loadJTables() as Record<string, Record<string, Record<string, unknown>>>;
    const tableRows = jTables[this.config.tableName];
    const branchRows = tableRows?.[branch];
    const record =
      this.getZiweiJ023Record(branchRows, primaryKey) ??
      (fallbackKey !== primaryKey ? this.getZiweiJ023Record(branchRows, fallbackKey) : null);

    const text = record && typeof record.data === 'string' ? record.data.trim() : '';
    const numerical = record && record.numerical !== undefined && record.numerical !== null ? String(record.numerical) : null;

    return {
      tableName: this.config.tableName,
      expression: `${branch}|${primaryKey}`,
      text,
      numerical,
      metadata: {
        ...this.getMetadata(inputData),
        branch,
        primary_key: primaryKey,
        fallback_key: fallbackKey,
      },
    };
  }

  private buildS126TextBlocks(inputData: CalculationInput): string[] {
    const blocks: string[] = [];
    const seen = new Set<string>();
    const addText = (text: string) => {
      const normalized = text.trim();
      if (!normalized || seen.has(normalized)) {
        return;
      }
      seen.add(normalized);
      blocks.push(`■ ${normalized}`);
    };
    const addTableEntry = (key: string) => {
      const [text] = this.retrieveData(key);
      addText(text);
    };

    const birthDayBranch = extractKorean(inputData.dayBranch);
    const birthYearBranch = extractKorean(inputData.yearBranch);
    const monthBranch = extractKorean(inputData.monthBranch);
    const hourBranch = extractKorean(inputData.hourBranch);

    const pillarLabels = [
      calculateSinsal(birthDayBranch, monthBranch),
      calculateSinsal(birthDayBranch, birthYearBranch),
      calculateSinsal(birthDayBranch, hourBranch),
      calculateSinsal(birthYearBranch, birthDayBranch),
    ];

    for (const label of pillarLabels) {
      if (!label) {
        continue;
      }
      const tableKey = SINSAL_TABLE_KEY_BY_LABEL[label];
      if (tableKey) {
        addTableEntry(tableKey);
      }
      if (label === '도화살(桃花殺)') {
        addTableEntry('도화살');
      }
    }

    const currentYearBranch = this.getCurrentManseBranch(inputData, 'year_e');
    if (currentYearBranch) {
      const annualLabel = calculateSinsal(birthYearBranch, currentYearBranch);
      const annualTableKey = annualLabel ? SINSAL_DISP_TABLE_KEY_BY_LABEL[annualLabel] : null;
      if (annualTableKey) {
        addTableEntry(annualTableKey);
      }
    }

    return blocks;
  }

  private getZiweiJ023Record(
    branchRows: Record<string, unknown> | undefined,
    key: string
  ): { readonly data?: string; readonly numerical?: string | number | null } | null {
    if (!branchRows || !key) {
      return null;
    }

    const record = branchRows[key];
    if (!record || typeof record !== 'object') {
      return null;
    }

    return record as { readonly data?: string; readonly numerical?: string | number | null };
  }

  private getZiweiJ023QueryKey(inputData: CalculationInput): string {
    const stars = this.getZiweiGuanrokStars(inputData);
    const transformedIndex = stars.findIndex((star) => this.hasZiweiSawhaSuffix(star));
    if (transformedIndex >= 0) {
      return stars[transformedIndex] ?? '';
    }
    if (stars.length >= 2) {
      return `${stars[0] ?? ''}${stars[1] ?? ''}`;
    }
    return stars[0] ?? '';
  }

  private getZiweiJ023FallbackKey(inputData: CalculationInput): string {
    const stars = this.getZiweiGuanrokStars(inputData, false);
    if (stars.length >= 2) {
      return `${stars[0] ?? ''}${stars[1] ?? ''}`;
    }
    return stars[0] ?? '';
  }

  private getZiweiGuanrokStars(inputData: CalculationInput, includeSawha = true): string[] {
    const guanrokSlot = this.getZiweiGuanrokSlot(inputData);
    const directStars = this.getZiweiStarsForSlot(inputData, guanrokSlot, includeSawha);
    if (directStars.length > 0) {
      return directStars;
    }

    // Legacy PHP falls back to the opposite spouse palace when 관록궁 is 무정요궁.
    return this.getZiweiStarsForSlot(inputData, this.wrapZiweiSlot(guanrokSlot + 6), includeSawha);
  }

  private getZiweiStarsForSlot(inputData: CalculationInput, targetSlot: number, includeSawha: boolean): string[] {
    const jamiSlot = this.getZiweiJamiSlot(inputData);
    const cheanbuSlot = this.wrapZiweiSlot(14 - jamiSlot);
    const sawhaMap = includeSawha ? this.getZiweiSawhaSuffixMap(inputData) : {};
    const starsInGuanrok: string[] = [];
    const assignStar = (slot: number, name: string) => {
      if (slot === targetSlot) {
        const suffix = sawhaMap[name];
        starsInGuanrok.push(suffix ? `${name}${suffix}` : name);
      }
    };

    assignStar(this.wrapZiweiSlot(jamiSlot), '자미');
    assignStar(this.wrapZiweiSlot(jamiSlot - 1), '천기');
    assignStar(this.wrapZiweiSlot(jamiSlot - 3), '태양');
    assignStar(this.wrapZiweiSlot(jamiSlot - 4), '무곡');
    assignStar(this.wrapZiweiSlot(jamiSlot - 5), '천동');
    assignStar(this.wrapZiweiSlot(jamiSlot + 4), '염정');

    assignStar(this.wrapZiweiSlot(cheanbuSlot), '천부');
    assignStar(this.wrapZiweiSlot(cheanbuSlot + 1), '태음');
    assignStar(this.wrapZiweiSlot(cheanbuSlot + 2), '탐랑');
    assignStar(this.wrapZiweiSlot(cheanbuSlot + 3), '거문');
    assignStar(this.wrapZiweiSlot(cheanbuSlot + 4), '천상');
    assignStar(this.wrapZiweiSlot(cheanbuSlot + 5), '천량');
    assignStar(this.wrapZiweiSlot(cheanbuSlot + 6), '칠살');
    assignStar(this.wrapZiweiSlot(cheanbuSlot - 2), '파군');

    return ZIWEI_QUERY_STAR_ORDER.flatMap((star) => {
      const entry = starsInGuanrok.find((value) => value.startsWith(star));
      return entry ? [entry] : [];
    });
  }

  private hasZiweiSawhaSuffix(starName: string): boolean {
    return starName.endsWith('록') || starName.endsWith('권') || starName.endsWith('과') || starName.endsWith('기');
  }

  private getZiweiGuanrokBranch(inputData: CalculationInput): string {
    return ZIWEI_BRANCH_BY_SLOT[this.getZiweiGuanrokSlot(inputData) - 1] ?? '午';
  }

  private getZiweiGuanrokSlot(inputData: CalculationInput): number {
    return this.wrapZiweiSlot(this.getZiweiMyungSlot(inputData) + 4);
  }

  private getZiweiMyungSlot(inputData: CalculationInput): number {
    const birthLunarDate = this.getBirthLunarDateParts(inputData);
    if (!birthLunarDate) {
      throw new Error(`Birth lunar date is unavailable for ${this.config.tableName}`);
    }

    const lunarMonth = Number.parseInt(birthLunarDate.month, 10);
    const hourIndex = this.getBranchNumber(inputData.hourBranch);
    return this.wrapZiweiSlot(lunarMonth - hourIndex + 1);
  }

  private getZiweiJamiSlot(inputData: CalculationInput): number {
    const birthLunarDate = this.getBirthLunarDateParts(inputData);
    if (!birthLunarDate) {
      throw new Error(`Birth lunar date is unavailable for ${this.config.tableName}`);
    }

    const day = Number.parseInt(birthLunarDate.day, 10);
    if (!Number.isFinite(day) || day < 1 || day > 30) {
      throw new Error(`Birth lunar day is invalid for ${this.config.tableName}`);
    }

    const guk = this.getZiweiMyungGuk(inputData);
    const table = ZIWEI_JAMI_SLOT_BY_GUK[guk];
    const slot = table?.[day - 1];
    if (!slot) {
      throw new Error(`Ziwei jami slot lookup failed for ${this.config.tableName}`);
    }
    return slot;
  }

  private getZiweiMyungGuk(inputData: CalculationInput): string {
    const yearGroup = ZIWEI_YEAR_GROUP_INDEX_BY_STEM[extractKorean(inputData.yearStem)];
    if (yearGroup === undefined) {
      throw new Error(`Birth year stem group is unavailable for ${this.config.tableName}`);
    }

    const slot = this.getZiweiMyungSlot(inputData);
    const guk = ZIWEI_GUK_BY_MYUNG_SLOT_AND_YEAR_GROUP[slot]?.[yearGroup];
    if (!guk) {
      throw new Error(`Ziwei myung guk lookup failed for ${this.config.tableName}`);
    }
    return guk;
  }

  private getZiweiSawhaSuffixMap(inputData: CalculationInput): Readonly<Record<string, string>> {
    const currentDate = this.getCurrentDateContext(inputData);
    if (!currentDate) {
      return {};
    }
    const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>;
    const currentManse = mansedata[currentDate.dateCode];
    const stemCode = typeof currentManse?.year_h === 'string' ? currentManse.year_h : '';
    const hanja = STEM_CODE_TO_HANJA[stemCode] ?? STEM_DISPLAY_TO_HANJA[extractKorean(inputData.yearStem)] ?? '';
    return ZIWEI_SAWHA_SUFFIX_BY_STEM_HANJA[hanja] ?? {};
  }

  private wrapZiweiSlot(value: number): number {
    const normalized = ((value - 1) % 12 + 12) % 12;
    return normalized + 1;
  }

  private calculateS014Expression(inputData: CalculationInput): string {
    const context = this.buildS014Context(inputData);
    return `${context.toYCSibsin}-${context.woonY}|${context.toYGSibsin}-${context.woonZ}`;
  }

  private calculateS014Result(inputData: CalculationInput): CalculationResult {
    const context = this.buildS014Context(inputData);
    const firstLookup = `${context.toYCSibsin}-${context.woonY}`;
    let secondWoon = context.woonZ;
    if (context.toYCSibsin === context.toYGSibsin && context.woonY === context.woonZ) {
      secondWoon = String(((Number.parseInt(context.woonZ, 10) % 3) + 1)).padStart(2, '0');
    }
    const secondLookup = `${context.toYGSibsin}-${secondWoon}`;
    const [firstText] = this.retrieveData(firstLookup);
    const [secondText, numerical] = this.retrieveData(secondLookup);

    return {
      tableName: this.config.tableName,
      expression: `${firstLookup}|${secondLookup}`,
      text: `${firstText}${secondText}`,
      numerical: numerical || null,
      metadata: {
        ...this.getMetadata(inputData),
        first_lookup: firstLookup,
        second_lookup: secondLookup,
        role_profile_source: context.elementRoleProfile.sourceTitleKey,
        role_profile_number: context.elementRoleProfile.sourceNumber,
        role_profile_primary: context.elementRoleProfile.primary,
        current_year_stem_role: context.currentYearStemRole,
        current_year_branch_role: context.currentYearBranchRole,
        yong_to_sipsin: context.yongToSipsin,
        yong_chungan: context.yongChungan,
        woon12_daygi: context.woon12Daygi,
      },
    };
  }

  private buildS014Context(inputData: CalculationInput): {
    readonly toYCSibsin: string;
    readonly toYGSibsin: string;
    readonly woonY: string;
    readonly woonZ: string;
    readonly elementRoleProfile: import('./elementRoleProfiles').ElementRoleProfile;
    readonly currentYearStemRole: import('./elementRoleProfiles').ElementRoleLabel;
    readonly currentYearBranchRole: import('./elementRoleProfiles').ElementRoleLabel;
    readonly yongToSipsin: string;
    readonly yongChungan: string;
    readonly woon12Daygi: string;
  } {
    const currentDate = this.getCurrentDateContext(inputData);
    if (!currentDate) {
      throw new Error(`Current date context is unavailable for ${this.config.tableName}`);
    }

    const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>;
    const currentManse = mansedata[currentDate.dateCode];
    if (!currentManse || typeof currentManse !== 'object') {
      throw new Error(`Current mansedata row is unavailable for ${this.config.tableName}`);
    }

    const currentYearStem = typeof currentManse.year_h === 'string' ? currentManse.year_h : '';
    const currentYearBranchCode = typeof currentManse.year_e === 'string' ? currentManse.year_e : '';
    const currentYearBranchHanja = BRANCH_NUMBER_TO_HANJA[currentYearBranchCode];
    const currentYearBranchDisplay = currentYearBranchHanja ? KOREAN_BRANCH_TO_DISPLAY[currentYearBranchHanja] ?? '' : '';
    const currentYearBranchNumber = currentYearBranchDisplay ? this.getBranchNumber(currentYearBranchDisplay) : 1;
    const currentBranchRule = CURRENT_YEAR_BRANCH_RULES[currentYearBranchNumber] ?? CURRENT_YEAR_BRANCH_RULES[1];
    const currentYearStemNumber = this.getStemNumberFromCode(currentYearStem);

    const dayStemDisplay = extractKorean(inputData.dayStem);
    const monthBranchDisplay = extractKorean(inputData.monthBranch);
    const titleKey = `${STEM_DISPLAY_TO_HANJA[dayStemDisplay] ?? ''}${BRANCH_DISPLAY_TO_HANJA[monthBranchDisplay] ?? ''}`;
    const elementRoleProfile = getElementRoleProfile(titleKey);

    const dayStemNumber = this.getStemNumber(dayStemDisplay);
    const dayStemElementGroup = this.getStemElementGroup(dayStemNumber);

    let toYCSibsin = this.getCurrentStemSibsin(dayStemNumber, currentYearStemNumber);
    let toYGSibsin = this.getCurrentBranchSibsin(dayStemNumber, dayStemElementGroup, currentBranchRule.oh, currentBranchRule.ey);
    let woonY = classifyCurrentFortuneElement(this.getStemElementGroup(currentYearStemNumber), elementRoleProfile);
    let woonZ = classifyCurrentFortuneElement(currentBranchRule.oh, elementRoleProfile);
    const currentYearStemRole = classifyStemRoleLabel(STEM_CODE_TO_HANJA[currentYearStem] ?? '', elementRoleProfile);
    const currentYearBranchRole = classifyBranchRoleLabel(currentYearBranchHanja ?? '', elementRoleProfile);
    const yongToSipsin = calculateYongToSipsin(inputData);
    const yongChungan = calculateYongChungan(inputData, yongToSipsin);
    const woon12Daygi = calculateWoon12Daygi(inputData);

    if (inputData.gender !== 'M') {
      woonY = this.incrementWoonCode(woonY);
      woonZ = this.incrementWoonCode(woonZ);
    }

    const hourOffset = Math.floor(this.getBirthHourValue(inputData) / 2) % 12;
    toYCSibsin = String(Math.abs(hourOffset - Number.parseInt(toYCSibsin, 10))).padStart(2, '0');
    toYGSibsin = String(Math.abs(hourOffset - Number.parseInt(toYGSibsin, 10))).padStart(2, '0');

    return {
      toYCSibsin,
      toYGSibsin,
      woonY,
      woonZ,
      elementRoleProfile,
      currentYearStemRole,
      currentYearBranchRole,
      yongToSipsin,
      yongChungan,
      woon12Daygi,
    };
  }

  private calculateS101Result(inputData: CalculationInput): CalculationResult {
    const expression = calculateNewYearMonthlyExpression(inputData, (stemKr) => this.stemToAlpha(stemKr));
    return this.buildMonthlyRecordResult(expression, inputData);
  }

  private calculateMonthlyRecordResult(inputData: CalculationInput): CalculationResult {
    const expression = this.calculateExpression(inputData);
    return this.buildMonthlyRecordResult(expression, inputData);
  }

  private buildMonthlyRecordResult(expression: string, inputData: CalculationInput): CalculationResult {
    const tableData = getDataLoader().loadSTables() as Record<string, Record<string, Record<string, unknown>>>;
    const tableRows = tableData[this.config.tableName];
    const record = tableRows?.[expression];

    if (!record || typeof record !== 'object') {
      return {
        tableName: this.config.tableName,
        expression,
        text: '',
        numerical: null,
        metadata: this.getMetadata(inputData),
      };
    }

    const monthTexts = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const value = record[`DB_data_${month}`];
      const text = typeof value === 'string' ? value.trim() : '';
      return text ? `${month}월\n${text}` : '';
    }).filter(Boolean);

    return {
      tableName: this.config.tableName,
      expression,
      text: monthTexts.join('\n\n'),
      numerical: null,
      metadata: {
        ...this.getMetadata(inputData),
        block_count: monthTexts.length,
      },
    };
  }

  private getBirthDateParts(inputData: CalculationInput): { year: string; month: string; day: string } | null {
    const birthDate = inputData.additionalData?.birth_date;
    if (typeof birthDate !== 'string') {
      return null;
    }
    const [year, month, day] = birthDate.split('-');
    if (!year || !month || !day) {
      return null;
    }
    return { year, month, day };
  }

  private getBirthHourValue(inputData: CalculationInput): number {
    const birthTime = inputData.additionalData?.birth_time;
    if (typeof birthTime !== 'string') {
      return 0;
    }

    const [hourText] = birthTime.split(':');
    const hour = Number.parseInt(hourText ?? '0', 10);
    return Number.isFinite(hour) ? hour : 0;
  }

  private getBirthLunarDateParts(inputData: CalculationInput): { year: string; month: string; day: string } | null {
    const birthDate = this.getBirthDateParts(inputData);
    if (!birthDate) {
      return null;
    }

    const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>;
    const birthRow = mansedata[`${birthDate.year}${birthDate.month}${birthDate.day}`];
    const lunarDate =
      typeof birthRow?.lunar_date === 'string' && birthRow.lunar_date
        ? birthRow.lunar_date
        : typeof birthRow?.umdate === 'string' && birthRow.umdate
          ? birthRow.umdate
          : null;
    if (!lunarDate || lunarDate.length !== 8) {
      return null;
    }

    return {
      year: lunarDate.slice(0, 4),
      month: lunarDate.slice(4, 6),
      day: lunarDate.slice(6, 8),
    };
  }

  private getStemElementGroup(stemNumber: number): string {
    if (stemNumber === 1 || stemNumber === 2) return '1';
    if (stemNumber === 3 || stemNumber === 4) return '2';
    if (stemNumber === 5 || stemNumber === 6) return '3';
    if (stemNumber === 7 || stemNumber === 8) return '4';
    return '5';
  }

  private getCurrentStemSibsin(dayStemNumber: number, currentYearStemNumber: number): string {
    if (dayStemNumber % 2 === 1) {
      const oddMapping = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
      return oddMapping[(currentYearStemNumber - dayStemNumber + 10) % 10] ?? '02';
    }

    const evenMapping = ['01', '04', '03', '06', '05', '08', '07', '10', '09', '02'];
    return evenMapping[(currentYearStemNumber - dayStemNumber + 10) % 10] ?? '02';
  }

  private getCurrentBranchSibsin(dayStemNumber: number, dayStemElementGroup: string, branchElementGroup: string, branchEy: number): string {
    const diff = (Number.parseInt(branchElementGroup, 10) - Number.parseInt(dayStemElementGroup, 10) + 5) % 5;
    const baseCodes = ['02', '04', '06', '08', '10'];
    let result = baseCodes[diff] ?? '02';
    if (dayStemNumber % 2 === 0 && branchEy === 2) {
      const shiftedCodes: Record<string, string> = {
        '02': '01',
        '04': '03',
        '06': '05',
        '08': '07',
        '10': '09',
      };
      result = shiftedCodes[result] ?? result;
    }
    return result;
  }

  private incrementWoonCode(code: string): '01' | '02' | '03' {
    const next = (Number.parseInt(code, 10) % 3) + 1;
    return String(next).padStart(2, '0') as '01' | '02' | '03';
  }


  /**
   * 천간 번호 추출
   */
  private getStemNumber(stemKr: string): number {
    const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
    const index = stems.indexOf(stemKr);
    return index >= 0 ? index + 1 : 1;
  }

  private getStemNumberFromCode(stemCode: string): number {
    const codes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const index = codes.indexOf(stemCode);
    return index >= 0 ? index + 1 : 1;
  }

  private branchOrgCodeToKorean(value: number): string {
    return BRANCHES_FROM_IN_DISPLAY[value - 1] ?? '축';
  }

  /**
   * 지지 번호 추출
   */
  private getBranchNumber(branchKr: string): number {
    const branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
    const index = branches.indexOf(branchKr);
    return index >= 0 ? index + 1 : 1;
  }

  private getBranchOrgNumber(branchKr: string): number {
    const branches = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'];
    const index = branches.indexOf(branchKr);
    return index >= 0 ? index + 1 : 1;
  }

  /**
   * 천간을 알파벳으로 변환
   */
  private stemToAlpha(stemKr: string): string {
    const stemMap: Record<string, string> = {
      갑: 'A',
      을: 'B',
      병: 'C',
      정: 'D',
      무: 'E',
      기: 'F',
      경: 'G',
      신: 'H',
      임: 'I',
      계: 'J',
    };
    const result = stemMap[stemKr];
    return result !== undefined ? result : 'A';
  }

  private getCurrentDateContext(inputData: CalculationInput): CurrentDateContext | null {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone:
          typeof inputData.additionalData?.timezone === 'string' && inputData.additionalData.timezone
            ? inputData.additionalData.timezone
            : 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      });
      const partMap = Object.fromEntries(
        formatter
          .formatToParts(new Date())
          .filter((part) => part.type !== 'literal')
          .map((part) => [part.type, part.value])
      );

      const year = Number.parseInt(String(partMap.year ?? '0'), 10);
      const month = Number.parseInt(String(partMap.month ?? '1'), 10);
      const day = Number.parseInt(String(partMap.day ?? '1'), 10);
      const hour = Number.parseInt(String(partMap.hour ?? '0'), 10);
      const minute = Number.parseInt(String(partMap.minute ?? '0'), 10);

      return {
        year,
        month,
        day,
        hour,
        minute,
        daysInMonth: new Date(Date.UTC(year, month, 0)).getUTCDate(),
        dateCode: `${year.toString().padStart(4, '0')}${month.toString().padStart(2, '0')}${day
          .toString()
          .padStart(2, '0')}`,
        hhmm: hour * 100 + minute,
      };
    } catch {
      return null;
    }
  }

  private parseNumberField(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private getCurrentManseBranch(inputData: CalculationInput, fieldName: 'year_e' | 'month_e' | 'day_e' | 'hour_e'): string | null {
    const currentDate = this.getCurrentDateContext(inputData);
    if (!currentDate) {
      return null;
    }

    const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>;
    const manse = mansedata[currentDate.dateCode];
    const branchNumber = this.parseNumberField(manse?.[fieldName]);
    if (!branchNumber) {
      return null;
    }

    return this.branchOrgCodeToKorean(branchNumber);
  }
}

/**
 * 성별 구분형 계산기 (F013, T022 등)
 */
export class GenderBasedCalculator extends AbstractFortuneCalculator {
  calculateExpression(inputData: CalculationInput): string {
    const fieldName = this.config.expressionFields[0];
    if (!fieldName) {
      throw new Error(`Missing gender-based field for ${this.config.tableName}`);
    }

    const expressionKind = resolveGenderedNarrativeExpressionKind(fieldName);
    if (expressionKind) {
      return calculateGenderedNarrativeExpression(expressionKind, inputData);
    }

    if (fieldName === 'star_name') {
      return getWesternZodiacName(inputData);
    }

    throw new Error(`Unsupported gender-based field: ${fieldName} for ${this.config.tableName}`);
  }

  override calculate(inputData: CalculationInput): CalculationResult {
    const expression = this.calculateExpression(inputData);
    const [text, numerical] = this.retrieveGenderData(expression, inputData.gender);

    return {
      tableName: this.config.tableName,
      expression,
      text,
      numerical,
      metadata: this.getMetadata(inputData),
    };
  }

  /**
   * 성별별 컬럼 선택하여 데이터 조회
   */
  private retrieveGenderData(expression: string, gender: string): readonly [string, string] {
    if (!this.config.genderColumns) {
      return super.retrieveData(expression);
    }

    const genderKey = resolveGenderKey(gender);
    const preferredColumn = genderKey ? this.config.genderColumns[genderKey] : undefined;

    if (!preferredColumn) {
      return super.retrieveData(expression);
    }

    return super.retrieveData(expression, { preferredColumns: [preferredColumn] });
  }
}

/**
 * 검색 기반형 계산기 (F007, T013 등)
 */
export class SearchBasedCalculator extends AbstractFortuneCalculator {
  calculateExpression(inputData: CalculationInput): string {
    if (inputData.additionalData && 'search_keyword' in inputData.additionalData) {
      return inputData.additionalData['search_keyword'] as string;
    }

    if (this.config.tableName === 'T013') {
      return this.getT013Keyword(inputData);
    }

    throw new Error(`Search keyword is required for ${this.config.tableName}`);
  }

  /**
   * LIKE 검색으로 데이터 조회
   */
  protected override retrieveData(expression: string): readonly [string, string] {
    // 검색 로직은 data_retriever에서 처리
    return super.retrieveData(expression);
  }

  private getT013Keyword(inputData: CalculationInput): string {
    const birthDate = inputData.additionalData?.birth_date;
    if (typeof birthDate !== 'string' || !birthDate) {
      throw new Error(`Birth date is required for ${this.config.tableName}`);
    }

    const [yearText = '', monthText = '', dayText = ''] = birthDate.split('-');
    const solarYear = Number.parseInt(yearText, 10);
    const solarMonth = Number.parseInt(monthText, 10);
    const solarDay = Number.parseInt(dayText, 10);

    if (!Number.isFinite(solarYear) || !Number.isFinite(solarMonth) || !Number.isFinite(solarDay)) {
      throw new Error(`Invalid birth date for ${this.config.tableName}: ${birthDate}`);
    }

    const monthlyOffsets = [
      [43, 48, 54, 59, 4, 9, 15, 20, 25],
      [14, 19, 25, 30, 35, 40, 6, 51, 56],
      [42, 48, 53, 58, 3, 9, 14, 19, 24],
      [13, 19, 24, 29, 34, 40, 45, 50, 55],
      [43, 49, 54, 59, 4, 10, 15, 20, 25],
      [14, 20, 25, 30, 35, 41, 46, 51, 56],
      [14, 52, 55, 60, 5, 11, 16, 21, 26],
      [15, 21, 26, 31, 36, 42, 47, 52, 57],
      [46, 52, 57, 2, 7, 13, 18, 23, 28],
      [16, 22, 27, 32, 37, 43, 48, 53, 58],
      [47, 53, 58, 3, 8, 14, 19, 24, 29],
      [17, 23, 28, 33, 38, 44, 49, 54, 59],
    ] as const;

    const animalNames = [
      '치타',
      '너구리',
      '원숭이',
      '코알라',
      '흑표범',
      '호랑이',
      '치타',
      '너구리',
      '원숭이',
      '코알라',
      '아기사슴',
      '양',
      '늑대',
      '양',
      '원숭이',
      '코끼리',
      '아기사슴',
      '코끼리',
      '늑대',
      '양',
      '페가수스',
      '페가수스',
      '양',
      '늑대',
      '늑대',
      '양',
      '페가수스',
      '페가수스',
      '양',
      '늑대',
      '코끼리',
      '치타',
      '코알라',
      '원숭이',
      '양',
      '늑대',
      '코끼리',
      '아기사슴',
      '코알라',
      '원숭이',
      '너구리',
      '치타',
      '호랑이',
      '흑표범',
      '코알라',
      '원숭이',
      '너구리',
      '치타',
      '호랑이',
      '흑표범',
      '사자',
      '사자',
      '흑표범',
      '호랑이',
      '호랑이',
      '흑표범',
      '페가수스',
      '페가수스',
      '흑표범',
      '호랑이',
    ] as const;

    let yun0 = solarYear % 100;
    if (yun0 < 48) {
      yun0 += 48;
    }
    if (yun0 > 92) {
      yun0 -= 51;
    }

    let yun1 = (yun0 - 2) % 9;
    if (yun1 <= 0) {
      yun1 += 9;
    }

    const monthOffsets = monthlyOffsets[solarMonth - 1];
    if (!monthOffsets) {
      throw new Error(`Invalid birth month for ${this.config.tableName}: ${birthDate}`);
    }

    const baseOffset = monthOffsets[yun1 - 1];
    if (baseOffset === undefined) {
      throw new Error(`Unsupported animal lookup seed for ${this.config.tableName}: ${birthDate}`);
    }

    let resultIndex = (baseOffset + solarDay) % 60;
    if (resultIndex === 0) {
      resultIndex = 60;
    }

    const keyword = animalNames[resultIndex - 1];
    if (!keyword) {
      throw new Error(`Animal keyword lookup failed for ${this.config.tableName}: ${birthDate}`);
    }

    return keyword;
  }
}
