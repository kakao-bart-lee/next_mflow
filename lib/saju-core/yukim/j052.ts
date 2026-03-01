/**
 * Implementation of the Jidu method (J052) from Yukim.
 *
 * The routine determines the 국수(局數) based on the day's 월장 and 점시,
 * looks up the corresponding record from etc_tables.json (yukim_720) and
 * returns key divination information.
 */

import { getDataLoader } from '../saju/dataLoader';
import { HEAVENLY_STEMS, EARTHLY_BRANCHES, timeToBranch } from './j045';

/**
 * Mapping of human readable inquiry types to the express keys
 */
export const WHAT_MAP: Readonly<Record<string, string>> = {
  momang: '계획사',
  gujae: '구재,구물사',
  maemae: '매매사',
  children: '태아성별사',
  dese: '질병사',
  app: '내방여부사',
  visit: '방문부재사',
  trival: '여행,레저길흉사',
  miro: '미로탈출사',
  gil: '길흉예측사',
  donan: '도난실물사',
  tak: '위탁성부사',
  sbu: '승부(필승좌법)',
  true: '진위파악사',
  escape: '도망,피신사',
};

/**
 * 월장과 점시 조합으로 국수를 산출하는 표
 */
export const TEMP_GUK_MAP: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  子: { 子: 1, 丑: 2, 寅: 3, 卯: 4, 辰: 5, 巳: 6, 午: 7, 未: 8, 申: 9, 酉: 10, 戌: 11, 亥: 12 },
  丑: { 子: 12, 丑: 1, 寅: 2, 卯: 3, 辰: 4, 巳: 5, 午: 6, 未: 7, 申: 8, 酉: 9, 戌: 10, 亥: 11 },
  寅: { 子: 11, 丑: 12, 寅: 1, 卯: 2, 辰: 3, 巳: 4, 午: 5, 未: 6, 申: 7, 酉: 8, 戌: 9, 亥: 10 },
  卯: { 子: 10, 丑: 11, 寅: 12, 卯: 1, 辰: 2, 巳: 3, 午: 4, 未: 5, 申: 6, 酉: 7, 戌: 8, 亥: 9 },
  辰: { 子: 9, 丑: 10, 寅: 11, 卯: 12, 辰: 1, 巳: 2, 午: 3, 未: 4, 申: 5, 酉: 6, 戌: 7, 亥: 8 },
  巳: { 子: 8, 丑: 9, 寅: 10, 卯: 11, 辰: 12, 巳: 1, 午: 2, 未: 3, 申: 4, 酉: 5, 戌: 6, 亥: 7 },
  午: { 子: 7, 丑: 8, 寅: 9, 卯: 10, 辰: 11, 巳: 12, 午: 1, 未: 2, 申: 3, 酉: 4, 戌: 5, 亥: 6 },
  未: { 子: 6, 丑: 7, 寅: 6, 卯: 5, 辰: 10, 巳: 11, 午: 12, 未: 1, 申: 2, 酉: 3, 戌: 4, 亥: 5 },
  申: { 子: 5, 丑: 6, 寅: 7, 卯: 8, 辰: 9, 巳: 10, 午: 11, 未: 12, 申: 1, 酉: 2, 戌: 3, 亥: 4 },
  酉: { 子: 4, 丑: 5, 寅: 6, 卯: 7, 辰: 8, 巳: 9, 午: 10, 未: 11, 申: 12, 酉: 1, 戌: 2, 亥: 3 },
  戌: { 子: 3, 丑: 4, 寅: 5, 卯: 6, 辰: 7, 巳: 8, 午: 9, 未: 10, 申: 11, 酉: 12, 戌: 1, 亥: 2 },
  亥: { 子: 2, 丑: 3, 寅: 4, 卯: 5, 辰: 6, 巳: 7, 午: 8, 未: 9, 申: 10, 酉: 11, 戌: 12, 亥: 1 },
};

/**
 * Mapping from 국수 to 진(辰)하(下)지지 등 주요 포지션
 */
export const JINHA_MAP: Readonly<Record<number, readonly [string, string, string]>> = {
  1: ['辰', '子', '卯'],
  2: ['巳', '丑', '辰'],
  3: ['午', '寅', '巳'],
  4: ['未', '卯', '午'],
  5: ['申', '辰', '未'],
  6: ['酉', '巳', '申'],
  7: ['戌', '午', '酉'],
  8: ['亥', '未', '戌'],
  9: ['子', '申', '亥'],
  10: ['丑', '酉', '子'],
  11: ['寅', '戌', '丑'],
  12: ['卯', '亥', '寅'],
};

/**
 * Base position codes
 */
export const BASE_CODES: readonly string[] = [
  '11',
  '12',
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
];

/**
 * Result of Yukim Jidu calculation
 */
export interface YukimJiduResult {
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
  readonly jumc: string;
  readonly temp_guk: number;
  readonly chenban: Record<string, string>;
  readonly jinha: string;
  readonly jaha: string;
  readonly myoha: string;
  readonly day_gui: string;
  readonly night_gui: string;
  readonly today_gui: string;
  readonly today_gui_t: string;
  readonly gongmang: readonly [string, string];
  readonly k: string;
  readonly result: string;
}

/**
 * Calculate the Jidu method (지두법) for a given inquiry type
 *
 * @param what - Inquiry key (e.g. "momang" for 계획사)
 * @param day - Date in YYYYMMDD format. Defaults to today
 * @param time - Time in HHMM format. Defaults to current time
 * @returns Calculation results
 */
export function calculateYukimJidu(what: string, day?: string, time?: string): YukimJiduResult {
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
  const specialYoun = record.is_leap_month === '1' ? '윤' : '';
  const jeol = record.solar_term_name ?? '';

  const woljang = record.woljang ?? '子';
  const jumc = timeToBranch(timeStr);

  // Calculate 국수
  const tempGukRow = TEMP_GUK_MAP[woljang];
  const tempGuk = tempGukRow ? tempGukRow[jumc] ?? 1 : 1;

  // Calculate chenban (rotated positions)
  const rotation = (-(tempGuk - 1) + 12) % 12;
  const rotated = [...BASE_CODES.slice(rotation), ...BASE_CODES.slice(0, rotation)];
  const chenban: Record<string, string> = {};

  for (let i = 0; i < BASE_CODES.length; i++) {
    const pos = BASE_CODES[i];
    const code = rotated[i];
    if (pos && code) {
      const branch = EARTHLY_BRANCHES[code];
      if (branch) {
        chenban[pos] = branch;
      }
    }
  }

  // Get jinha, jaha, myoha from mapping
  const jinhaEntry = JINHA_MAP[tempGuk];
  const [jinha, jaha, myoha] = jinhaEntry ?? ['', '', ''];

  // Lookup additional data from yukim_720 table
  const etcTables = dataLoader.loadEtcTables();
  const yukim720 = (etcTables as any).yukim_720 ?? [];
  const llday = `${ldayH}${ldayE}`;

  const record720 = yukim720.find(
    (r: any) => r.ganji === llday && r.guk === String(tempGuk)
  );

  let dayGui = '';
  let nightGui = '';
  let todayGui = '';
  let todayGuiT = '';
  let gongmang01 = '';
  let gongmang02 = '';

  if (record720) {
    dayGui = record720.day_gui ?? '';
    nightGui = record720.night_gui ?? '';
    gongmang01 = record720.gongmang_01 ?? '';
    gongmang02 = record720.gongmang_02 ?? '';
    const dayGuiT = record720.day_gui_t ?? '';
    const nightGuiT = record720.night_gui_t ?? '';

    // Determine if it's daytime or nighttime
    const daytimeBranches = new Set(['卯', '辰', '巳', '午', '未', '申']);
    if (daytimeBranches.has(jumc)) {
      todayGui = dayGui;
      todayGuiT = dayGuiT;
    } else {
      todayGui = nightGui;
      todayGuiT = nightGuiT;
    }
  }

  const daytimeBranches = new Set(['卯', '辰', '巳', '午', '未', '申']);
  const k = daytimeBranches.has(jumc)
    ? `${todayGui}(주)  ${nightGui}(염)`
    : `${todayGui}(야)  ${dayGui}(염)`;

  // Retrieve interpretation text from j_tables.json
  const jTables = dataLoader.loadJTables().J052 ?? {};
  const resultRecord = (jTables as any)[what] ?? {};
  const resultText = (resultRecord.data ?? resultRecord.information ?? '') as string;

  return {
    what,
    what_dis: WHAT_MAP[what] ?? '',
    lyear,
    lmonth,
    lday,
    umyear,
    special_youn: specialYoun,
    ummonth,
    umday,
    jeol,
    woljang,
    jumc,
    temp_guk: tempGuk,
    chenban,
    jinha: jinha ?? '',
    jaha: jaha ?? '',
    myoha: myoha ?? '',
    day_gui: dayGui,
    night_gui: nightGui,
    today_gui: todayGui,
    today_gui_t: todayGuiT,
    gongmang: [gongmang01, gongmang02],
    k,
    result: resultText,
  };
}
