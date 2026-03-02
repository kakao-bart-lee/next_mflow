import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"
import { createHash } from "crypto"

// =============================================================================
// Fortune Cache — Analysis 테이블 재활용
// =============================================================================

export type FortuneExpertId = "daily" | "weekly" | "decision"

export interface FortuneCacheKey {
  userId: string
  expertId: FortuneExpertId
  /** daily: "YYYY-MM-DD", weekly: weekStartDate "YYYY-MM-DD" */
  dateKey: string
  /** decision 전용: optionA + optionB 해시 */
  contextHash?: string
}

/**
 * decision 캐시용 contextHash 생성
 * optionA + optionB를 SHA-256 해시하여 짧은 식별자로 변환
 */
export function buildContextHash(optionA: string, optionB: string): string {
  return createHash("sha256")
    .update(`${optionA}||${optionB}`)
    .digest("hex")
    .slice(0, 16)
}

/**
 * 캐시된 fortune 결과 조회
 *
 * Analysis 테이블에서 (userId, expertId, dateKey[, contextHash]) 조합으로 검색.
 * 패턴: journal API의 JSON path 쿼리와 동일 (input.dateKey === key.dateKey)
 */
export async function getCachedFortune<T>(
  key: FortuneCacheKey
): Promise<T | null> {
  const where: Prisma.AnalysisWhereInput = {
    userId: key.userId,
    expertId: key.expertId,
    input: {
      path: ["dateKey"],
      equals: key.dateKey,
    },
  }

  const rows = await prisma.analysis.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { input: true, result: true },
  })

  // contextHash 매칭 (decision 타입)
  for (const row of rows) {
    if (!isJsonObject(row.input)) continue
    if (key.contextHash) {
      if (row.input.contextHash !== key.contextHash) continue
    }
    if (!isJsonObject(row.result)) continue
    return row.result as unknown as T
  }

  return null
}

/**
 * fortune 결과를 캐시에 저장
 *
 * Analysis 테이블에 새 레코드 생성.
 * input JSON에 dateKey(+ contextHash)를 포함하여 조회 가능하게 구성.
 */
export async function cacheFortune<T>(
  key: FortuneCacheKey,
  input: Record<string, unknown>,
  result: T
): Promise<void> {
  await prisma.analysis.create({
    data: {
      userId: key.userId,
      expertId: key.expertId,
      input: {
        ...input,
        dateKey: key.dateKey,
        ...(key.contextHash ? { contextHash: key.contextHash } : {}),
      } as Prisma.InputJsonValue,
      result: result as Prisma.InputJsonValue,
    },
  })
}

// =============================================================================
// Helpers
// =============================================================================

function isJsonObject(
  value: Prisma.JsonValue | null | undefined
): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
