/**
 * Interpretation Data Module
 * 사주 해석 데이터 - 주제별/오행별 해석 텍스트 및 설정
 */

/**
 * 해석 유형
 */
export enum InterpretationType {
  FORTUNE = 'fortune', // 일반 운세
  WEALTH = 'wealth', // 재물운
  CAREER = 'career', // 직업운
  LOVE = 'love', // 연애운
  MARRIAGE = 'marriage', // 결혼운
  HEALTH = 'health', // 건강운
  STUDY = 'study', // 학업운
  CHILDREN = 'children', // 자녀운
  FAMILY = 'family', // 가족운
  PERSONALITY = 'personality', // 성격 분석
  YEARLY = 'yearly', // 연간 운세
  MONTHLY = 'monthly', // 월간 운세
  DAILY = 'daily', // 일간 운세
}

/** 오행 목록 */
export const ELEMENTS = ['목', '화', '토', '금', '수'] as const;
export type Element = (typeof ELEMENTS)[number];

/** 오행별 해석 데이터 구조 */
export interface ElementInterpretation {
  summary?: string;
  strengths: string[];
  weaknesses?: string[];
  advice?: string[];
  score_bonus: number;
  suitable_careers?: string[];
  vulnerable_areas?: string[];
  personality_traits?: string[];
  fortune?: string;
  color?: string;
  number?: string;
}

/** 공통 해석 데이터 구조 */
export interface CommonInterpretation {
  strengths?: string[];
  weaknesses?: string[];
  advice?: string[];
  lucky_elements: string[];
  unlucky_elements: string[];
  score_bonus?: number;
}

/** 월간 운세 계절 데이터 */
export interface SeasonData {
  months: number[];
  strong_element: Element;
  strong_summary: string;
  default_summary: string;
}

/** 해석 타입별 데이터 구조 */
export interface InterpretationTypeData {
  title: string;
  base_score: number;
  elements?: Record<string, ElementInterpretation>;
  common?: Partial<CommonInterpretation>;
  detailed_template: string;
  seasons?: Record<string, SeasonData>;
  weekday_themes?: Record<string, string>;
}

/** 해석 데이터 구조 */
export const INTERPRETATION_DATA: Record<InterpretationType, InterpretationTypeData> = {
  [InterpretationType.FORTUNE]: {
    title: '전체 운세',
    base_score: 70.0,
    elements: {
      목: {
        summary: '생명력이 강하고 성장지향적인 성격입니다.',
        strengths: ['창의성', '적응력', '성장 가능성'],
        weaknesses: ['고집', '변덕스러움'],
        advice: ['꾸준한 노력으로 성과를 이루세요', '인내심을 기르는 것이 중요합니다'],
        score_bonus: 5,
      },
      화: {
        summary: '열정적이고 활동적인 성격입니다.',
        strengths: ['리더십', '열정', '사교성'],
        weaknesses: ['성급함', '감정기복'],
        advice: ['차분함을 유지하세요', '계획적인 행동이 필요합니다'],
        score_bonus: 8,
      },
      토: {
        summary: '안정적이고 신뢰할 수 있는 성격입니다.',
        strengths: ['성실함', '신뢰성', '포용력'],
        weaknesses: ['고집', '변화 거부'],
        advice: ['새로운 시도를 두려워하지 마세요', '유연성을 기르세요'],
        score_bonus: 10,
      },
      금: {
        summary: '원칙적이고 의지가 강한 성격입니다.',
        strengths: ['의지력', '판단력', '실행력'],
        weaknesses: ['완고함', '비판적'],
        advice: ['타인의 의견도 들어보세요', '부드러운 소통이 필요합니다'],
        score_bonus: 7,
      },
      수: {
        summary: '지혜롭고 유연한 성격입니다.',
        strengths: ['지혜', '유연성', '포용력'],
        weaknesses: ['우유부단', '소극적'],
        advice: ['자신감을 가지세요', '적극적인 행동이 필요합니다'],
        score_bonus: 6,
      },
    },
    common: {
      lucky_elements: ['{element} 관련 사업', '성실함을 바탕으로 한 활동'],
      unlucky_elements: ['성급한 결정', '감정적인 판단'],
    },
    detailed_template: `
일간 {day_stem}({element}) 기준 분석:

{summary}

당신의 사주는 {element} 오행을 중심으로 구성되어 있습니다.
이는 당신의 기본 성격과 운세의 흐름을 결정하는 중요한 요소입니다.

사주 구성:
- 년주: {year_stem}{year_branch}
- 월주: {month_stem}{month_branch}
- 일주: {day_stem}{day_branch}
- 시주: {hour_stem}{hour_branch}

이러한 구성을 바탕으로 전반적으로 안정적인 운세를 가지고 있으며,
꾸준한 노력을 통해 좋은 성과를 거둘 수 있을 것입니다.
`,
  },

  [InterpretationType.WEALTH]: {
    title: '재물운',
    base_score: 65.0,
    elements: {
      목: {
        summary: '점진적으로 재물이 늘어나는 운입니다.',
        strengths: ['성장성', '장기 투자', '근면성'],
        score_bonus: 5,
      },
      화: {
        summary: '화려한 소비와 큰 수익이 함께하는 운입니다.',
        strengths: ['큰 수익 기회', '사업 감각', '리더십'],
        score_bonus: 8,
      },
      토: {
        summary: '재물을 모으고 관리하는 능력이 뛰어납니다.',
        strengths: ['절약 정신', '투자 감각', '안정성 추구'],
        score_bonus: 15,
      },
      금: {
        summary: '재물을 모으고 관리하는 능력이 뛰어납니다.',
        strengths: ['절약 정신', '투자 감각', '안정성 추구'],
        score_bonus: 15,
      },
      수: {
        summary: '유동적인 재물운을 가지고 있습니다.',
        strengths: ['기회 포착', '다양한 수입원', '적응력'],
        score_bonus: 10,
      },
    },
    common: {
      weaknesses: ['무리한 투자', '감정적 소비'],
      advice: ['계획적인 저축을 하세요', '안정적인 투자를 선택하세요'],
      lucky_elements: ['부동산', '장기 투자'],
      unlucky_elements: ['투기', '충동 구매'],
    },
    detailed_template: `
재물운 분석 ({element} 일간):

{summary}

당신의 일간 {element} 오행은 재물에 대한 다음과 같은 특성을 나타냅니다:

재물운의 특징:
- 기본 재물 성향이 {element} 오행의 특성을 따릅니다
- 안정적인 수입보다는 변동성이 있을 수 있습니다
- 장기적인 관점에서 재물 관리를 하는 것이 좋습니다

투자와 관련해서는 신중한 접근이 필요하며,
무리한 투자보다는 안정적인 방법을 선택하는 것이 바람직합니다.
`,
  },

  [InterpretationType.CAREER]: {
    title: '직업운',
    base_score: 68.0,
    elements: {
      목: {
        summary: '교육, 예술, 문화 분야에 적합합니다.',
        strengths: ['창의성', '교육 능력', '성장 가능성'],
        suitable_careers: ['교사', '예술가', '기자', '상담사'],
        score_bonus: 7,
      },
      화: {
        summary: '리더십을 발휘할 수 있는 분야에 적합합니다.',
        strengths: ['리더십', '열정', '추진력'],
        suitable_careers: ['경영자', '정치인', '연예인', '마케터'],
        score_bonus: 10,
      },
      토: {
        summary: '안정적인 직업이나 부동산 관련 분야에 적합합니다.',
        strengths: ['신뢰성', '성실함', '인내력'],
        suitable_careers: ['공무원', '부동산업', '건축업', '농업'],
        score_bonus: 12,
      },
      금: {
        summary: '정밀함이 요구되는 기술직에 적합합니다.',
        strengths: ['정확성', '기술력', '분석력'],
        suitable_careers: ['의사', '법조인', '엔지니어', '금융업'],
        score_bonus: 9,
      },
      수: {
        summary: '유연성과 지혜가 필요한 분야에 적합합니다.',
        strengths: ['지혜', '적응력', '소통 능력'],
        suitable_careers: ['연구원', '상담사', '유통업', 'IT업'],
        score_bonus: 6,
      },
    },
    common: {
      weaknesses: ['성급한 이직', '전문성 부족'],
      advice: ['전문성을 기르세요', '인맥을 소중히 하세요', '꾸준한 자기계발이 필요합니다'],
      lucky_elements: ['전문 기술', '인간관계', '꾸준한 노력'],
      unlucky_elements: ['빈번한 이직', '무계획적 창업'],
    },
    detailed_template: `
직업운 분석 ({element} 일간):

{summary}

추천 직업군: {suitable_careers}

당신의 일간 오행인 {element}는 다음과 같은 직업적 특성을 나타냅니다:

직업운의 특징:
- 본인의 타고난 재능을 활용할 수 있는 분야가 좋습니다
- 꾸준한 노력을 통해 전문성을 쌓아가세요
- 인간관계를 중시하는 직업에서 좋은 성과를 거둘 수 있습니다

장기적으로는 안정적인 커리어 발전이 가능하며,
자신만의 전문 분야를 개발하는 것이 중요합니다.
`,
  },

  [InterpretationType.LOVE]: {
    title: '연애운',
    base_score: 72.0,
    elements: {
      목: {
        summary: '순수하고 성장하는 연애를 추구합니다.',
        strengths: ['순수함', '성장성', '헌신'],
        score_bonus: 6,
      },
      화: {
        summary: '열정적이고 로맨틱한 연애를 즐기는 타입입니다.',
        strengths: ['매력', '열정', '로맨스'],
        score_bonus: 10,
      },
      토: {
        summary: '안정적이고 신뢰할 수 있는 연애관을 가집니다.',
        strengths: ['신뢰', '안정', '헌신'],
        score_bonus: 12,
      },
      금: {
        summary: '분명한 기준과 원칙이 있는 연애를 합니다.',
        strengths: ['진실', '원칙', '의리'],
        score_bonus: 7,
      },
      수: {
        summary: '깊이 있고 지적인 연애를 선호합니다.',
        strengths: ['깊이', '이해력', '포용력'],
        score_bonus: 8,
      },
    },
    common: {
      weaknesses: ['고집', '질투'],
      advice: ['상대방을 이해하려 노력하세요', '소통을 자주 하세요', '서로의 개성을 인정하세요'],
      lucky_elements: ['진실한 마음', '꾸준한 관심', '서로에 대한 이해'],
      unlucky_elements: ['의심', '과도한 간섭', '감정적 대립'],
    },
    detailed_template: `
연애운 분석 ({element} 일간):

{summary}

당신의 일간 오행인 {element}는 다음과 같은 연애 특성을 나타냅니다:

연애운의 특징:
- 진실한 마음으로 상대방을 대합니다
- 장기적인 관계를 추구하는 경향이 있습니다
- 상대방과의 가치관 일치를 중요하게 생각합니다

연애에서는 서로를 이해하고 존중하는 것이 가장 중요하며,
소통을 통해 더욱 깊은 관계로 발전시킬 수 있습니다.
`,
  },

  [InterpretationType.MARRIAGE]: {
    title: '결혼운',
    base_score: 70.0,
    elements: {
      목: {
        summary: '성장하고 발전하는 결혼 생활을 추구합니다.',
        strengths: ['성장지향', '적응력', '포용력'],
        score_bonus: 7,
      },
      화: {
        summary: '열정적이고 활기찬 결혼 생활을 만들어갑니다.',
        strengths: ['열정', '적극성', '애정표현'],
        score_bonus: 8,
      },
      토: {
        summary: '안정적이고 행복한 결혼 생활을 할 가능성이 높습니다.',
        strengths: ['가정적', '배려심', '책임감'],
        score_bonus: 15,
      },
      금: {
        summary: '원칙과 신의를 중시하는 결혼관을 가집니다.',
        strengths: ['신뢰', '원칙', '책임감'],
        score_bonus: 12,
      },
      수: {
        summary: '지적이고 소통이 원활한 결혼 생활을 추구합니다.',
        strengths: ['이해력', '유연성', '소통능력'],
        score_bonus: 10,
      },
    },
    common: {
      weaknesses: ['고집', '기대치 차이'],
      advice: ['상대방의 입장을 이해하세요', '대화와 소통을 중시하세요', '서로의 개성을 존중하세요'],
      lucky_elements: ['상호 이해', '신뢰 구축', '공동 목표'],
      unlucky_elements: ['의심', '일방적 요구', '소통 부재'],
    },
    detailed_template: `
결혼운 분석 ({element} 일간):

{summary}

결혼 생활의 특징:
- 배우자와의 조화로운 관계 형성이 중요합니다
- 서로의 차이를 인정하고 존중하는 태도가 필요합니다
- 가정의 안정과 화목을 위해 노력하세요

결혼 시기와 관련해서는 대운의 흐름을 참고하시고,
서로를 이해하고 배려하는 마음이 행복한 결혼의 기초가 됩니다.
`,
  },

  [InterpretationType.HEALTH]: {
    title: '건강운',
    base_score: 75.0,
    elements: {
      목: {
        summary: '간과 담낭 건강에 주의하고 스트레스 관리가 필요합니다.',
        strengths: ['회복력', '활력', '성장력'],
        vulnerable_areas: ['간', '담낭', '신경계'],
        score_bonus: 5,
      },
      화: {
        summary: '심장과 혈액순환 건강을 잘 관리하세요.',
        strengths: ['활동성', '혈액순환', '대사율'],
        vulnerable_areas: ['심장', '혈관', '소장'],
        score_bonus: 7,
      },
      토: {
        summary: '소화기 건강과 체중 관리에 신경쓰세요.',
        strengths: ['면역력', '체력', '지구력'],
        vulnerable_areas: ['위장', '비장', '췌장'],
        score_bonus: 10,
      },
      금: {
        summary: '호흡기와 피부 건강 관리가 중요합니다.',
        strengths: ['정화능력', '호흡기능', '피부재생'],
        vulnerable_areas: ['폐', '대장', '피부'],
        score_bonus: 8,
      },
      수: {
        summary: '신장과 비뇨기 건강을 주의깊게 관리하세요.',
        strengths: ['정화능력', '수분대사', '해독작용'],
        vulnerable_areas: ['신장', '방광', '생식기'],
        score_bonus: 6,
      },
    },
    common: {
      advice: ['규칙적인 생활습관을 유지하세요', '스트레스를 관리하세요', '계절에 맞는 건강관리를 하세요'],
      lucky_elements: ['규칙적인 운동', '균형잡힌 식단', '충분한 수면'],
      unlucky_elements: ['과로', '스트레스', '불규칙한 생활'],
    },
    detailed_template: `
건강운 분석 ({element} 일간):

{summary}

건강 관리 포인트:
- 주의해야 할 부위: {vulnerable_areas}
- 규칙적인 운동과 충분한 휴식이 필요합니다
- 계절 변화에 따른 건강 관리를 하세요
- 정기적인 건강 검진을 받으세요

오행의 균형을 맞추는 생활습관을 통해
더욱 건강한 삶을 유지할 수 있습니다.
`,
  },

  [InterpretationType.STUDY]: {
    title: '학업운',
    base_score: 73.0,
    elements: {
      목: {
        summary: '창의적 사고와 발전적 학습을 추구합니다.',
        strengths: ['창의성', '성장욕구', '적응력'],
        score_bonus: 10,
      },
      화: {
        summary: '열정적으로 학습하며 리더십을 발휘합니다.',
        strengths: ['열정', '집중력', '표현력'],
        score_bonus: 8,
      },
      토: {
        summary: '꾸준하고 성실한 학습 태도를 가집니다.',
        strengths: ['성실성', '인내력', '실용성'],
        score_bonus: 12,
      },
      금: {
        summary: '논리적이고 체계적인 학습을 선호합니다.',
        strengths: ['논리성', '정확성', '체계성'],
        score_bonus: 9,
      },
      수: {
        summary: '지적 호기심이 강하고 학습 능력이 뛰어납니다.',
        strengths: ['지혜', '이해력', '분석력'],
        score_bonus: 15,
      },
    },
    common: {
      weaknesses: ['집중력 부족', '조급함'],
      advice: ['규칙적인 학습 습관을 기르세요', '충분한 휴식을 취하세요', '목표를 명확히 설정하세요'],
      lucky_elements: ['계획적 학습', '반복 학습', '그룹 스터디'],
      unlucky_elements: ['벼락치기', '과도한 스트레스', '불규칙한 학습'],
    },
    detailed_template: `
학업운 분석 ({element} 일간):

{summary}

학습 특성:
- 자신만의 학습 스타일을 개발하는 것이 중요합니다
- 꾸준한 노력과 반복 학습이 성과로 이어집니다
- 관심 분야를 깊이 있게 탐구하면 좋은 결과가 있습니다

시험운과 관련해서는 철저한 준비와 함께
심리적 안정을 유지하는 것이 중요합니다.
`,
  },

  [InterpretationType.CHILDREN]: {
    title: '자녀운',
    base_score: 72.0,
    elements: {
      목: {
        summary: '자녀의 성장과 발전을 적극 지원합니다.',
        strengths: ['교육열', '성장지원', '창의성 격려'],
        score_bonus: 8,
      },
      화: {
        summary: '자녀와 활발하고 열정적인 관계를 맺습니다.',
        strengths: ['애정표현', '활동성', '격려'],
        score_bonus: 7,
      },
      토: {
        summary: '자녀와 안정적이고 따뜻한 관계를 형성합니다.',
        strengths: ['포용력', '인내심', '양육능력'],
        score_bonus: 12,
      },
      금: {
        summary: '자녀에게 원칙과 규율을 가르칩니다.',
        strengths: ['훈육능력', '원칙성', '책임감'],
        score_bonus: 9,
      },
      수: {
        summary: '자녀와 지적이고 깊은 교감을 나눕니다.',
        strengths: ['이해력', '소통능력', '교육력'],
        score_bonus: 10,
      },
    },
    common: {
      weaknesses: ['과잉보호', '기대치 부담'],
      advice: ['자녀의 입장을 이해하세요', '충분한 대화시간을 가지세요', '자율성을 존중하세요'],
      lucky_elements: ['소통', '신뢰', '격려'],
      unlucky_elements: ['과잉간섭', '비교', '압박'],
    },
    detailed_template: `
자녀운 분석 ({element} 일간):

{summary}

자녀 관계의 특징:
- 자녀의 개성을 인정하고 존중하는 것이 중요합니다
- 적절한 거리두기와 관심의 균형이 필요합니다
- 자녀와의 소통을 위해 꾸준히 노력하세요

자녀의 재능을 발견하고 키워주는 것이
부모로서의 중요한 역할입니다.
`,
  },

  [InterpretationType.FAMILY]: {
    title: '가족운',
    base_score: 74.0,
    elements: {
      목: {
        summary: '가족의 발전과 성장을 도모합니다.',
        strengths: ['발전지향', '희생정신', '보살핌'],
        score_bonus: 8,
      },
      화: {
        summary: '가족에게 따뜻함과 활력을 줍니다.',
        strengths: ['따뜻함', '활력', '즐거움'],
        score_bonus: 7,
      },
      토: {
        summary: '가족의 중심이 되어 화목을 이끕니다.',
        strengths: ['중재력', '포용력', '안정감'],
        score_bonus: 13,
      },
      금: {
        summary: '가족에 대한 책임감과 의무를 중시합니다.',
        strengths: ['책임감', '보호본능', '신뢰'],
        score_bonus: 10,
      },
      수: {
        summary: '가족과 깊은 정서적 교감을 나눕니다.',
        strengths: ['이해력', '공감능력', '유연성'],
        score_bonus: 9,
      },
    },
    common: {
      weaknesses: ['간섭', '의견충돌'],
      advice: ['가족과의 시간을 늘리세요', '서로의 의견을 존중하세요', '감사의 마음을 표현하세요'],
      lucky_elements: ['화합', '이해', '배려'],
      unlucky_elements: ['갈등', '무관심', '비난'],
    },
    detailed_template: `
가족운 분석 ({element} 일간):

{summary}

가족 관계의 특징:
- 가족 구성원 각자의 입장을 이해하려 노력하세요
- 가족 화합을 위한 시간을 정기적으로 가지세요
- 서로를 존중하고 배려하는 문화를 만들어가세요

가족은 삶의 가장 중요한 버팀목이므로
따뜻한 관계 유지를 위해 노력하는 것이 중요합니다.
`,
  },

  [InterpretationType.PERSONALITY]: {
    title: '성격 분석',
    base_score: 75.0,
    elements: {
      목: {
        summary: '진취적이고 창의적인 성격으로 새로운 도전을 즐깁니다.',
        strengths: ['창의성', '적응력', '성장욕구', '리더십'],
        personality_traits: ['진취적', '독립적', '이상주의적'],
        weaknesses: ['변덕', '우유부단'],
        score_bonus: 7,
      },
      화: {
        summary: '열정적이고 사교적인 성격으로 주변을 밝게 만듭니다.',
        strengths: ['열정', '사교성', '표현력', '카리스마'],
        personality_traits: ['외향적', '낙천적', '충동적'],
        weaknesses: ['변덕', '우유부단'],
        score_bonus: 9,
      },
      토: {
        summary: '신중하고 신뢰할 수 있는 성격으로 안정을 추구합니다.',
        strengths: ['신뢰성', '인내심', '실용성', '균형감'],
        personality_traits: ['신중함', '보수적', '현실적'],
        weaknesses: ['고집', '완벽주의'],
        score_bonus: 11,
      },
      금: {
        summary: '원칙적이고 정의로운 성격으로 옳고 그름이 분명합니다.',
        strengths: ['정의감', '결단력', '조직력', '완벽주의'],
        personality_traits: ['원칙적', '비판적', '독립적'],
        weaknesses: ['고집', '완벽주의'],
        score_bonus: 8,
      },
      수: {
        summary: '지혜롭고 유연한 성격으로 상황에 잘 적응합니다.',
        strengths: ['지혜', '직관력', '유연성', '통찰력'],
        personality_traits: ['내향적', '사색적', '신비주의적'],
        weaknesses: ['변덕', '우유부단'],
        score_bonus: 6,
      },
    },
    common: {
      advice: ['자신의 장점을 활용하세요', '단점을 인정하고 개선하세요', '타인의 다양성을 인정하세요'],
      unlucky_elements: ['자기부정', '과도한 비판', '경직성'],
      lucky_elements: [],
    },
    detailed_template: `
성격 분석 ({element} 일간):

{summary}

주요 성격 특성: {personality_traits}

성격의 장점:
- {strengths}

성격 발전 방향:
- 장점을 극대화하고 단점을 보완하세요
- 다양한 경험을 통해 성격의 폭을 넓히세요
- 자기 이해를 바탕으로 타인을 이해하세요

당신의 고유한 성격은 소중한 자산입니다.
이를 잘 활용하여 삶을 풍요롭게 만들어가세요.
`,
  },

  [InterpretationType.YEARLY]: {
    title: '연간 운세',
    base_score: 70.0,
    elements: {
      목: { summary: '성장과 발전의 해', strengths: [], score_bonus: 8 },
      화: { summary: '열정과 도전의 해', strengths: [], score_bonus: 10 },
      토: { summary: '안정과 수확의 해', strengths: [], score_bonus: 12 },
      금: { summary: '결실과 정리의 해', strengths: [], score_bonus: 9 },
      수: { summary: '변화와 기회의 해', strengths: [], score_bonus: 7 },
    },
    common: {
      strengths: ['기회 포착', '성장 가능성', '인간관계 발전'],
      weaknesses: ['과욕', '조급함'],
      advice: ['계획을 세워 실천하세요', '건강관리에 신경쓰세요', '인간관계를 소중히 하세요'],
      lucky_elements: ['새로운 시도', '꾸준한 노력', '긍정적 태도'],
      unlucky_elements: ['무계획', '과로', '부정적 사고'],
    },
    detailed_template: `
{year}년 연간 운세 ({element} 일간):

{year}년은 {summary}입니다.

올해의 운세 흐름:
- 상반기: 준비와 계획의 시기
- 중반기: 실행과 도전의 시기
- 하반기: 수확과 정리의 시기

월별 주요 포인트:
- 1-3월: 새로운 시작과 계획 수립
- 4-6월: 적극적인 활동과 관계 형성
- 7-9월: 중간 점검과 방향 조정
- 10-12월: 마무리와 다음해 준비

올해는 꾸준한 노력과 긍정적인 태도로
좋은 성과를 거둘 수 있는 해입니다.
`,
  },

  [InterpretationType.MONTHLY]: {
    title: '월간 운세',
    base_score: 72.0,
    seasons: {
      봄: {
        months: [3, 4, 5],
        strong_element: '목',
        strong_summary: '왕성한 성장의 시기입니다.',
        default_summary: '새로운 시작의 기회가 있습니다.',
      },
      여름: {
        months: [6, 7, 8],
        strong_element: '화',
        strong_summary: '최고의 활동력을 발휘하는 시기입니다.',
        default_summary: '열정적인 도전의 시기입니다.',
      },
      가을: {
        months: [9, 10, 11],
        strong_element: '금',
        strong_summary: '결실을 맺는 시기입니다.',
        default_summary: '수확과 정리의 시기입니다.',
      },
      겨울: {
        months: [12, 1, 2],
        strong_element: '수',
        strong_summary: '내면의 지혜가 빛나는 시기입니다.',
        default_summary: '휴식과 재충전의 시기입니다.',
      },
    },
    common: {
      strengths: ['시기적절한 기회', '좋은 인연', '건강한 에너지'],
      weaknesses: ['일시적 피로', '소통 오해'],
      advice: ['매일 작은 목표를 세우세요', '긍정적인 마인드를 유지하세요', '충분한 휴식을 취하세요'],
      lucky_elements: ['계획 실행', '새로운 만남', '자기계발'],
      unlucky_elements: ['과도한 욕심', '무리한 일정', '부정적 사고'],
    },
    detailed_template: `
{month}월 월간 운세 ({element} 일간):

{summary}

이번 달 운세의 특징:
- {season}의 기운이 당신의 {element} 오행과 만나는 시기입니다
- 주간별로 운세의 기복이 있을 수 있습니다
- 중순 이후 운세가 상승하는 경향이 있습니다

이번 달 중점 사항:
- 건강: 계절 변화에 따른 건강 관리 필요
- 재물: 계획적인 지출과 저축 권장
- 인간관계: 소통과 이해를 중시하세요

매일의 작은 노력이 모여
큰 성과를 이루는 달이 될 것입니다.
`,
  },

  [InterpretationType.DAILY]: {
    title: '오늘의 운세',
    base_score: 75.0,
    weekday_themes: {
      Monday: '새로운 시작',
      Tuesday: '적극적 활동',
      Wednesday: '균형과 조화',
      Thursday: '성장과 발전',
      Friday: '마무리와 정리',
      Saturday: '휴식과 재충전',
      Sunday: '가족과 화합',
    },
    elements: {
      목: { fortune: '창의적인 아이디어가 샘솟는 날', color: '초록색', number: '3, 8', strengths: [], score_bonus: 5 },
      화: { fortune: '열정과 활력이 넘치는 날', color: '빨간색', number: '2, 7', strengths: [], score_bonus: 5 },
      토: { fortune: '안정적이고 실속있는 날', color: '노란색', number: '5, 10', strengths: [], score_bonus: 5 },
      금: { fortune: '결단력과 추진력이 좋은 날', color: '흰색', number: '4, 9', strengths: [], score_bonus: 5 },
      수: { fortune: '직관과 통찰력이 빛나는 날', color: '검은색', number: '1, 6', strengths: [], score_bonus: 5 },
    },
    common: {
      score_bonus: 5,
      strengths: ['좋은 기운', '원활한 소통', '집중력 향상'],
      weaknesses: ['일시적 피로'],
      advice: ['아침 일찍 시작하세요', '중요한 결정은 오전에 하세요', '저녁에는 충분히 쉬세요'],
      lucky_elements: ['긍정적 태도', '적극적 소통', '감사하는 마음'],
      unlucky_elements: ['부정적 생각', '무리한 일정', '과도한 스트레스'],
    },
    detailed_template: `
오늘의 운세 ({element} 일간):

오늘은 {theme}의 날입니다.
{element_fortune}입니다.

시간대별 운세:
- 오전 (06-12시): 활력이 넘치는 시간, 중요한 일 처리
- 오후 (12-18시): 안정적인 시간, 계획 실행
- 저녁 (18-24시): 휴식과 정리의 시간

오늘의 행운:
- 행운의 방향: 동쪽
- 행운의 색상: {lucky_color}
- 행운의 숫자: {lucky_number}

오늘 하루도 긍정적인 마음으로
최선을 다해 보내세요.
`,
  },
};

/**
 * 해석 유형에 해당하는 데이터 반환
 */
export function getInterpretationData(interpretationType: InterpretationType): InterpretationTypeData {
  return INTERPRETATION_DATA[interpretationType] ?? INTERPRETATION_DATA[InterpretationType.FORTUNE];
}

/**
 * 해석 유형과 오행에 해당하는 데이터 반환
 */
export function getElementData(
  interpretationType: InterpretationType,
  element: string
): ElementInterpretation | undefined {
  const typeData = getInterpretationData(interpretationType);
  const elementsData = typeData.elements ?? {};
  return elementsData[element] ?? elementsData['토']; // 기본값: 토
}
