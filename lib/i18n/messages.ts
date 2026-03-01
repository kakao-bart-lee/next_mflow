import type { Locale } from "."

/**
 * Message dictionary structure.
 * - Korean: complete
 * - English: fill in as needed
 *
 * Add new sections as screens are translated.
 */
const messages = {
  ko: {
    common: {
      next: "다음",
      back: "이전",
      start: "시작하기",
      analyzing: "분석 중...",
    },
    onboarding: {
      brand: "사주 플레이북",
      tagline: "오늘을 잘 쓰는 방법을 알려드릴게요",
      step1Label: "기본 정보",
      step2Label: "추가 정보",
      // Step 0
      whenBorn: "언제 태어나셨나요?",
      whenBornDesc: "정확한 생년월일이 기운을 읽는 데 큰 도움이 됩니다",
      birthDate: "생년월일",
      birthTime: "출생 시간",
      timeKnown: "알고 있어요",
      timeUnknown: "모르겠어요",
      timeUnknownMsg: "괜찮아요. 시간 없이도 읽을 수 있는 것들이 있어요.",
      // Step 1
      tellMore: "조금만 더 알려주세요",
      tellMoreDesc: "태어난 곳의 기운도 함께 읽습니다",
      gender: "성별",
      male: "남성",
      female: "여성",
      birthPlace: "태어난 장소",
      timezone: "시간대",
      dstNote: "서머타임 자동 반영",
      // Validation
      dateRequired: "날짜를 입력해주세요",
      dateInvalid: "올바른 날짜를 입력해주세요",
      dateFuture: "미래 날짜는 입력할 수 없어요",
      dateTooOld: "1900년 이후 날짜를 입력해주세요",
    },
  },
  en: {
    common: {
      next: "Next",
      back: "Back",
      start: "Get started",
      analyzing: "Analyzing...",
    },
    onboarding: {
      brand: "Saju Playbook",
      tagline: "Your daily guide to living well",
      step1Label: "Basic info",
      step2Label: "More details",
      // Step 0
      whenBorn: "When were you born?",
      whenBornDesc: "Your exact birth date helps us read the energy",
      birthDate: "Date of birth",
      birthTime: "Time of birth",
      timeKnown: "I know",
      timeUnknown: "Not sure",
      timeUnknownMsg: "No worries. There's still plenty we can read.",
      // Step 1
      tellMore: "Just a bit more",
      tellMoreDesc: "Where you were born matters too",
      gender: "Gender",
      male: "Male",
      female: "Female",
      birthPlace: "Place of birth",
      timezone: "Timezone",
      dstNote: "DST applied automatically",
      // Validation
      dateRequired: "Please enter a date",
      dateInvalid: "Please enter a valid date",
      dateFuture: "Date cannot be in the future",
      dateTooOld: "Please enter a date after 1900",
    },
  },
} as const

export type Messages = (typeof messages)[Locale]

export function getMessages(locale: Locale): Messages {
  return messages[locale]
}
