import { getDataLoader } from './dataLoader';
import type { CalculationInput } from './fortuneCalculatorBase';

const STEM_CODE_TO_HANJA: Record<string, string> = {
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

const BRANCH_NUMBER_TO_HANJA: Record<string, string> = {
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
  '11': '子',
  '12': '丑',
};

type CurrentDateContext = { dateCode: string; year: number; month: number; day: number };
type BirthDateParts = { year: string; month: string; day: string };
type BirthLunarDateParts = { year: string; month: string; day: string };

type TojeongResolver = {
  getBirthDateParts(inputData: CalculationInput): BirthDateParts | null;
  getBirthHourValue(inputData: CalculationInput): number;
  getBirthLunarDateParts(inputData: CalculationInput): BirthLunarDateParts | null;
  getCurrentDateContext(inputData: CalculationInput): CurrentDateContext | null;
};

export function calculateTojeongTrigramCompositeKey(
  inputData: CalculationInput,
  resolver: TojeongResolver,
  tableName: string
): string {
  const currentDate = resolver.getCurrentDateContext(inputData);
  const birthDate = resolver.getBirthDateParts(inputData);
  const birthLunarDate = resolver.getBirthLunarDateParts(inputData);
  if (!currentDate || !birthDate || !birthLunarDate) {
    throw new Error(`Birth or current date context is unavailable for ${tableName}`);
  }

  const baseYear =
    currentDate.month > 9 || (currentDate.month === 9 && currentDate.day > 1) ? currentDate.year + 1 : currentDate.year;
  let currentYearDateCode = `${baseYear.toString().padStart(4, '0')}${birthDate.month.padStart(2, '0')}${birthDate.day.padStart(2, '0')}`;
  if (birthDate.month === '02' && birthDate.day === '29') {
    currentYearDateCode = resolveLeapSafeDateCode(baseYear, birthDate.month, birthDate.day);
  }

  const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>;
  const currentSolarBirthdayRow = mansedata[currentYearDateCode];
  if (!currentSolarBirthdayRow || typeof currentSolarBirthdayRow !== 'object') {
    throw new Error(`Current solar birthday mansedata row is unavailable for ${tableName}`);
  }

  const currentYearStemCode =
    typeof currentSolarBirthdayRow.year_h === 'string' && currentSolarBirthdayRow.year_h
      ? currentSolarBirthdayRow.year_h
      : null;
  const currentYearBranchCode =
    typeof currentSolarBirthdayRow.year_e === 'string' && currentSolarBirthdayRow.year_e
      ? currentSolarBirthdayRow.year_e.padStart(2, '0')
      : null;
  const currentUmdate =
    typeof currentSolarBirthdayRow.lunar_date === 'string' && currentSolarBirthdayRow.lunar_date
      ? currentSolarBirthdayRow.lunar_date
      : typeof currentSolarBirthdayRow.umdate === 'string' && currentSolarBirthdayRow.umdate
        ? currentSolarBirthdayRow.umdate
        : null;
  if (!currentYearStemCode || !currentYearBranchCode || !currentUmdate) {
    throw new Error(`Current birthday mansedata fields are unavailable for ${tableName}`);
  }

  const currentLunarYear = currentUmdate.slice(0, 4);
  const currentLunarDay = currentUmdate.slice(6, 8) === '30' ? '29' : currentUmdate.slice(6, 8);
  const monthRow = findManseRowByUmdate(`${currentLunarYear}${birthLunarDate.month}${currentLunarDay}`);
  if (!monthRow) {
    throw new Error(`Current lunar month mansedata row is unavailable for ${tableName}`);
  }

  let dayRow = findManseRowByUmdate(`${currentLunarYear}${birthLunarDate.month}${birthLunarDate.day}`);
  if (!dayRow && birthLunarDate.day === '30') {
    dayRow = findManseRowByUmdate(`${currentLunarYear}${birthLunarDate.month}29`);
  }
  if (!dayRow) {
    throw new Error(`Current lunar day mansedata row is unavailable for ${tableName}`);
  }

  const yearGabja = buildGabja(currentYearStemCode, currentYearBranchCode, tableName);
  const monthGabja = buildGabja(
    typeof monthRow.month_h === 'string' ? monthRow.month_h : '',
    typeof monthRow.month_e === 'string' ? monthRow.month_e : '',
    tableName,
    'month '
  );
  const dayGabja = buildGabja(
    typeof dayRow.day_h === 'string' ? dayRow.day_h : '',
    typeof dayRow.day_e === 'string' ? dayRow.day_e : '',
    tableName
  );

  const yearSu = getTojeongGabjaValue(yearGabja, 'tae');
  const monthSu = getTojeongGabjaValue(monthGabja, 'wol');
  const daySu = getTojeongGabjaValue(dayGabja, 'il');
  const age = Number.parseInt(currentLunarYear, 10) - Number.parseInt(birthLunarDate.year, 10) + 1;
  const monthHasThirtyDays = findManseRowByUmdate(`${currentLunarYear}${birthLunarDate.month}30`) ? 30 : 29;

  let upperTrigram = (age + yearSu) % 8;
  if (upperTrigram === 0) {
    upperTrigram = 8;
  }

  let middleTrigram = (monthHasThirtyDays + monthSu) % 6;
  if (inputData.gender !== 'M') {
    middleTrigram -= 1;
  }
  middleTrigram -= Math.floor(resolver.getBirthHourValue(inputData) / 2) % 6;
  if (middleTrigram < 1) {
    middleTrigram = 6 + middleTrigram;
  }
  if (middleTrigram === 0) {
    middleTrigram = 3;
  }

  let lowerTrigram = (Number.parseInt(birthLunarDate.day, 10) + daySu) % 3;
  if (inputData.gender !== 'M') {
    lowerTrigram -= 1;
  }
  if (lowerTrigram < 1) {
    lowerTrigram = 3 + lowerTrigram;
  }

  return `${upperTrigram}${middleTrigram}${lowerTrigram}`;
}

function resolveLeapSafeDateCode(year: number, month: string, day: string): string {
  const candidate = new Date(Date.UTC(year, Number.parseInt(month, 10) - 1, Number.parseInt(day, 10)));
  return `${candidate.getUTCFullYear().toString().padStart(4, '0')}${(candidate.getUTCMonth() + 1)
    .toString()
    .padStart(2, '0')}${candidate.getUTCDate().toString().padStart(2, '0')}`;
}

function findManseRowByUmdate(umdate: string): Record<string, unknown> | null {
  const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>;
  for (const row of Object.values(mansedata)) {
    if (typeof row?.lunar_date === 'string' && row.lunar_date === umdate) {
      return row;
    }
    if (typeof row?.umdate === 'string' && row.umdate === umdate) {
      return row;
    }
  }
  return null;
}

function buildGabja(stemCode: string, branchCode: string, tableName: string, prefix = ''): string {
  const stem = STEM_CODE_TO_HANJA[stemCode];
  const branch = BRANCH_NUMBER_TO_HANJA[String(branchCode).padStart(2, '0')];
  if (!stem || !branch) {
    throw new Error(`Unsupported ${prefix}gabja components for ${tableName}: ${stemCode}/${branchCode}`);
  }
  return `${stem}${branch}`;
}

function getTojeongGabjaValue(gabja: string, field: 'tae' | 'wol' | 'il'): number {
  const etcTables = getDataLoader().loadEtcTables() as Record<string, unknown>;
  const rows = Array.isArray(etcTables.tojung_gabja) ? etcTables.tojung_gabja : [];
  const record = rows.find(
    (row): row is Record<string, unknown> =>
      typeof row === 'object' && row !== null && typeof row.gabja === 'string' && row.gabja === gabja
  );
  const value = record?.[field];
  const parsed = typeof value === 'string' || typeof value === 'number' ? Number.parseInt(String(value), 10) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}
