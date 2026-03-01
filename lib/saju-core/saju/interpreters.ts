/**
 * Saju Interpreters Module
 * 사주 해석 모듈 - 주제별 점술 및 사주 풀이 시스템 (리팩토링 버전)
 */

import { getElementFromStem } from './constants';
import {
  InterpretationType,
  type Element,
  type ElementInterpretation,
  type InterpretationTypeData,
  getInterpretationData,
  getElementData,
} from './interpretationData';

// InterpretationType 재export
export { InterpretationType };

/** 인생 단계 */
export enum LifeStage {
  CHILDHOOD = 'childhood', // 유년기 (0-15세)
  YOUTH = 'youth', // 청년기 (16-30세)
  MIDDLE_AGE = 'middle_age', // 중년기 (31-50세)
  MATURE = 'mature', // 장년기 (51-65세)
  ELDERLY = 'elderly', // 노년기 (66세 이상)
}

/** 해석 결과 */
export interface InterpretationResult {
  interpretation_type: InterpretationType;
  title: string; // 제목
  summary: string; // 요약
  detailed_analysis: string; // 상세 분석
  strengths: string[]; // 장점
  weaknesses: string[]; // 단점/주의점
  advice: string[]; // 조언
  lucky_elements: string[]; // 길한 요소
  unlucky_elements: string[]; // 흉한 요소
  score: number; // 점수 (0-100)
  grade: string; // 등급
}

/** 인생 단계별 분석 */
export interface LifeStageAnalysis {
  stage: LifeStage;
  age_range: string;
  characteristics: string[];
  key_events: string[];
  fortune_trend: string;
  advice: string[];
}

/** 주제별 해석 */
export interface ThemeInterpretation {
  theme: InterpretationType;
  main_result: InterpretationResult;
  life_stages: LifeStageAnalysis[];
  yearly_overview: Record<string, string>; // 연도별 개요
  recommendations: string[];
}

/** 사주 데이터의 기본 구조 */
export interface SajuData {
  four_pillars?: {
    년주?: { 천간?: string; 지지?: string };
    월주?: { 천간?: string; 지지?: string };
    일주?: { 천간?: string; 지지?: string };
    시주?: { 천간?: string; 지지?: string };
  };
  [key: string]: unknown;
}

/** 기둥 요소 */
interface PillarElements {
  year_stem: string;
  year_branch: string;
  month_stem: string;
  month_branch: string;
  day_stem: string;
  day_branch: string;
  hour_stem: string;
  hour_branch: string;
}

/**
 * 데이터 기반 통합 해석기
 */
export class DataDrivenInterpreter {
  private readonly interpretation_type: InterpretationType;
  private readonly config: InterpretationTypeData;

  constructor(interpretationType: InterpretationType) {
    this.interpretation_type = interpretationType;
    this.config = getInterpretationData(interpretationType);
  }

  /**
   * 사주 해석 수행
   */
  interpret(sajuData: SajuData): InterpretationResult {
    const elements = this.extractPillarElements(sajuData);
    const dayElement = getElementFromStem(elements.day_stem) as Element;

    const elementConfig = getElementData(this.interpretation_type, dayElement);
    const commonConfig = this.config.common ?? {};

    // 점수 계산
    const baseScore = this.config.base_score;
    let scoreBonus = elementConfig?.score_bonus ?? 0;
    if (this.interpretation_type === InterpretationType.DAILY) {
      scoreBonus = commonConfig.score_bonus ?? 5;
    }
    const score = baseScore + scoreBonus;

    // 요약 생성
    const summary = this.generateSummary(elementConfig, dayElement);

    // 상세 분석 생성
    const detailedAnalysis = this.generateDetailedAnalysis(elements, dayElement, elementConfig, summary);

    // 강점/약점/조언 등 가져오기 (element 우선, 없으면 common에서)
    const strengths = elementConfig?.strengths ?? commonConfig.strengths ?? [];
    const weaknesses = elementConfig?.weaknesses ?? commonConfig.weaknesses ?? [];
    let advice = elementConfig?.advice ?? commonConfig.advice ?? [];
    let luckyElements = this.formatLuckyElements(commonConfig.lucky_elements ?? [], dayElement);
    let unluckyElements = commonConfig.unlucky_elements ?? [];

    // PERSONALITY 타입의 경우 lucky_elements는 personality_traits
    if (this.interpretation_type === InterpretationType.PERSONALITY) {
      luckyElements = elementConfig?.personality_traits ?? luckyElements;
    }

    // HEALTH 타입의 경우 weaknesses는 vulnerable_areas
    if (this.interpretation_type === InterpretationType.HEALTH) {
      const vulnerableAreas = elementConfig?.vulnerable_areas;
      if (vulnerableAreas) {
        advice = [...advice];
      }
    }

    const grade = this.getGradeFromScore(score);

    // 타이틀 생성
    const title = this.generateTitle();

    return {
      interpretation_type: this.interpretation_type,
      title,
      summary,
      detailed_analysis: detailedAnalysis,
      strengths,
      weaknesses,
      advice,
      lucky_elements: luckyElements,
      unlucky_elements: unluckyElements,
      score,
      grade,
    };
  }

  /**
   * 사주에서 기본 요소 추출
   */
  private extractPillarElements(sajuData: SajuData): PillarElements {
    const pillars = sajuData.four_pillars ?? {};

    return {
      year_stem: pillars.년주?.천간?.[0] ?? '',
      year_branch: pillars.년주?.지지?.[0] ?? '',
      month_stem: pillars.월주?.천간?.[0] ?? '',
      month_branch: pillars.월주?.지지?.[0] ?? '',
      day_stem: pillars.일주?.천간?.[0] ?? '',
      day_branch: pillars.일주?.지지?.[0] ?? '',
      hour_stem: pillars.시주?.천간?.[0] ?? '',
      hour_branch: pillars.시주?.지지?.[0] ?? '',
    };
  }

  /**
   * 요약 생성
   */
  private generateSummary(elementConfig: ElementInterpretation | undefined, dayElement: Element | string): string {
    if (this.interpretation_type === InterpretationType.YEARLY) {
      const year = new Date().getFullYear();
      const baseSummary = elementConfig?.summary ?? '평온한 한 해';
      return `${year}년은 ${baseSummary}입니다.`;
    }

    if (this.interpretation_type === InterpretationType.MONTHLY) {
      return this.generateMonthlySummary(dayElement);
    }

    if (this.interpretation_type === InterpretationType.DAILY) {
      return this.generateDailySummary(dayElement);
    }

    return elementConfig?.summary ?? '';
  }

  /**
   * 월간 운세 요약 생성
   */
  private generateMonthlySummary(dayElement: Element | string): string {
    const currentMonth = new Date().getMonth() + 1;
    const seasonsConfig = this.config.seasons ?? {};

    for (const [_seasonName, seasonData] of Object.entries(seasonsConfig)) {
      if (seasonData.months.includes(currentMonth)) {
        if (dayElement === seasonData.strong_element) {
          return seasonData.strong_summary;
        }
        return seasonData.default_summary;
      }
    }

    return '평온한 한 달입니다.';
  }

  /**
   * 일간 운세 요약 생성
   */
  private generateDailySummary(_dayElement: Element | string): string {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekday = weekdays[new Date().getDay()] ?? 'Sunday';
    const weekdayThemes = this.config.weekday_themes ?? {};
    const theme = weekdayThemes[weekday] ?? '평온한 하루';
    return `오늘은 ${theme}의 날입니다.`;
  }

  /**
   * 타이틀 생성
   */
  private generateTitle(): string {
    if (this.interpretation_type === InterpretationType.YEARLY) {
      const year = new Date().getFullYear();
      return `${year}년 운세`;
    }

    if (this.interpretation_type === InterpretationType.MONTHLY) {
      const month = new Date().getMonth() + 1;
      return `${month}월 운세`;
    }

    return this.config.title;
  }

  /**
   * 상세 분석 텍스트 생성
   */
  private generateDetailedAnalysis(
    elements: PillarElements,
    dayElement: Element | string,
    elementConfig: ElementInterpretation | undefined,
    summary: string
  ): string {
    const template = this.config.detailed_template;

    // 템플릿 변수 매핑
    const formatVars: Record<string, string | number> = {
      element: dayElement,
      day_stem: elements.day_stem,
      day_branch: elements.day_branch,
      year_stem: elements.year_stem,
      year_branch: elements.year_branch,
      month_stem: elements.month_stem,
      month_branch: elements.month_branch,
      hour_stem: elements.hour_stem,
      hour_branch: elements.hour_branch,
      summary,
    };

    // 타입별 추가 변수
    if (this.interpretation_type === InterpretationType.CAREER) {
      const careers = elementConfig?.suitable_careers ?? [];
      formatVars.suitable_careers = careers.join(', ');
    }

    if (this.interpretation_type === InterpretationType.HEALTH) {
      const areas = elementConfig?.vulnerable_areas ?? [];
      formatVars.vulnerable_areas = areas.join(', ');
    }

    if (this.interpretation_type === InterpretationType.PERSONALITY) {
      const traits = elementConfig?.personality_traits ?? [];
      const strengths = elementConfig?.strengths ?? [];
      formatVars.personality_traits = traits.join(', ');
      formatVars.strengths = strengths.join(', ');
    }

    if (this.interpretation_type === InterpretationType.YEARLY) {
      formatVars.year = new Date().getFullYear();
    }

    if (this.interpretation_type === InterpretationType.MONTHLY) {
      const currentMonth = new Date().getMonth() + 1;
      formatVars.month = currentMonth;
      formatVars.season = this.getCurrentSeason(currentMonth);
    }

    if (this.interpretation_type === InterpretationType.DAILY) {
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekday = weekdays[new Date().getDay()] ?? 'Sunday';
      const weekdayThemes = this.config.weekday_themes ?? {};
      const elementsDataKey = dayElement as string;
      const elementsData = this.config.elements?.[elementsDataKey] as ElementInterpretation | undefined;

      formatVars.theme = weekdayThemes[weekday] ?? '평온한 하루';
      formatVars.element_fortune = elementsData?.fortune ?? '평온한 하루';
      formatVars.lucky_color = elementsData?.color ?? '파란색';
      formatVars.lucky_number = elementsData?.number ?? '7';
    }

    try {
      return this.formatTemplate(template, formatVars);
    } catch {
      return template;
    }
  }

  /**
   * 템플릿 문자열 포맷팅
   */
  private formatTemplate(template: string, vars: Record<string, string | number>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  /**
   * 현재 계절 반환
   */
  private getCurrentSeason(month: number): string {
    const seasonsConfig = this.config.seasons ?? {};
    for (const [seasonName, seasonData] of Object.entries(seasonsConfig)) {
      if (seasonData.months.includes(month)) {
        return seasonName;
      }
    }
    return '봄';
  }

  /**
   * 행운 요소 포맷팅 ({element} 치환)
   */
  private formatLuckyElements(luckyElements: string[], dayElement: Element | string): string[] {
    return luckyElements.map((elem) => elem.replace('{element}', dayElement));
  }

  /**
   * 점수에서 등급 산출
   */
  private getGradeFromScore(score: number): string {
    if (score >= 90) return '최상';
    if (score >= 80) return '상';
    if (score >= 70) return '중상';
    if (score >= 60) return '중';
    if (score >= 50) return '중하';
    return '하';
  }
}

/**
 * 주제별 해석 관리자
 */
export class ThemeInterpreterManager {
  private readonly interpreters: Map<InterpretationType, DataDrivenInterpreter>;

  constructor() {
    this.interpreters = new Map();
    // 모든 InterpretationType에 대해 인터프리터 생성
    for (const itype of Object.values(InterpretationType)) {
      this.interpreters.set(itype, new DataDrivenInterpreter(itype));
    }
  }

  /**
   * 지정된 유형의 해석 수행
   */
  getInterpretation(sajuData: SajuData, interpretationType: InterpretationType): InterpretationResult {
    const interpreter = this.interpreters.get(interpretationType);
    if (!interpreter) {
      throw new Error(`지원하지 않는 해석 유형: ${interpretationType}`);
    }

    return interpreter.interpret(sajuData);
  }

  /**
   * 종합 해석 수행
   */
  getComprehensiveInterpretation(sajuData: SajuData): Map<InterpretationType, InterpretationResult> {
    const results = new Map<InterpretationType, InterpretationResult>();

    for (const interpretationType of this.interpreters.keys()) {
      try {
        results.set(interpretationType, this.getInterpretation(sajuData, interpretationType));
      } catch (error) {
        console.error(`${interpretationType} 해석 실패:`, error);
      }
    }

    return results;
  }

  /**
   * 주제별 상세 해석
   */
  getThemeInterpretation(sajuData: SajuData, theme: InterpretationType): ThemeInterpretation {
    const mainResult = this.getInterpretation(sajuData, theme);

    // 인생 단계별 분석
    const lifeStages = this.analyzeLifeStages(sajuData, theme);

    // 연도별 개요 (향후 10년)
    const yearlyOverview = this.generateYearlyOverview(sajuData, theme);

    // 추천사항
    const recommendations = this.generateRecommendations(mainResult);

    return {
      theme,
      main_result: mainResult,
      life_stages: lifeStages,
      yearly_overview: yearlyOverview,
      recommendations,
    };
  }

  /**
   * 인생 단계별 분석
   */
  private analyzeLifeStages(_sajuData: SajuData, _theme: InterpretationType): LifeStageAnalysis[] {
    return [
      {
        stage: LifeStage.CHILDHOOD,
        age_range: '0-15세',
        characteristics: ['기초 형성기', '가족의 영향이 큰 시기'],
        key_events: ['교육의 시작', '기본 성격 형성'],
        fortune_trend: '안정',
        advice: ['기초를 탄탄히 하세요', '좋은 습관을 기르세요'],
      },
      {
        stage: LifeStage.YOUTH,
        age_range: '16-30세',
        characteristics: ['도전과 성장의 시기', '진로 결정의 시기'],
        key_events: ['학업 완성', '취업', '연애'],
        fortune_trend: '상승',
        advice: ['적극적으로 도전하세요', '다양한 경험을 쌓으세요'],
      },
      {
        stage: LifeStage.MIDDLE_AGE,
        age_range: '31-50세',
        characteristics: ['안정과 성취의 시기', '가족의 중심'],
        key_events: ['결혼', '출산', '승진'],
        fortune_trend: '안정',
        advice: ['균형잡힌 삶을 추구하세요', '가족을 소중히 하세요'],
      },
      {
        stage: LifeStage.MATURE,
        age_range: '51-65세',
        characteristics: ['지혜와 경험의 시기', '후배 양성'],
        key_events: ['전문성 완성', '사회적 기여'],
        fortune_trend: '안정',
        advice: ['경험을 나누세요', '여유를 즐기세요'],
      },
      {
        stage: LifeStage.ELDERLY,
        age_range: '66세 이상',
        characteristics: ['여유와 성찰의 시기', '건강 관리 중요'],
        key_events: ['은퇴', '손자녀', '건강 관리'],
        fortune_trend: '평온',
        advice: ['건강을 챙기세요', '가족과의 시간을 늘리세요'],
      },
    ];
  }

  /**
   * 연도별 개요 생성
   */
  private generateYearlyOverview(_sajuData: SajuData, theme: InterpretationType): Record<string, string> {
    const currentYear = new Date().getFullYear();
    const overview: Record<string, string> = {};

    for (let i = 0; i < 10; i++) {
      // 향후 10년
      const year = currentYear + i;
      let trend: string;
      if (i < 3) {
        trend = '상승기';
      } else if (i < 7) {
        trend = '안정기';
      } else {
        trend = '성찰기';
      }

      overview[String(year)] = `${year}년은 ${trend}로 ${theme} 분야에서 좋은 기회가 있을 것입니다.`;
    }

    return overview;
  }

  /**
   * 추천사항 생성
   */
  private generateRecommendations(result: InterpretationResult): string[] {
    const recommendations: string[] = [];

    // 조언을 바탕으로 구체적인 추천사항 생성
    if (result.advice.length > 0) {
      recommendations.push(...result.advice);
    }

    // 점수에 따른 추가 추천사항
    if (result.score >= 80) {
      recommendations.push('현재 좋은 운세이므로 적극적으로 행동하세요');
    } else if (result.score >= 60) {
      recommendations.push('꾸준한 노력으로 더 좋은 결과를 만들어가세요');
    } else {
      recommendations.push('인내심을 가지고 기다리는 시기입니다');
    }

    return recommendations;
  }
}

// SajuFortuneType과 InterpretationType 매핑
export const SAJU_TO_INTERPRETATION_MAPPING: Record<string, InterpretationType> = {
  saju_3: InterpretationType.FORTUNE, // 자평명리학 평생총운
  saju_4: InterpretationType.FORTUNE, // 인생풀이
  saju_5: InterpretationType.FORTUNE, // 사주운세
  saju_7: InterpretationType.FORTUNE, // 전생운
  saju_8: InterpretationType.HEALTH, // 질병운
  saju_10: InterpretationType.DAILY, // 자평명리학 오늘의 운세
  saju_11: InterpretationType.FORTUNE, // 당사주 평생총운
  saju_12: InterpretationType.PERSONALITY, // 사주로 보는 심리분석
  saju_14: InterpretationType.PERSONALITY, // 성격운세
  saju_15: InterpretationType.YEARLY, // 초년운
  saju_16: InterpretationType.YEARLY, // 중년운
  saju_17: InterpretationType.YEARLY, // 말년운
  saju_18: InterpretationType.CAREER, // 직업운
  saju_19: InterpretationType.WEALTH, // 재물운
  saju_20: InterpretationType.PERSONALITY, // 선천적기질운
  saju_1: InterpretationType.YEARLY, // 올해의토정비결
  saju_2: InterpretationType.YEARLY, // 새해신수
  saju_6: InterpretationType.YEARLY, // 십년대운풀이
  saju_9: InterpretationType.FORTUNE, // 나의 오행기운세
  saju_13: InterpretationType.FORTUNE, // 살풀이
  saju_21: InterpretationType.FORTUNE, // 태어난계절에따른운
};

/**
 * SajuFortuneType 문자열에서 InterpretationType 반환
 */
export function getInterpretationTypeFromSaju(sajuType: string): InterpretationType {
  return SAJU_TO_INTERPRETATION_MAPPING[sajuType] ?? InterpretationType.FORTUNE;
}

/**
 * 주제별 해석 관리자 생성 팩토리 함수
 */
export function createThemeInterpreterManager(): ThemeInterpreterManager {
  return new ThemeInterpreterManager();
}

// =============================================================================
// 하위 호환성을 위한 레거시 인터프리터 클래스들
// =============================================================================

/**
 * 기본 해석기 인터페이스 (하위 호환성)
 */
export abstract class BaseInterpreter {
  abstract interpret(sajuData: SajuData): InterpretationResult;

  extractPillarElements(sajuData: SajuData): PillarElements {
    const pillars = sajuData.four_pillars ?? {};
    return {
      year_stem: pillars.년주?.천간?.[0] ?? '',
      year_branch: pillars.년주?.지지?.[0] ?? '',
      month_stem: pillars.월주?.천간?.[0] ?? '',
      month_branch: pillars.월주?.지지?.[0] ?? '',
      day_stem: pillars.일주?.천간?.[0] ?? '',
      day_branch: pillars.일주?.지지?.[0] ?? '',
      hour_stem: pillars.시주?.천간?.[0] ?? '',
      hour_branch: pillars.시주?.지지?.[0] ?? '',
    };
  }

  getElementFromStem(stem: string): string {
    return getElementFromStem(stem);
  }

  getGradeFromScore(score: number): string {
    if (score >= 90) return '최상';
    if (score >= 80) return '상';
    if (score >= 70) return '중상';
    if (score >= 60) return '중';
    if (score >= 50) return '중하';
    return '하';
  }
}

/**
 * 하위 호환성을 위한 레거시 인터프리터 클래스 팩토리
 */
function createLegacyInterpreterClass(interpretationType: InterpretationType) {
  return class LegacyInterpreter extends BaseInterpreter {
    readonly _interpreter: DataDrivenInterpreter;

    constructor() {
      super();
      this._interpreter = new DataDrivenInterpreter(interpretationType);
    }

    interpret(sajuData: SajuData): InterpretationResult {
      return this._interpreter.interpret(sajuData);
    }
  };
}

// 하위 호환성을 위한 클래스 별칭들
export const FortuneInterpreter = createLegacyInterpreterClass(InterpretationType.FORTUNE);
export const WealthInterpreter = createLegacyInterpreterClass(InterpretationType.WEALTH);
export const CareerInterpreter = createLegacyInterpreterClass(InterpretationType.CAREER);
export const LoveInterpreter = createLegacyInterpreterClass(InterpretationType.LOVE);
export const MarriageInterpreter = createLegacyInterpreterClass(InterpretationType.MARRIAGE);
export const HealthInterpreter = createLegacyInterpreterClass(InterpretationType.HEALTH);
export const StudyInterpreter = createLegacyInterpreterClass(InterpretationType.STUDY);
export const ChildrenInterpreter = createLegacyInterpreterClass(InterpretationType.CHILDREN);
export const FamilyInterpreter = createLegacyInterpreterClass(InterpretationType.FAMILY);
export const PersonalityInterpreter = createLegacyInterpreterClass(InterpretationType.PERSONALITY);
export const YearlyInterpreter = createLegacyInterpreterClass(InterpretationType.YEARLY);
export const MonthlyInterpreter = createLegacyInterpreterClass(InterpretationType.MONTHLY);
export const DailyInterpreter = createLegacyInterpreterClass(InterpretationType.DAILY);
