import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { pathToFileURL } from "node:url";
import {
  getSajuSyncPreconditionStatus,
  getRequiredArtifactPath,
} from "../../../scripts/saju-sync-preconditions";
import type { FortuneRequest, FortuneResponse } from "@/lib/saju-core";
import {
  SAJU_CORE_BASELINE_SHORT_SHA,
  calculateSajuFromBirthInfo,
  getSajuFortuneFromBirthInfo,
} from "@/lib/integrations/saju-core-adapter";
import parityCases from "../../fixtures/saju-core-parity-cases.json";

type ParityCase = {
  id: string;
  birthDate: string;
  birthTime: string;
  gender: "M" | "F";
  timezone: string;
};

type UpstreamService = {
  calculateSaju: (request: FortuneRequest) => FortuneResponse;
  getSajuFortune: (request: FortuneRequest, fortuneTypeOrProfileId: string) => FortuneResponse;
};

const coreCase = (parityCases as ParityCase[])[0];
const preconditions = getSajuSyncPreconditionStatus(["facade-dist"]);
const upstreamFacadePath = getRequiredArtifactPath(preconditions, "facade-dist");
const driftDescribe = preconditions.missing.length === 0 ? describe : describe.skip;

let upstreamService: UpstreamService | null = null;

async function getUpstreamService(): Promise<UpstreamService> {
  if (upstreamService) {
    return upstreamService;
  }

  const module = (await import(pathToFileURL(upstreamFacadePath).href)) as {
    FortuneTellerService: new () => UpstreamService;
  };
  upstreamService = new module.FortuneTellerService();
  return upstreamService;
}

function toRequest(input: ParityCase): FortuneRequest {
  return {
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    gender: input.gender,
    timezone: input.timezone,
  };
}

driftDescribe(
  `saju contract drift snapshot (next_mflow vs saju-core-lib@${SAJU_CORE_BASELINE_SHORT_SHA})`,
  () => {
    let warnSpy: ReturnType<typeof vi.spyOn> | null = null;

    beforeAll(() => {
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterAll(() => {
      warnSpy?.mockRestore();
    });

    it("calculateSaju inputData keys are aligned", async () => {
      const upstream = await getUpstreamService();
      const adapterResult = calculateSajuFromBirthInfo({
        ...coreCase,
        isTimeUnknown: false,
      });
      const upstreamResult = upstream.calculateSaju(toRequest(coreCase));

      const adapterKeys = Object.keys(adapterResult.inputData ?? {}).sort();
      const upstreamKeys = Object.keys(upstreamResult.inputData ?? {}).sort();

      const adapterOnly = adapterKeys.filter((key) => !upstreamKeys.includes(key)).sort();
      const upstreamOnly = upstreamKeys.filter((key) => !adapterKeys.includes(key)).sort();

      expect(adapterOnly).toEqual([]);
      expect(upstreamOnly).toEqual([]);
    });

    it("basic fortune extended keys are aligned", async () => {
      const upstream = await getUpstreamService();
      const adapterResult = getSajuFortuneFromBirthInfo(
        {
          ...coreCase,
          isTimeUnknown: false,
        },
        "basic"
      );
      const upstreamResult = upstream.getSajuFortune(toRequest(coreCase), "basic");

      expect(Boolean(adapterResult.fortuneProfileResult)).toBe(true);
      expect(Boolean(upstreamResult.fortuneProfileResult)).toBe(true);

      const adapterKeys = Object.keys(adapterResult.inputData ?? {}).sort();
      const upstreamKeys = Object.keys(upstreamResult.inputData ?? {}).sort();
      const adapterOnly = adapterKeys.filter((key) => !upstreamKeys.includes(key)).sort();
      const upstreamOnly = upstreamKeys.filter((key) => !adapterKeys.includes(key)).sort();

      expect(adapterOnly).toEqual([]);
      expect(upstreamOnly).toEqual([]);
    });
  }
);
