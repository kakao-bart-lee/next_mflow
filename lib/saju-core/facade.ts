/**
 * Fortune Teller Calculator Service
 */

import type {
  FortuneRequest,
  FortuneResponse,
  SajuData,
  BasicInfo,
  Pillars,
  Pillar,
  FiveElements,
  JijangganStem,
} from './models/fortuneTeller';
import type {
  STablesData,
  PillarData,
  JijangganData,
  SinsalData,
  FortuneTypesResponse,
} from './models/dataTypes';
import { FourPillarsCalculator } from './saju/calculator';
import { getDataLoader, type SajuDataLoader } from './saju/dataLoader';
import { LifecycleStageCalculator } from './saju/lifecycleStage';
import { SipsinCalculator } from './saju/sipsin';
import { SinyakSingangAnalyzer } from './saju/sinyakSingang';
import { calculateComprehensiveSinsal } from './saju/twelveSinsal';
import { createJijangganCalculator } from './saju/jijanggan';
import { ExtendedFortuneInterpreter } from './saju/interpreter';
import {
  getSajuCombination,
  isValidCombination,
  getAvailableCombinations,
} from './saju/combinations';
import {
  getFortuneTypeFromString,
  getAllFortuneTypes,
} from './models/sajuFortuneTypes';
import {
  ThemeInterpreterManager,
  getInterpretationTypeFromSaju,
  type InterpretationType,
} from './saju/interpreters';
import { extractHanja, extractKorean } from './utils';
import { calculateHyungchung, type HyungchungResult } from './saju/hyungchung';

/**
 * Fortune Teller Service
 * 사주 계산 서비스 클래스
 */
export class FortuneTellerService {
  private readonly dataLoader: SajuDataLoader;
  private readonly sData: STablesData;
  private readonly fourPillarsCalculator: FourPillarsCalculator;
  private readonly lifecycleCalculator: LifecycleStageCalculator;
  private readonly sipsinCalculator: SipsinCalculator;
  private readonly sinyakSingangAnalyzer: SinyakSingangAnalyzer;
  private readonly jijangganCalculator: ReturnType<typeof createJijangganCalculator>;
  private readonly fortuneInterpreter: ExtendedFortuneInterpreter;
  private readonly themeInterpreterManager: ThemeInterpreterManager;

  /**
   * SajuDataLoader를 통해 데이터 로드 (기본: 싱글톤 인스턴스 사용)
   */
  constructor(dataLoader?: SajuDataLoader) {
    this.dataLoader = dataLoader ?? getDataLoader();
    this.sData = this.dataLoader.loadSTables() as STablesData;
    this.fourPillarsCalculator = new FourPillarsCalculator(this.dataLoader);
    this.lifecycleCalculator = new LifecycleStageCalculator();
    this.sipsinCalculator = new SipsinCalculator();
    this.sinyakSingangAnalyzer = new SinyakSingangAnalyzer();
    this.jijangganCalculator = createJijangganCalculator();
    this.fortuneInterpreter = new ExtendedFortuneInterpreter(this.sData);
    this.themeInterpreterManager = new ThemeInterpreterManager();
  }

  /**
   * 데이터베이스 조회 결과 반환
   * @param table - 테이블명 (예: 'S063')
   * @param dbExpress - 검색 키 (예: '갑01')
   */
  private getDbResult(table: string, dbExpress: string): readonly [string, string] {
    if (!(table in this.sData)) {
      return ['', ''];
    }

    const records = this.sData[table];
    if (!Array.isArray(records)) {
      return ['', ''];
    }

    for (const record of records) {
      if (record?.DB_express === dbExpress) {
        return [record.DB_data ?? '', record.DB_numerical ?? ''];
      }
    }

    return ['', ''];
  }

  /**
   * Calculate fortune based on birth information
   *
   * @param request - 기본 사주 계산 입력
   * @param currentAge - 대운 산정을 위한 현재 만나이 (선택). 제공되지 않으면 임시 기본값(35)를 사용합니다.
   */
  calculateSaju(request: FortuneRequest, currentAge?: number): FortuneResponse {
    // FortuneRequest의 birthDate와 birthTime은 string 타입
    const birthDateStr = request.birthDate;
    const birthTimeStr = request.birthTime;

    // Calculate four pillars using FourPillarsCalculator
    const fourPillarsResult = this.fourPillarsCalculator.calculateFourPillars(
      birthDateStr,
      birthTimeStr ?? undefined,
      request.gender
    );

    // Extract four pillars data
    const pillarsData = fourPillarsResult.four_pillars;

    // Extract천간 and 지지 from the formatted strings
    // Format is like "갑(甲)" so we need to extract the hanja part

    // Get day heavenly stem for lifecycle calculation
    const dayStemHanja = extractHanja(pillarsData.일주.천간);

    // Get earthly branches for all pillars
    const yearBranchHanja = extractHanja(pillarsData.년주.지지);
    const monthBranchHanja = extractHanja(pillarsData.월주.지지);
    const dayBranchHanja = extractHanja(pillarsData.일주.지지);
    const hourBranchHanja = extractHanja(pillarsData.시주.지지);

    // Calculate lifecycle stages (십이운성)
    const lifecycleStages = this.lifecycleCalculator.calculateAllLifecycleStages(
      dayStemHanja,
      yearBranchHanja,
      monthBranchHanja,
      dayBranchHanja,
      hourBranchHanja
    );

    // Calculate comprehensive sinsal (신살) for all pillars
    // Extract Korean characters (not hanja) for sinsal calculation
    const yearStemKorean = extractKorean(pillarsData.년주.천간);
    const monthStemKorean = extractKorean(pillarsData.월주.천간);
    const dayStemKorean = extractKorean(pillarsData.일주.천간);
    const hourStemKorean = extractKorean(pillarsData.시주.천간);
    const yearBranchKorean = extractKorean(pillarsData.년주.지지);
    const monthBranchKorean = extractKorean(pillarsData.월주.지지);
    const dayBranchKorean = extractKorean(pillarsData.일주.지지);
    const hourBranchKorean = extractKorean(pillarsData.시주.지지);
    const genderCode = request.gender === 'M' ? 'M' : 'F';

    const comprehensiveSinsal = calculateComprehensiveSinsal(
      yearStemKorean,
      monthStemKorean,
      dayStemKorean,
      hourStemKorean,
      yearBranchKorean,
      monthBranchKorean,
      dayBranchKorean,
      hourBranchKorean,
      genderCode
    );

    // Helper function to extract relevant sinsal for each pillar
    const getPillarSinsal = (pillarPosition: string, sinsalData: SinsalData): string[] => {
      const relevantSinsal: string[] = [];

      // Map pillar positions to their prefixes in sinsal data
      const positionMap: Record<string, string> = {
        년주: '년',
        월주: '월',
        일주: '일',
        시주: '시',
      };

      const positionPrefix = positionMap[pillarPosition] ?? '';

      // Extract 신살 (main sinsal) for this pillar
      const sinsalObj = sinsalData['신살'];
      if (sinsalObj && typeof sinsalObj === 'object') {
        for (const [sinsalName, sinsalValue] of Object.entries(sinsalObj)) {
          if (sinsalValue && sinsalName === `${positionPrefix}살`) {
            relevantSinsal.push(sinsalValue as string);
          }
        }
      }

      // Extract 길신 (beneficial spirits) for this pillar
      const gilsinObj = sinsalData['길신'];
      if (gilsinObj && typeof gilsinObj === 'object') {
        for (const [gilsinName, gilsinValue] of Object.entries(gilsinObj)) {
          if (gilsinValue && gilsinName.startsWith(positionPrefix)) {
            relevantSinsal.push(gilsinValue as string);
          }
        }
      }

      return relevantSinsal;
    };

    // Helper function to create jijanggan list from calculation result
    const createJijangganList = (pillarData: JijangganData): JijangganStem[] => {
      const jijangganList: JijangganStem[] = [];

      // Explicitly access each stem field
      const stems = [
        { stem: pillarData.stem1, sipsin: pillarData.stem1_sipsin },
        { stem: pillarData.stem2, sipsin: pillarData.stem2_sipsin },
        { stem: pillarData.stem3, sipsin: pillarData.stem3_sipsin },
      ];

      for (const { stem, sipsin } of stems) {
        if (stem && sipsin) {
          jijangganList.push({
            간: stem,
            십신: sipsin,
          });
        }
      }

      return jijangganList;
    };

    // Calculate jijanggan before creating pillars
    const dayStemHanjaForJijanggan = extractHanja(pillarsData.일주.천간);

    // Calculate jijanggan and sipsin
    const jijangganResult = this.jijangganCalculator.calculatePillarJijanggan(
      dayStemHanjaForJijanggan,
      yearBranchKorean,
      monthBranchKorean,
      dayBranchKorean,
      hourBranchKorean
    );

    // Helper function to create Pillar object
    const createPillar = (
      pillarData: PillarData,
      lifecycleStage: string | null,
      pillarPosition: string,
      jijangganList: JijangganStem[]
    ): Pillar => {
      const pillarSinsal = getPillarSinsal(pillarPosition, comprehensiveSinsal);
      return {
        천간: pillarData.천간,
        지지: pillarData.지지,
        오행: {
          천간: pillarData.십성_천간,
          지지: pillarData.십성_지지,
        },
        십이운성: lifecycleStage ?? '',
        신살: pillarSinsal,
        지장간: jijangganList,
      };
    };

    // Create Pillars object with jijanggan info
    const pillars: Pillars = {
      시: createPillar(
        pillarsData.시주,
        lifecycleStages.hour,
        '시주',
        createJijangganList(jijangganResult.hour)
      ),
      일: createPillar(
        pillarsData.일주,
        lifecycleStages.day,
        '일주',
        createJijangganList(jijangganResult.day)
      ),
      월: createPillar(
        pillarsData.월주,
        lifecycleStages.month,
        '월주',
        createJijangganList(jijangganResult.month)
      ),
      년: createPillar(
        pillarsData.년주,
        lifecycleStages.year,
        '년주',
        createJijangganList(jijangganResult.year)
      ),
    };

    // Create BasicInfo
    const basicInfo: BasicInfo = {
      name: '', // Name is not provided in request
      solarDate: birthDateStr,
      lunarDate: '', // Lunar date conversion would require additional calculation
      birthTime: birthTimeStr ?? '',
    };

    // Create SajuData
    const sajuData: SajuData = {
      basicInfo: basicInfo,
      pillars,
    };

    // Calculate sipsin (십신) analysis
    const sipsinAnalysis = this.sipsinCalculator.analyzeSipsin(
      dayStemKorean,
      yearStemKorean,
      monthStemKorean,
      hourStemKorean,
      yearBranchKorean,
      monthBranchKorean,
      dayBranchKorean,
      hourBranchKorean
    );

    // Convert sipsin analysis to dictionary for response
    const sipsinDict = {
      positions: {
        년간: sipsinAnalysis.positions.year_h,
        월간: sipsinAnalysis.positions.month_h,
        시간: sipsinAnalysis.positions.hour_h,
        년지: sipsinAnalysis.positions.year_e,
        월지: sipsinAnalysis.positions.month_e,
        일지: sipsinAnalysis.positions.day_e,
        시지: sipsinAnalysis.positions.hour_e,
      },
      counts: sipsinAnalysis.counts,
      dominant_sipsin: sipsinAnalysis.dominant_sipsin,
    };

    // Calculate sinyak_singang (신약신강) analysis
    const sinyakSingangAnalysis = this.sinyakSingangAnalyzer.analyzeSinyakSingang(
      yearStemKorean,
      yearBranchKorean,
      monthStemKorean,
      monthBranchKorean,
      dayStemKorean,
      dayBranchKorean,
      hourStemKorean,
      hourBranchKorean
    );

    // Convert sinyak_singang analysis to dictionary for response
    const sinyakSingangDict = {
      day_stem_element: sinyakSingangAnalysis.day_stem_element,
      supporting_power: sinyakSingangAnalysis.supporting_power,
      total_power: sinyakSingangAnalysis.total_power,
      strength_type: sinyakSingangAnalysis.strength_type,
      strength_score: sinyakSingangAnalysis.strength_score,
      element_powers: {
        목: sinyakSingangAnalysis.element_powers.wood_power,
        화: sinyakSingangAnalysis.element_powers.fire_power,
        토: sinyakSingangAnalysis.element_powers.earth_power,
        금: sinyakSingangAnalysis.element_powers.metal_power,
        수: sinyakSingangAnalysis.element_powers.water_power,
      },
    };

    // Calculate great fortune (대운십신) analysis
    const effectiveAge = currentAge ?? 35;
    const genderKorean = request.gender === 'M' ? '남' : '여';

    const greatFortuneAnalysis = this.sipsinCalculator.calculateGreatFortune(
      yearStemKorean,
      monthStemKorean,
      monthBranchKorean,
      dayStemKorean,
      effectiveAge,
      genderKorean
    );

    // Calculate hyungchung (형충파해) analysis
    const yearStemHanja = extractHanja(pillarsData.년주.천간);
    const monthStemHanja = extractHanja(pillarsData.월주.천간);
    const hourStemHanja = extractHanja(pillarsData.시주.천간);

    const hyungchungAnalysis = calculateHyungchung(
      yearStemHanja,
      monthStemHanja,
      dayStemHanja,
      hourStemHanja,
      yearBranchHanja,
      monthBranchHanja,
      dayBranchHanja,
      hourBranchHanja
    );

    // Convert great fortune analysis to dictionary for response
    const greatFortuneDict = {
      direction: greatFortuneAnalysis.direction,
      current_period: greatFortuneAnalysis.current_period
        ? {
            start_age: greatFortuneAnalysis.current_period.start_age,
            end_age: greatFortuneAnalysis.current_period.end_age,
            heavenly_stem: greatFortuneAnalysis.current_period.heavenly_stem,
            earthly_branch: greatFortuneAnalysis.current_period.earthly_branch,
            sipsin: greatFortuneAnalysis.current_period.sipsin,
            period_number: greatFortuneAnalysis.current_period.period_number,
          }
        : null,
      periods: greatFortuneAnalysis.periods.map((period) => ({
        start_age: period.start_age,
        end_age: period.end_age,
        heavenly_stem: period.heavenly_stem,
        earthly_branch: period.earthly_branch,
        sipsin: period.sipsin,
        period_number: period.period_number,
      })),
    };

    // Create and return FortuneResponse
    const result: FortuneResponse = {
      success: true,
      sajuData: sajuData,
      sipsin: sipsinDict,
      sinyakSingang: sinyakSingangDict,
      greatFortune: greatFortuneDict,
      hyungchung: hyungchungAnalysis,
      timestamp: new Date(),
      inputData: {
        birth_date: request.birthDate,
        birth_time: request.birthTime,
        gender: request.gender,
        timezone: request.timezone,
        current_age: effectiveAge,
      },
    };

    return result;
  }

  /**
   * Get fortune based on birth information
   */
  getSajuFortune(
    request: FortuneRequest,
    fortuneType: string,
    currentAge?: number
  ): FortuneResponse {
    const fr = this.calculateSaju(request, currentAge);

    try {
      // Enum 기반 fortune type 처리
      const parsedFortuneType = getFortuneTypeFromString(fortuneType);
      const combinationName = parsedFortuneType;

      // 새로운 해석기 시스템 사용
      const interpretationType = getInterpretationTypeFromSaju(combinationName);

      // 사주 데이터를 딕셔너리로 변환 (해석기가 사용할 수 있도록)
      const sajuDict = {
        four_pillars: {
          년주: {
            천간: fr.sajuData.pillars.년.천간,
            지지: fr.sajuData.pillars.년.지지,
          },
          월주: {
            천간: fr.sajuData.pillars.월.천간,
            지지: fr.sajuData.pillars.월.지지,
          },
          일주: {
            천간: fr.sajuData.pillars.일.천간,
            지지: fr.sajuData.pillars.일.지지,
          },
          시주: {
            천간: fr.sajuData.pillars.시.천간,
            지지: fr.sajuData.pillars.시.지지,
          },
        },
      };

      // 새로운 해석기로 해석 수행
      const interpretationResult = this.themeInterpreterManager.getInterpretation(
        sajuDict,
        interpretationType
      );

      // 해석 결과를 응답에 추가
      fr.inputData.theme_interpretation = {
        type: interpretationResult.interpretation_type,
        title: interpretationResult.title,
        summary: interpretationResult.summary,
        detailed_analysis: interpretationResult.detailed_analysis,
        strengths: interpretationResult.strengths,
        weaknesses: interpretationResult.weaknesses,
        advice: interpretationResult.advice,
        lucky_elements: interpretationResult.lucky_elements,
        unlucky_elements: interpretationResult.unlucky_elements,
        score: interpretationResult.score,
        grade: interpretationResult.grade,
      };

      // 기존 해석도 유지 (호환성을 위해)
      if (isValidCombination(combinationName)) {
        const tableList = getSajuCombination(combinationName);
        const interpretations = this.fortuneInterpreter.getComprehensiveInterpretations(
          request,
          fr,
          tableList
        );
        fr.inputData.fortune_interpretations = interpretations;
        fr.inputData.fortune_type = combinationName;
        fr.inputData.fortune_type_description = getAvailableCombinations()[combinationName] ?? '';
      } else {
        // 기본: 기본 해설만
        const interpretations = this.fortuneInterpreter.getCategoryInterpretations(
          request,
          fr,
          'basic'
        );
        fr.inputData.fortune_interpretations = interpretations;
        fr.inputData.fortune_type = 'basic';
      }
    } catch (error) {
      // 무효한 타입의 경우 기본 해설로 폴백
      console.warn('Fortune type interpretation failed, falling back to basic:', error);
      const interpretations = this.fortuneInterpreter.getCategoryInterpretations(request, fr, 'basic');
      fr.inputData.fortune_interpretations = interpretations;
      fr.inputData.fortune_type = 'basic';
    }

    return fr;
  }

  /**
   * 사용 가능한 운세 타입 반환
   */
  getAvailableFortuneTypes(): FortuneTypesResponse {
    return {
      fortune_types: getAllFortuneTypes(),
      combinations: getAvailableCombinations(),
      table_descriptions: this.fortuneInterpreter.getSupportedTables(),
    };
  }
}
