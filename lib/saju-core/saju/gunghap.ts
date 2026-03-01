/**
 * Gunghap (궁합) - Saju Compatibility Analysis Module
 * 사주 궁합 분석 모듈 - 남녀 두 사주의 조화와 길흉을 분석
 */

/** 궁합 분석 유형 */
export enum CompatibilityType {
  GENERAL = 'general', // 전체 궁합
  MARRIAGE = 'marriage', // 결혼 궁합
  LOVE = 'love', // 연애 궁합
  BUSINESS = 'business', // 사업 궁합
  FRIENDSHIP = 'friendship', // 우정 궁합
}

/** 궁합 점수 */
export interface CompatibilityScore {
  score: number; // 점수 (0-100)
  grade: string; // 등급 (상, 중상, 중, 중하, 하)
  description: string; // 설명
  strengths: string[]; // 장점
  weaknesses: string[]; // 단점
  advice: string[]; // 조언
}

/** 오행 궁합 */
export interface ElementalCompatibility {
  male_element: string; // 남성 오행
  female_element: string; // 여성 오행
  relationship: string; // 관계 (상생/상극/동오행)
  score: number; // 점수
  description: string; // 설명
}

/** 12지지 동물 궁합 */
export interface TwelveAnimalsCompatibility {
  male_animal: string; // 남성 띠
  female_animal: string; // 여성 띠
  relationship: string; // 관계 (삼합/육합/충/형/해)
  score: number; // 점수
  description: string; // 설명
}

/** 사주 데이터 인터페이스 */
export interface SajuData {
  four_pillars: {
    년주: { 천간: string; 지지: string };
    월주: { 천간: string; 지지: string };
    일주: { 천간: string; 지지: string };
    시주: { 천간: string; 지지: string };
  };
  [key: string]: unknown;
}

/** 궁합 분석 결과 */
export interface GunghapResult {
  // 기본 정보
  male_saju: SajuData;
  female_saju: SajuData;
  compatibility_type: CompatibilityType;

  // 전체 점수
  total_score: CompatibilityScore;

  // 세부 분석
  elemental_compatibility: ElementalCompatibility;
  animals_compatibility: TwelveAnimalsCompatibility;

  // 상세 분석 항목들
  personality_match: CompatibilityScore; // 성격 궁합
  fortune_match: CompatibilityScore; // 운세 궁합
  health_match: CompatibilityScore; // 건강 궁합
  wealth_match: CompatibilityScore; // 재물 궁합
  career_match: CompatibilityScore; // 직업 궁합

  // 종합 해석
  overall_interpretation: string;
  recommendations: string[];

  // 특별 분석 (결혼 궁합용) - 옵셔널 필드는 마지막에
  marriage_timing?: CompatibilityScore; // 결혼 시기
  children_luck?: CompatibilityScore; // 자녀 운
  in_laws_relationship?: CompatibilityScore; // 시댁/친정 관계
}

type RelationshipData = readonly [string, number, string];

/**
 * 궁합 분석기
 */
export class GunghapAnalyzer {
  private readonly elementalRelationships: ReadonlyMap<string, RelationshipData>;
  private readonly animalRelationships: ReadonlyMap<string, RelationshipData>;
  private readonly personalityWeights: Readonly<Record<string, number>>;

  constructor() {
    this.elementalRelationships = this.initializeElementalRelationships();
    this.animalRelationships = this.initializeAnimalRelationships();
    this.personalityWeights = {
      일간: 0.3, // 일간 궁합
      월지: 0.25, // 월지 궁합
      년지: 0.2, // 년지 궁합
      시지: 0.15, // 시지 궁합
      전체: 0.1, // 전체 밸런스
    };
  }

  private initializeElementalRelationships(): ReadonlyMap<string, RelationshipData> {
    const data: Array<[string, RelationshipData]> = [
      ['목-목', ['동오행', 70, '같은 오행으로 이해는 잘 하지만 경쟁 관계가 될 수 있습니다']],
      ['목-화', ['상생', 85, '목이 화를 돕는 좋은 관계입니다']],
      ['목-토', ['상극', 40, '목이 토를 극하여 갈등이 있을 수 있습니다']],
      ['목-금', ['상극', 35, '금이 목을 극하여 어려움이 있을 수 있습니다']],
      ['목-수', ['상생', 80, '수가 목을 돕는 조화로운 관계입니다']],

      ['화-목', ['상생', 80, '목이 화를 돕는 좋은 관계입니다']],
      ['화-화', ['동오행', 65, '같은 오행으로 열정적이지만 충돌할 수 있습니다']],
      ['화-토', ['상생', 85, '화가 토를 돕는 안정적인 관계입니다']],
      ['화-금', ['상극', 40, '화가 금을 극하여 갈등이 있을 수 있습니다']],
      ['화-수', ['상극', 30, '수가 화를 극하여 큰 어려움이 있을 수 있습니다']],

      ['토-목', ['상극', 45, '목이 토를 극하지만 적응 가능합니다']],
      ['토-화', ['상생', 80, '화가 토를 돕는 안정적인 관계입니다']],
      ['토-토', ['동오행', 75, '같은 오행으로 안정적이고 조화롭습니다']],
      ['토-금', ['상생', 85, '토가 금을 돕는 좋은 관계입니다']],
      ['토-수', ['상극', 40, '토가 수를 극하여 갈등이 있을 수 있습니다']],

      ['금-목', ['상극', 35, '금이 목을 극하여 어려움이 있을 수 있습니다']],
      ['금-화', ['상극', 35, '화가 금을 극하여 갈등이 있을 수 있습니다']],
      ['금-토', ['상생', 80, '토가 금을 돕는 좋은 관계입니다']],
      ['금-금', ['동오행', 70, '같은 오행으로 이해는 잘 하지만 딱딱할 수 있습니다']],
      ['금-수', ['상생', 85, '금이 수를 돕는 조화로운 관계입니다']],

      ['수-목', ['상생', 85, '수가 목을 돕는 조화로운 관계입니다']],
      ['수-화', ['상극', 30, '수가 화를 극하여 큰 어려움이 있을 수 있습니다']],
      ['수-토', ['상극', 45, '토가 수를 극하지만 적응 가능합니다']],
      ['수-금', ['상생', 80, '금이 수를 돕는 좋은 관계입니다']],
      ['수-수', ['동오행', 75, '같은 오행으로 깊이 있는 관계를 형성합니다']],
    ];
    return new Map(data);
  }

  private initializeAnimalRelationships(): ReadonlyMap<string, RelationshipData> {
    const data: Array<[string, RelationshipData]> = [
      // 삼합 관계 (매우 좋음 - 90점)
      ['자-신', ['삼합', 90, '쥐와 원숭이는 삼합으로 매우 좋은 궁합입니다']],
      ['자-진', ['삼합', 90, '쥐와 용은 삼합으로 매우 좋은 궁합입니다']],
      ['축-사', ['삼합', 90, '소와 뱀은 삼합으로 매우 좋은 궁합입니다']],
      ['축-유', ['삼합', 90, '소와 닭은 삼합으로 매우 좋은 궁합입니다']],
      ['인-오', ['삼합', 90, '호랑이와 말은 삼합으로 매우 좋은 궁합입니다']],
      ['인-술', ['삼합', 90, '호랑이와 개는 삼합으로 매우 좋은 궁합입니다']],
      ['묘-미', ['삼합', 90, '토끼와 양은 삼합으로 매우 좋은 궁합입니다']],
      ['묘-해', ['삼합', 90, '토끼와 돼지는 삼합으로 매우 좋은 궁합입니다']],

      // 육합 관계 (좋음 - 80점)
      ['자-축', ['육합', 80, '쥐와 소는 육합으로 좋은 궁합입니다']],
      ['인-해', ['육합', 80, '호랑이와 돼지는 육합으로 좋은 궁합입니다']],
      ['묘-술', ['육합', 80, '토끼와 개는 육합으로 좋은 궁합입니다']],
      ['진-유', ['육합', 80, '용과 닭은 육합으로 좋은 궁합입니다']],
      ['사-신', ['육합', 80, '뱀과 원숭이는 육합으로 좋은 궁합입니다']],
      ['오-미', ['육합', 80, '말과 양은 육합으로 좋은 궁합입니다']],

      // 충 관계 (나쁨 - 20점)
      ['자-오', ['충', 20, '쥐와 말은 충 관계로 갈등이 많을 수 있습니다']],
      ['축-미', ['충', 20, '소와 양은 충 관계로 갈등이 많을 수 있습니다']],
      ['인-신', ['충', 20, '호랑이와 원숭이는 충 관계로 갈등이 많을 수 있습니다']],
      ['묘-유', ['충', 20, '토끼와 닭은 충 관계로 갈등이 많을 수 있습니다']],
      ['진-술', ['충', 20, '용과 개는 충 관계로 갈등이 많을 수 있습니다']],
      ['사-해', ['충', 20, '뱀과 돼지는 충 관계로 갈등이 많을 수 있습니다']],

      // 형 관계 (좋지 않음 - 30점)
      ['자-묘', ['형', 30, '쥐와 토끼는 형 관계로 조심해야 합니다']],
      ['축-술', ['형', 30, '소와 개는 형 관계로 조심해야 합니다']],
      ['인-사', ['형', 30, '호랑이와 뱀은 형 관계로 조심해야 합니다']],
      ['진-진', ['형', 30, '용끼리는 형 관계로 조심해야 합니다']],
      ['오-묘', ['형', 30, '말과 토끼는 형 관계로 조심해야 합니다']],
      ['유-술', ['형', 30, '닭과 개는 형 관계로 조심해야 합니다']],
      ['해-해', ['형', 30, '돼지끼리는 형 관계로 조심해야 합니다']],

      // 해 관계 (약간 좋지 않음 - 40점)
      ['자-미', ['해', 40, '쥐와 양은 해 관계로 약간의 갈등이 있을 수 있습니다']],
      ['축-오', ['해', 40, '소와 말은 해 관계로 약간의 갈등이 있을 수 있습니다']],
      ['묘-진', ['해', 40, '토끼와 용은 해 관계로 약간의 갈등이 있을 수 있습니다']],
      ['신-해', ['해', 40, '원숭이와 돼지는 해 관계로 약간의 갈등이 있을 수 있습니다']],
      ['술-유', ['해', 40, '개와 닭은 해 관계로 약간의 갈등이 있을 수 있습니다']],
    ];
    return new Map(data);
  }

  /**
   * 두 사주의 궁합 분석
   */
  analyzeCompatibility(
    maleSaju: SajuData,
    femaleSaju: SajuData,
    compatibilityType: CompatibilityType = CompatibilityType.GENERAL
  ): GunghapResult {
    // 1. 오행 궁합 분석
    const elementalCompat = this.analyzeElementalCompatibility(maleSaju, femaleSaju);

    // 2. 12지지 동물 궁합 분석
    const animalsCompat = this.analyzeAnimalsCompatibility(maleSaju, femaleSaju);

    // 3. 성격 궁합 분석
    const personalityMatch = this.analyzePersonalityMatch(maleSaju, femaleSaju);

    // 4. 운세 궁합 분석
    const fortuneMatch = this.analyzeFortuneMatch(maleSaju, femaleSaju);

    // 5. 건강 궁합 분석
    const healthMatch = this.analyzeHealthMatch(maleSaju, femaleSaju);

    // 6. 재물 궁합 분석
    const wealthMatch = this.analyzeWealthMatch(maleSaju, femaleSaju);

    // 7. 직업 궁합 분석
    const careerMatch = this.analyzeCareerMatch(maleSaju, femaleSaju);

    // 8. 전체 점수 계산
    const totalScore = this.calculateTotalScore(
      elementalCompat,
      animalsCompat,
      personalityMatch,
      fortuneMatch,
      healthMatch,
      wealthMatch,
      careerMatch
    );

    // 9. 특별 분석 (결혼 궁합용)
    const result: GunghapResult = {
      male_saju: maleSaju,
      female_saju: femaleSaju,
      compatibility_type: compatibilityType,
      total_score: totalScore,
      elemental_compatibility: elementalCompat,
      animals_compatibility: animalsCompat,
      personality_match: personalityMatch,
      fortune_match: fortuneMatch,
      health_match: healthMatch,
      wealth_match: wealthMatch,
      career_match: careerMatch,
      overall_interpretation: '',
      recommendations: [],
    };

    if (compatibilityType === CompatibilityType.MARRIAGE) {
      result.marriage_timing = this.analyzeMarriageTiming(maleSaju, femaleSaju);
      result.children_luck = this.analyzeChildrenLuck(maleSaju, femaleSaju);
      result.in_laws_relationship = this.analyzeInLawsRelationship(maleSaju, femaleSaju);
    }

    // 10. 종합 해석 생성
    result.overall_interpretation = this.generateOverallInterpretation(
      totalScore,
      elementalCompat,
      animalsCompat,
      compatibilityType
    );

    // 11. 추천사항 생성
    result.recommendations = this.generateRecommendations(totalScore, elementalCompat, animalsCompat, compatibilityType);

    return result;
  }

  private analyzeElementalCompatibility(maleSaju: SajuData, femaleSaju: SajuData): ElementalCompatibility {
    const maleDayStem = maleSaju.four_pillars.일주.천간.charAt(0);
    const femaleDayStem = femaleSaju.four_pillars.일주.천간.charAt(0);

    const maleElement = this.getElementFromStem(maleDayStem);
    const femaleElement = this.getElementFromStem(femaleDayStem);

    const key = `${maleElement}-${femaleElement}`;
    const data = this.elementalRelationships.get(key) ?? (['보통', 60, '보통 관계입니다'] as const);
    const [relationship, score, description] = data;

    return {
      male_element: maleElement,
      female_element: femaleElement,
      relationship,
      score,
      description,
    };
  }

  private analyzeAnimalsCompatibility(maleSaju: SajuData, femaleSaju: SajuData): TwelveAnimalsCompatibility {
    const maleAnimal = maleSaju.four_pillars.년주.지지.charAt(0);
    const femaleAnimal = femaleSaju.four_pillars.년주.지지.charAt(0);

    const key = `${maleAnimal}-${femaleAnimal}`;
    const reverseKey = `${femaleAnimal}-${maleAnimal}`;

    const data =
      this.animalRelationships.get(key) ??
      this.animalRelationships.get(reverseKey) ??
      (['보통', 60, '보통 관계입니다'] as const);
    const [relationship, score, description] = data;

    return {
      male_animal: this.getAnimalName(maleAnimal),
      female_animal: this.getAnimalName(femaleAnimal),
      relationship,
      score,
      description,
    };
  }

  private analyzePersonalityMatch(maleSaju: SajuData, femaleSaju: SajuData): CompatibilityScore {
    const scores: Record<string, number> = {};

    // 일간 궁합
    const maleDayStem = maleSaju.four_pillars.일주.천간.charAt(0);
    const femaleDayStem = femaleSaju.four_pillars.일주.천간.charAt(0);
    scores.일간 = this.calculateStemCompatibility(maleDayStem, femaleDayStem);

    // 월지 궁합
    const maleMonthBranch = maleSaju.four_pillars.월주.지지.charAt(0);
    const femaleMonthBranch = femaleSaju.four_pillars.월주.지지.charAt(0);
    scores.월지 = this.calculateBranchCompatibility(maleMonthBranch, femaleMonthBranch);

    // 년지 궁합
    const maleYearBranch = maleSaju.four_pillars.년주.지지.charAt(0);
    const femaleYearBranch = femaleSaju.four_pillars.년주.지지.charAt(0);
    scores.년지 = this.calculateBranchCompatibility(maleYearBranch, femaleYearBranch);

    // 시지 궁합
    const maleHourBranch = maleSaju.four_pillars.시주.지지.charAt(0);
    const femaleHourBranch = femaleSaju.four_pillars.시주.지지.charAt(0);
    scores.시지 = this.calculateBranchCompatibility(maleHourBranch, femaleHourBranch);

    // 가중 평균 계산
    let weightedSum = 0;
    let weightsSum = 0;
    for (const key of Object.keys(scores)) {
      const score = scores[key] ?? 0;
      const weight = this.personalityWeights[key] ?? 0;
      weightedSum += score * weight;
      weightsSum += weight;
    }
    const totalScore = (weightedSum / weightsSum) * 100;

    const grade = this.getCompatibilityGrade(totalScore);

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const advice: string[] = [];

    if (totalScore >= 80) {
      strengths.push('성격적으로 매우 잘 맞습니다');
      advice.push('서로의 장점을 더욱 살려보세요');
    } else if (totalScore >= 60) {
      strengths.push('기본적인 성격 궁합이 좋습니다');
      advice.push('소통을 통해 더욱 발전시켜보세요');
    } else {
      weaknesses.push('성격 차이가 클 수 있습니다');
      advice.push('서로의 차이를 인정하고 이해하려 노력하세요');
    }

    return {
      score: totalScore,
      grade,
      description: `성격 궁합 점수: ${totalScore.toFixed(1)}점`,
      strengths,
      weaknesses,
      advice,
    };
  }

  private analyzeFortuneMatch(_maleSaju: SajuData, _femaleSaju: SajuData): CompatibilityScore {
    const score = 70.0;
    const grade = this.getCompatibilityGrade(score);

    return {
      score,
      grade,
      description: `운세 궁합 점수: ${score.toFixed(1)}점`,
      strengths: ['운세적으로 서로 도움이 됩니다'],
      weaknesses: [],
      advice: ['함께 좋은 운을 만들어가세요'],
    };
  }

  private analyzeHealthMatch(_maleSaju: SajuData, _femaleSaju: SajuData): CompatibilityScore {
    const score = 65.0;
    const grade = this.getCompatibilityGrade(score);

    return {
      score,
      grade,
      description: `건강 궁합 점수: ${score.toFixed(1)}점`,
      strengths: ['서로의 건강에 좋은 영향을 줍니다'],
      weaknesses: [],
      advice: ['함께 건강을 관리하세요'],
    };
  }

  private analyzeWealthMatch(_maleSaju: SajuData, _femaleSaju: SajuData): CompatibilityScore {
    const score = 68.0;
    const grade = this.getCompatibilityGrade(score);

    return {
      score,
      grade,
      description: `재물 궁합 점수: ${score.toFixed(1)}점`,
      strengths: ['함께 재물을 모을 수 있습니다'],
      weaknesses: [],
      advice: ['계획적인 재정 관리를 하세요'],
    };
  }

  private analyzeCareerMatch(_maleSaju: SajuData, _femaleSaju: SajuData): CompatibilityScore {
    const score = 66.0;
    const grade = this.getCompatibilityGrade(score);

    return {
      score,
      grade,
      description: `직업 궁합 점수: ${score.toFixed(1)}점`,
      strengths: ['서로의 사업과 직업에 도움이 됩니다'],
      weaknesses: [],
      advice: ['서로의 꿈을 응원해주세요'],
    };
  }

  private analyzeMarriageTiming(_maleSaju: SajuData, _femaleSaju: SajuData): CompatibilityScore {
    const score = 72.0;
    const grade = this.getCompatibilityGrade(score);

    return {
      score,
      grade,
      description: '결혼 시기가 적절합니다',
      strengths: ['좋은 결혼 시기입니다'],
      weaknesses: [],
      advice: ['서로 준비가 되었을 때 진행하세요'],
    };
  }

  private analyzeChildrenLuck(_maleSaju: SajuData, _femaleSaju: SajuData): CompatibilityScore {
    const score = 70.0;
    const grade = this.getCompatibilityGrade(score);

    return {
      score,
      grade,
      description: '자녀 운이 양호합니다',
      strengths: ['건강한 자녀를 둘 수 있습니다'],
      weaknesses: [],
      advice: ['사랑으로 자녀를 키우세요'],
    };
  }

  private analyzeInLawsRelationship(_maleSaju: SajuData, _femaleSaju: SajuData): CompatibilityScore {
    const score = 68.0;
    const grade = this.getCompatibilityGrade(score);

    return {
      score,
      grade,
      description: '시댁/친정 관계가 원만합니다',
      strengths: ['양가 어른들과 좋은 관계를 유지할 수 있습니다'],
      weaknesses: [],
      advice: ['서로의 가족을 존중하세요'],
    };
  }

  private calculateTotalScore(
    elementalCompat: ElementalCompatibility,
    animalsCompat: TwelveAnimalsCompatibility,
    personalityMatch: CompatibilityScore,
    fortuneMatch: CompatibilityScore,
    healthMatch: CompatibilityScore,
    wealthMatch: CompatibilityScore,
    careerMatch: CompatibilityScore
  ): CompatibilityScore {
    const weights = {
      elemental: 0.2,
      animals: 0.2,
      personality: 0.25,
      fortune: 0.15,
      health: 0.1,
      wealth: 0.05,
      career: 0.05,
    };

    const totalScore =
      elementalCompat.score * weights.elemental +
      animalsCompat.score * weights.animals +
      personalityMatch.score * weights.personality +
      fortuneMatch.score * weights.fortune +
      healthMatch.score * weights.health +
      wealthMatch.score * weights.wealth +
      careerMatch.score * weights.career;

    const grade = this.getCompatibilityGrade(totalScore);

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const advice: string[] = [];

    if (totalScore >= 85) {
      strengths.push('매우 이상적인 궁합입니다');
      advice.push('서로를 소중히 여기며 행복한 관계를 유지하세요');
    } else if (totalScore >= 75) {
      strengths.push('좋은 궁합입니다');
      advice.push('작은 차이점들을 이해하며 관계를 발전시키세요');
    } else if (totalScore >= 60) {
      strengths.push('보통 수준의 궁합입니다');
      advice.push('소통과 이해를 통해 더 좋은 관계를 만들어가세요');
    } else {
      weaknesses.push('궁합상 어려움이 있을 수 있습니다');
      advice.push('서로의 차이를 인정하고 노력이 필요합니다');
    }

    return {
      score: totalScore,
      grade,
      description: `전체 궁합 점수: ${totalScore.toFixed(1)}점`,
      strengths,
      weaknesses,
      advice,
    };
  }

  private generateOverallInterpretation(
    totalScore: CompatibilityScore,
    elementalCompat: ElementalCompatibility,
    animalsCompat: TwelveAnimalsCompatibility,
    compatibilityType: CompatibilityType
  ): string {
    let interpretation = `
${compatibilityType.charAt(0).toUpperCase() + compatibilityType.slice(1)} 궁합 분석 결과

전체 점수: ${totalScore.score.toFixed(1)}점 (${totalScore.grade})

오행 궁합: ${elementalCompat.male_element}(${elementalCompat.male_element}) + ${elementalCompat.female_element}(${elementalCompat.female_element}) = ${elementalCompat.relationship}
- ${elementalCompat.description}

띠 궁합: ${animalsCompat.male_animal} + ${animalsCompat.female_animal} = ${animalsCompat.relationship}
- ${animalsCompat.description}

${totalScore.description}
`;

    if (totalScore.strengths.length > 0) {
      interpretation += '\n장점:\n' + totalScore.strengths.map((s) => `- ${s}`).join('\n');
    }

    if (totalScore.weaknesses.length > 0) {
      interpretation += '\n주의점:\n' + totalScore.weaknesses.map((w) => `- ${w}`).join('\n');
    }

    return interpretation.trim();
  }

  private generateRecommendations(
    totalScore: CompatibilityScore,
    elementalCompat: ElementalCompatibility,
    animalsCompat: TwelveAnimalsCompatibility,
    compatibilityType: CompatibilityType
  ): string[] {
    const recommendations: string[] = [];

    // 일반적인 조언
    if (totalScore.advice.length > 0) {
      recommendations.push(...totalScore.advice);
    }

    // 오행별 특별 조언
    if (elementalCompat.relationship === '상극') {
      recommendations.push('오행이 상극이므로 서로 이해하려는 노력이 특히 중요합니다');
    } else if (elementalCompat.relationship === '상생') {
      recommendations.push('오행이 상생이므로 서로에게 힘이 되는 관계입니다');
    }

    // 동물별 특별 조언
    if (animalsCompat.relationship === '충') {
      recommendations.push('띠가 충 관계이므로 감정 조절에 신경 쓰세요');
    } else if (animalsCompat.relationship === '삼합' || animalsCompat.relationship === '육합') {
      recommendations.push('띠가 좋은 관계이므로 자연스럽게 좋은 관계를 유지할 수 있습니다');
    }

    // 궁합 유형별 조언
    if (compatibilityType === CompatibilityType.MARRIAGE) {
      recommendations.push('결혼 전 충분한 대화와 이해의 시간을 가지세요');
    } else if (compatibilityType === CompatibilityType.BUSINESS) {
      recommendations.push('비즈니스에서는 역할 분담을 명확히 하세요');
    }

    return recommendations;
  }

  private getElementFromStem(stem: string): string {
    const elementMap: Record<string, string> = {
      甲: '목',
      乙: '목',
      丙: '화',
      丁: '화',
      戊: '토',
      己: '토',
      庚: '금',
      辛: '금',
      壬: '수',
      癸: '수',
      갑: '목',
      을: '목',
      병: '화',
      정: '화',
      무: '토',
      기: '토',
      경: '금',
      신: '금',
      임: '수',
      계: '수',
    };
    return elementMap[stem] ?? '토';
  }

  private getAnimalName(branch: string): string {
    const animalMap: Record<string, string> = {
      자: '쥐',
      축: '소',
      인: '호랑이',
      묘: '토끼',
      진: '용',
      사: '뱀',
      오: '말',
      미: '양',
      신: '원숭이',
      유: '닭',
      술: '개',
      해: '돼지',
      子: '쥐',
      丑: '소',
      寅: '호랑이',
      卯: '토끼',
      辰: '용',
      巳: '뱀',
      午: '말',
      未: '양',
      申: '원숭이',
      酉: '닭',
      戌: '개',
      亥: '돼지',
    };
    return animalMap[branch] ?? branch;
  }

  private calculateStemCompatibility(stem1: string, stem2: string): number {
    if (stem1 === stem2) {
      return 0.7;
    }

    const element1 = this.getElementFromStem(stem1);
    const element2 = this.getElementFromStem(stem2);

    const key = `${element1}-${element2}`;
    const data = this.elementalRelationships.get(key);
    if (data) {
      return data[1] / 100.0;
    }

    return 0.6;
  }

  private calculateBranchCompatibility(branch1: string, branch2: string): number {
    const key = `${branch1}-${branch2}`;
    const reverseKey = `${branch2}-${branch1}`;

    const data = this.animalRelationships.get(key) ?? this.animalRelationships.get(reverseKey);
    if (data) {
      return data[1] / 100.0;
    }

    return 0.6;
  }

  private getCompatibilityGrade(score: number): string {
    if (score >= 90) return '최상';
    if (score >= 80) return '상';
    if (score >= 70) return '중상';
    if (score >= 60) return '중';
    if (score >= 50) return '중하';
    return '하';
  }
}

/**
 * 궁합 분석기 생성 팩토리 함수
 */
export function createGunghapAnalyzer(): GunghapAnalyzer {
  return new GunghapAnalyzer();
}
