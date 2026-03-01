/**
 * Saju Fortune Types Enum
 * 사주 운세 타입 열거형
 */

/**
 * 사주 운세 타입 열거형
 */
export enum SajuFortuneType {
  /** 올해의토정비결 (This Year's Fortune) */
  SAJU_1 = 'saju_1',
  /** 새해신수 (New Year Fortune) */
  SAJU_2 = 'saju_2',
  /** 자평명리학 평생총운 (Lifetime Total Fortune) */
  SAJU_3 = 'saju_3',
  /** 인생풀이 (Life Analysis) */
  SAJU_4 = 'saju_4',
  /** 사주운세 (Saju Fortune) */
  SAJU_5 = 'saju_5',
  /** 십년대운풀이 (10-Year Great Fortune Analysis) */
  SAJU_6 = 'saju_6',
  /** 전생운 (Past Life Fortune) */
  SAJU_7 = 'saju_7',
  /** 질병운 (Disease Fortune) */
  SAJU_8 = 'saju_8',
  /** 나의 오행기운세 (My Five Elements Fortune) */
  SAJU_9 = 'saju_9',
  /** 자평명리학 오늘의 운세 (Today's Fortune) */
  SAJU_10 = 'saju_10',
  /** 당사주 평생총운 (Your Saju Lifetime Fortune) */
  SAJU_11 = 'saju_11',
  /** 사주로 보는 심리분석 (Psychological Analysis) */
  SAJU_12 = 'saju_12',
  /** 살풀이 (Exorcism/Evil Spirit Resolution) */
  SAJU_13 = 'saju_13',
  /** 성격운세 (Personality Fortune) */
  SAJU_14 = 'saju_14',
  /** 초년운 (Early Life Fortune) */
  SAJU_15 = 'saju_15',
  /** 중년운 (Middle Age Fortune) */
  SAJU_16 = 'saju_16',
  /** 말년운 (Old Age Fortune) */
  SAJU_17 = 'saju_17',
  /** 직업운 (Career Fortune) */
  SAJU_18 = 'saju_18',
  /** 재물운 (Wealth Fortune) */
  SAJU_19 = 'saju_19',
  /** 선천적기질운 (Innate Temperament Fortune) */
  SAJU_20 = 'saju_20',
  /** 태어난계절에따른운 (Fortune by Birth Season) */
  SAJU_21 = 'saju_21',
}

/** 운세 타입별 한글 이름 */
export const FORTUNE_TYPE_NAMES: Record<SajuFortuneType, string> = {
  [SajuFortuneType.SAJU_1]: '올해의토정비결',
  [SajuFortuneType.SAJU_2]: '새해신수',
  [SajuFortuneType.SAJU_3]: '자평명리학 평생총운',
  [SajuFortuneType.SAJU_4]: '인생풀이',
  [SajuFortuneType.SAJU_5]: '사주운세',
  [SajuFortuneType.SAJU_6]: '십년대운풀이',
  [SajuFortuneType.SAJU_7]: '전생운',
  [SajuFortuneType.SAJU_8]: '질병운',
  [SajuFortuneType.SAJU_9]: '나의 오행기운세',
  [SajuFortuneType.SAJU_10]: '자평명리학 오늘의 운세',
  [SajuFortuneType.SAJU_11]: '당사주 평생총운',
  [SajuFortuneType.SAJU_12]: '사주로 보는 심리분석',
  [SajuFortuneType.SAJU_13]: '살풀이',
  [SajuFortuneType.SAJU_14]: '성격운세',
  [SajuFortuneType.SAJU_15]: '초년운',
  [SajuFortuneType.SAJU_16]: '중년운',
  [SajuFortuneType.SAJU_17]: '말년운',
  [SajuFortuneType.SAJU_18]: '직업운',
  [SajuFortuneType.SAJU_19]: '재물운',
  [SajuFortuneType.SAJU_20]: '선천적기질운',
  [SajuFortuneType.SAJU_21]: '태어난계절에따른운',
};

/** 운세 타입별 상세 설명 */
export const FORTUNE_TYPE_DESCRIPTIONS: Record<SajuFortuneType, string> = {
  [SajuFortuneType.SAJU_1]: '올해의토정비결 - 한 해 동안의 운세와 재물처방, 대인운을 종합적으로 분석',
  [SajuFortuneType.SAJU_2]: '새해신수 - 새해의 전체적인 운세와 재물, 길흉, 행운을 포괄적으로 해석',
  [SajuFortuneType.SAJU_3]: '자평명리학 평생총운 - 전통 자평명리학에 기반한 평생 총운과 재물운 분석',
  [SajuFortuneType.SAJU_4]: '인생풀이 - 종합적인 인생 운세 해석과 길흉 분석',
  [SajuFortuneType.SAJU_5]: '사주운세 - 세부적인 운세와 대인관계 분석',
  [SajuFortuneType.SAJU_6]: '십년대운풀이 - 10년 주기의 대운 흐름과 길흉 시기 분석',
  [SajuFortuneType.SAJU_7]: '전생운 - 전생과 현재의 인연 및 현재운세 분석',
  [SajuFortuneType.SAJU_8]: '질병운 - 건강과 질병 관련 운세 및 대인운 분석',
  [SajuFortuneType.SAJU_9]: '나의 오행기운세 - 오행(五行) 기운에 따른 상세 운세 분석',
  [SajuFortuneType.SAJU_10]: '자평명리학 오늘의 운세 - 오늘 하루의 세부 운세 분석',
  [SajuFortuneType.SAJU_11]: '당사주 평생총운 - 개인 사주의 평생 총운과 극복 방법 분석',
  [SajuFortuneType.SAJU_12]: '사주로 보는 심리분석 - 사주를 통한 심리 상태와 행운 분석',
  [SajuFortuneType.SAJU_13]: '살풀이 - 액운 해소와 악한 기운 정화 방법',
  [SajuFortuneType.SAJU_14]: '성격운세 - 타고난 성격과 기질에 따른 운세 분석',
  [SajuFortuneType.SAJU_15]: '초년운 - 어린 시절부터 청년기까지의 운세 분석',
  [SajuFortuneType.SAJU_16]: '중년운 - 중년기의 운세와 대인관계, 재물 분석',
  [SajuFortuneType.SAJU_17]: '말년운 - 노년기의 운세와 건강, 길흉 분석',
  [SajuFortuneType.SAJU_18]: '직업운 - 직업과 사업 관련 운세 분석',
  [SajuFortuneType.SAJU_19]: '재물운 - 재물과 금전 관련 운세 분석',
  [SajuFortuneType.SAJU_20]: '선천적기질운 - 타고난 기질과 성격 특성 분석',
  [SajuFortuneType.SAJU_21]: '태어난계절에따른운 - 출생 계절에 따른 운세 분석',
};

/**
 * 문자열로부터 SajuFortuneType 반환
 * @param typeStr - 운세 타입 문자열 (예: 'saju_1' 또는 '1')
 * @returns SajuFortuneType enum 값
 * @throws Error - 유효하지 않은 운세 타입인 경우
 */
export function getFortuneTypeFromString(typeStr: string): SajuFortuneType {
  // 직접 매칭 시도
  if (Object.values(SajuFortuneType).includes(typeStr as SajuFortuneType)) {
    return typeStr as SajuFortuneType;
  }

  // 하위 호환성: 숫자만 있는 경우
  if (/^\d+$/.test(typeStr)) {
    const fullType = `saju_${typeStr}`;
    if (Object.values(SajuFortuneType).includes(fullType as SajuFortuneType)) {
      return fullType as SajuFortuneType;
    }
  }

  throw new Error(`Unknown fortune type: ${typeStr}`);
}

/**
 * 모든 운세 타입과 설명 반환
 * @returns 운세 타입 값과 설명의 매핑
 */
export function getAllFortuneTypes(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const fortuneType of Object.values(SajuFortuneType)) {
    result[fortuneType] = FORTUNE_TYPE_DESCRIPTIONS[fortuneType];
  }
  return result;
}

/**
 * 운세 타입이 유효한지 확인
 * @param typeStr - 확인할 운세 타입 문자열
 * @returns 유효한 경우 true, 그렇지 않으면 false
 */
export function isValidFortuneType(typeStr: string): boolean {
  try {
    getFortuneTypeFromString(typeStr);
    return true;
  } catch {
    return false;
  }
}
