import type { ZiweiBoardRequest, ZiweiRuntimeOverlayRequest } from "@/lib/schemas/ziwei"
import {
  generateZiweiBoard,
  generateZiweiRuntimeOverlay,
  ZiweiEngineError,
} from "@/lib/ziwei/engine"
import type { ZiweiBoardResponse, ZiweiRuntimeOverlayResponse } from "@/lib/ziwei/types"

export type AnalyzeZiweiBoardResult =
  | { success: true; data: ZiweiBoardResponse }
  | { success: false; error: string; code: string; status: number }

export type AnalyzeZiweiRuntimeOverlayResult =
  | { success: true; data: ZiweiRuntimeOverlayResponse }
  | { success: false; error: string; code: string; status: number }

export function analyzeZiweiBoard(input: ZiweiBoardRequest): AnalyzeZiweiBoardResult {
  try {
    return {
      success: true,
      data: generateZiweiBoard(input),
    }
  } catch (err) {
    if (err instanceof ZiweiEngineError) {
      return {
        success: false,
        error: err.message,
        code: err.code,
        status: err.status,
      }
    }
    return {
      success: false,
      error: "자미두수 명반 계산 중 오류가 발생했습니다",
      code: "ZIWEI_CALCULATION_ERROR",
      status: 500,
    }
  }
}

export function analyzeZiweiRuntimeOverlay(
  input: ZiweiRuntimeOverlayRequest
): AnalyzeZiweiRuntimeOverlayResult {
  try {
    return {
      success: true,
      data: generateZiweiRuntimeOverlay(input),
    }
  } catch (err) {
    if (err instanceof ZiweiEngineError) {
      return {
        success: false,
        error: err.message,
        code: err.code,
        status: err.status,
      }
    }
    return {
      success: false,
      error: "자미두수 운한 계산 중 오류가 발생했습니다",
      code: "ZIWEI_RUNTIME_ERROR",
      status: 500,
    }
  }
}
