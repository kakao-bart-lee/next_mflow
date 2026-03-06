export interface TableCatalogEntry {
  readonly code: string;
  readonly entryId: string;
  readonly title: string;
  readonly showScore: boolean;
}

const KNOWN_TABLE_CATALOG: Readonly<Record<string, TableCatalogEntry>> = {
  S063: { code: 'S063', entryId: 'overall_summary', title: '총평', showScore: true },
  S045: { code: 'S045', entryId: 'early_life_fortune', title: '초년운', showScore: true },
  S046: { code: 'S046', entryId: 'middle_life_fortune', title: '중년운', showScore: true },
  S047: { code: 'S047', entryId: 'late_life_fortune', title: '말년운', showScore: true },
  S048: { code: 'S048', entryId: 'innate_personality', title: '타고난 성격', showScore: false },
  S049: { code: 'S049', entryId: 'sociality', title: '사회성', showScore: false },
  S050: { code: 'S050', entryId: 'sense_of_purpose', title: '목표의식', showScore: false },
  S051: { code: 'S051', entryId: 'health_fortune', title: '건강운', showScore: true },
  S052: { code: 'S052', entryId: 'career_fortune', title: '직업운', showScore: false },
  S053: { code: 'S053', entryId: 'love_fortune', title: '연애운', showScore: true },
  S054: { code: 'S054', entryId: 'sexual_chemistry_fortune', title: '섹스운', showScore: true },
  S055: { code: 'S055', entryId: 'compatibility_fortune', title: '궁합', showScore: true },
  S056: { code: 'S056', entryId: 'marital_fortune', title: '부부궁', showScore: true },
  S057: { code: 'S057', entryId: 'money_fortune', title: '금전운', showScore: true },
  S058: { code: 'S058', entryId: 'family_fortune', title: '가정운', showScore: false },
  S059: { code: 'S059', entryId: 'children_fortune', title: '자식운', showScore: false },
  S060: { code: 'S060', entryId: 'study_fortune', title: '학업운', showScore: false },
  S061: { code: 'S061', entryId: 'soulmate_fortune', title: '천생연분', showScore: true },
  S007: { code: 'S007', entryId: 'current_auspiciousness', title: '현재의 길흉사', showScore: true },
  S008: { code: 'S008', entryId: 'future_fortune', title: '미래운세', showScore: false },
  S009: { code: 'S009', entryId: 'additional_fortune_one', title: '기타운세1', showScore: false },
  S010: { code: 'S010', entryId: 'additional_fortune_two', title: '기타운세2', showScore: false },
  F011: { code: 'F011', entryId: 'i_ching_hexagram', title: '주역괘', showScore: false },
  T039: { code: 'T039', entryId: 'best_lucky_number', title: '나에게 맞는 숫자운', showScore: false },
  S113: { code: 'S113', entryId: 'base_fortune', title: '기본운세', showScore: false },
  S070: { code: 'S070', entryId: 'seasonal_fortune', title: '계절운', showScore: false },
  S071: { code: 'S071', entryId: 'five_elements_fortune', title: '오행운', showScore: false },
  S072: { code: 'S072', entryId: 'yin_yang_fortune', title: '음양운', showScore: false },
  S073: { code: 'S073', entryId: 'ten_gods_primary', title: '십성운1', showScore: false },
  S074: { code: 'S074', entryId: 'ten_gods_secondary', title: '십성운2', showScore: false },
  S028: { code: 'S028', entryId: 'interpersonal_relationships', title: '인간관계', showScore: false },
  S078: { code: 'S078', entryId: 'social_fortune', title: '사교운', showScore: false },
  S031: { code: 'S031', entryId: 'cooperation_fortune', title: '협력운', showScore: false },
  S040: { code: 'S040', entryId: 'harmony_fortune', title: '화합운', showScore: false },
  S014: { code: 'S014', entryId: 'current_outlook', title: '현재운세', showScore: true },
  S087: { code: 'S087', entryId: 'daily_fortune_one', title: '오늘의 운세 1', showScore: true },
  S088: { code: 'S088', entryId: 'daily_fortune_two', title: '오늘의 운세 2', showScore: true },
  S089: { code: 'S089', entryId: 'daily_fortune_three', title: '오늘의 운세 3', showScore: true },
  S090: { code: 'S090', entryId: 'daily_fortune_four', title: '오늘의 운세 4', showScore: true },
  S091: { code: 'S091', entryId: 'daily_fortune_five', title: '오늘의 운세 5', showScore: true },
  S092: { code: 'S092', entryId: 'daily_fortune_six', title: '오늘의 운세 6', showScore: true },
  S129: { code: 'S129', entryId: 'past_life_story', title: '전생 해석', showScore: false },
  T060: { code: 'T060', entryId: 'psychology_analysis', title: '사주로 보는 심리분석', showScore: true },
  S126: { code: 'S126', entryId: 'misfortune_relief_guide', title: '살풀이', showScore: false },
  S023: { code: 'S023', entryId: 'personality_core', title: '성격 핵심', showScore: false },
  S015: { code: 'S015', entryId: 'career_path', title: '직업 방향', showScore: false },
  S018: { code: 'S018', entryId: 'early_life_main', title: '초년운', showScore: false },
  S019: { code: 'S019', entryId: 'midlife_main', title: '중년운', showScore: false },
  S020: { code: 'S020', entryId: 'later_life_main', title: '말년운', showScore: false },
  S021: { code: 'S021', entryId: 'longevity_fortune', title: '수명운', showScore: true },
};

const FAMILY_WORDS: Readonly<Record<string, string>> = {
  S: 'saju',
  T: 'numerology',
  F: 'hexagram',
  J: 'reference',
  G: 'compatibility',
  N: 'naming',
  Y: 'yukim',
};

export function getTableCatalogEntry(tableCode: string): TableCatalogEntry {
  const known = KNOWN_TABLE_CATALOG[tableCode];
  if (known) {
    return known;
  }

  const family = FAMILY_WORDS[tableCode.slice(0, 1)] ?? 'fortune';
  const digits = /(\d+)$/.exec(tableCode)?.[1] ?? 'item';
  return {
    code: tableCode,
    entryId: `analysis_${family}_${digits}`,
    title: `해석 항목 ${digits}`,
    showScore: false,
  };
}
