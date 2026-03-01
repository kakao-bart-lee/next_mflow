/**
 * 십신(十神) 분석 모듈
 * Ten Spirits analysis for Saju fortune telling
 *
 * 십신은 일간을 기준으로 다른 간지들과의 관계를 10가지로 분류하는 체계입니다:
 * - 비견(비견): 동질성, 경쟁, 형제자매
 * - 겁재(겁재): 경쟁, 갈등, 손실
 * - 식신(식신): 표현, 재능, 자유로움
 * - 상관(상관): 비판, 표현, 반항
 * - 편재(편재): 유동적 재물, 투자
 * - 정재(정재): 안정적 재물, 저축
 * - 편관(편관): 권력, 압박, 도전
 * - 정관(정관): 명예, 질서, 책임
 * - 편인(편인): 특수한 학문, 직감
 * - 정인(정인): 학문, 명예, 어머니
 */

import { getSipsinForStem, getSipsinForBranch as getSipsinForBranchUtil } from './constants';

/** 십신 종류 */
export enum SipsinType {
  BIGYEON = '비견', // 비견
  GEOBJE = '겁재', // 겁재
  SIKSIN = '식신', // 식신
  SANGGWAN = '상관', // 상관
  PYEONJE = '편재', // 편재
  JEONGJE = '정재', // 정재
  PYEONGWAN = '편관', // 편관
  JEONGGWAN = '정관', // 정관
  PYEONIN = '편인', // 편인
  JEONGIN = '정인', // 정인
}

/** 대운 진행 방향 */
export enum ProgressDirection {
  FORWARD = '순', // 순행 (양남, 음녀)
  BACKWARD = '역', // 역행 (음남, 양녀)
}

/** 사주 각 위치의 십신 */
export interface SipsinPosition {
  year_h: string | null; // 년간 십신
  month_h: string | null; // 월간 십신
  hour_h: string | null; // 시간 십신
  year_e: string | null; // 년지 십신
  month_e: string | null; // 월지 십신
  day_e: string | null; // 일지 십신
  hour_e: string | null; // 시지 십신
}

/** 대운 기간 정보 */
export interface GreatFortunePeriod {
  start_age: number; // 시작 나이
  end_age: number; // 종료 나이
  heavenly_stem: string; // 천간
  earthly_branch: string; // 지지
  sipsin: string; // 십신
  period_number: number; // 대운 순서 (1-10)
}

/** 대운 분석 결과 */
export interface GreatFortuneAnalysis {
  direction: ProgressDirection; // 진행 방향
  current_period: GreatFortunePeriod | null; // 현재 대운
  periods: GreatFortunePeriod[]; // 전체 대운 목록
}

/** 십신 분석 결과 */
export interface SipsinAnalysis {
  positions: SipsinPosition;
  counts: Record<string, number>; // 각 십신별 개수
  dominant_sipsin: string; // 가장 많은 십신
}

/**
 * 십신 계산기 (대운십신 포함)
 */
export class SipsinCalculator {
  private heavenlyStems: Record<string, string> = {};
  private earthlyBranches: Record<string, string> = {};
  private stemToCode: Record<string, string> = {};
  private branchToCode: Record<string, string> = {};
  private sixtyCycle: string[] = [];
  private forwardPatterns: Record<string, [string, string]> = {};
  private backwardPatterns: Record<string, [string, string]> = {};
  private greatFortuneSipsinMapping: Record<string, Record<string, string>> = {};

  constructor() {
    this.initConversionTables();
    this.initSixtyCycle();
    this.initFortunePatterns();
    this.initGreatFortuneSipsinMapping();
  }

  /**
   * 천간/지지 변환 테이블 초기화
   */
  private initConversionTables(): void {
    // 알파벳 → 한자 변환
    this.heavenlyStems = {
      A: '갑',
      B: '을',
      C: '병',
      D: '정',
      E: '무',
      F: '기',
      G: '경',
      H: '신',
      I: '임',
      J: '계',
    };

    // 숫자 → 한자 변환
    this.earthlyBranches = {
      '01': '인',
      '02': '묘',
      '03': '진',
      '04': '사',
      '05': '오',
      '06': '미',
      '07': '신',
      '08': '유',
      '09': '술',
      '10': '해',
      '11': '자',
      '12': '축',
    };

    // 한자 → 알파벳/숫자 역변환
    this.stemToCode = Object.fromEntries(
      Object.entries(this.heavenlyStems).map(([k, v]) => [v, k])
    );
    this.branchToCode = Object.fromEntries(
      Object.entries(this.earthlyBranches).map(([k, v]) => [v, k])
    );
  }

  /**
   * 60갑자 순서 테이블 초기화
   */
  private initSixtyCycle(): void {
    this.sixtyCycle = [
      '갑자',
      '을축',
      '병인',
      '정묘',
      '무진',
      '기사',
      '경오',
      '신미',
      '임신',
      '계유',
      '갑술',
      '을해',
      '병자',
      '정축',
      '무인',
      '기묘',
      '경진',
      '신사',
      '임오',
      '계미',
      '갑신',
      '을유',
      '병술',
      '정해',
      '무자',
      '기축',
      '경인',
      '신묘',
      '임진',
      '계사',
      '갑오',
      '을미',
      '병신',
      '정유',
      '무술',
      '기해',
      '경자',
      '신축',
      '임인',
      '계묘',
      '갑진',
      '을사',
      '병오',
      '정미',
      '무신',
      '기유',
      '경술',
      '신해',
      '임자',
      '계축',
      '갑인',
      '을묘',
      '병진',
      '정사',
      '무오',
      '기미',
      '경신',
      '신유',
      '임술',
      '계해',
    ];
  }

  /**
   * 대운 진행 패턴 테이블 초기화
   */
  private initFortunePatterns(): void {
    // 순행 패턴 (각 월주별 10년간의 천간/지지 진행)
    this.forwardPatterns = {
      갑자: ['BCDEFGHIJA', '12|01|02|03|04|05|06|07|08|09'],
      을축: ['CDEFGHIJAB', '01|02|03|04|05|06|07|08|09|10'],
      병인: ['DEFGHIJABC', '02|03|04|05|06|07|08|09|10|11'],
      정묘: ['EFGHIJABCD', '03|04|05|06|07|08|09|10|11|12'],
      무진: ['FGHIJABCDE', '04|05|06|07|08|09|10|11|12|01'],
      기사: ['GHIJABCDEF', '05|06|07|08|09|10|11|12|01|02'],
      경오: ['HIJABCDEFG', '06|07|08|09|10|11|12|01|02|03'],
      신미: ['IJABCDEFGH', '07|08|09|10|11|12|01|02|03|04'],
      임신: ['JABCDEFGHI', '08|09|10|11|12|01|02|03|04|05'],
      계유: ['ABCDEFGHIJ', '09|10|11|12|01|02|03|04|05|06'],
      갑술: ['BCDEFGHIJA', '10|11|12|01|02|03|04|05|06|07'],
      을해: ['CDEFGHIJAB', '11|12|01|02|03|04|05|06|07|08'],
      병자: ['DEFGHIJABC', '12|01|02|03|04|05|06|07|08|09'],
      정축: ['EFGHIJABCD', '01|02|03|04|05|06|07|08|09|10'],
      무인: ['FGHIJABCDE', '02|03|04|05|06|07|08|09|10|11'],
      기묘: ['GHIJABCDEF', '03|04|05|06|07|08|09|10|11|12'],
      경진: ['HIJABCDEFG', '04|05|06|07|08|09|10|11|12|01'],
      신사: ['IJABCDEFGH', '05|06|07|08|09|10|11|12|01|02'],
      임오: ['JABCDEFGHI', '06|07|08|09|10|11|12|01|02|03'],
      계미: ['ABCDEFGHIJ', '07|08|09|10|11|12|01|02|03|04'],
      갑신: ['BCDEFGHIJA', '08|09|10|11|12|01|02|03|04|05'],
      을유: ['CDEFGHIJAB', '09|10|11|12|01|02|03|04|05|06'],
      병술: ['DEFGHIJABC', '10|11|12|01|02|03|04|05|06|07'],
      정해: ['EFGHIJABCD', '11|12|01|02|03|04|05|06|07|08'],
      무자: ['FGHIJABCDE', '12|01|02|03|04|05|06|07|08|09'],
      기축: ['GHIJABCDEF', '01|02|03|04|05|06|07|08|09|10'],
      경인: ['HIJABCDEFG', '02|03|04|05|06|07|08|09|10|11'],
      신묘: ['IJABCDEFGH', '03|04|05|06|07|08|09|10|11|12'],
      임진: ['JABCDEFGHI', '04|05|06|07|08|09|10|11|12|01'],
      계사: ['ABCDEFGHIJ', '05|06|07|08|09|10|11|12|01|02'],
      갑오: ['BCDEFGHIJA', '06|07|08|09|10|11|12|01|02|03'],
      을미: ['CDEFGHIJAB', '07|08|09|10|11|12|01|02|03|04'],
      병신: ['DEFGHIJABC', '08|09|10|11|12|01|02|03|04|05'],
      정유: ['EFGHIJABCD', '09|10|11|12|01|02|03|04|05|06'],
      무술: ['FGHIJABCDE', '10|11|12|01|02|03|04|05|06|07'],
      기해: ['GHIJABCDEF', '11|12|01|02|03|04|05|06|07|08'],
      경자: ['HIJABCDEFG', '12|01|02|03|04|05|06|07|08|09'],
      신축: ['IJABCDEFGH', '01|02|03|04|05|06|07|08|09|10'],
      임인: ['JABCDEFGHI', '02|03|04|05|06|07|08|09|10|11'],
      계묘: ['ABCDEFGHIJ', '03|04|05|06|07|08|09|10|11|12'],
      갑진: ['BCDEFGHIJA', '04|05|06|07|08|09|10|11|12|01'],
      을사: ['CDEFGHIJAB', '05|06|07|08|09|10|11|12|01|02'],
      병오: ['DEFGHIJABC', '06|07|08|09|10|11|12|01|02|03'],
      정미: ['EFGHIJABCD', '07|08|09|10|11|12|01|02|03|04'],
      무신: ['FGHIJABCDE', '08|09|10|11|12|01|02|03|04|05'],
      기유: ['GHIJABCDEF', '09|10|11|12|01|02|03|04|05|06'],
      경술: ['HIJABCDEFG', '10|11|12|01|02|03|04|05|06|07'],
      신해: ['IJABCDEFGH', '11|12|01|02|03|04|05|06|07|08'],
      임자: ['JABCDEFGHI', '12|01|02|03|04|05|06|07|08|09'],
      계축: ['ABCDEFGHIJ', '01|02|03|04|05|06|07|08|09|10'],
      갑인: ['BCDEFGHIJA', '02|03|04|05|06|07|08|09|10|11'],
      을묘: ['CDEFGHIJAB', '03|04|05|06|07|08|09|10|11|12'],
      병진: ['DEFGHIJABC', '04|05|06|07|08|09|10|11|12|01'],
      정사: ['EFGHIJABCD', '05|06|07|08|09|10|11|12|01|02'],
      무오: ['FGHIJABCDE', '06|07|08|09|10|11|12|01|02|03'],
      기미: ['GHIJABCDEF', '07|08|09|10|11|12|01|02|03|04'],
      경신: ['HIJABCDEFG', '08|09|10|11|12|01|02|03|04|05'],
      신유: ['IJABCDEFGH', '09|10|11|12|01|02|03|04|05|06'],
      임술: ['JABCDEFGHI', '10|11|12|01|02|03|04|05|06|07'],
      계해: ['ABCDEFGHIJ', '11|12|01|02|03|04|05|06|07|08'],
    };

    // 역행 패턴 생성 (순행의 역순)
    this.backwardPatterns = {};
    for (const [monthPillar, [stems, branches]] of Object.entries(this.forwardPatterns)) {
      const reversedStems = stems.split('').reverse().join('');
      const reversedBranches = branches.split('|').reverse().join('|');
      this.backwardPatterns[monthPillar] = [reversedStems, reversedBranches];
    }
  }

  /**
   * 대운십신 매핑 테이블 초기화 (일간 기준)
   */
  private initGreatFortuneSipsinMapping(): void {
    this.greatFortuneSipsinMapping = {
      A: {
        '01': '비견',
        '02': '겁재',
        '03': '편재',
        '04': '식신',
        '05': '상관',
        '06': '정재',
        '07': '편관',
        '08': '정관',
        '09': '편재',
        '10': '편인',
        '11': '정인',
        '12': '정재',
      },
      B: {
        '01': '겁재',
        '02': '비견',
        '03': '편인',
        '04': '정인',
        '05': '식신',
        '06': '편재',
        '07': '정관',
        '08': '편관',
        '09': '편인',
        '10': '편인',
        '11': '정인',
        '12': '편재',
      },
      C: {
        '01': '정인',
        '02': '편인',
        '03': '비견',
        '04': '비견',
        '05': '겁재',
        '06': '상관',
        '07': '편재',
        '08': '정재',
        '09': '식신',
        '10': '편관',
        '11': '정관',
        '12': '식신',
      },
      D: {
        '01': '편인',
        '02': '정인',
        '03': '겁재',
        '04': '상관',
        '05': '비견',
        '06': '식신',
        '07': '정재',
        '08': '편재',
        '09': '상관',
        '10': '정관',
        '11': '편관',
        '12': '상관',
      },
      E: {
        '01': '정관',
        '02': '편관',
        '03': '비견',
        '04': '정인',
        '05': '편인',
        '06': '겁재',
        '07': '식신',
        '08': '상관',
        '09': '비견',
        '10': '편재',
        '11': '정재',
        '12': '겁재',
      },
      F: {
        '01': '편관',
        '02': '정관',
        '03': '겁재',
        '04': '편인',
        '05': '정인',
        '06': '비견',
        '07': '상관',
        '08': '식신',
        '09': '겁재',
        '10': '정재',
        '11': '편재',
        '12': '비견',
      },
      G: {
        '01': '편재',
        '02': '정재',
        '03': '편인',
        '04': '편관',
        '05': '정관',
        '06': '정인',
        '07': '비견',
        '08': '겁재',
        '09': '편인',
        '10': '식신',
        '11': '상관',
        '12': '정인',
      },
      H: {
        '01': '정재',
        '02': '편재',
        '03': '정인',
        '04': '정관',
        '05': '편관',
        '06': '편인',
        '07': '겁재',
        '08': '비견',
        '09': '정인',
        '10': '상관',
        '11': '식신',
        '12': '편인',
      },
      I: {
        '01': '식신',
        '02': '상관',
        '03': '편관',
        '04': '편재',
        '05': '정재',
        '06': '정관',
        '07': '편인',
        '08': '정인',
        '09': '편관',
        '10': '비견',
        '11': '겁재',
        '12': '정관',
      },
      J: {
        '01': '상관',
        '02': '식신',
        '03': '정관',
        '04': '정재',
        '05': '편재',
        '06': '편관',
        '07': '정인',
        '08': '편인',
        '09': '정관',
        '10': '겁재',
        '11': '비견',
        '12': '편관',
      },
    };
  }

  /**
   * 일간 기준으로 다른 천간의 십신을 구한다
   */
  getSipsin(dayStem: string, targetStem: string): string | null {
    const result = getSipsinForStem(dayStem, targetStem);
    return result || null;
  }

  /**
   * 일간 기준으로 지지의 십신을 구한다
   * constants.ts의 getSipsinForBranch 사용으로 '신(辛/申)' 충돌 문제가 해결됨
   */
  getSipsinForBranch(dayStem: string, branch: string): string | null {
    const result = getSipsinForBranchUtil(dayStem, branch);
    return result || null;
  }

  /**
   * 사주의 모든 위치 십신을 계산한다
   */
  calculateSipsin(
    dayStem: string,
    yearStem: string,
    monthStem: string,
    hourStem: string,
    yearBranch: string,
    monthBranch: string,
    dayBranch: string,
    hourBranch: string
  ): SipsinPosition {
    return {
      year_h: this.getSipsin(dayStem, yearStem),
      month_h: this.getSipsin(dayStem, monthStem),
      hour_h: this.getSipsin(dayStem, hourStem),
      year_e: this.getSipsinForBranch(dayStem, yearBranch),
      month_e: this.getSipsinForBranch(dayStem, monthBranch),
      day_e: this.getSipsinForBranch(dayStem, dayBranch),
      hour_e: this.getSipsinForBranch(dayStem, hourBranch),
    };
  }

  /**
   * 십신별 개수를 센다
   */
  countSipsin(positions: SipsinPosition): Record<string, number> {
    const counts: Record<string, number> = {};

    // 모든 위치의 십신을 수집
    const allSipsin = [
      positions.year_h,
      positions.month_h,
      positions.hour_h,
      positions.year_e,
      positions.month_e,
      positions.day_e,
      positions.hour_e,
    ];

    // 십신별 개수 계산
    for (const sipsin of allSipsin) {
      if (sipsin) {
        counts[sipsin] = (counts[sipsin] ?? 0) + 1;
      }
    }

    return counts;
  }

  /**
   * 가장 많은 십신을 찾는다
   */
  getDominantSipsin(counts: Record<string, number>): string {
    if (Object.keys(counts).length === 0) {
      return '없음';
    }

    const maxCount = Math.max(...Object.values(counts));
    const dominantList = Object.entries(counts)
      .filter(([, count]) => count === maxCount)
      .map(([sipsin]) => sipsin);

    return dominantList.length === 1 ? dominantList[0]! : dominantList.join(', ');
  }

  /**
   * 종합적인 십신 분석을 수행한다
   */
  analyzeSipsin(
    dayStem: string,
    yearStem: string,
    monthStem: string,
    hourStem: string,
    yearBranch: string,
    monthBranch: string,
    dayBranch: string,
    hourBranch: string
  ): SipsinAnalysis {
    // 십신 계산
    const positions = this.calculateSipsin(
      dayStem,
      yearStem,
      monthStem,
      hourStem,
      yearBranch,
      monthBranch,
      dayBranch,
      hourBranch
    );

    // 십신 개수 계산
    const counts = this.countSipsin(positions);

    // 주요 십신 찾기
    const dominant = this.getDominantSipsin(counts);

    return {
      positions,
      counts,
      dominant_sipsin: dominant,
    };
  }

  /**
   * 대운 진행 방향 결정
   */
  determineDirection(yearStem: string, gender: string): ProgressDirection {
    // 양간: 갑병무경임
    const yangStems = ['갑', '병', '무', '경', '임'];
    const isYangStem = yangStems.includes(yearStem);
    const isMale = gender === '남';

    // 양남음녀 = 순행, 음남양녀 = 역행
    if ((isYangStem && isMale) || (!isYangStem && !isMale)) {
      return ProgressDirection.FORWARD;
    } else {
      return ProgressDirection.BACKWARD;
    }
  }

  /**
   * 월주와 방향에 따른 대운 진행 패턴 반환
   */
  getFortuneSequence(monthPillar: string, direction: ProgressDirection): [string, string] {
    if (direction === ProgressDirection.FORWARD) {
      return (
        this.forwardPatterns[monthPillar] ?? ['ABCDEFGHIJ', '01|02|03|04|05|06|07|08|09|10']
      );
    } else {
      return (
        this.backwardPatterns[monthPillar] ?? ['JIHGFEDCBA', '10|09|08|07|06|05|04|03|02|01']
      );
    }
  }

  /**
   * 대운 계산용: 일간 코드와 지지 코드에 따른 십신 결정
   */
  private getGreatFortuneSipsin(dayStemCode: string, branchCode: string): string {
    // 술과 축의 특수 처리
    let adjustedBranchCode = branchCode;
    if (branchCode === '09') {
      // 술
      adjustedBranchCode = '03';
    } else if (branchCode === '12') {
      // 축
      adjustedBranchCode = '06';
    }

    return this.greatFortuneSipsinMapping[dayStemCode]?.[adjustedBranchCode] ?? '미상';
  }

  /**
   * 대운십신 계산 및 분석
   */
  calculateGreatFortune(
    yearStem: string,
    monthStem: string,
    monthBranch: string,
    dayStem: string,
    currentAge: number,
    gender: string
  ): GreatFortuneAnalysis {
    // 1. 대운 진행 방향 결정
    const direction = this.determineDirection(yearStem, gender);

    // 2. 월주 생성
    const monthPillar = monthStem + monthBranch;

    // 3. 대운 진행 패턴 가져오기
    const [stemSequence, branchSequence] = this.getFortuneSequence(monthPillar, direction);
    const branchList = branchSequence.split('|');

    // 4. 일간 코드 변환
    const dayStemCode = this.stemToCode[dayStem] ?? 'A';

    // 5. 각 대운 기간 계산
    const periods: GreatFortunePeriod[] = [];
    let currentPeriod: GreatFortunePeriod | null = null;

    for (let i = 0; i < 10; i++) {
      const startAge = 1 + i * 10;
      const endAge = startAge + 9;

      // 천간/지지 변환
      const stemChar = this.heavenlyStems[stemSequence[i]!] ?? stemSequence[i]!;
      const branchChar = this.earthlyBranches[branchList[i]!] ?? branchList[i]!;

      // 십신 계산
      const sipsin = this.getGreatFortuneSipsin(dayStemCode, branchList[i]!);

      const period: GreatFortunePeriod = {
        start_age: startAge,
        end_age: endAge,
        heavenly_stem: stemChar,
        earthly_branch: branchChar,
        sipsin,
        period_number: i + 1,
      };

      periods.push(period);

      // 현재 대운 찾기
      if (startAge <= currentAge && currentAge <= endAge) {
        currentPeriod = period;
      }
    }

    return {
      direction,
      current_period: currentPeriod,
      periods,
    };
  }
}

/**
 * Factory function to create SipsinCalculator
 */
export function createSipsinCalculator(): SipsinCalculator {
  return new SipsinCalculator();
}
