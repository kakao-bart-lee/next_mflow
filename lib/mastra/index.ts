import { Mastra } from "@mastra/core";
import { sajuAgent } from "./agents/saju-agent";
import { sajuMasterAgent } from "./agents/saju-master-agent";
import { astrologerAgent } from "./agents/astrologer-agent";

export const mastra = new Mastra({
  agents: { sajuAgent, sajuMasterAgent, astrologerAgent },
});

export { sajuAgent, sajuMasterAgent, astrologerAgent };
