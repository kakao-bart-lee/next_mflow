"use client"

import { ChevronDown } from "lucide-react"

interface WhyThisResultProps {
  onClick: () => void
  className?: string
}

/**
 * "근거 살펴보기" — 근거 레이어 진입 텍스트 링크
 * 은은한 inline 스타일로 콘텐츠 하단에 자연스럽게 배치
 */
export function WhyThisResult({ onClick, className = "" }: WhyThisResultProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs text-muted-foreground/70 transition-colors hover:text-foreground ${className}`}
      type="button"
    >
      <span>해석 들여다보기</span>
      <ChevronDown className="h-3 w-3" />
    </button>
  )
}
