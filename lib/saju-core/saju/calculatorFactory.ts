/**
 * Fortune Calculator Factory
 * 설정 기반으로 적절한 계산기를 생성하는 팩토리
 */

import {
  CalculatorType,
  CalculatorConfig,
  FortuneCalculatorBase,
  DataRetriever,
  SimpleQueryCalculator,
  ComplexCalculationCalculator,
  GenderBasedCalculator,
  SearchBasedCalculator,
} from './fortuneCalculatorBase';

/**
 * 계산기 설정 레코드 타입
 */
interface CalculatorConfigDict {
  readonly calculator_type: CalculatorType;
  readonly expression_fields: readonly string[];
  readonly description: string;
  readonly gender_columns?: Record<string, string>;
  readonly calculation_method?: string;
}

/**
 * 계산기 설정 사전
 */
export const CALCULATOR_CONFIGS: Readonly<Record<string, CalculatorConfigDict>> = {
  // === S 테이블 (사주 기본) ===
  S045: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['year_branch_num'],
    description: '초년운',
  },
  S046: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['year_branch_num'],
    description: '중년운',
  },
  S047: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['year_branch_num'],
    description: '말년운',
  },
  S048: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_num'],
    description: '타고난 성격',
  },
  S049: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['month_branch_num'],
    description: '사회성',
  },
  S050: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['hour_branch_num'],
    description: '목표의식',
  },
  S051: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_num'],
    description: '건강운',
  },
  S052: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['year_branch_num'],
    description: '직업운',
  },
  S053: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['month_branch_num'],
    description: '연애운',
  },
  S054: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_num'],
    description: '섹스운',
  },
  S055: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['hour_branch_num'],
    description: '궁합',
  },
  S056: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_num'],
    description: '부부궁',
  },
  S057: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['year_branch_num'],
    description: '금전운',
  },
  S058: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['month_branch_num'],
    description: '가정운',
  },
  S059: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['hour_branch_num'],
    description: '자식운',
  },
  S060: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_num'],
    description: '학업운',
  },
  S061: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['year_branch_num'],
    description: '천생연분',
  },

  // 추가 지원 테이블 (간단 매핑)
  S062: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['month_branch_num'],
    description: '보조설명1',
  },
  S064: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_num'],
    description: '보조설명2',
  },
  S065: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['hour_branch_num'],
    description: '보조설명3',
  },
  S066: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['year_branch_num'],
    description: '보조설명4',
  },
  S067: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['month_branch_num'],
    description: '보조설명5',
  },

  // === 오늘의 운세 (일간/일지 기반 일일 운세) ===
  S087: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_num'],
    description: '오늘의 운세 1',
  },
  S088: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_num'],
    description: '오늘의 운세 2',
  },
  S089: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_num'],
    description: '오늘의 운세 3',
  },
  S090: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_num'],
    description: '오늘의 운세 4',
  },
  S091: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_num'],
    description: '오늘의 운세 5',
  },
  S092: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_num'],
    description: '오늘의 운세 6',
  },

  // === 복합 계산형 ===
  S063: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['year_stem', 'year_branch'],
    calculation_method: 's063_calculation',
    description: '총평',
  },
  S007: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['comprehensive'],
    calculation_method: 's007_calculation',
    description: '현재의 길흉사',
  },
  S008: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['ohang_based'],
    calculation_method: 's008_calculation',
    description: '미래운세',
  },

  // === F 테이블 (운세/점괘) ===
  F011: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['day_stem', 'day_branch'],
    calculation_method: 'f011_trigram',
    description: '주역괘',
  },
  F012: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['month_branch_num'],
    description: '월별운세',
  },
  F013: {
    calculator_type: CalculatorType.GENDER_BASED,
    expression_fields: ['star_name'],
    gender_columns: { M: 'DB_data_m', F: 'DB_data_w' },
    description: '별자리운세',
  },

  // === T 테이블 (타로/수비학) ===
  T039: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['serial_number'],
    description: '나에게 맞는 숫자운',
  },
  T010: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['year_branch'],
    calculation_method: 't010_multiplication',
    description: '타로운세',
  },
  T022: {
    calculator_type: CalculatorType.GENDER_BASED,
    expression_fields: ['combined_value'],
    gender_columns: { M: 'DB_data_m', F: 'DB_data_w' },
    description: '성별운세',
  },

  // === saju_5 조합에 필요한 누락된 테이블들 ===
  S113: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_stem_num'],
    description: '기본운세',
  },
  S070: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['birth_season'],
    calculation_method: 's070_season_calculation',
    description: '계절운',
  },
  S071: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['five_elements_strength'],
    calculation_method: 's071_ohang_calculation',
    description: '오행운',
  },
  S072: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['yin_yang_balance'],
    description: '음양운',
  },
  S073: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['sipsin_dominant'],
    calculation_method: 's073_sipsin_calculation',
    description: '십성운1',
  },
  S074: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['sipsin_secondary'],
    calculation_method: 's074_sipsin_calculation',
    description: '십성운2',
  },
  S078: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['social_element'],
    description: '사교운',
  },
  S031: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['cooperation_index'],
    description: '협력운',
  },
  S028: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['interpersonal_index'],
    description: '인간관계',
  },
  S009: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['conflict_pattern'],
    description: '갈등운',
  },
  S040: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['harmony_index'],
    description: '화합운',
  },
  S014: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['current_fortune'],
    calculation_method: 's014_current_fortune',
    description: '현재나의운 분석',
  },

  // === 검색 기반 ===
  F007: {
    calculator_type: CalculatorType.SEARCH_BASED,
    expression_fields: ['search_keyword'],
    description: '꿈해몽 검색',
  },
  T013: {
    calculator_type: CalculatorType.SEARCH_BASED,
    expression_fields: ['search_keyword'],
    description: '타로 키워드 검색',
  },
};

/**
 * 계산기 팩토리
 */
export class CalculatorFactory {
  private readonly calculatorCache: Map<string, FortuneCalculatorBase>;

  /**
   * @param dataRetriever - 데이터베이스 조회 객체
   */
  constructor(private readonly dataRetriever: DataRetriever) {
    this.calculatorCache = new Map();
  }

  /**
   * 테이블명에 맞는 계산기 생성
   *
   * @param tableName - 테이블명 (예: 'S045', 'F011', 'T039')
   * @returns 해당 테이블의 계산기
   * @throws {Error} 지원하지 않는 테이블명인 경우
   */
  createCalculator(tableName: string): FortuneCalculatorBase {
    // 캐시에서 확인
    const cached = this.calculatorCache.get(tableName);
    if (cached) {
      return cached;
    }

    // 설정 확인
    const configDict = CALCULATOR_CONFIGS[tableName];
    if (!configDict) {
      throw new Error(`Unsupported table: ${tableName}`);
    }

    // CalculatorConfig 객체 생성
    const config: CalculatorConfig = {
      tableName,
      calculatorType: configDict.calculator_type,
      expressionFields: configDict.expression_fields,
      genderColumns: configDict.gender_columns ?? undefined,
      calculationMethod: configDict.calculation_method ?? undefined,
      additionalConfig: {
        description: configDict.description,
      },
    };

    // 타입에 맞는 계산기 생성
    const calculatorType = config.calculatorType;

    let calculator: FortuneCalculatorBase;

    if (calculatorType === CalculatorType.SIMPLE_QUERY) {
      calculator = new SimpleQueryCalculator(config, this.dataRetriever);
    } else if (calculatorType === CalculatorType.COMPLEX_CALCULATION) {
      calculator = new ComplexCalculationCalculator(config, this.dataRetriever);
    } else if (calculatorType === CalculatorType.GENDER_BASED) {
      calculator = new GenderBasedCalculator(config, this.dataRetriever);
    } else if (calculatorType === CalculatorType.SEARCH_BASED) {
      calculator = new SearchBasedCalculator(config, this.dataRetriever);
    } else {
      throw new Error(`Unknown calculator type: ${calculatorType}`);
    }

    // 캐시에 저장
    this.calculatorCache.set(tableName, calculator);

    return calculator;
  }

  /**
   * 지원하는 테이블 목록과 설명 반환
   *
   * @returns {테이블명: 설명} 레코드
   */
  getSupportedTables(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [table, config] of Object.entries(CALCULATOR_CONFIGS)) {
      result[table] = config.description;
    }
    return result;
  }

  /**
   * 계산기 타입별 테이블 목록 반환
   *
   * @param calculatorType - 계산기 타입
   * @returns 해당 타입의 테이블명 목록
   */
  getTablesByType(calculatorType: CalculatorType): string[] {
    return Object.entries(CALCULATOR_CONFIGS)
      .filter(([, config]) => config.calculator_type === calculatorType)
      .map(([table]) => table);
  }
}
