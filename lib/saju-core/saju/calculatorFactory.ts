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
  S015: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['year_lifecycle_num'],
    description: '직업 방향',
  },
  S018: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['year_branch_org_num'],
    description: '초년운',
  },
  S019: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['month_lifecycle_num'],
    description: '중년운',
  },
  S020: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_lifecycle_num'],
    description: '말년운',
  },
  S021: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['hour_lifecycle_num'],
    description: '수명운',
  },
  S027: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['month_branch_sipsin_num'],
    description: '타고난 재물운',
  },
  S026: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['yong_to_sibsin'],
    description: '직업에 따른 길',
  },
  S029: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_stem_num'],
    description: '타고난 성격 장점',
  },
  S030: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_sipsin_num'],
    description: '잠재된 성격 긍정 요소',
  },
  S023: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['personality_core_index'],
    description: '성격 핵심 성향',
  },

  // 추가 지원 테이블 (간단 매핑)
  S062: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['month_branch_num'],
    description: '보조설명1',
  },
  S064: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_ganzhi_code'],
    description: '보조설명2',
  },
  S065: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_ganzhi_code'],
    description: '보조설명3',
  },
  S066: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_ganzhi_code'],
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
  S095: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['new_year_signal'],
    calculation_method: 's095_new_year_signal',
    description: '새해신수 1',
  },
  S097: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['new_year_signal_with_hour'],
    calculation_method: 's097_new_year_signal',
    description: '새해신수 2',
  },
  S098: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['new_year_signal'],
    calculation_method: 's098_new_year_signal',
    description: '새해신수 3',
  },
  S099: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['new_year_signal'],
    calculation_method: 's099_new_year_signal',
    description: '새해신수 4',
  },
  S100: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['new_year_signal'],
    calculation_method: 's100_new_year_signal',
    description: '새해신수 5',
  },
  S101: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['new_year_monthly_signal'],
    calculation_method: 's101_monthly_new_year_signal',
    description: '새해 월별신수',
  },
  S103: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['tojung_cut_tot'],
    calculation_method: 's103_tojeong_cut_tot',
    description: '새해신수 총론',
  },
  S104: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['tojung_cut_tot'],
    calculation_method: 's104_tojeong_cut_tot',
    description: '새해신수 해설',
  },
  S106: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['tojung_cut_tot'],
    calculation_method: 's106_tojeong_cut_tot',
    description: '토정비결 1',
  },
  S107: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['tojung_cut_tot'],
    calculation_method: 's107_tojeong_cut_tot',
    description: '토정비결 2',
  },
  S108: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['tojung_cut_tot'],
    calculation_method: 's108_tojeong_cut_tot',
    description: '토정비결 3',
  },
  S109: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['tojung_cut_tot'],
    calculation_method: 's109_tojeong_cut_tot',
    description: '토정비결 4',
  },
  S110: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['tojung_cut_tot_monthly'],
    calculation_method: 's110_tojeong_cut_tot_monthly',
    description: '토정비결 월별',
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
  J004: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['juyeok_pair_serial'],
    description: '현재의 건강운',
  },
  J005: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['juyeok_pair_serial'],
    description: '현재의 대인관계운',
  },
  J009: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['juyeok_pair_serial'],
    description: '현재의 행운방위',
  },
  J010: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['juyeok_pair_serial'],
    description: '현재의 학업운',
  },
  J023: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['ziwei_guanrok'],
    calculation_method: 'j023_ziwei_guanrok',
    description: '자미두수 취업운',
  },
  T056: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_stem_name'],
    description: '오행 기운과 건강',
  },
  T057: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_stem_name'],
    description: '건강 리스크',
  },
  T058: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_name'],
    description: '건강 체질',
  },
  T060: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_ganzhi_code'],
    description: '심리적 특성',
  },
  T061: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_stem_name'],
    description: '포텐 터지기 좋은 날짜',
  },
  T010: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['year_branch'],
    calculation_method: 't010_multiplication',
    description: '타로운세',
  },
  T022: {
    calculator_type: CalculatorType.GENDER_BASED,
    expression_fields: ['western_zodiac_number'],
    gender_columns: { M: 'DB_data_m', F: 'DB_data_w' },
    description: '성별운세',
  },
  T026: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['year_lifecycle_num'],
    description: '입신양명',
  },
  T028: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_stem_element_num'],
    description: '행운의 색상',
  },
  T035: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_element_num'],
    description: '심리 보완 포인트',
  },

  // === saju_5 조합에 필요한 누락된 테이블들 ===
  S113: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_stem_num'],
    description: '기본운세',
  },
  S070: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_ganzhi_code'],
    description: '계절운',
  },
  S071: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_ganzhi_code'],
    description: '오행운',
  },
  S072: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_ganzhi_code'],
    description: '음양운',
  },
  S077: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['social_element'],
    description: '기질 DNA',
  },
  S082: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_stem_num'],
    description: '재물 DNA',
  },
  S083: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_stem_num'],
    description: '신체 DNA',
  },
  S085: {
    calculator_type: CalculatorType.GENDER_BASED,
    expression_fields: ['day_stem_index'],
    gender_columns: { M: 'DB_data_m', F: 'DB_data_w' },
    description: '선천적기질운',
  },
  S073: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_ganzhi_code'],
    description: '십성운1',
  },
  S074: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_ganzhi_code'],
    description: '십성운2',
  },
  S078: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['social_element'],
    description: '사교운',
  },
  S079: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_stem_num'],
    description: '럭키룩',
  },
  S080: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_stem_num'],
    description: '성격 리스크',
  },
  S081: {
    calculator_type: CalculatorType.GENDER_BASED,
    expression_fields: ['day_stem_index'],
    gender_columns: { M: 'DB_data_m', F: 'DB_data_w' },
    description: '오행 보완 포인트',
  },
  S084: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_stem_num'],
    description: '직업과 명예',
  },
  S031: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['month_branch_sipsin_num'],
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
  S010: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_branch_num'],
    description: '기타운세2',
  },
  S040: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['year_branch_num'],
    description: '화합운',
  },
  S042: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['current_wealth_index'],
    description: '현재 재물 흐름',
  },
  S022: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['year_branch_org_num'],
    description: '시주 성격 보완',
  },
  S068: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['day_ganzhi_code'],
    description: '찰떡궁합 띠',
  },
  S129: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['year_branch_code_05'],
    description: '전생운',
  },
  S116: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['western_zodiac_num'],
    description: '재물운 유리 계절',
  },
  S117: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['western_zodiac_num'],
    description: '재물 누수 패턴',
  },
  S118: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['western_zodiac_num'],
    description: '최적 재테크 분야',
  },
  S119: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['month_stem_num'],
    description: '타고난 학업운',
  },
  S121: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['current_state_index'],
    description: '현재 운명의 흐름',
  },
  S130: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['dangsaju_early_life_index'],
    description: '당사주 초년운',
  },
  S128: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['dangsaju_lifetime_index'],
    description: '당사주 평생총운',
  },
  S131: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['dangsaju_middle_life_index'],
    description: '당사주 중년운',
  },
  S132: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['dangsaju_late_life_index'],
    description: '당사주 말년운',
  },
  S133: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['dangsaju_spouse_index'],
    description: '당사주 배우자운',
  },
  S134: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['dangsaju_children_index'],
    description: '당사주 자식운',
  },
  S135: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['dangsaju_sibling_index'],
    description: '당사주 형제운',
  },
  S142: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['current_half_year_index'],
    description: '상반기 흐름',
  },
  S143: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['current_end_year_index'],
    description: '하반기 흐름',
  },
  S144: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['current_sinsal_key'],
    description: '현재 살운 흐름',
  },
  S126: {
    calculator_type: CalculatorType.COMPLEX_CALCULATION,
    expression_fields: ['s126_relief'],
    calculation_method: 's126_misfortune_relief',
    description: '살풀이',
  },
  S145: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['month_stem_num'],
    description: '인연이 따르는 캠퍼스',
  },
  S146: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['month_stem_num'],
    description: '유학운 국가',
  },
  J037: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['jumno_legacy'],
    description: '현재 길운 방향',
  },
  J044: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['jumno_legacy'],
    description: '자식운 길흉',
  },
  J047: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['current_direction_serial'],
    description: '현재 괘 대길 방향',
  },
  J048: {
    calculator_type: CalculatorType.SIMPLE_QUERY,
    expression_fields: ['current_direction_serial_plus_one'],
    description: '현재 괘 차선 방향',
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
