/**
 * Four Pillars (사주) Calculator based on PHP reference implementation
 * 사주 사기둥 계산기
 */

import { SajuDataLoader, getDataLoader } from './dataLoader';
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  KOREAN_STEM_TO_DISPLAY,
  KOREAN_BRANCH_TO_DISPLAY,
  KOREAN_STEM_ELEMENTS,
  KOREAN_BRANCH_ELEMENTS,
  DAY_STEM_MIDNIGHT_ADJUSTMENTS,
  DAY_STEM_NORMAL_ADJUSTMENTS,
  DAY_BRANCH_MIDNIGHT_ADJUSTMENTS,
  DAY_BRANCH_NORMAL_ADJUSTMENTS,
  HOUR_TIME_RANGES,
} from './constants';

/** Hour branches for 12 time periods */
const HOUR_BRANCHES = ['11', '12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10'] as const;

/** Solar time corrections (minutes) for common Korean cities */
export const SOLAR_TIME_CORRECTIONS: Record<string, number> = {
  none: 0,
  seoul: -32,
  incheon: -33,
  busan: -29,
  daegu: -30,
  gwangju: -32,
  daejeon: -31,
  ulsan: -28,
  jeju: -34,
};

/** Exact boundary hour ranges (23:00-01:00 for 자시, etc.) */
const HOUR_RANGES_EXACT: ReadonlyArray<readonly [number, number, number, boolean]> = [
  [0, 100, 0, true], // 00:00-00:59 -> s=0, kk_check=True
  [2300, 2400, 0, true], // 23:00-23:59 -> s=0, kk_check=True
  [100, 300, 1, false], // 01:00-02:59 -> s=1
  [300, 500, 2, false], // 03:00-04:59 -> s=2
  [500, 700, 3, false], // 05:00-06:59 -> s=3
  [700, 900, 4, false], // 07:00-08:59 -> s=4
  [900, 1100, 5, false], // 09:00-10:59 -> s=5
  [1100, 1300, 6, false], // 11:00-12:59 -> s=6
  [1300, 1500, 7, false], // 13:00-14:59 -> s=7
  [1500, 1700, 8, false], // 15:00-16:59 -> s=8
  [1700, 1900, 9, false], // 17:00-18:59 -> s=9
  [1900, 2100, 10, false], // 19:00-20:59 -> s=10
  [2100, 2300, 11, false], // 21:00-22:59 -> s=11
];

/** Parsed birth input data */
export interface ParsedBirthInput {
  dt: Date;
  hour: number;
  minute: number;
  gender: string;
  originalDate: string;
  originalTime: string;
}

/** Time correction result */
export interface CorrectedTime {
  dt: Date;
  hour: number;
  minute: number;
  correctionMinutes: number;
  correctedDateStr: string;
  correctedTimeStr: string;
  locationInfo: Record<string, unknown>;
}

/** Mansedata entry */
export interface ManseData {
  number: number;
  year_h: string;
  year_e: string;
  month_h: string;
  month_e: string;
  day_h: string;
  day_e: string;
  jeolip: string;
}

/** Pillar data structure */
export interface PillarData {
  천간: string;
  지지: string;
  십성_천간: string;
  십성_지지: string;
}

/** Four pillars result */
export interface FourPillarsResult {
  four_pillars: {
    시주: PillarData;
    일주: PillarData;
    월주: PillarData;
    년주: PillarData;
  };
  jumno: number;
  time_correction: {
    original_date: string;
    original_time: string;
    corrected_date: string;
    corrected_time: string;
    location: unknown;
    correction_minutes: number;
    applied: boolean;
    use_exact_boundary: boolean;
  };
}

/** Location input types */
export type LocationInput =
  | string
  | { longitude?: number; lon?: number; utc_offset?: number; offset?: number; name?: string }
  | [number, number]
  | { longitude: number; utc_offset: number };

/**
 * Four Pillars Calculator
 * 사주 사기둥 계산기
 */
export class FourPillarsCalculator {
  private readonly dataLoader: SajuDataLoader;
  private numberIndexCache: Map<number, string> | null = null;
  private hourStemArrayCache = new Map<string, readonly string[]>();

  constructor(dataLoader?: SajuDataLoader) {
    this.dataLoader = dataLoader ?? getDataLoader();
  }

  /** Get mansedata table */
  private get mansedata(): Record<string, unknown> {
    return this.dataLoader.loadMansedata();
  }

  /** Get number index (number -> date key mapping) */
  private get numberIndex(): Map<number, string> {
    if (!this.numberIndexCache) {
      this.numberIndexCache = new Map();
      for (const [key, data] of Object.entries(this.mansedata)) {
        const entry = data as Record<string, unknown>;
        if (entry.number) {
          this.numberIndexCache.set(Number(entry.number), key);
        }
      }
    }
    return this.numberIndexCache;
  }

  /**
   * Get hour stem array based on day stem with caching
   */
  private getHourStemArray(dayStem: string, isMidnight: boolean): readonly string[] {
    const cacheKey = `${dayStem}:${isMidnight}`;

    if (this.hourStemArrayCache.has(cacheKey)) {
      return this.hourStemArrayCache.get(cacheKey)!;
    }

    // Hour stem arrays based on day stem (following PHP logic exactly)
    const arrays = {
      normal: {
        '甲己': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'] as const,
        '乙庚': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'] as const,
        '丙辛': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'] as const,
        '丁壬': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'] as const,
        '戊癸': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const,
      },
      midnight: {
        '甲己': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'] as const,
        '乙庚': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'] as const,
        '丙辛': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'] as const,
        '丁壬': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const,
        '戊癸': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'] as const,
      },
    };

    const arrayType = isMidnight ? 'midnight' : 'normal';
    const arrayMap = arrays[arrayType];

    for (const [stemPair, stemArray] of Object.entries(arrayMap)) {
      if (stemPair.includes(dayStem)) {
        this.hourStemArrayCache.set(cacheKey, stemArray);
        return stemArray;
      }
    }

    throw new Error(`Could not find hour stem array for day stem ${dayStem}`);
  }

  /**
   * Calculate four pillars based on birth information
   *
   * @param birthDate - Birth date in YYYY-MM-DD format
   * @param birthTime - Birth time in HH:MM format (KST)
   * @param gender - Gender ('M' or 'F')
   * @param location - Optional location for solar time correction
   * @param useExactBoundary - Use exact hour boundaries (23:00-01:00 for 자시)
   * @returns Four pillars information
   */
  calculateFourPillars(
    birthDate: string,
    birthTime: string,
    gender: string,
    location?: LocationInput,
    useExactBoundary = false
  ): FourPillarsResult {
    // 1. Parse input and apply time correction
    const parsed = this.parseBirthInput(birthDate, birthTime, gender);
    const corrected = this.applyLocationCorrection(parsed, location);

    // 2. Lookup mansedata
    let manse = this.lookupMansedata(corrected);

    // 3. Apply jeolip adjustment
    manse = this.applyJeolipAdjustment(manse, corrected.hour, corrected.minute);

    // 4. Apply midnight adjustment
    manse = this.applyMidnightAdjustment(manse, corrected.hour, corrected.minute);

    // 5. Calculate hour pillar
    const memberHourMin = corrected.hour * 100 + corrected.minute;
    const [hourStem, hourBranch] = this.calculateHourPillar(manse.day_h, memberHourMin, useExactBoundary);

    // 6. Build result
    return this.buildResult(manse, hourStem, hourBranch, parsed, corrected, useExactBoundary, location);
  }

  /**
   * Parse birth input
   */
  private parseBirthInput(birthDate: string, birthTime: string, gender: string): ParsedBirthInput {
    const dt = new Date(birthDate);
    const parts = birthTime.split(':');
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new Error(`Invalid birth time format: ${birthTime}. Expected HH:MM format.`);
    }
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);

    return {
      dt,
      hour,
      minute,
      gender,
      originalDate: birthDate,
      originalTime: birthTime,
    };
  }

  /**
   * Apply location-based time correction
   */
  private applyLocationCorrection(parsed: ParsedBirthInput, location?: LocationInput): CorrectedTime {
    let dt = new Date(parsed.dt);
    let hour = parsed.hour;
    let minute = parsed.minute;
    let correctionMinutes = 0;
    let locationInfo: Record<string, unknown> = {};

    if (location) {
      const [correction, info] = this.resolveTimeCorrection(location);
      correctionMinutes = correction;
      locationInfo = info;

      if (correctionMinutes !== 0) {
        const [newHour, newMinute, dayOffset] = this.applyTimeCorrection(hour, minute, correctionMinutes);
        hour = newHour;
        minute = newMinute;

        if (dayOffset !== 0) {
          dt = new Date(dt.getTime() + dayOffset * 24 * 60 * 60 * 1000);
        }
      }
    }

    return {
      dt,
      hour,
      minute,
      correctionMinutes,
      correctedDateStr: this.formatDate(dt),
      correctedTimeStr: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      locationInfo,
    };
  }

  /**
   * Lookup mansedata entry
   */
  private lookupMansedata(corrected: CorrectedTime): ManseData {
    const year = corrected.dt.getFullYear();
    const month = corrected.dt.getMonth() + 1; // JavaScript months are 0-indexed
    const day = corrected.dt.getDate();

    const dateKey = `${year.toString().padStart(4, '0')}${month.toString().padStart(2, '0')}${day
      .toString()
      .padStart(2, '0')}`;

    if (!(dateKey in this.mansedata)) {
      throw new Error(`Date ${dateKey} not found in mansedata`);
    }

    const data = this.mansedata[dateKey] as Record<string, unknown>;
    return {
      number: Number(data.number),
      year_h: String(data.year_h),
      year_e: String(data.year_e),
      month_h: String(data.month_h),
      month_e: String(data.month_e),
      day_h: String(data.day_h),
      day_e: String(data.day_e),
      jeolip: String(data.term_entry_time ?? ''),
    };
  }

  /**
   * Apply jeolip (solar term) adjustment
   */
  private applyJeolipAdjustment(manse: ManseData, hour: number, minute: number): ManseData {
    if (!manse.jeolip || manse.jeolip.length !== 4) {
      return manse;
    }

    const requestTime = hour * 100 + minute;
    const jeolipTime = parseInt(manse.jeolip, 10);
    let myNumber = manse.number;

    if (jeolipTime > requestTime) {
      myNumber -= 1;
    } else if (jeolipTime < requestTime) {
      myNumber += 1;
    }

    if (myNumber === manse.number) {
      return manse;
    }

    if (!this.numberIndex.has(myNumber)) {
      throw new Error(`Number ${myNumber} not found in mansedata`);
    }

    const newKey = this.numberIndex.get(myNumber)!;
    const newData = this.mansedata[newKey] as Record<string, unknown>;

    return {
      number: myNumber,
      year_h: String(newData.year_h),
      year_e: String(newData.year_e),
      month_h: String(newData.month_h),
      month_e: String(newData.month_e),
      day_h: manse.day_h,
      day_e: manse.day_e,
      jeolip: manse.jeolip,
    };
  }

  /**
   * Apply midnight time adjustment
   */
  private applyMidnightAdjustment(manse: ManseData, hour: number, minute: number): ManseData {
    const memberHourMin = hour * 100 + minute;
    let dayH = manse.day_h;
    let dayE = manse.day_e;

    if (memberHourMin < 30) {
      dayH = this.adjustDayStemMidnight(dayH);
      dayE = this.adjustDayBranchMidnight(dayE);
    } else if (memberHourMin === 100) {
      dayH = this.adjustDayStemNormalMidnight(dayH);
      dayE = this.adjustDayBranchNormalMidnight(dayE);
    }

    if (dayH === manse.day_h && dayE === manse.day_e) {
      return manse;
    }

    return {
      number: manse.number,
      year_h: manse.year_h,
      year_e: manse.year_e,
      month_h: manse.month_h,
      month_e: manse.month_e,
      day_h: dayH,
      day_e: dayE,
      jeolip: manse.jeolip,
    };
  }

  /**
   * Calculate jumno (점수)
   */
  private calculateJumno(manse: ManseData, gender: string): number {
    let jumno = parseInt(manse.year_e, 10) * parseInt(manse.month_e, 10) + parseInt(manse.day_e, 10);

    if (gender !== 'M') {
      jumno += 12;
    }
    if (jumno > 100) {
      jumno -= 100;
    }
    if (jumno === 0) {
      jumno = 100;
    }

    return jumno;
  }

  /**
   * Build final result structure
   */
  private buildResult(
    manse: ManseData,
    hourStem: string,
    hourBranch: string,
    parsed: ParsedBirthInput,
    corrected: CorrectedTime,
    useExactBoundary: boolean,
    location?: LocationInput
  ): FourPillarsResult {
    // Convert to Korean characters
    const dayStemKr =
      (HEAVENLY_STEMS as Record<string, { korean: string }>)[manse.day_h]?.korean ?? manse.day_h;
    const dayBranchKr =
      (EARTHLY_BRANCHES as Record<string, { korean: string }>)[manse.day_e]?.korean ?? manse.day_e;
    const monthStemKr =
      (HEAVENLY_STEMS as Record<string, { korean: string }>)[manse.month_h]?.korean ?? manse.month_h;
    const monthBranchKr =
      (EARTHLY_BRANCHES as Record<string, { korean: string }>)[manse.month_e]?.korean ?? manse.month_e;
    const yearStemKr =
      (HEAVENLY_STEMS as Record<string, { korean: string }>)[manse.year_h]?.korean ?? manse.year_h;
    const yearBranchKr =
      (EARTHLY_BRANCHES as Record<string, { korean: string }>)[manse.year_e]?.korean ?? manse.year_e;

    return {
      four_pillars: {
        시주: this.createPillarData(hourStem, hourBranch),
        일주: this.createPillarData(dayStemKr, dayBranchKr),
        월주: this.createPillarData(monthStemKr, monthBranchKr),
        년주: this.createPillarData(yearStemKr, yearBranchKr),
      },
      jumno: this.calculateJumno(manse, parsed.gender),
      time_correction: {
        original_date: parsed.originalDate,
        original_time: parsed.originalTime,
        corrected_date: corrected.correctedDateStr,
        corrected_time: corrected.correctedTimeStr,
        location: corrected.locationInfo || location,
        correction_minutes: corrected.correctionMinutes,
        applied: corrected.correctionMinutes !== 0,
        use_exact_boundary: useExactBoundary,
      },
    };
  }

  /**
   * Adjust day stem for midnight births
   */
  private adjustDayStemMidnight(dayH: string): string {
    return DAY_STEM_MIDNIGHT_ADJUSTMENTS[dayH] ?? dayH;
  }

  /**
   * Adjust day stem for normal midnight handling
   */
  private adjustDayStemNormalMidnight(dayH: string): string {
    return DAY_STEM_NORMAL_ADJUSTMENTS[dayH] ?? dayH;
  }

  /**
   * Adjust day branch for midnight births
   */
  private adjustDayBranchMidnight(dayE: string): string {
    return DAY_BRANCH_MIDNIGHT_ADJUSTMENTS[dayE] ?? dayE;
  }

  /**
   * Adjust day branch for normal midnight handling
   */
  private adjustDayBranchNormalMidnight(dayE: string): string {
    return DAY_BRANCH_NORMAL_ADJUSTMENTS[dayE] ?? dayE;
  }

  /**
   * Calculate hour pillar stem and branch
   */
  private calculateHourPillar(
    dayStem: string,
    memberHourMin: number,
    useExactBoundary: boolean
  ): [string, string] {
    const [s, kkCheck] = this.getHourIndexAndMidnightCheck(memberHourMin, useExactBoundary);

    const dayStemKorean =
      (HEAVENLY_STEMS as Record<string, { korean: string }>)[dayStem]?.korean ?? dayStem;
    const stemArray = this.getHourStemArray(dayStemKorean, kkCheck);
    const hourStemKorean = stemArray[s];
    if (!hourStemKorean) {
      throw new Error(`Invalid stem array index: ${s}`);
    }

    const hourBranchCode = HOUR_BRANCHES[s];
    if (!hourBranchCode) {
      throw new Error(`Invalid hour index: ${s}`);
    }

    const hourBranchKorean =
      (EARTHLY_BRANCHES as Record<string, { korean: string }>)[hourBranchCode]?.korean ?? hourBranchCode;

    return [hourStemKorean, hourBranchKorean];
  }

  /**
   * Get hour index and midnight check
   */
  private getHourIndexAndMidnightCheck(memberHourMin: number, useExactBoundary: boolean): [number, boolean] {
    const ranges = useExactBoundary ? HOUR_RANGES_EXACT : HOUR_TIME_RANGES;

    for (const [start, end, s, kkCheck] of ranges) {
      if (start <= memberHourMin && memberHourMin < end) {
        return [s, kkCheck];
      }
    }

    // Default fallback
    return [0, false];
  }

  /**
   * Apply solar time correction to time value
   */
  private applyTimeCorrection(hour: number, minute: number, correctionMinutes: number): [number, number, number] {
    let totalMinutes = hour * 60 + minute + correctionMinutes;
    let dayOffset = 0;

    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
      dayOffset = -1;
    } else if (totalMinutes >= 24 * 60) {
      totalMinutes -= 24 * 60;
      dayOffset = 1;
    }

    const newHour = Math.floor(totalMinutes / 60);
    const newMinute = totalMinutes % 60;

    return [newHour, newMinute, dayOffset];
  }

  /**
   * Calculate true solar time correction in minutes
   */
  private solarTimeCorrectionMinutes(longitude: number, utcOffset: number): number {
    const standardMeridian = 15 * utcOffset;
    return Math.round((standardMeridian - longitude) * 4);
  }

  /**
   * Parse 'longitude,utc_offset' string
   */
  private parseLocationString(location: string): [number, number] | null {
    const parts = location.split(',').map((p) => p.trim());
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return null;
    }

    try {
      const longitude = parseFloat(parts[0]);
      const offsetStr = parts[1].toUpperCase().replace('UTC', '');
      const utcOffset = parseFloat(offsetStr);

      if (isNaN(longitude) || isNaN(utcOffset)) {
        return null;
      }

      return [longitude, utcOffset];
    } catch {
      return null;
    }
  }

  /**
   * Resolve time correction minutes from various location inputs
   */
  private resolveTimeCorrection(location: LocationInput): [number, Record<string, unknown>] {
    if (typeof location === 'string') {
      const key = location.trim().toLowerCase();
      if (key in SOLAR_TIME_CORRECTIONS) {
        const correction = SOLAR_TIME_CORRECTIONS[key];
        if (correction !== undefined) {
          return [correction, { type: 'preset', key }];
        }
      }

      const parsed = this.parseLocationString(key);
      if (parsed) {
        const [longitude, utcOffset] = parsed;
        return [
          this.solarTimeCorrectionMinutes(longitude, utcOffset),
          { type: 'coordinates', longitude, utc_offset: utcOffset },
        ];
      }

      throw new Error("Unsupported location string. Use preset key or 'longitude,utc_offset'.");
    }

    if (Array.isArray(location) && location.length === 2) {
      const [longitude, utcOffset] = location;
      return [
        this.solarTimeCorrectionMinutes(longitude, utcOffset),
        { type: 'coordinates', longitude, utc_offset: utcOffset },
      ];
    }

    if (typeof location === 'object') {
      const obj = location as Record<string, unknown>;
      const longitudeValue = obj.longitude ?? obj.lon;
      const utcOffsetValue = obj.utc_offset ?? obj.offset;

      if (
        typeof longitudeValue !== 'number' ||
        typeof utcOffsetValue !== 'number' ||
        longitudeValue === undefined ||
        utcOffsetValue === undefined
      ) {
        throw new Error('Location dict requires longitude and utc_offset as numbers.');
      }

      const longitude = longitudeValue;
      const utcOffset = utcOffsetValue;

      const info: Record<string, unknown> = {
        type: 'coordinates',
        longitude,
        utc_offset: utcOffset,
      };

      if ('name' in obj) {
        info.name = obj.name;
      }

      return [this.solarTimeCorrectionMinutes(longitude, utcOffset), info];
    }

    throw new Error("Unsupported location. Use preset key, 'longitude,utc_offset', a tuple, or a dict.");
  }

  /**
   * Get stem display name
   */
  private getStemDisplay(stem: string): string {
    return KOREAN_STEM_TO_DISPLAY[stem] ?? stem;
  }

  /**
   * Get branch display name
   */
  private getBranchDisplay(branch: string): string {
    return KOREAN_BRANCH_TO_DISPLAY[branch] ?? branch;
  }

  /**
   * Get stem element
   */
  private getStemElement(stem: string): string {
    return KOREAN_STEM_ELEMENTS[stem] ?? stem;
  }

  /**
   * Get branch element
   */
  private getBranchElement(branch: string): string {
    return KOREAN_BRANCH_ELEMENTS[branch] ?? branch;
  }

  /**
   * Create pillar data structure
   */
  private createPillarData(stem: string, branch: string): PillarData {
    return {
      천간: `${this.getStemDisplay(stem)}(${stem})`,
      지지: `${this.getBranchDisplay(branch)}(${branch})`,
      십성_천간: this.getStemElement(stem),
      십성_지지: this.getBranchElement(branch),
    };
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(dt: Date): string {
    const year = dt.getFullYear();
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const day = dt.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Factory function to create a FourPillarsCalculator instance
 */
export function createFourPillarsCalculator(dataLoader?: SajuDataLoader): FourPillarsCalculator {
  return new FourPillarsCalculator(dataLoader);
}
