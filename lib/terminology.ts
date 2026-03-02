/**
 * 용어 워싱(Terminology Washing) — 도메인 전문 용어를 부드러운 라이프스타일 언어로 치환
 *
 * 원칙:
 * - 탐색(Explore) 페이지에서는 전문 용어 그대로 허용
 * - "왜 이렇게 나왔나요?" 근거 레이어에서는 전문 용어 OK
 * - 1차 화면(today, week, decision)에서는 워싱된 표현만 사용
 */

/** 전문 용어 → 대체 표현 매핑 (긴 문자열 먼저 매칭되도록 정렬) */
const TERM_MAP: [RegExp, string][] = [
  // 복합 표현 (먼저 매칭)
  [/사주명리학\s*전문가/g, "라이프 가이드 전문가"],
  [/사주\s*에너지/g, "오늘의 흐름"],
  [/사주\s*데이터/g, "분석 데이터"],
  [/사주\s*분석/g, "맞춤 분석"],
  [/사주\s*관점/g, "분석 관점"],
  [/사주\s*기반/g, "데이터 기반"],
  [/사주명리학/g, "라이프 가이드"],

  // 오행 에너지 표현
  [/목\(木\)의\s*(기운|에너지)/g, "성장의 에너지"],
  [/화\(火\)의\s*(기운|에너지)/g, "열정의 에너지"],
  [/토\(土\)의\s*(기운|에너지)/g, "안정의 에너지"],
  [/금\(金\)의\s*(기운|에너지)/g, "결단의 에너지"],
  [/수\(水\)의\s*(기운|에너지)/g, "지혜의 에너지"],

  // 단일 표현 — 문맥을 고려한 보수적 치환
  [/오행/g, "에너지 흐름"],
  [/십신/g, "에너지 관계"],
  [/일주/g, "나의 기본 성향"],
  [/사주/g, "운세"],
]

/**
 * 텍스트에서 도메인 전문 용어를 부드러운 일상 표현으로 치환합니다.
 * LLM 응답, mock 데이터, UI 라벨 등에 범용으로 적용할 수 있습니다.
 */
export function washTerminology(text: string): string {
  let result = text
  for (const [pattern, replacement] of TERM_MAP) {
    result = result.replace(pattern, replacement)
  }
  return result
}

/** 오행 원소별 부드러운 라벨 */
export const ELEMENT_FRIENDLY_LABEL: Record<string, string> = {
  목: "성장",
  화: "열정",
  토: "안정",
  금: "결단",
  수: "지혜",
}
