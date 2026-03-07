import { extractKorean } from '../utils'
import type { CalculationInput } from './fortuneCalculatorBase'

export type GenderNarrativeExpressionKind = 'western_zodiac_number' | 'day_stem_index'

export function resolveGenderKey(gender: string): 'M' | 'F' | null {
  const normalized = String(gender ?? '').trim().toUpperCase()

  if (normalized === 'M' || normalized === 'MALE' || normalized.startsWith('남')) {
    return 'M'
  }

  if (normalized === 'F' || normalized === 'FEMALE' || normalized.startsWith('여')) {
    return 'F'
  }

  return null
}

export function resolveGenderedNarrativeExpressionKind(fieldName: string): GenderNarrativeExpressionKind | null {
  if (fieldName === 'combined_value' || fieldName === 'western_zodiac_number') {
    return 'western_zodiac_number'
  }

  if (fieldName === 'day_stem_num' || fieldName === 'day_stem_index') {
    return 'day_stem_index'
  }

  return null
}

export function calculateGenderedNarrativeExpression(
  expressionKind: GenderNarrativeExpressionKind,
  inputData: CalculationInput
): string {
  if (expressionKind === 'western_zodiac_number') {
    return getWesternZodiacNumber(inputData).toString().padStart(2, '0')
  }

  return getStemNumber(inputData.dayStem).toString().padStart(2, '0')
}

export function getWesternZodiacName(inputData: CalculationInput): string {
  const zodiacNames = [
    '물병자리',
    '물고기자리',
    '양자리',
    '황소자리',
    '쌍둥이자리',
    '게자리',
    '사자자리',
    '처녀자리',
    '천칭자리',
    '전갈자리',
    '사수자리',
    '염소자리',
  ] as const

  const zodiacNumber = getWesternZodiacNumber(inputData)
  return zodiacNames[zodiacNumber - 1] ?? '물병자리'
}

function getWesternZodiacNumber(inputData: CalculationInput): number {
  const birthDate = inputData.additionalData?.birth_date
  if (typeof birthDate !== 'string' || !birthDate) {
    return 1
  }

  const [, monthText = '01', dayText = '01'] = birthDate.split('-')
  const month = Number.parseInt(monthText, 10)
  const day = Number.parseInt(dayText, 10)

  if ((month === 12 && day > 23) || (month === 1 && day < 21)) return 12
  if ((month === 1 && day > 20) || (month === 2 && day < 20)) return 1
  if ((month === 2 && day > 19) || (month === 3 && day < 21)) return 2
  if ((month === 3 && day > 20) || (month === 4 && day < 21)) return 3
  if ((month === 4 && day > 20) || (month === 5 && day < 22)) return 4
  if ((month === 5 && day > 21) || (month === 6 && day < 22)) return 5
  if ((month === 6 && day > 21) || (month === 7 && day < 24)) return 6
  if ((month === 7 && day > 23) || (month === 8 && day < 24)) return 7
  if ((month === 8 && day > 23) || (month === 9 && day < 24)) return 8
  if ((month === 9 && day > 23) || (month === 10 && day < 24)) return 9
  if ((month === 10 && day > 23) || (month === 11 && day < 23)) return 10
  return 11
}

function getStemNumber(stem: string): number {
  const stemKr = extractKorean(stem)
  const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
  const index = stems.indexOf(stemKr)
  return index >= 0 ? index + 1 : 1
}
