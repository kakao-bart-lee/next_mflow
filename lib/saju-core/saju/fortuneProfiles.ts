import { InterpretationType } from './interpreters';

export interface ProfileSectionDefinition {
  readonly id: string;
  readonly title: string;
  readonly tableCodes: readonly string[];
}

export interface FortuneProfileDefinition {
  readonly id: string;
  readonly legacyFortuneType: string;
  readonly titleKo: string;
  readonly description: string;
  readonly themeType: InterpretationType;
  readonly sections: readonly ProfileSectionDefinition[];
}

const SECTION_ID_OVERRIDES: Readonly<Record<string, string>> = {
  올해의토정비결: 'yearly_guidance',
  새해신수: 'new_year_guidance',
  '자평명리학 평생총운': 'lifetime_guidance',
  인생풀이: 'life_analysis',
  사주운세: 'saju_reading',
  대길흉이오는시기: 'major_cycle',
  대운세운풀이: 'fortune_cycle',
  전생운: 'past_life',
  질병운: 'health',
  '나의 오행기운세': 'five_elements',
  '자평명리학 오늘의 운세': 'daily',
  '당사주 평생총운': 'dangsaju_lifetime',
  사주뛰어넘기: 'beyond_saju',
  '사주로 보는 심리분석': 'psychology',
  행운: 'lucky_signals',
  살풀이: 'misfortune_relief',
  성격운세: 'personality',
  성격운: 'personality',
  중년운: 'midlife',
  재물처방: 'wealth_guidance',
  대인운: 'interpersonal',
  현재운세: 'current_outlook',
  길흉: 'auspiciousness',
  재물운: 'wealth',
  초년운: 'early_life',
  학업운: 'study',
  취업운: 'employment',
  말년운: 'later_life',
  건강운: 'health_details',
  직업운: 'career',
  태어난계절에따른운: 'birth_season',
  기본해설: 'basic_overview',
};

function section(title: string, tableCodes: readonly string[]): ProfileSectionDefinition {
  const normalizedTitle = title.replace(/\s+/g, '');
  return {
    id: SECTION_ID_OVERRIDES[normalizedTitle] ?? 'main',
    title,
    tableCodes,
  };
}

export const BASIC_FORTUNE_PROFILE: FortuneProfileDefinition = {
  id: 'basic',
  legacyFortuneType: 'basic',
  titleKo: '기본 해설',
  description: '총평과 초중말년운을 빠르게 읽는 기본 프로필',
  themeType: InterpretationType.FORTUNE,
  sections: [
    section('기본 해설', ['S063', 'S045', 'S046', 'S047']),
  ],
};

export const FORTUNE_PROFILES: Readonly<Record<string, FortuneProfileDefinition>> = {
  tojeong_yearly_fortune: {
    id: 'tojeong_yearly_fortune',
    legacyFortuneType: 'saju_1',
    titleKo: '올해의토정비결',
    description: '한 해 동안의 운세와 재물처방, 대인운, 현재운세를 종합적으로 읽는 프로필',
    themeType: InterpretationType.YEARLY,
    sections: [
      section('올해의토정비결', ['S142', 'S143', 'S106', 'S107', 'S108', 'S109', 'S110']),
      section('재물처방', ['S082', 'S116', 'S117', 'S118', 'S042']),
      section('대인운', ['S028', 'J037', 'J005', 'S009', 'S040']),
      section('현재운세', ['S014']),
    ],
  },
  new_year_fortune: {
    id: 'new_year_fortune',
    legacyFortuneType: 'saju_2',
    titleKo: '새해신수',
    description: '새해의 흐름을 길흉, 행운, 현재운세까지 묶어 해석하는 프로필',
    themeType: InterpretationType.YEARLY,
    sections: [
      section('새해신수', ['S103', 'S104', 'S095', 'S097', 'S098', 'S099', 'S100', 'S101']),
      section('재물처방', ['S082', 'S116', 'S117', 'S118', 'S042']),
      section('길흉', ['S144', 'J047', 'J048', 'S026', 'T035', 'S007', 'T061']),
      section('행운', ['T028', 'S009', 'J009', 'S010', 'T039']),
      section('현재운세', ['S121']),
    ],
  },
  lifetime_overview: {
    id: 'lifetime_overview',
    legacyFortuneType: 'saju_3',
    titleKo: '자평명리학 평생총운',
    description: '전통 자평명리학 관점에서 평생 총운, 재물운, 현재운세를 살피는 프로필',
    themeType: InterpretationType.FORTUNE,
    sections: [
      section('자평명리학 평생총운', ['S022', 'S064', 'S065', 'S066', 'S067', 'S068']),
      section('재물운', ['S027', 'S116', 'S117', 'S042', 'S082']),
      section('현재운세', ['S014']),
    ],
  },
  life_overview: {
    id: 'life_overview',
    legacyFortuneType: 'saju_4',
    titleKo: '인생풀이',
    description: '인생 전반과 길흉을 종합적으로 해석하는 프로필',
    themeType: InterpretationType.FORTUNE,
    sections: [
      section('인생풀이', ['S063', 'S045', 'S046', 'S047', 'S048', 'S049', 'S050', 'S051', 'S052', 'S053', 'S054', 'S055', 'S056', 'S057', 'S058', 'S059', 'S060', 'S061']),
      section('길흉', ['S007', 'S008', 'S009', 'S010', 'F011', 'T039']),
    ],
  },
  detailed_saju_reading: {
    id: 'detailed_saju_reading',
    legacyFortuneType: 'saju_5',
    titleKo: '사주운세',
    description: '세부 운세, 대인운, 현재운세를 나눠 읽는 프로필',
    themeType: InterpretationType.FORTUNE,
    sections: [
      section('사주운세', ['S113', 'S070', 'S071', 'S072', 'S073', 'S074']),
      section('대인운', ['S028', 'S078', 'S031', 'S009', 'S040']),
      section('현재운세', ['S014']),
    ],
  },
  ten_year_fortune_cycle: {
    id: 'ten_year_fortune_cycle',
    legacyFortuneType: 'saju_6',
    titleKo: '십년대운풀이',
    description: '십년 주기의 운세 흐름과 대길흉 시기를 보는 프로필',
    themeType: InterpretationType.YEARLY,
    sections: [
      section('대길흉이 오는시기', []),
      section('대운세 운풀이', []),
    ],
  },
  past_life_fortune: {
    id: 'past_life_fortune',
    legacyFortuneType: 'saju_7',
    titleKo: '전생운',
    description: '전생 해석과 현재운세를 함께 보는 프로필',
    themeType: InterpretationType.FORTUNE,
    sections: [
      section('전생운', ['S129']),
      section('현재운세', ['S014']),
    ],
  },
  health_fortune: {
    id: 'health_fortune',
    legacyFortuneType: 'saju_8',
    titleKo: '질병운',
    description: '건강과 대인운을 함께 보는 프로필',
    themeType: InterpretationType.HEALTH,
    sections: [
      section('질병운', ['T056', 'T057', 'T058']),
      section('대인운', ['S028', 'J037', 'J005', 'S009', 'S040']),
    ],
  },
  five_elements_balance: {
    id: 'five_elements_balance',
    legacyFortuneType: 'saju_9',
    titleKo: '나의 오행기운세',
    description: '오행 흐름을 중심으로 세부 운세를 읽는 프로필',
    themeType: InterpretationType.FORTUNE,
    sections: [
      section('나의 오행기운세', ['S128', 'S077', 'S078', 'S079', 'S080', 'S081', 'S082', 'S083', 'S084', 'S085']),
    ],
  },
  daily_fortune: {
    id: 'daily_fortune',
    legacyFortuneType: 'saju_10',
    titleKo: '자평명리학 오늘의 운세',
    description: '오늘 하루의 흐름을 여섯 개 항목으로 읽는 프로필',
    themeType: InterpretationType.DAILY,
    sections: [
      section('자평명리학 오늘의 운세', ['S087', 'S088', 'S089', 'S090', 'S091', 'S092']),
    ],
  },
  dangsaju_lifetime_overview: {
    id: 'dangsaju_lifetime_overview',
    legacyFortuneType: 'saju_11',
    titleKo: '당사주 평생총운',
    description: '당사주 기반 평생총운과 보완 운세를 함께 읽는 프로필',
    themeType: InterpretationType.FORTUNE,
    sections: [
      section('당사주 평생총운', ['S128', 'S129', 'S130', 'S131', 'S132', 'S133', 'S134', 'S135']),
      section('사주뛰어넘기', ['S059', 'S070', 'S040', 'T026', 'T039']),
    ],
  },
  psychology_profile: {
    id: 'psychology_profile',
    legacyFortuneType: 'saju_12',
    titleKo: '사주로 보는 심리분석',
    description: '심리분석과 행운 요소를 함께 보는 프로필',
    themeType: InterpretationType.PERSONALITY,
    sections: [
      section('사주로 보는 심리분석', ['T060']),
      section('행운', ['T028', 'S009', 'J009', 'S010', 'T039']),
    ],
  },
  misfortune_relief: {
    id: 'misfortune_relief',
    legacyFortuneType: 'saju_13',
    titleKo: '살풀이',
    description: '액운과 길흉을 함께 보는 프로필',
    themeType: InterpretationType.FORTUNE,
    sections: [
      section('살풀이', ['S126', 'S007']),
    ],
  },
  personality_profile: {
    id: 'personality_profile',
    legacyFortuneType: 'saju_14',
    titleKo: '성격운세',
    description: '타고난 성격과 보완 운세를 읽는 프로필',
    themeType: InterpretationType.PERSONALITY,
    sections: [
      section('성격운세', ['S023']),
      section('사주뛰어넘기', ['S059', 'S070', 'S040', 'T026', 'T039']),
    ],
  },
  early_life_fortune: {
    id: 'early_life_fortune',
    legacyFortuneType: 'saju_15',
    titleKo: '초년운',
    description: '초년기 운세와 성격, 학업, 취업 흐름을 읽는 프로필',
    themeType: InterpretationType.YEARLY,
    sections: [
      section('초년운', ['S018']),
      section('성격운', ['S048', 'S023', 'S029', 'S030', 'S031']),
      section('학업운', ['S119', 'S145', 'S146', 'J010', 'J044']),
      section('취업운', ['J023', 'S050', 'S078', 'S026']),
    ],
  },
  midlife_fortune: {
    id: 'midlife_fortune',
    legacyFortuneType: 'saju_16',
    titleKo: '중년운',
    description: '중년기의 흐름과 대인운, 재물처방을 함께 읽는 프로필',
    themeType: InterpretationType.YEARLY,
    sections: [
      section('중년운', ['S019', 'S051', 'S083', 'J004']),
      section('대인운', ['S028', 'J037', 'J005', 'S009', 'S040']),
      section('재물처방', ['S082', 'S116', 'S117', 'S118', 'S042']),
    ],
  },
  later_life_fortune: {
    id: 'later_life_fortune',
    legacyFortuneType: 'saju_17',
    titleKo: '말년운',
    description: '말년기의 핵심 흐름과 건강운, 길흉을 함께 읽는 프로필',
    themeType: InterpretationType.YEARLY,
    sections: [
      section('말년운', ['S020']),
      section('건강운', ['S051', 'S083', 'J004', 'S021']),
      section('길흉', ['S007', 'S008', 'S009', 'S010', 'F011', 'T039']),
    ],
  },
  career_fortune: {
    id: 'career_fortune',
    legacyFortuneType: 'saju_18',
    titleKo: '직업운',
    description: '직업 방향과 성격 기반 역량을 함께 읽는 프로필',
    themeType: InterpretationType.CAREER,
    sections: [
      section('직업운', ['S015']),
      section('성격운', ['S048', 'S023', 'S029', 'S030', 'S031']),
    ],
  },
  wealth_fortune: {
    id: 'wealth_fortune',
    legacyFortuneType: 'saju_19',
    titleKo: '재물운',
    description: '재물운과 재물처방을 함께 읽는 프로필',
    themeType: InterpretationType.WEALTH,
    sections: [
      section('재물운', ['S027']),
      section('재물처방', ['S082', 'S116', 'S117', 'S118', 'S042']),
    ],
  },
  innate_temperament: {
    id: 'innate_temperament',
    legacyFortuneType: 'saju_20',
    titleKo: '선천적기질운',
    description: '선천적 기질과 성격 기반 역량을 읽는 프로필',
    themeType: InterpretationType.PERSONALITY,
    sections: [
      section('선천적기질운', ['S085']),
      section('성격운', ['S048', 'S023', 'S029', 'S030', 'S031']),
    ],
  },
  birth_season_fortune: {
    id: 'birth_season_fortune',
    legacyFortuneType: 'saju_21',
    titleKo: '태어난계절에따른운',
    description: '출생 계절에 따른 기질과 보완 해석을 읽는 프로필',
    themeType: InterpretationType.FORTUNE,
    sections: [
      section('태어난계절에따른운', ['S113', 'T013', 'T022', 'S058', 'S116', 'S117', 'S118']),
    ],
  },
};

export function getFortuneProfile(profileId: string): FortuneProfileDefinition {
  if (profileId === BASIC_FORTUNE_PROFILE.id) {
    return BASIC_FORTUNE_PROFILE;
  }

  const profile = FORTUNE_PROFILES[profileId];
  if (!profile) {
    throw new Error(`Unknown profile_id: ${profileId}`);
  }

  return profile;
}

export function getFortuneProfileByFortuneType(fortuneType: string): FortuneProfileDefinition {
  const normalized = fortuneType.trim().toLowerCase();
  if (normalized === BASIC_FORTUNE_PROFILE.legacyFortuneType) {
    return BASIC_FORTUNE_PROFILE;
  }

  const profile = Object.values(FORTUNE_PROFILES).find(
    (candidate) => candidate.legacyFortuneType === normalized
  );
  if (!profile) {
    throw new Error(`Unknown fortune type: ${fortuneType}`);
  }

  return profile;
}

export function isSupportedProfileId(profileId: string): boolean {
  return profileId === BASIC_FORTUNE_PROFILE.id || profileId in FORTUNE_PROFILES;
}

export function listFortuneProfiles(): Array<{
  id: string;
  title: string;
  description: string;
}> {
  return [BASIC_FORTUNE_PROFILE, ...Object.values(FORTUNE_PROFILES)].map((profile) => ({
    id: profile.id,
    title: profile.titleKo,
    description: profile.description,
  }));
}
