import { LibSQLStore } from "@mastra/libsql"

/**
 * Mastra 공유 스토리지 — Memory와 Mastra 인스턴스 모두 이 인스턴스를 사용.
 * 별도 모듈로 분리하여 순환 의존성(index ↔ orchestrator) 방지.
 */
export const storage = new LibSQLStore({
  id: "mastra-storage",
  url: process.env.MASTRA_MEMORY_DB_URL || "file:./mastra-memory.db",
})
