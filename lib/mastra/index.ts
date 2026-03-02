import { Mastra } from "@mastra/core"
import { sajuAgent } from "./agents/saju-agent"
import { sajuMasterAgent } from "./agents/saju-master-agent"
import { astrologerAgent } from "./agents/astrologer-agent"
import { fortuneOrchestrator } from "./agents/fortune-orchestrator"
import { chatAgent } from "./agents/chat-agent"
import { getStorage } from "./storage"

const storage = getStorage()

export const mastra = new Mastra({
  agents: { sajuAgent, sajuMasterAgent, astrologerAgent, fortuneOrchestrator, chatAgent },
  ...(storage ? { storage } : {}),
})

export {
  sajuAgent,
  sajuMasterAgent,
  astrologerAgent,
  fortuneOrchestrator,
  chatAgent,
}
