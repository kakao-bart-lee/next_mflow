import { PostgresStore } from "@mastra/pg"

/**
 * Mastra 공유 스토리지 — Memory와 Mastra 인스턴스 모두 이 인스턴스를 사용.
 * 별도 모듈로 분리하여 순환 의존성(index ↔ orchestrator) 방지.
 *
 * LibSQLStore → PostgresStore 전환:
 * - 동일 PostgreSQL에 mastra_threads/mastra_messages 테이블 자동 생성
 * - 별도 SQLite 파일(mastra-memory.db) 불필요
 * - Next.js HMR에서 안전한 singleton 패턴 (Prisma와 동일)
 */

declare global {
  // eslint-disable-next-line no-var
  var pgStore: PostgresStore | undefined
}

function getPgStore(): PostgresStore {
  if (!global.pgStore) {
    global.pgStore = new PostgresStore({
      id: "mastra-storage",
      connectionString: process.env.DATABASE_URL!,
    })
  }
  return global.pgStore
}

export const storage = getPgStore()
