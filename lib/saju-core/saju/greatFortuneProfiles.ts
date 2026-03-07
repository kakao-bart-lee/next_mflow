import type { FortuneProfileEntry, FortuneProfileSection, FortuneRequest, FortuneResponse } from '../models/fortuneTeller'
import { extractHanja, extractKorean } from '../utils'
import { resolveFortuneYearMarkers } from './fortuneYearMarkers'
import { getSipsinForBranch, getSipsinForStem } from './constants'
import type { ProfileSectionDefinition } from './fortuneProfiles'
import { GONGMANG_MAPPING, YANGINSAL_MAPPING } from './twelveSinsal/mappings'
import { calculateSinsal } from './twelveSinsal/utils'

type GreatFortunePeriodRecord = {
  readonly start_age: number
  readonly end_age: number
  readonly heavenly_stem: string
  readonly earthly_branch: string
  readonly sipsin: string
  readonly period_number: number
}

type GreatFortuneRecord = {
  readonly direction: string | null
  readonly current_period: GreatFortunePeriodRecord | null
  readonly periods: readonly GreatFortunePeriodRecord[]
}

type YearWindowRow = {
  readonly year: number
  readonly age: number | null
  readonly stem: string
  readonly branch: string
  readonly stemSipsin: string
  readonly branchSipsin: string
  readonly sinsal: string | null
  readonly yearMarkers: readonly string[]
  readonly hasYangin: boolean
  readonly hasGongmang: boolean
  readonly isCurrentYear: boolean
}

const SEXAGENARY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
const SEXAGENARY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
const SEXAGENARY_BASE_YEAR = 1984
const YEAR_WINDOW_OFFSETS = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7] as const

function normalizeModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function getCurrentYear(timezone: string): number {
  const yearText = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
  }).format(new Date())
  return Number(yearText)
}

function normalizeDirection(direction: unknown): string | null {
  if (direction === '순' || direction === 'FORWARD') return '순행'
  if (direction === '역' || direction === 'BACKWARD') return '역행'
  return null
}

function isGreatFortunePeriodRecord(value: unknown): value is GreatFortunePeriodRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.start_age === 'number' &&
    typeof candidate.end_age === 'number' &&
    typeof candidate.heavenly_stem === 'string' &&
    typeof candidate.earthly_branch === 'string' &&
    typeof candidate.sipsin === 'string' &&
    typeof candidate.period_number === 'number'
  )
}

function getGreatFortuneRecord(fortuneResponse: FortuneResponse): GreatFortuneRecord | null {
  const raw = fortuneResponse.greatFortune
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const candidate = raw as Record<string, unknown>
  const periods = Array.isArray(candidate.periods)
    ? candidate.periods.filter(isGreatFortunePeriodRecord)
    : []
  const currentPeriod = isGreatFortunePeriodRecord(candidate.current_period)
    ? candidate.current_period
    : null

  if (periods.length === 0) {
    return null
  }

  return {
    direction: normalizeDirection(candidate.direction),
    current_period: currentPeriod,
    periods,
  }
}

function getSexagenaryYearPillar(year: number): { stem: string; branch: string } {
  const offset = normalizeModulo(year - SEXAGENARY_BASE_YEAR, 60)
  return {
    stem: SEXAGENARY_STEMS[offset % SEXAGENARY_STEMS.length] ?? SEXAGENARY_STEMS[0],
    branch: SEXAGENARY_BRANCHES[offset % SEXAGENARY_BRANCHES.length] ?? SEXAGENARY_BRANCHES[0],
  }
}

function buildMarkerSummary(row: YearWindowRow): string {
  const markers: string[] = []

  if (row.sinsal) {
    markers.push(row.sinsal)
  }
  markers.push(...row.yearMarkers)
  if (row.hasYangin) {
    markers.push('양인')
  }
  if (row.hasGongmang) {
    markers.push('공망')
  }

  return markers.length > 0 ? markers.join(', ') : '특이 표식 없음'
}

function buildYearWindowRows(
  request: FortuneRequest,
  fortuneResponse: FortuneResponse
): YearWindowRow[] {
  const currentAgeRaw = fortuneResponse.inputData.current_age
  const currentAge = typeof currentAgeRaw === 'number' ? currentAgeRaw : null
  const currentYear = getCurrentYear(request.timezone)
  const dayStemKorean = extractKorean(fortuneResponse.sajuData.pillars.일.천간)
  const dayStemHanja = extractHanja(fortuneResponse.sajuData.pillars.일.천간)
  const dayBranchKorean = extractKorean(fortuneResponse.sajuData.pillars.일.지지)
  const monthBranchHanja = extractHanja(fortuneResponse.sajuData.pillars.월.지지)
  const dayPillarKey = `${dayStemKorean}${dayBranchKorean}`

  return YEAR_WINDOW_OFFSETS.map((offset) => {
    const year = currentYear + offset
    const age = currentAge === null ? null : currentAge + offset
    const pillar = getSexagenaryYearPillar(year)
    const branchDisplay = extractKorean(pillar.branch)
    const stemDisplay = extractKorean(pillar.stem)
    const yanginTargets = YANGINSAL_MAPPING[dayStemKorean] ?? []
    const gongmangTargets = GONGMANG_MAPPING[dayPillarKey] ?? []

    return {
      year,
      age: age !== null && age > 0 ? age : null,
      stem: pillar.stem,
      branch: pillar.branch,
      stemSipsin: getSipsinForStem(dayStemHanja, pillar.stem),
      branchSipsin: getSipsinForBranch(dayStemHanja, pillar.branch),
      sinsal: calculateSinsal(dayBranchKorean, branchDisplay),
      yearMarkers: resolveFortuneYearMarkers({
        monthBranch: monthBranchHanja,
        targetYearStem: pillar.stem,
        targetYearBranch: pillar.branch,
      }),
      hasYangin: yanginTargets.includes(branchDisplay),
      hasGongmang: gongmangTargets.includes(branchDisplay),
      isCurrentYear: offset === 0,
    }
  })
}

function buildYearWindowEntry(
  sectionId: string,
  title: string,
  request: FortuneRequest,
  fortuneResponse: FortuneResponse
): FortuneProfileEntry {
  const rows = buildYearWindowRows(request, fortuneResponse)
  const currentRow = rows.find((row) => row.isCurrentYear) ?? rows[2] ?? rows[0]
  const currentAgeText = currentRow?.age !== null && currentRow?.age !== undefined
    ? `${currentRow.age}세`
    : '나이 미상'

  const fullText = rows
    .map((row) => {
      const ageText = row.age === null ? '출생 전/미산정' : `${row.age}세`
      const currentFlag = row.isCurrentYear ? '현재 기준' : '예상 구간'
      return `${row.year}년 (${ageText}) ${row.stem}${row.branch} | 천간 십성 ${row.stemSipsin || '미상'} | 지지 십성 ${row.branchSipsin || '미상'} | 표식 ${buildMarkerSummary(row)} | ${currentFlag}`
    })
    .join('\n')

  const briefRows = rows
    .filter((row) => row.isCurrentYear || row.year === currentRow.year + 1 || row.year === currentRow.year + 2)
    .map((row) => `${row.year}년 ${row.stem}${row.branch} ${buildMarkerSummary(row)}`)
  const briefText = briefRows.join(' / ')
  const currentSummary = currentRow
    ? `${currentRow.year}년 ${currentAgeText}은 ${currentRow.stem}${currentRow.branch}년으로 천간 ${currentRow.stemSipsin || '미상'}, 지지 ${currentRow.branchSipsin || '미상'} 흐름입니다.`
    : '현재 연도 기준 대길흉 창을 계산하지 못했습니다.'
  const markerSuffix =
    currentRow && buildMarkerSummary(currentRow) !== '특이 표식 없음'
      ? ` 주요 표식은 ${buildMarkerSummary(currentRow)}입니다.`
      : ''

  return {
    id: `${sectionId}_timeline`,
    tableCode: 'GF_TIMELINE',
    title,
    fullText,
    briefText,
    oneLineSummary: `${currentSummary}${markerSuffix}`,
    score: null,
    status: 'resolved',
    lookupKey: String(currentRow?.year ?? ''),
    missingReason: null,
  }
}

function buildGreatFortunePeriodEntry(
  sectionId: string,
  title: string,
  fortuneResponse: FortuneResponse
): FortuneProfileEntry {
  const greatFortune = getGreatFortuneRecord(fortuneResponse)
  if (!greatFortune) {
    return {
      id: `${sectionId}_periods`,
      tableCode: 'GF_PERIODS',
      title,
      fullText: '',
      briefText: '',
      oneLineSummary: '',
      score: null,
      status: 'missing_data',
      lookupKey: null,
      missingReason: 'greatFortune periods are unavailable',
    }
  }

  const currentPeriod = greatFortune.current_period
  const fullText = greatFortune.periods
    .map((period) => {
      const currentPrefix = currentPeriod?.period_number === period.period_number ? '현재 대운' : `${period.period_number}대운`
      return `${currentPrefix} ${period.start_age}~${period.end_age}세 | ${period.heavenly_stem}${period.earthly_branch} | 십성 ${period.sipsin || '미상'}`
    })
    .join('\n')

  const briefText = greatFortune.periods
    .slice(0, 3)
    .map((period) => `${period.start_age}~${period.end_age}세 ${period.heavenly_stem}${period.earthly_branch} ${period.sipsin}`)
    .join(' / ')

  const summary = currentPeriod
    ? `현재 대운은 ${currentPeriod.start_age}~${currentPeriod.end_age}세 ${currentPeriod.heavenly_stem}${currentPeriod.earthly_branch} 대운(${currentPeriod.sipsin})입니다.`
    : `${greatFortune.periods[0]?.start_age ?? 1}세부터 ${greatFortune.periods.at(-1)?.end_age ?? 100}세까지의 대운 흐름입니다.`

  return {
    id: `${sectionId}_periods`,
    tableCode: 'GF_PERIODS',
    title,
    fullText: greatFortune.direction ? `진행 방향: ${greatFortune.direction}\n${fullText}` : fullText,
    briefText,
    oneLineSummary: summary,
    score: null,
    status: 'resolved',
    lookupKey: currentPeriod ? `${currentPeriod.period_number}` : '1',
    missingReason: null,
  }
}

export function buildTenYearFortuneCycleSections(
  request: FortuneRequest,
  fortuneResponse: FortuneResponse,
  sections: readonly ProfileSectionDefinition[]
): FortuneProfileSection[] {
  return sections.map((section) => {
    if (section.id === 'major_cycle') {
      return {
        id: section.id,
        title: section.title,
        entries: [buildYearWindowEntry(section.id, section.title, request, fortuneResponse)],
      }
    }

    if (section.id === 'fortune_cycle') {
      return {
        id: section.id,
        title: section.title,
        entries: [buildGreatFortunePeriodEntry(section.id, section.title, fortuneResponse)],
      }
    }

    return {
      id: section.id,
      title: section.title,
      entries: [],
    }
  })
}
