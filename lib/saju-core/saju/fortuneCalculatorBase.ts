/**
 * Fortune Calculator Base Classes
 * 사주 해설 계산기들의 기본 클래스
 */

import { extractKorean } from '../utils';
import { getSipsinForBranch, KOREAN_BRANCH_TO_DISPLAY } from './constants';
import { getDataLoader } from './dataLoader';
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
      throw new Error(`Missing legacy F_woonday conflict lookup for ${this.config.tableName}`);
    }

    if (fieldName === 'serial_number') {
      throw new Error(`Missing legacy F_Juyeok_trigram serial derivation for ${this.config.tableName}`);
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
      throw new Error(`Missing legacy F_woonday/F_ohengSearch pipeline for ${this.config.tableName}`);
    }

    if (methodName === 's014_current_fortune') {
      throw new Error(`Missing yong/hee/kee/goo code pipeline for ${this.config.tableName}`);
    }

    if (methodName === 'f011_trigram') {
      throw new Error(`Missing legacy F_Juyeok_trigram helper for ${this.config.tableName}`);
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

    if (fieldName === 'combined_value') {
      return this.getWesternZodiacNumber(inputData).toString().padStart(2, '0');
    }

    if (fieldName === 'day_stem_num') {
      return this.getStemNumber(inputData.dayStem).toString().padStart(2, '0');
    }

    if (fieldName === 'star_name') {
      return this.getWesternZodiacName(inputData);
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

    const genderKey = this.resolveGenderKey(gender);
    const preferredColumn = genderKey ? this.config.genderColumns[genderKey] : undefined;

    if (!preferredColumn) {
      return super.retrieveData(expression);
    }

    return super.retrieveData(expression, { preferredColumns: [preferredColumn] });
  }

  private resolveGenderKey(gender: string): 'M' | 'F' | null {
    const normalized = String(gender ?? '').trim().toUpperCase();

    if (normalized === 'M' || normalized === 'MALE' || normalized.startsWith('남')) {
      return 'M';
    }

    if (normalized === 'F' || normalized === 'FEMALE' || normalized.startsWith('여')) {
      return 'F';
    }

    return null;
  }

  private getWesternZodiacNumber(inputData: CalculationInput): number {
    const birthDate = inputData.additionalData?.birth_date;
    if (typeof birthDate !== 'string' || !birthDate) {
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

  private getWesternZodiacName(inputData: CalculationInput): string {
    const zodiacNames = [
      '물병자리',
      '물고기자리',
      '양자리',
      '황소자리',
      '쌍둥이자리',
      '게자리',
      '사자자리',
      '처녀자리',
      '천칭자리',
      '전갈자리',
      '사수자리',
      '염소자리',
    ] as const;

    const zodiacNumber = this.getWesternZodiacNumber(inputData);
    return zodiacNames[zodiacNumber - 1] ?? '물병자리';
  }

  private getStemNumber(stem: string): number {
    const stemKr = extractKorean(stem);
    const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
    const index = stems.indexOf(stemKr);
    return index >= 0 ? index + 1 : 1;
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
