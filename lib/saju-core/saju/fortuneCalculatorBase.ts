/**
 * Fortune Calculator Base Classes
 * 사주 해설 계산기들의 기본 클래스
 */

import { extractKorean } from '../utils';

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
  readonly monthBranch: string; // 월지
  readonly dayStem: string; // 일간
  readonly dayBranch: string; // 일지
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

/**
 * 데이터 조회 인터페이스
 */
export interface DataRetriever {
  getResult(tableName: string, expression: string): readonly [string, string];
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
  protected retrieveData(expression: string): readonly [string, string] {
    return this.dataRetriever.getResult(this.config.tableName, expression);
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
      return '01';
    }

    // 필드명에 따른 값 매핑
    const fieldValueMap: Record<string, number> = {
      year_branch_num: this.getBranchNumber(inputData.yearBranch),
      month_branch_num: this.getBranchNumber(inputData.monthBranch),
      day_branch_num: this.getBranchNumber(inputData.dayBranch),
      hour_branch_num: this.getBranchNumber(inputData.hourBranch),
    };

    if (fieldName in fieldValueMap) {
      const value = fieldValueMap[fieldName];
      if (value !== undefined) {
        return value.toString().padStart(2, '0');
      }
    }

    // 기본값 반환
    return '01';
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
}

/**
 * 복합 계산형 계산기 (S007, S063 등)
 */
export class ComplexCalculationCalculator extends AbstractFortuneCalculator {
  calculateExpression(inputData: CalculationInput): string {
    const methodName = this.config.calculationMethod;

    if (methodName === 's063_calculation') {
      return this.calculateS063(inputData);
    } else if (methodName === 's007_calculation') {
      return this.calculateS007(inputData);
    } else {
      // 기본 계산
      return this.defaultCalculation(inputData);
    }
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
    // S007의 복잡한 계산 로직 구현 예정
    return '01'; // 임시값
  }

  /**
   * 기본 계산
   */
  private defaultCalculation(inputData: CalculationInput): string {
    return '01';
  }


  /**
   * 천간 번호 추출
   */
  private getStemNumber(stemKr: string): number {
    const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
    const index = stems.indexOf(stemKr);
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
}

/**
 * 성별 구분형 계산기 (F013, T022 등)
 */
export class GenderBasedCalculator extends AbstractFortuneCalculator {
  calculateExpression(inputData: CalculationInput): string {
    // 성별 구분 없이 기본 표현식만 반환
    // 성별 구분은 데이터 조회 시 컬럼 선택으로 처리
    const fieldName = this.config.expressionFields[0];

    if (fieldName === 'star_name') {
      // 별자리 계산 로직 (예정)
      return '01';
    }

    return '01';
  }

  /**
   * 성별별 컬럼 선택하여 데이터 조회
   */
  protected override retrieveData(expression: string): readonly [string, string] {
    if (!this.config.genderColumns) {
      return super.retrieveData(expression);
    }

    // 성별별 컬럼 선택 로직은 data_retriever에서 처리
    // 여기서는 일반적인 조회 수행
    return super.retrieveData(expression);
  }
}

/**
 * 검색 기반형 계산기 (F007, T013 등)
 */
export class SearchBasedCalculator extends AbstractFortuneCalculator {
  calculateExpression(inputData: CalculationInput): string {
    // 검색 키워드 기반 표현식
    if (inputData.additionalData && 'search_keyword' in inputData.additionalData) {
      return inputData.additionalData['search_keyword'] as string;
    }

    return '';
  }

  /**
   * LIKE 검색으로 데이터 조회
   */
  protected override retrieveData(expression: string): readonly [string, string] {
    // 검색 로직은 data_retriever에서 처리
    return super.retrieveData(expression);
  }
}
