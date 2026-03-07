const JUYEOK_TRIGRAM_GAN_GROUPS: Record<string, readonly string[]> = {
  건: ['갑인', '갑오', '갑술', '병신', '병자', '병진', '무해', '무묘', '무미', '경사', '임인', '경유', '경축', '임오', '임술'],
  태: ['을인', '을오', '을술', '정신', '기묘', '정진', '기해', '정자', '기미', '신사', '계오', '계인', '신유', '신축', '계술'],
  이: ['갑사', '갑유', '갑축', '병인', '병오', '병술', '무신', '무자', '무진', '경해', '경묘', '경미', '임사', '임유', '임축'],
  진: ['을사', '을유', '을축', '정오', '정인', '정술', '기신', '기자', '기진', '신해', '신묘', '신미', '계사', '계유', '계축'],
  손: ['갑해', '갑묘', '갑미', '병사', '병유', '병축', '경신', '무인', '무오', '경자', '무술', '임해', '임묘', '임미', '경진'],
  감: ['을해', '을묘', '정사', '을미', '정유', '정축', '기인', '기오', '기술', '신신', '계해', '신진', '신자', '계묘', '계미'],
  간: ['갑신', '갑자', '갑진', '병해', '병묘', '병미', '무사', '무유', '무축', '경인', '경오', '경술', '임신', '임자', '임진'],
  곤: ['을신', '을자', '을진', '정해', '정묘', '정미', '기사', '기유', '기축', '신인', '신오', '신술', '계신', '계자', '계진'],
}

const JUYEOK_TRIGRAM_JI_GROUPS: Record<string, readonly string[]> = {
  건: ['자인', '오인', '술인', '자오', '오오', '술오', '자술', '오술', '술술', '진신', '신신', '해신', '진자', '신자', '해자', '진진', '신진', '해진'],
  태: ['축인', '미인', '해인', '축오', '미오', '해오', '축술', '미술', '해술', '사신', '유신', '축신', '사자', '유자', '축자', '사진', '유진', '축진'],
  이: ['자인', '오인', '술인', '자사', '오사', '술사', '자신', '오신', '술신', '진인', '신인', '해인', '진사', '신사', '해사', '진신', '신신', '해신'],
  진: ['묘인', '사인', '유인', '묘오', '사오', '유오', '묘술', '사술', '유술', '인신', '오신', '술신', '인자', '오자', '술자', '인진', '오진', '술진'],
  손: ['사인', '유인', '축인', '사오', '유오', '축오', '사술', '유술', '축술', '묘신', '미신', '해신', '묘자', '미자', '해자', '묘진', '미진', '해진'],
  감: ['인인', '진인', '신인', '인오', '진오', '신오', '인술', '진술', '신술', '묘신', '미신', '해신', '묘자', '미자', '해자', '묘진', '미진', '해진'],
  간: ['인인', '진인', '신인', '인사', '진사', '신사', '인유', '진유', '신유', '오신', '술신', '자인', '오자', '술자', '자자', '오진', '술진', '자진'],
  곤: ['자묘', '오묘', '술묘', '자미', '오미', '술미', '자해', '오해', '술해', '진묘', '신묘', '해묘', '진미', '신미', '해미', '진해', '신해', '해해'],
}

const TRIGRAM_TO_SERIAL: Record<string, number> = {
  건: 1,
  태: 2,
  이: 3,
  진: 4,
  손: 5,
  감: 6,
  간: 7,
  곤: 8,
}

export function calculateJuyeokGanSerial(birthDayStem: string, currentDayBranch: string): string {
  return String(trigramToSerial(resolveJuyeokTrigram('Gan', birthDayStem, currentDayBranch)))
}

export function calculateJuyeokJiSerial(birthDayBranch: string, currentDayBranch: string): string {
  return String(trigramToSerial(resolveJuyeokTrigram('Ji', birthDayBranch, currentDayBranch)))
}

export function calculateJuyeokPairSerial(
  birthDayStem: string,
  birthDayBranch: string,
  currentDayBranch: string
): string {
  return `${calculateJuyeokGanSerial(birthDayStem, currentDayBranch)}${calculateJuyeokJiSerial(
    birthDayBranch,
    currentDayBranch
  )}`
}

function resolveJuyeokTrigram(mode: 'Gan' | 'Ji', first: string, second: string): string | null {
  const groups = mode === 'Gan' ? JUYEOK_TRIGRAM_GAN_GROUPS : JUYEOK_TRIGRAM_JI_GROUPS
  const key = `${first}${second}`
  for (const [trigram, combos] of Object.entries(groups)) {
    if (combos.includes(key)) {
      return trigram
    }
  }
  return null
}

function trigramToSerial(trigram: string | null): number {
  return TRIGRAM_TO_SERIAL[trigram ?? ""] ?? 8
}
