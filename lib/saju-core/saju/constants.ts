/**
 * Saju Constants Module
 * 사주팔자 계산에 사용되는 천간/지지/오행 관련 상수 정의
 *
 * 이 모듈은 여러 파일에 분산되어 있던 상수들을 중앙화합니다.
 */

// =============================================================================
// 천간 (天干, Heavenly Stems) - 10개
// =============================================================================

/** 천간 상세 정보 (알파벳 키 기준) */
export const HEAVENLY_STEMS = {
  A: { korean: '甲', element: '+목', display: '갑' },
  B: { korean: '乙', element: '-목', display: '을' },
  C: { korean: '丙', element: '+화', display: '병' },
  D: { korean: '丁', element: '-화', display: '정' },
  E: { korean: '戊', element: '+토', display: '무' },
  F: { korean: '己', element: '-토', display: '기' },
  G: { korean: '庚', element: '+금', display: '경' },
  H: { korean: '辛', element: '-금', display: '신' },
  I: { korean: '壬', element: '+수', display: '임' },
  J: { korean: '癸', element: '-수', display: '계' },
} as const;

/** 십간 순서 리스트 (한글 표기) */
export const TEN_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;

/** 한자 천간 → 한글 표기 */
export const KOREAN_STEM_TO_DISPLAY: Record<string, string> = {
  甲: '갑',
  乙: '을',
  丙: '병',
  丁: '정',
  戊: '무',
  己: '기',
  庚: '경',
  辛: '신',
  壬: '임',
  癸: '계',
};

/** 한자 천간 → 오행 */
export const KOREAN_STEM_ELEMENTS: Record<string, string> = {
  甲: '+목',
  乙: '-목',
  丙: '+화',
  丁: '-화',
  戊: '+토',
  己: '-토',
  庚: '+금',
  辛: '-금',
  壬: '+수',
  癸: '-수',
};

/** 천간 → 알파벳 변환 (한글/한자 모두 지원) */
export const STEM_TO_ALPHA: Record<string, string> = {
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
  甲: 'A',
  乙: 'B',
  丙: 'C',
  丁: 'D',
  戊: 'E',
  己: 'F',
  庚: 'G',
  辛: 'H',
  壬: 'I',
  癸: 'J',
};

/** 천간 → 오행 (부호 없이, 한글/한자 모두 지원) */
export const STEM_TO_ELEMENT: Record<string, string> = {
  甲: '목',
  乙: '목',
  갑: '목',
  을: '목',
  丙: '화',
  丁: '화',
  병: '화',
  정: '화',
  戊: '토',
  己: '토',
  무: '토',
  기: '토',
  庚: '금',
  辛: '금',
  경: '금',
  신: '금',
  壬: '수',
  癸: '수',
  임: '수',
  계: '수',
};

// =============================================================================
// 지지 (地支, Earthly Branches) - 12개
// =============================================================================

/** 지지 상세 정보 (숫자 키 기준) */
export const EARTHLY_BRANCHES = {
  '01': { korean: '寅', element: '+목', display: '인' },
  '02': { korean: '卯', element: '-목', display: '묘' },
  '03': { korean: '辰', element: '+토', display: '진' },
  '04': { korean: '巳', element: '+화', display: '사' },
  '05': { korean: '午', element: '-화', display: '오' },
  '06': { korean: '未', element: '-토', display: '미' },
  '07': { korean: '申', element: '+금', display: '신' },
  '08': { korean: '酉', element: '-금', display: '유' },
  '09': { korean: '戌', element: '+토', display: '술' },
  '10': { korean: '亥', element: '+수', display: '해' },
  '11': { korean: '子', element: '-수', display: '자' },
  '12': { korean: '丑', element: '-토', display: '축' },
} as const;

/** 십이지 순서 리스트 (한글 표기) - 인월 시작 */
export const TWELVE_BRANCHES = [
  '인',
  '묘',
  '진',
  '사',
  '오',
  '미',
  '신',
  '유',
  '술',
  '해',
  '자',
  '축',
] as const;

/** 십이지 순서 리스트 (자월 시작) - 일반적인 순서 */
export const TWELVE_BRANCHES_FROM_JA = [
  '자',
  '축',
  '인',
  '묘',
  '진',
  '사',
  '오',
  '미',
  '신',
  '유',
  '술',
  '해',
] as const;

/** 한자 지지 → 한글 표기 */
export const KOREAN_BRANCH_TO_DISPLAY: Record<string, string> = {
  寅: '인',
  卯: '묘',
  辰: '진',
  巳: '사',
  午: '오',
  未: '미',
  申: '신',
  酉: '유',
  戌: '술',
  亥: '해',
  子: '자',
  丑: '축',
};

/** 한자 지지 → 오행 */
export const KOREAN_BRANCH_ELEMENTS: Record<string, string> = {
  寅: '+목',
  卯: '-목',
  辰: '+토',
  巳: '+화',
  午: '-화',
  未: '-토',
  申: '+금',
  酉: '-금',
  戌: '+토',
  亥: '+수',
  子: '-수',
  丑: '-토',
};

/** 지지 → 오행 (부호 없이, 한글/한자 모두 지원) */
export const BRANCH_TO_ELEMENT: Record<string, string> = {
  寅: '목',
  卯: '목',
  인: '목',
  묘: '목',
  辰: '토',
  진: '토',
  巳: '화',
  午: '화',
  사: '화',
  오: '화',
  未: '토',
  미: '토',
  申: '금',
  酉: '금',
  신: '금',
  유: '금',
  戌: '토',
  술: '토',
  亥: '수',
  子: '수',
  해: '수',
  자: '수',
  丑: '토',
  축: '토',
};

// =============================================================================
// 일간/지지 조정 테이블 (자정/절입 처리용)
// =============================================================================

export const DAY_STEM_MIDNIGHT_ADJUSTMENTS: Record<string, string> = {
  C: 'B',
  D: 'C',
  E: 'D',
  F: 'E',
  G: 'F',
  H: 'G',
  I: 'H',
  J: 'I',
  A: 'J',
  B: 'A',
};

export const DAY_STEM_NORMAL_ADJUSTMENTS: Record<string, string> = {
  J: 'A',
  A: 'B',
  B: 'C',
  C: 'D',
  D: 'E',
  E: 'F',
  F: 'G',
  G: 'H',
  H: 'I',
  I: 'J',
};

export const DAY_BRANCH_MIDNIGHT_ADJUSTMENTS: Record<string, string> = {
  '03': '02',
  '04': '03',
  '05': '04',
  '06': '05',
  '07': '06',
  '08': '07',
  '09': '08',
  '10': '09',
  '11': '10',
  '12': '11',
  '01': '12',
};

export const DAY_BRANCH_NORMAL_ADJUSTMENTS: Record<string, string> = {
  '12': '01',
  '01': '02',
  '02': '03',
  '03': '04',
  '04': '05',
  '05': '06',
  '06': '07',
  '07': '08',
  '08': '09',
  '09': '10',
  '10': '11',
  '11': '12',
};

// =============================================================================
// 시간대별 시주 계산 테이블
// =============================================================================

/** 시간 범위 타입 (시작시간, 종료시간, 시주인덱스, 자시여부) */
export type HourTimeRange = readonly [number, number, number, boolean];

/** (시작시간, 종료시간, 시주인덱스, 자시여부) */
export const HOUR_TIME_RANGES: readonly HourTimeRange[] = [
  [0, 30, 0, true], // 00:00-00:29 -> s=0, kk_check=True
  [2330, 2400, 0, true], // 23:30-23:59 -> s=0, kk_check=True
  [30, 130, 0, false], // 00:30-01:29 -> s=0
  [130, 330, 1, false], // 01:30-03:29 -> s=1
  [330, 530, 2, false], // 03:30-05:29 -> s=2
  [530, 730, 3, false], // 05:30-07:29 -> s=3
  [730, 930, 4, false], // 07:30-09:29 -> s=4
  [930, 1130, 5, false], // 09:30-11:29 -> s=5
  [1130, 1330, 6, false], // 11:30-13:29 -> s=6
  [1330, 1530, 7, false], // 13:30-15:29 -> s=7
  [1530, 1730, 8, false], // 15:30-17:29 -> s=8
  [1730, 1930, 9, false], // 17:30-19:29 -> s=9
  [1930, 2130, 10, false], // 19:30-21:29 -> s=10
  [2130, 2330, 11, false], // 21:30-23:29 -> s=11
] as const;

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * 천간에서 오행 추출 (기본값: 토)
 */
export function getElementFromStem(stem: string): string {
  return STEM_TO_ELEMENT[stem] ?? '토';
}

/**
 * 지지에서 오행 추출 (기본값: 토)
 */
export function getElementFromBranch(branch: string): string {
  return BRANCH_TO_ELEMENT[branch] ?? '토';
}

/**
 * 천간에서 알파벳 코드 추출
 */
export function getAlphaFromStem(stem: string): string {
  return STEM_TO_ALPHA[stem] ?? '';
}

/**
 * 한자 천간에서 한글 표기 추출
 */
export function getDisplayFromKoreanStem(koreanStem: string): string {
  return KOREAN_STEM_TO_DISPLAY[koreanStem] ?? koreanStem;
}

/**
 * 한자 지지에서 한글 표기 추출
 */
export function getDisplayFromKoreanBranch(koreanBranch: string): string {
  return KOREAN_BRANCH_TO_DISPLAY[koreanBranch] ?? koreanBranch;
}

// =============================================================================
// 십신(十神) 통합 매핑 테이블
// =============================================================================

/**
 * 천간 십신 관계 (일간 한글 → 타천간 한글 → 십신)
 * 지지와 분리하여 '신(辛)'과 '신(申)' 충돌 방지
 */
export const SIPSIN_STEM_RELATIONS: Record<string, Record<string, string>> = {
  갑: {
    갑: '비견',
    을: '겁재',
    병: '식신',
    정: '상관',
    무: '편재',
    기: '정재',
    경: '편관',
    신: '정관',
    임: '정인',
    계: '편인',
  },
  을: {
    갑: '겁재',
    을: '비견',
    병: '상관',
    정: '식신',
    무: '정재',
    기: '편재',
    경: '정관',
    신: '편관',
    임: '편인',
    계: '정인',
  },
  병: {
    갑: '편인',
    을: '정인',
    병: '비견',
    정: '겁재',
    무: '식신',
    기: '상관',
    경: '편재',
    신: '정재',
    임: '편관',
    계: '정관',
  },
  정: {
    갑: '정인',
    을: '편인',
    병: '겁재',
    정: '비견',
    무: '상관',
    기: '식신',
    경: '정재',
    신: '편재',
    임: '정관',
    계: '편관',
  },
  무: {
    갑: '편관',
    을: '정관',
    병: '편인',
    정: '정인',
    무: '비견',
    기: '겁재',
    경: '식신',
    신: '상관',
    임: '편재',
    계: '정재',
  },
  기: {
    갑: '정관',
    을: '편관',
    병: '정인',
    정: '편인',
    무: '겁재',
    기: '비견',
    경: '상관',
    신: '식신',
    임: '정재',
    계: '편재',
  },
  경: {
    갑: '편재',
    을: '정재',
    병: '편관',
    정: '정관',
    무: '편인',
    기: '정인',
    경: '비견',
    신: '겁재',
    임: '식신',
    계: '상관',
  },
  신: {
    갑: '정재',
    을: '편재',
    병: '정관',
    정: '편관',
    무: '정인',
    기: '편인',
    경: '겁재',
    신: '비견',
    임: '상관',
    계: '식신',
  },
  임: {
    갑: '식신',
    을: '상관',
    병: '편재',
    정: '정재',
    무: '편관',
    기: '정관',
    경: '편인',
    신: '정인',
    임: '비견',
    계: '겁재',
  },
  계: {
    갑: '상관',
    을: '식신',
    병: '정재',
    정: '편재',
    무: '정관',
    기: '편관',
    경: '정인',
    신: '편인',
    임: '겁재',
    계: '비견',
  },
};

/**
 * 지지 십신 관계 (일간 한글 → 지지 한글 → 십신)
 * 지지의 본기(本氣) 천간 기준으로 십신 결정
 */
export const SIPSIN_BRANCH_RELATIONS: Record<string, Record<string, string>> = {
  갑: {
    인: '비견',
    묘: '겁재',
    사: '식신',
    오: '상관',
    진: '편재',
    술: '편재',
    축: '정재',
    미: '정재',
    신: '편관',
    유: '정관',
    해: '정인',
    자: '편인',
  },
  을: {
    인: '겁재',
    묘: '비견',
    사: '상관',
    오: '식신',
    진: '정재',
    술: '정재',
    축: '편재',
    미: '편재',
    신: '정관',
    유: '편관',
    해: '편인',
    자: '정인',
  },
  병: {
    인: '정인',
    묘: '편인',
    사: '비견',
    오: '겁재',
    진: '식신',
    술: '식신',
    축: '상관',
    미: '상관',
    신: '편재',
    유: '정재',
    해: '편관',
    자: '정관',
  },
  정: {
    인: '편인',
    묘: '정인',
    사: '겁재',
    오: '비견',
    진: '상관',
    술: '상관',
    축: '식신',
    미: '식신',
    신: '정재',
    유: '편재',
    해: '정관',
    자: '편관',
  },
  무: {
    인: '편관',
    묘: '정관',
    사: '정인',
    오: '편인',
    진: '비견',
    술: '비견',
    축: '겁재',
    미: '겁재',
    신: '식신',
    유: '상관',
    해: '편재',
    자: '정재',
  },
  기: {
    인: '정관',
    묘: '편관',
    사: '편인',
    오: '정인',
    진: '겁재',
    술: '겁재',
    축: '비견',
    미: '비견',
    신: '상관',
    유: '식신',
    해: '정재',
    자: '편재',
  },
  경: {
    인: '편재',
    묘: '정재',
    사: '편관',
    오: '정관',
    진: '정인',
    술: '정인',
    축: '편인',
    미: '편인',
    신: '비견',
    유: '겁재',
    해: '식신',
    자: '상관',
  },
  신: {
    인: '정재',
    묘: '편재',
    사: '정관',
    오: '편관',
    진: '편인',
    술: '편인',
    축: '정인',
    미: '정인',
    신: '겁재',
    유: '비견',
    해: '상관',
    자: '식신',
  },
  임: {
    인: '식신',
    묘: '상관',
    사: '편재',
    오: '정재',
    진: '편관',
    술: '편관',
    축: '정관',
    미: '정관',
    신: '편인',
    유: '정인',
    해: '비견',
    자: '겁재',
  },
  계: {
    인: '상관',
    묘: '식신',
    사: '정재',
    오: '편재',
    진: '정관',
    술: '정관',
    축: '편관',
    미: '편관',
    신: '정인',
    유: '편인',
    해: '겁재',
    자: '비견',
  },
};

/** 한자 천간 키를 한글로 변환하여 십신 조회 지원 */
export const HANJA_STEM_TO_DISPLAY: Record<string, string> = {
  甲: '갑',
  乙: '을',
  丙: '병',
  丁: '정',
  戊: '무',
  己: '기',
  庚: '경',
  辛: '신',
  壬: '임',
  癸: '계',
};

/**
 * 일간 기준 타천간의 십신을 반환
 *
 * @param dayStem - 일간 (한글 '갑' 또는 한자 '甲')
 * @param targetStem - 타천간 (한글 '을' 또는 한자 '乙')
 * @returns 십신 명칭 (예: '비견', '식신') 또는 빈 문자열
 */
export function getSipsinForStem(dayStem: string, targetStem: string): string {
  // 한자인 경우 한글로 변환
  const dayDisplay = HANJA_STEM_TO_DISPLAY[dayStem] ?? dayStem;
  const targetDisplay = HANJA_STEM_TO_DISPLAY[targetStem] ?? targetStem;

  const relations = SIPSIN_STEM_RELATIONS[dayDisplay];
  if (relations) {
    return relations[targetDisplay] ?? '';
  }
  return '';
}

/**
 * 일간 기준 지지의 십신을 반환
 *
 * @param dayStem - 일간 (한글 '갑' 또는 한자 '甲')
 * @param branch - 지지 (한글 '인', '묘' 등)
 * @returns 십신 명칭 (예: '비견', '편관') 또는 빈 문자열
 */
export function getSipsinForBranch(dayStem: string, branch: string): string {
  // 한자인 경우 한글로 변환
  const dayDisplay = HANJA_STEM_TO_DISPLAY[dayStem] ?? dayStem;
  const branchDisplay = KOREAN_BRANCH_TO_DISPLAY[branch] ?? branch;

  const relations = SIPSIN_BRANCH_RELATIONS[dayDisplay];
  if (relations) {
    return relations[branchDisplay] ?? '';
  }
  return '';
}
