/**
 * Manse Advanced Features Module
 * 만세력 고급 기능 모듈 - 특수 날짜 계산, 절기 분석, 윤달 처리 등
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { SajuDataLoader, getDataLoader } from './dataLoader';

/** 절기 유형 */
export enum SolarTermType {
  MAJOR = 'major', // 중기 (큰 절기)
  MINOR = 'minor', // 절기 (작은 절기)
}

/** 절기 정보 */
export interface SolarTerm {
  name: string; // 절기명
  date: string; // 날짜 (YYYY-MM-DD)
  time: string; // 시간 (HH:MM)
  term_type: SolarTermType;
  season: string; // 계절
  description: string; // 설명
}

/** 윤달 정보 */
export interface LeapMonthInfo {
  year: number;
  month: number; // 윤달이 삽입되는 달
  is_leap_year: boolean;
  total_days: number; // 해당 년도 총 일수
  description: string;
}

/** 특수 날짜 정보 */
export interface SpecialDate {
  date: string; // 날짜
  name: string; // 명칭
  category: string; // 분류 (절기, 명절, 기념일 등)
  description: string; // 설명
  is_favorable: boolean; // 길일 여부
}

/** 만세력 분석 결과 */
export interface ManseAnalysis {
  target_date: string;
  solar_terms: SolarTerm[]; // 해당 연도 절기
  leap_month_info: LeapMonthInfo; // 윤달 정보
  special_dates: SpecialDate[]; // 특수 날짜들
  favorable_dates: string[]; // 길일
  unfavorable_dates: string[]; // 흉일
  recommendations: string[]; // 추천사항
}

/**
 * 만세력 고급 계산기
 */
export class ManseAdvancedCalculator {
  private readonly dataLoader: SajuDataLoader;
  private readonly mansedata: Record<string, unknown>;
  private readonly solarTermsData: Record<string, Record<string, unknown>>;
  private readonly leapMonthsData: Record<number, { leap_month: number; total_days: number }>;
  private readonly specialDatesData: Record<string, Array<{ pattern?: string; name: string; description: string }>>;

  constructor(dataLoader?: SajuDataLoader) {
    this.dataLoader = dataLoader ?? getDataLoader();
    this.mansedata = this.dataLoader.loadMansedata();

    // 절기 정보 초기화
    this.solarTermsData = this.loadSolarTermsData();

    // 윤달 정보 초기화
    this.leapMonthsData = this.initializeLeapMonthsData();

    // 특수 날짜 정보 초기화
    this.specialDatesData = this.initializeSpecialDatesData();
  }

  /**
   * 절기 데이터 로드
   */
  private loadSolarTermsData(): Record<string, Record<string, unknown>> {
    try {
      // Try multiple potential paths
      const potentialPaths = [
        join(process.cwd(), 'data', 'solar_term_entry.json'),
        join(process.cwd(), 'dist', 'data', 'solar_term_entry.json'),
        join(__dirname, '..', 'data', 'solar_term_entry.json'),
        join(__dirname, '..', '..', 'data', 'solar_term_entry.json'),
      ];

      for (const path of potentialPaths) {
        if (existsSync(path)) {
          const data = JSON.parse(readFileSync(path, 'utf-8'));
          // 데이터 구조 검증 - 년도 키가 있는지 확인
          if (Object.keys(data).some((key) => /^\d{4}$/.test(key))) {
            return data as Record<string, Record<string, unknown>>;
          }
        }
      }
    } catch (error) {
      console.warn('절기 데이터 로드 실패, 기본 데이터 사용:', error);
    }

    // 기본 절기 데이터
    return this.createDefaultSolarTerms();
  }

  /**
   * 기본 절기 데이터 생성
   */
  private createDefaultSolarTerms(): Record<string, Record<string, unknown>> {
    return {
      '2024': {
        입춘: { date: '2024-02-04', time: '16:27', type: 'minor' },
        우수: { date: '2024-02-19', time: '12:13', type: 'major' },
        경칩: { date: '2024-03-05', time: '10:23', type: 'minor' },
        춘분: { date: '2024-03-20', time: '09:06', type: 'major' },
        청명: { date: '2024-04-04', time: '15:02', type: 'minor' },
        곡우: { date: '2024-04-19', time: '21:59', type: 'major' },
        입하: { date: '2024-05-05', time: '08:10', type: 'minor' },
        소만: { date: '2024-05-20', time: '20:59', type: 'major' },
        망종: { date: '2024-06-05', time: '12:10', type: 'minor' },
        하지: { date: '2024-06-21', time: '04:51', type: 'major' },
        소서: { date: '2024-07-06', time: '22:20', type: 'minor' },
        대서: { date: '2024-07-22', time: '15:44', type: 'major' },
        입추: { date: '2024-08-07', time: '08:09', type: 'minor' },
        처서: { date: '2024-08-22', time: '23:55', type: 'major' },
        백로: { date: '2024-09-07', time: '14:11', type: 'minor' },
        추분: { date: '2024-09-22', time: '20:44', type: 'major' },
        한로: { date: '2024-10-08', time: '02:00', type: 'minor' },
        상강: { date: '2024-10-23', time: '06:15', type: 'major' },
        입동: { date: '2024-11-07', time: '12:20', type: 'minor' },
        소설: { date: '2024-11-22', time: '09:56', type: 'major' },
        대설: { date: '2024-12-07', time: '05:57', type: 'minor' },
        동지: { date: '2024-12-21', time: '21:21', type: 'major' },
      },
    };
  }

  /**
   * 윤달 데이터 초기화
   */
  private initializeLeapMonthsData(): Record<number, { leap_month: number; total_days: number }> {
    return {
      2017: { leap_month: 5, total_days: 384 },
      2020: { leap_month: 4, total_days: 384 },
      2023: { leap_month: 2, total_days: 384 },
      2025: { leap_month: 6, total_days: 384 },
      2028: { leap_month: 5, total_days: 384 },
      2031: { leap_month: 3, total_days: 384 },
      2033: { leap_month: 11, total_days: 384 },
      2036: { leap_month: 6, total_days: 384 },
      2039: { leap_month: 5, total_days: 384 },
      2042: { leap_month: 2, total_days: 384 },
    };
  }

  /**
   * 특수 날짜 데이터 초기화
   */
  private initializeSpecialDatesData(): Record<
    string,
    Array<{ pattern?: string; name: string; description: string }>
  > {
    return {
      길일: [
        { pattern: '甲子', name: '갑자일', description: '시작하기 좋은 날' },
        { pattern: '乙丑', name: '을축일', description: '재물과 관련하여 좋은 날' },
        { pattern: '丙寅', name: '병인일', description: '활동하기 좋은 날' },
        { pattern: '丁卯', name: '정묘일', description: '화합과 소통에 좋은 날' },
        { pattern: '戊辰', name: '무진일', description: '안정과 발전에 좋은 날' },
      ],
      흉일: [
        { pattern: '庚申', name: '경신일', description: '변화를 피하는 것이 좋은 날' },
        { pattern: '辛酉', name: '신유일', description: '신중함이 필요한 날' },
        { pattern: '壬戌', name: '임술일', description: '갈등을 피하는 것이 좋은 날' },
        { pattern: '癸亥', name: '계해일', description: '마무리와 정리에 좋은 날' },
      ],
      절기: [
        { name: '입춘', description: '봄의 시작, 새로운 계획을 세우기 좋은 때' },
        { name: '춘분', description: '낮과 밤의 길이가 같아지는 날' },
        { name: '입하', description: '여름의 시작, 활동적인 계획 실행' },
        { name: '하지', description: '일년 중 낮이 가장 긴 날' },
        { name: '입추', description: '가을의 시작, 수확과 정리의 시기' },
        { name: '추분', description: '낮과 밤의 길이가 같아지는 날' },
        { name: '입동', description: '겨울의 시작, 휴식과 준비의 시기' },
        { name: '동지', description: '일년 중 낮이 가장 짧은 날, 새로운 시작' },
      ],
    };
  }

  /**
   * 특정 년도의 만세력 분석
   *
   * @param year - 분석할 년도
   * @returns 만세력 분석 결과
   */
  analyzeYear(year: number): ManseAnalysis {
    const targetDate = `${year}-01-01`;

    // 1. 절기 분석
    const solarTerms = this.getSolarTermsForYear(year);

    // 2. 윤달 정보
    const leapMonthInfo = this.getLeapMonthInfo(year);

    // 3. 특수 날짜 분석
    const specialDates = this.analyzeSpecialDatesForYear(year);

    // 4. 길일/흉일 분석
    const [favorableDates, unfavorableDates] = this.analyzeFavorableDates(year);

    // 5. 추천사항 생성
    const recommendations = this.generateYearRecommendations(year, solarTerms, leapMonthInfo, specialDates);

    return {
      target_date: targetDate,
      solar_terms: solarTerms,
      leap_month_info: leapMonthInfo,
      special_dates: specialDates,
      favorable_dates: favorableDates,
      unfavorable_dates: unfavorableDates,
      recommendations,
    };
  }

  /**
   * 특정 기간의 길일 찾기
   *
   * @param startDate - 시작 날짜 (YYYY-MM-DD)
   * @param endDate - 종료 날짜 (YYYY-MM-DD)
   * @param purpose - 목적 (general, marriage, business, move 등)
   * @returns 길일 목록
   */
  findFavorableDates(startDate: string, endDate: string, purpose: string = 'general'): SpecialDate[] {
    const favorableDates: SpecialDate[] = [];

    const startDt = new Date(startDate);
    const endDt = new Date(endDate);

    let currentDate = new Date(startDt);
    while (currentDate <= endDt) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;

      if (dateStr in this.mansedata) {
        const dateInfo = this.mansedata[dateStr] as Record<string, unknown>;

        // 간지 조합 확인
        const dayStem = this.convertStemCode(String(dateInfo.day_h ?? 'A'));
        const dayBranch = this.convertBranchCode(dateInfo.day_e as string | number);
        const dayCombination = dayStem + dayBranch;

        // 길일 패턴 확인
        const goodDates = this.specialDatesData['길일'];
        if (goodDates) {
          for (const goodDate of goodDates) {
            if (goodDate.pattern && dayCombination === goodDate.pattern) {
              favorableDates.push({
                date: `${year}-${month}-${day}`,
                name: goodDate.name,
                category: '길일',
                description: goodDate.description,
                is_favorable: true,
              });
              break;
            }
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return favorableDates;
  }

  /**
   * 특정 날짜의 절기 영향 분석
   *
   * @param targetDate - 분석할 날짜 (YYYY-MM-DD)
   * @returns 절기 영향 분석 결과
   */
  calculateSolarTermInfluence(targetDate: string): {
    target_date: string;
    previous_term: SolarTerm | null;
    next_term: SolarTerm | null;
    position_ratio: number;
    season_influence: string;
    recommendations: string[];
  } {
    const targetDt = new Date(targetDate);
    const year = targetDt.getFullYear();

    const solarTerms = this.getSolarTermsForYear(year);

    // 가장 가까운 이전 절기와 다음 절기 찾기
    let previousTerm: SolarTerm | null = null;
    let nextTerm: SolarTerm | null = null;

    for (const term of solarTerms) {
      const termDt = new Date(term.date);

      if (termDt <= targetDt) {
        if (!previousTerm || termDt > new Date(previousTerm.date)) {
          previousTerm = term;
        }
      }

      if (termDt > targetDt) {
        if (!nextTerm || termDt < new Date(nextTerm.date)) {
          nextTerm = term;
        }
      }
    }

    // 절기간 위치 계산
    let positionRatio = 0.5;
    if (previousTerm && nextTerm) {
      const prevDt = new Date(previousTerm.date);
      const nextDt = new Date(nextTerm.date);
      const totalDays = Math.floor((nextDt.getTime() - prevDt.getTime()) / (1000 * 60 * 60 * 24));
      const passedDays = Math.floor((targetDt.getTime() - prevDt.getTime()) / (1000 * 60 * 60 * 24));
      positionRatio = totalDays > 0 ? passedDays / totalDays : 0.5;
    }

    return {
      target_date: targetDate,
      previous_term: previousTerm,
      next_term: nextTerm,
      position_ratio: positionRatio,
      season_influence: this.analyzeSeasonInfluence(previousTerm, positionRatio),
      recommendations: this.generateSolarTermRecommendations(previousTerm, nextTerm, positionRatio),
    };
  }

  /**
   * 특정 년도의 절기 목록 생성
   */
  private getSolarTermsForYear(year: number): SolarTerm[] {
    const solarTerms: SolarTerm[] = [];
    const yearStr = String(year);

    if (yearStr in this.solarTermsData) {
      const yearData = this.solarTermsData[yearStr];

      if (yearData) {
        for (const [termName, termInfo] of Object.entries(yearData)) {
          const info = termInfo as Record<string, unknown>;
          const termType = info.type === 'major' ? SolarTermType.MAJOR : SolarTermType.MINOR;
          const season = this.getSeasonFromTerm(termName);

          solarTerms.push({
            name: termName,
            date: String(info.date),
            time: String(info.time),
            term_type: termType,
            season,
            description: this.getTermDescription(termName),
          });
        }
      }
    }

    return solarTerms.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 윤달 정보 조회
   */
  private getLeapMonthInfo(year: number): LeapMonthInfo {
    if (year in this.leapMonthsData) {
      const leapData = this.leapMonthsData[year];
      if (leapData) {
        return {
          year,
          month: leapData.leap_month,
          is_leap_year: true,
          total_days: leapData.total_days,
          description: `${year}년 ${leapData.leap_month}월 다음에 윤${leapData.leap_month}월이 있습니다.`,
        };
      }
    }

    return {
      year,
      month: 0,
      is_leap_year: false,
      total_days: 354, // 평년 기준
      description: `${year}년은 평년입니다.`,
    };
  }

  /**
   * 특정 년도의 특수 날짜 분석
   */
  private analyzeSpecialDatesForYear(year: number): SpecialDate[] {
    const specialDates: SpecialDate[] = [];

    // 절기 날짜들 추가
    const solarTerms = this.getSolarTermsForYear(year);
    for (const term of solarTerms) {
      specialDates.push({
        date: term.date,
        name: term.name,
        category: '절기',
        description: term.description,
        is_favorable: true,
      });
    }

    return specialDates;
  }

  /**
   * 길일/흉일 분석
   */
  private analyzeFavorableDates(year: number): [string[], string[]] {
    const favorableDates: string[] = [];
    const unfavorableDates: string[] = [];

    // 1년간 모든 날짜 확인
    const startDate = `${year}0101`;
    const endDate = `${year}1231`;

    for (const dateKey of Object.keys(this.mansedata)) {
      if (dateKey >= startDate && dateKey <= endDate) {
        const dateInfo = this.mansedata[dateKey] as Record<string, unknown>;

        // 간지 조합 확인
        const dayStem = this.convertStemCode(String(dateInfo.day_h ?? 'A'));
        const dayBranch = this.convertBranchCode(dateInfo.day_e as string | number);
        const dayCombination = dayStem + dayBranch;

        // 길일 확인
        const goodDates = this.specialDatesData['길일'];
        if (goodDates) {
          for (const goodDate of goodDates) {
            if (goodDate.pattern && dayCombination === goodDate.pattern) {
              const formattedDate = `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6, 8)}`;
              favorableDates.push(formattedDate);
              break;
            }
          }
        }

        // 흉일 확인
        const badDates = this.specialDatesData['흉일'];
        if (badDates) {
          for (const badDate of badDates) {
            if (badDate.pattern && dayCombination === badDate.pattern) {
              const formattedDate = `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6, 8)}`;
              unfavorableDates.push(formattedDate);
              break;
            }
          }
        }
      }
    }

    return [favorableDates, unfavorableDates];
  }

  /**
   * 천간 코드를 한자로 변환
   */
  private convertStemCode(code: string): string {
    const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const idx = code.charCodeAt(0) - 'A'.charCodeAt(0);
    const stem = stems[idx];
    return stem ?? '甲';
  }

  /**
   * 지지 코드를 한자로 변환
   */
  private convertBranchCode(code: string | number): string {
    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

    let idx: number;
    if (typeof code === 'string') {
      idx = parseInt(code, 10) - 1;
    } else {
      idx = code - 1;
    }

    const branch = branches[idx];
    return branch ?? '子';
  }

  /**
   * 절기명에서 계절 추출
   */
  private getSeasonFromTerm(termName: string): string {
    const springTerms = ['입춘', '우수', '경칩', '춘분', '청명', '곡우'];
    const summerTerms = ['입하', '소만', '망종', '하지', '소서', '대서'];
    const autumnTerms = ['입추', '처서', '백로', '추분', '한로', '상강'];
    const winterTerms = ['입동', '소설', '대설', '동지'];

    if (springTerms.includes(termName)) return '봄';
    if (summerTerms.includes(termName)) return '여름';
    if (autumnTerms.includes(termName)) return '가을';
    if (winterTerms.includes(termName)) return '겨울';
    return '계절미상';
  }

  /**
   * 절기 설명
   */
  private getTermDescription(termName: string): string {
    const descriptions: Record<string, string> = {
      입춘: '봄의 시작, 새로운 계획과 시작에 좋은 때',
      우수: '눈이 녹고 비가 내리기 시작하는 때',
      경칩: '겨울잠을 자던 동물들이 깨어나는 때',
      춘분: '낮과 밤의 길이가 같아지는 봄의 중심',
      청명: '하늘이 맑고 깨끗한 때',
      곡우: '농사철이 시작되는 때',
      입하: '여름의 시작, 활동적인 시기',
      소만: '만물이 생장하여 충실해지는 때',
      망종: '보리를 베고 벼를 심는 때',
      하지: '일년 중 낮이 가장 긴 날',
      소서: '더위가 시작되는 때',
      대서: '일년 중 가장 더운 때',
      입추: '가을의 시작, 수확의 계절',
      처서: '더위가 물러가는 때',
      백로: '이슬이 맺히기 시작하는 때',
      추분: '낮과 밤의 길이가 같아지는 가을의 중심',
      한로: '찬 이슬이 맺히는 때',
      상강: '서리가 내리기 시작하는 때',
      입동: '겨울의 시작, 휴식과 정리의 시기',
      소설: '눈이 내리기 시작하는 때',
      대설: '눈이 많이 내리는 때',
      동지: '일년 중 낮이 가장 짧은 날, 음극양생',
    };
    return descriptions[termName] ?? '절기';
  }

  /**
   * 계절 영향 분석
   */
  private analyzeSeasonInfluence(term: SolarTerm | null, position: number): string {
    if (!term) {
      return '계절 정보 없음';
    }

    if (position < 0.3) {
      return `${term.season} 초기의 영향`;
    } else if (position < 0.7) {
      return `${term.season} 중기의 영향`;
    } else {
      return `${term.season} 후기의 영향`;
    }
  }

  /**
   * 년도별 추천사항 생성
   */
  private generateYearRecommendations(
    year: number,
    solarTerms: SolarTerm[],
    leapMonthInfo: LeapMonthInfo,
    specialDates: SpecialDate[]
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`${year}년은 절기에 맞춘 계획을 세우는 것이 좋습니다`);

    if (leapMonthInfo.is_leap_year) {
      recommendations.push(`윤${leapMonthInfo.month}월이 있는 해이므로 장기 계획에 여유를 두세요`);
    }

    // 계절별 추천사항
    const springTerms = solarTerms.filter((t) => t.season === '봄');
    if (springTerms.length > 0) {
      recommendations.push('봄철에는 새로운 시작과 계획 수립에 집중하세요');
    }

    const summerTerms = solarTerms.filter((t) => t.season === '여름');
    if (summerTerms.length > 0) {
      recommendations.push('여름철에는 활발한 활동과 성장에 집중하세요');
    }

    const autumnTerms = solarTerms.filter((t) => t.season === '가을');
    if (autumnTerms.length > 0) {
      recommendations.push('가을철에는 수확과 정리에 집중하세요');
    }

    const winterTerms = solarTerms.filter((t) => t.season === '겨울');
    if (winterTerms.length > 0) {
      recommendations.push('겨울철에는 휴식과 내적 성장에 집중하세요');
    }

    return recommendations;
  }

  /**
   * 절기 기반 추천사항 생성
   */
  private generateSolarTermRecommendations(
    previousTerm: SolarTerm | null,
    nextTerm: SolarTerm | null,
    position: number
  ): string[] {
    const recommendations: string[] = [];

    if (previousTerm) {
      recommendations.push(`${previousTerm.name} 이후의 시기이므로 ${previousTerm.description}`);
    }

    if (nextTerm) {
      recommendations.push(`${nextTerm.name}을 준비하는 시기입니다`);
    }

    if (position < 0.5) {
      recommendations.push('절기 초반이므로 새로운 시작에 좋은 시기입니다');
    } else {
      recommendations.push('절기 후반이므로 마무리와 정리에 좋은 시기입니다');
    }

    return recommendations;
  }
}

/**
 * 만세력 고급 계산기 생성 팩토리 함수
 */
export function createManseAdvancedCalculator(dataLoader?: SajuDataLoader): ManseAdvancedCalculator {
  return new ManseAdvancedCalculator(dataLoader);
}
