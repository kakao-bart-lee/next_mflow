import { extractKorean } from '../utils'
import type { CalculationInput } from './fortuneCalculatorBase'
import { getDataLoader } from './dataLoader'

export function calculateNewYearSignalExpression(inputData: CalculationInput): string {
  const dayStemValue = getNewYearSignalStemValue(inputData.dayStem)
  const currentYearStemValue = getCurrentYearStemSignalValue(inputData)
  let total = (dayStemValue * currentYearStemValue) % 25
  if (total === 0) {
    total = 1
  }
  return String(total)
}

export function calculateNewYearSignalWithHourExpression(inputData: CalculationInput): string {
  const dayStemValue = getNewYearSignalStemValue(inputData.dayStem)
  const currentYearStemValue = getCurrentYearStemSignalValue(inputData)
  const hourOffset = Math.floor(getBirthHourValue(inputData) / 2) % 12
  let total = (dayStemValue * currentYearStemValue + hourOffset) % 25
  if (total === 0) {
    total = 1
  }
  return String(total)
}

export function calculateNewYearMonthlyExpression(
  inputData: CalculationInput,
  stemToAlpha: (stemKr: string) => string
): string {
  return `${stemToAlpha(extractKorean(inputData.dayStem))}${getCurrentYearStemAlpha(inputData)}`
}

function getNewYearSignalStemValue(dayStem: string): number {
  return getStemNumber(extractKorean(dayStem))
}

function getCurrentYearStemSignalValue(inputData: CalculationInput): number {
  const alpha = getCurrentYearStemAlpha(inputData)
  return getStemNumberFromCode(alpha)
}

function getCurrentYearStemAlpha(inputData: CalculationInput): string {
  const currentDate = getCurrentDateContext(inputData)
  if (!currentDate) {
    return 'B'
  }

  const mansedata = getDataLoader().loadMansedata() as Record<string, Record<string, unknown>>
  const manse = mansedata[currentDate.dateCode]
  const stemCode = typeof manse?.year_h === 'string' && manse.year_h ? manse.year_h : 'B'
  return stemCode
}

function getBirthHourValue(inputData: CalculationInput): number {
  const birthTime = inputData.additionalData?.birth_time
  if (typeof birthTime !== 'string') {
    return 0
  }

  const [hourText] = birthTime.split(':')
  const hour = Number.parseInt(hourText ?? '0', 10)
  return Number.isFinite(hour) ? hour : 0
}

function getCurrentDateContext(
  inputData: CalculationInput
): { dateCode: string; year: number; month: number; day: number } | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone:
        typeof inputData.additionalData?.timezone === 'string' && inputData.additionalData.timezone
          ? inputData.additionalData.timezone
          : 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const partMap = Object.fromEntries(
      formatter
        .formatToParts(new Date())
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value])
    )

    const year = Number.parseInt(String(partMap.year ?? '0'), 10)
    const month = Number.parseInt(String(partMap.month ?? '1'), 10)
    const day = Number.parseInt(String(partMap.day ?? '1'), 10)

    return {
      year,
      month,
      day,
      dateCode: `${year.toString().padStart(4, '0')}${month.toString().padStart(2, '0')}${day
        .toString()
        .padStart(2, '0')}`,
    }
  } catch {
    return null
  }
}

function getStemNumber(stemKr: string): number {
  const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
  const index = stems.indexOf(stemKr)
  return index >= 0 ? index + 1 : 1
}

function getStemNumberFromCode(stemCode: string): number {
  const codes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
  const index = codes.indexOf(String(stemCode ?? '').trim())
  return index >= 0 ? index + 1 : 1
}
