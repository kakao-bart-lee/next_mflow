import { Mastra } from "@mastra/core";
import { sajuAgent } from "./agents/saju-agent";

export const mastra = new Mastra({
  agents: { sajuAgent },
});

export { sajuAgent };
