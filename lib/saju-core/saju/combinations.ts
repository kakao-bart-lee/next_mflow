/**
 * Saju Fortune Combinations
 * 사주 운세 조합 설정 - PHP 파일별 해설 조합 매핑
 */

/** 섹션 정보 타입 */
export interface CombinationSection {
  section_name: string;
  anchor: string;
  tables: string[];
}

/** PHP 파일별 사용하는 테이블 조합 설정 */
export const SAJU_COMBINATIONS: Record<string, string[]> = {
  // saju_1.php - 올해의토정비결
  saju_1: [
    'S142',
    'S143',
    'S106',
    'S107',
    'S108',
    'S109',
    'S110',
    'S082',
    'S116',
    'S117',
    'S118',
    'S042',
    'S028',
    'J037',
    'J005',
    'S009',
    'S040',
    'S014',
  ],

  // saju_2.php - 새해신수
  saju_2: [
    'S103',
    'S104',
    'S095',
    'S097',
    'S098',
    'S099',
    'S100',
    'S101',
    'S082',
    'S116',
    'S117',
    'S118',
    'S042',
    'S144',
    'J047',
    'J048',
    'S026',
    'T035',
    'S007',
    'T061',
    'T028',
    'S009',
    'J009',
    'S010',
    'T039',
    'S121',
  ],

  // saju_3.php - 자평명리학 평생총운
  saju_3: [
    'S022',
    'S064',
    'S065',
    'S066',
    'S067',
    'S068',
    'S027',
    'S116',
    'S117',
    'S042',
    'S082',
    'S014',
  ],

  // saju_4.php - 인생풀이
  saju_4: [
    // === 인생풀이 섹션 ===
    'S063', // 총평
    'S045', // 초년운
    'S046', // 중년운
    'S047', // 말년운
    'S048', // 타고난 성격
    'S049', // 사회성
    'S050', // 목표의식
    'S051', // 건강운
    'S052', // 직업운
    'S053', // 연애운
    'S054', // 섹스운
    'S055', // 궁합
    'S056', // 부부궁
    'S057', // 금전운
    'S058', // 가정운
    'S059', // 자식운
    'S060', // 학업운
    'S061', // 천생연분

    // === 길흉 섹션 ===
    'S007', // 현재의 길흉사
    'S008', // 미래운세
    'S009', // 기타운세1
    'S010', // 기타운세2
    'F011', // 주역괘
    'T039', // 나에게 맞는 숫자운
  ],

  // saju_5.php - 사주운세
  saju_5: [
    // === 사주운세 섹션 ===
    'S113', // 기본운세
    'S070', // 계절운
    'S071', // 오행운
    'S072', // 음양운
    'S073', // 십성운1
    'S074', // 십성운2

    // === 대인운 섹션 ===
    'S028', // 인간관계
    'S078', // 사교운
    'S031', // 협력운
    'S009', // 갈등운
    'S040', // 화합운

    // === 현재운세 섹션 ===
    'S014', // 현재나의운 분석
  ],

  // saju_6.php - 십년대운풀이 (특수: 대운 계산 중심)
  saju_6: [
    // 주요 대운 관련 계산은 별도 로직 필요
    // 기본적으로는 계산 결과를 텍스트로 출력
  ],

  // saju_7.php - 전생운
  saju_7: ['S129', 'S014'],

  // saju_8.php - 질병운
  saju_8: ['T056', 'T057', 'T058', 'S028', 'J037', 'J005', 'S009', 'S040'],

  // saju_9.php - 나의 오행기운세
  saju_9: [
    'S128',
    'S077',
    'S078',
    'S079',
    'S080',
    'S081',
    'S082',
    'S083',
    'S084',
    'S085',
  ],

  // saju_10.php - 자평명리학 오늘의 운세
  saju_10: ['S087', 'S088', 'S089', 'S090', 'S091', 'S092'],

  // saju_11.php - 당사주 평생총운
  saju_11: [
    'S128',
    'S129',
    'S130',
    'S131',
    'S132',
    'S133',
    'S134',
    'S135',
    'S059',
    'S070',
    'S040',
    'T026',
    'T039',
  ],

  // saju_12.php - 사주로 보는 심리분석
  saju_12: ['T060', 'T028', 'S009', 'J009', 'S010', 'T039'],

  // saju_13.php - 살풀이
  saju_13: ['S126', 'S007'],

  // saju_14.php - 성격운세
  saju_14: ['S023', 'S059', 'S070', 'S040', 'T026', 'T039'],

  // saju_15.php - 초년운
  saju_15: [
    'S018',
    'S048',
    'S023',
    'S029',
    'S030',
    'S031',
    'S119',
    'S145',
    'S146',
    'J010',
    'J044',
    'J023',
    'S050',
    'S078',
    'S026',
  ],

  // saju_16.php - 중년운
  saju_16: [
    'S019',
    'S051',
    'S083',
    'J004',
    'S028',
    'J037',
    'J005',
    'S009',
    'S040',
    'S082',
    'S116',
    'S117',
    'S118',
    'S042',
  ],

  // saju_17.php - 말년운
  saju_17: [
    'S020',
    'S051',
    'S083',
    'J004',
    'S021',
    'S007',
    'S008',
    'S009',
    'S010',
    'F011',
    'T039',
  ],

  // saju_18.php - 직업운
  saju_18: ['S015', 'S048', 'S023', 'S029', 'S030', 'S031'],

  // saju_19.php - 재물운
  saju_19: ['S027', 'S082', 'S116', 'S117', 'S118', 'S042'],

  // saju_20.php - 선천적기질운
  saju_20: ['S085', 'S048', 'S023', 'S029', 'S030', 'S031'],

  // saju_21.php - 태어난계절에따른운
  saju_21: ['S113', 'T013', 'T022', 'S058', 'S116', 'S117', 'S118'],
};

/** 조합별 설명 */
export const COMBINATION_DESCRIPTIONS: Record<string, string> = {
  saju_1: '올해의토정비결 - 한 해 동안의 운세와 재물처방, 대인운을 종합적으로 분석',
  saju_2: '새해신수 - 새해의 전체적인 운세와 재물, 길흉, 행운을 포괄적으로 해석',
  saju_3: '자평명리학 평생총운 - 전통 자평명리학에 기반한 평생 총운과 재물운 분석',
  saju_4: '인생풀이 - 종합적인 인생 운세 해석',
  saju_5: '사주운세 - 세부적인 운세와 대인관계 분석',
  saju_6: '십년대운풀이 - 10년 주기의 대운 흐름과 길흉 시기 분석',
  saju_7: '전생운 - 전생과 현재의 인연 및 현재운세 분석',
  saju_8: '질병운 - 건강과 질병 관련 운세 및 대인운 분석',
  saju_9: '나의 오행기운세 - 오행(五行) 기운에 따른 상세 운세 분석',
  saju_10: '자평명리학 오늘의 운세 - 오늘 하루의 세부 운세 분석',
  saju_11: '당사주 평생총운 - 개인 사주의 평생 총운과 극복 방법 분석',
  saju_12: '사주로 보는 심리분석 - 사주를 통한 심리 상태와 행운 분석',
  saju_13: '살풀이 - 액운 해소와 악한 기운 정화 방법',
  saju_14: '성격운세 - 타고난 성격과 기질에 따른 운세 분석',
  saju_15: '초년운 - 어린 시절부터 청년기까지의 운세 분석',
  saju_16: '중년운 - 중년기의 운세와 대인관계, 재물 분석',
  saju_17: '말년운 - 노년기의 운세와 건강, 길흉 분석',
  saju_18: '직업운 - 직업과 사업 관련 운세 분석',
  saju_19: '재물운 - 재물과 금전 관련 운세 분석',
  saju_20: '선천적기질운 - 타고난 기질과 성격 특성 분석',
  saju_21: '태어난계절에따른운 - 출생 계절에 따른 운세 분석',
};

/** 조합별 섹션 정보 (PHP 파일의 섹션 구조 반영) */
export const COMBINATION_SECTIONS: Record<string, CombinationSection[]> = {
  saju_4: [
    {
      section_name: '인생풀이',
      anchor: '0',
      tables: [
        'S063',
        'S045',
        'S046',
        'S047',
        'S048',
        'S049',
        'S050',
        'S051',
        'S052',
        'S053',
        'S054',
        'S055',
        'S056',
        'S057',
        'S058',
        'S059',
        'S060',
        'S061',
      ],
    },
    {
      section_name: '길흉',
      anchor: '1',
      tables: ['S007', 'S008', 'S009', 'S010', 'F011', 'T039'],
    },
  ],

  saju_5: [
    {
      section_name: '사주운세',
      anchor: '0',
      tables: ['S113', 'S070', 'S071', 'S072', 'S073', 'S074'],
    },
    {
      section_name: '대인운',
      anchor: '1',
      tables: ['S028', 'S078', 'S031', 'S009', 'S040'],
    },
    {
      section_name: '현재운세',
      anchor: '2',
      tables: ['S014'],
    },
  ],
};

/**
 * 사주 조합명으로 테이블 목록 반환
 *
 * @param combinationName - 조합명 (예: 'saju_4', 'saju_5')
 * @returns 해당 조합의 테이블 목록
 * @throws {Error} 지원하지 않는 조합명인 경우
 */
export function getSajuCombination(combinationName: string): string[] {
  const combination = SAJU_COMBINATIONS[combinationName];
  if (!combination) {
    throw new Error(`Unknown combination: ${combinationName}`);
  }
  return combination;
}

/**
 * 사용 가능한 조합 목록과 테이블 반환
 */
export function getAvailableCombinations(): Record<string, string[]> {
  return SAJU_COMBINATIONS;
}

/**
 * 조합의 섹션 구조 반환
 *
 * @param combinationName - 조합명
 * @returns 섹션 정보 리스트
 */
export function getCombinationSections(combinationName: string): CombinationSection[] {
  return COMBINATION_SECTIONS[combinationName] ?? [];
}

/**
 * 조합명이 유효한지 확인
 */
export function isValidCombination(combinationName: string): boolean {
  return combinationName in SAJU_COMBINATIONS;
}
