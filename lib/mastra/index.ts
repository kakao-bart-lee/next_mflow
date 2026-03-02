import { Mastra } from "@mastra/core"
import { sajuAgent } from "./agents/saju-agent"
import { sajuMasterAgent } from "./agents/saju-master-agent"
import { astrologerAgent } from "./agents/astrologer-agent"
import { fortuneOrchestrator } from "./agents/fortune-orchestrator"
import { storage } from "./storage"

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
