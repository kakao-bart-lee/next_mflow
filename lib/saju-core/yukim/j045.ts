/**
 * Implementation of Yukim Jeongdan (J045) calculation.
 *
 * This module calculates the 천반(天盤) configuration used in the
 * 육임정단 (Six Rens divination) and retrieves the corresponding
 * interpretation text from j_tables.json.
 */

import { SajuDataLoader, getDataLoader } from '../saju/dataLoader';

// ---------------------------------------------------------------------------
// Constants and basic lookup tables
// ---------------------------------------------------------------------------

/**
 * Heavenly stems mapping used in mansedata
 */
export const HEAVENLY_STEMS: Readonly<Record<string, string>> = {
  A: '甲',
  B: '乙',
  C: '丙',
  D: '丁',
  E: '戊',
  F: '己',
  G: '庚',
  H: '辛',
  I: '壬',
  J: '癸',
};

/**
 * Earthly branches mapping used in mansedata
 */
export const EARTHLY_BRANCHES: Readonly<Record<string, string>> = {
  '11': '子',
  '12': '丑',
  '01': '寅',
  '02': '卯',
  '03': '辰',
  '04': '巳',
  '05': '午',
  '06': '未',
  '07': '申',
  '08': '酉',
  '09': '戌',
  '10': '亥',
};

/**
 * Branch order for rotation calculations
 */
export const BRANCH_ORDER: readonly string[] = [
  '子',
  '丑',
  '寅',
  '卯',
  '辰',
  '巳',
  '午',
  '未',
  '申',
  '酉',
  '戌',
  '亥',
];

/**
 * Branch index mapping
 */
export const BRANCH_INDEX: Readonly<Record<string, number>> = Object.fromEntries(
  BRANCH_ORDER.map((b, i) => [b, i])
);

/**
 * Mapping for the random visitation (차객법) used to transform the 점시 (jumc)
 * into the final value jumc_temp
 */
export const VISIT_MAP: Readonly<Record<string, readonly string[]>> = {
  子: ['巳', '子', '卯', '戌', '丑', '申', '亥', '午', '酉', '辰', '未', '寅'],
  丑: ['戌', '丑', '申', '亥', '午', '酉', '辰', '未', '寅', '巳', '子', '卯'],
  寅: ['未', '寅', '巳', '子', '卯', '戌', '丑', '申', '亥', '午', '酉', '辰'],
  卯: ['子', '卯', '戌', '丑', '申', '亥', '午', '酉', '辰', '未', '寅', '巳'],
  辰: ['酉', '辰', '未', '寅', '巳', '子', '卯', '戌', '丑', '申', '亥', '午'],
  巳: ['寅', '巳', '子', '卯', '戌', '丑', '申', '亥', '午', '酉', '辰', '未'],
  午: ['亥', '午', '酉', '辰', '未', '寅', '巳', '子', '卯', '戌', '丑', '申'],
  未: ['辰', '未', '寅', '巳', '子', '卯', '戌', '丑', '申', '亥', '午', '酉'],
  申: ['丑', '申', '亥', '午', '酉', '辰', '未', '寅', '巳', '子', '卯', '戌'],
  酉: ['午', '酉', '辰', '未', '寅', '巳', '子', '卯', '戌', '丑', '申', '亥'],
  戌: ['卯', '戌', '丑', '申', '亥', '午', '酉', '辰', '未', '寅', '巳', '子'],
  亥: ['戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉'],
};

/**
 * Map of inquiry codes to their description
 */
export const WHAT_MAP: Readonly<Record<string, string>> = {
  '01': '사업사',
  '02': '취직사',
  '03': '이혼사',
  '04': '가출사',
  '05': '질병사',
  '06': '구재사',
  '07': '주식투자사',
  '08': '시험선거사',
  '09': '임신출산사',
  '10': '대인관계사',
  '11': '도난실물사',
  '12': '길흉예측사',
  '13': '소송승패사',
  '14': '매매사',
  '15': '가택이동사',
  '16': '혼인사',
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Convert time in HHMM format to an earthly branch
 */
export function timeToBranch(timeStr: string): string {
  const t = parseInt(timeStr, 10);

  if (t < 131 || t >= 2331) return '子';
  if (t >= 131 && t < 331) return '丑';
  if (t >= 331 && t < 531) return '寅';
  if (t >= 531 && t < 731) return '卯';
  if (t >= 731 && t < 931) return '辰';
  if (t >= 931 && t < 1131) return '巳';
  if (t >= 1131 && t < 1331) return '午';
  if (t >= 1331 && t < 1531) return '未';
  if (t >= 1531 && t < 1731) return '申';
  if (t >= 1731 && t < 1931) return '酉';
  if (t >= 1931 && t < 2131) return '戌';
  return '亥';
}

/**
 * Return list of 12 branches starting from start_branch
 */
export function rotateBranches(startBranch: string): string[] {
  const idx = BRANCH_INDEX[startBranch];
  if (idx === undefined) {
    throw new Error(`Invalid branch: ${startBranch}`);
  }
  return Array.from({ length: 12 }, (_, i) => BRANCH_ORDER[(idx + i) % 12] ?? '');
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

/**
 * Result of Yukim Jeongdan calculation
 */
export interface YukimJungdanResult {
  readonly what: string;
  readonly what_dis: string;
  readonly lyear: string;
  readonly lmonth: string;
  readonly lday: string;
  readonly umyear: string;
  readonly special_youn: string;
  readonly ummonth: string;
  readonly umday: string;
  readonly jeol: string;
  readonly woljang: string;
  readonly chenban: Record<string, string>;
  readonly jumc: string;
  readonly jumc_temp: string;
  readonly visit_na: number;
  readonly result: string;
}

// ---------------------------------------------------------------------------
// Main calculation function
// ---------------------------------------------------------------------------

/**
 * Calculate Yukim Jeongdan (육임정단)
 *
 * @param what - Inquiry code ("01".."16")
 * @param day - Date in YYYYMMDD format. Defaults to today
 * @param time - Time in HHMM format. Defaults to current time
 * @param seed - Optional seed for deterministic random behaviour
 * @returns Calculation results
 */
export function calculateYukimJungdan(
  what: string,
  day?: string,
  time?: string,
  seed?: number
): YukimJungdanResult {
  // Default to current date/time if not provided
  const now = new Date();
  const dayStr =
    day ?? `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
  const timeStr = time ?? `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

  const dataLoader = getDataLoader();
  const mansedata = dataLoader.loadMansedata();
  const record = mansedata[dayStr] as any;

  if (!record) {
    throw new Error(`No mansedata found for day ${dayStr}`);
  }

  // Convert codes to Hanja
  const lyearH = HEAVENLY_STEMS[record.year_h ?? ''] ?? '';
  const lmonthH = HEAVENLY_STEMS[record.month_h ?? ''] ?? '';
  const ldayH = HEAVENLY_STEMS[record.day_h ?? ''] ?? '';
  const lyearE = EARTHLY_BRANCHES[record.year_e ?? ''] ?? '';
  const lmonthE = EARTHLY_BRANCHES[record.month_e ?? ''] ?? '';
  const ldayE = EARTHLY_BRANCHES[record.day_e ?? ''] ?? '';

  const lyear = `${lyearH}${lyearE}年`;
  const lmonth = `${lmonthH}${lmonthE}月`;
  const lday = `${ldayH}${ldayE}日`;

  const lunarDate = record.lunar_date ?? '';
  const umyear = lunarDate.length >= 8 ? `${lunarDate.substring(0, 4)}年` : '';
  const ummonth = lunarDate.length >= 8 ? `${lunarDate.substring(4, 6)}月` : '';
  const umday = lunarDate.length >= 8 ? `${lunarDate.substring(6, 8)}日` : '';
  const specialYounDisp = record.is_leap_month === '1' ? '윤' : '';
  const jeol = record.solar_term_name ?? '';

  const woljang = record.woljang ?? '子';
  const woljangSeq = rotateBranches(woljang);

  // ------------------------------------------------------------------
  // Determine 점시(點時) and apply 차객법
  // ------------------------------------------------------------------
  const jumc = timeToBranch(timeStr);

  // Random visitation
  let visitNa: number;
  if (seed !== undefined) {
    // Simple seeded random (not cryptographically secure, but deterministic)
    const seededRandom = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };
    visitNa = Math.floor(seededRandom(seed) * 12);
  } else {
    visitNa = Math.floor(Math.random() * 12);
  }

  const visitMapEntry = VISIT_MAP[jumc];
  const jumcTemp = visitMapEntry ? visitMapEntry[visitNa] ?? '子' : '子';

  // ------------------------------------------------------------------
  // Calculate 천반(天盤) arrangement
  // ------------------------------------------------------------------
  const offset = (12 - (BRANCH_INDEX[jumcTemp] ?? 0)) % 12;
  const positionNames = ['11', '12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
  const chenban: Record<string, string> = {};

  for (let i = 0; i < positionNames.length; i++) {
    const pos = positionNames[i];
    const branch = woljangSeq[(offset + i) % 12];
    if (pos && branch) {
      chenban[pos] = branch;
    }
  }

  // ------------------------------------------------------------------
  // Retrieve interpretation text from j_tables.json
  // ------------------------------------------------------------------
  const jTables = dataLoader.loadJTables().J045 ?? {};
  const resultRecord = (jTables as any)[ldayH] ?? {};
  const resultText = resultRecord.data ?? '';

  return {
    what,
    what_dis: WHAT_MAP[what] ?? '',
    lyear,
    lmonth,
    lday,
    umyear,
    special_youn: specialYounDisp,
    ummonth,
    umday,
    jeol,
    woljang,
    chenban,
    jumc,
    jumc_temp: jumcTemp,
    visit_na: visitNa,
    result: resultText,
  };
}
