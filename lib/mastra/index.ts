import { Mastra } from "@mastra/core"
import { LibSQLStore } from "@mastra/libsql"
import { sajuAgent } from "./agents/saju-agent"
import { sajuMasterAgent } from "./agents/saju-master-agent"
import { astrologerAgent } from "./agents/astrologer-agent"
import { fortuneOrchestrator } from "./agents/fortune-orchestrator"

const storage = new LibSQLStore({
  id: "mastra-storage",
  url: process.env.MASTRA_MEMORY_DB_URL || "file:./mastra-memory.db",
})

export const mastra = new Mastra({
  agents: { sajuAgent, sajuMasterAgent, astrologerAgent, fortuneOrchestrator },
  storage,
})

export {
  sajuAgent,
  sajuMasterAgent,
  astrologerAgent,
  fortuneOrchestrator,
}
