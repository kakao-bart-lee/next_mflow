/**
 * 오행(五行) 공통 색상 팔레트
 * 전통 오행 색상을 기반으로 한 채도를 낮춘 값 (bright → muted)
 * 이 파일을 단일 진실의 원천(Single Source of Truth)으로 사용할 것.
 */

export type ElementKey = "목" | "화" | "토" | "금" | "수"

/** 오행별 hex 색상 (바 차트, 인라인 스타일 등에 사용) */
export const ELEMENT_HEX: Record<string, string> = {
  목: "#16a34a", // 木 — 초록 (green-600)
  화: "#dc2626", // 火 — 빨강 (red-600)
  토: "#ca8a04", // 土 — 황금 (yellow-600)
  금: "#64748b", // 金 — 슬레이트 (slate-500)
  수: "#2563eb", // 水 — 파랑 (blue-600)
}

/** 오행별 연한 배경색 (카드 배경, 뱃지 등에 사용) */
export const ELEMENT_HEX_LIGHT: Record<string, string> = {
  목: "#dcfce7", // green-100
  화: "#fee2e2", // red-100
  토: "#fef9c3", // yellow-100
  금: "#f1f5f9", // slate-100
  수: "#dbeafe", // blue-100
}

/** Tailwind className 기반 색상 (필요한 경우 — 주로 ELEMENT_HEX를 인라인 스타일로 사용 권장) */
export const ELEMENT_BG_CLASS: Record<string, string> = {
  목: "bg-green-600",
  화: "bg-red-600",
  토: "bg-yellow-600",
  금: "bg-slate-500",
  수: "bg-blue-600",
}

/** 텍스트 대비용 (배경 위 텍스트) */
export const ELEMENT_TEXT_CLASS: Record<string, string> = {
  목: "text-white",
  화: "text-white",
  토: "text-white",
  금: "text-white",
  수: "text-white",
}

/** 오행 영문명 */
export const ELEMENT_LABEL: Record<string, string> = {
  목: "Wood",
  화: "Fire",
  토: "Earth",
  금: "Metal",
  수: "Water",
}
