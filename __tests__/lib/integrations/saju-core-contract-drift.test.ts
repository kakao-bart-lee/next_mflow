import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { FortuneRequest, FortuneResponse } from "@/lib/saju-core";
import {
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
const upstreamRoot = process.env.SAJU_CORE_LIB_PATH
  ? path.resolve(process.env.SAJU_CORE_LIB_PATH)
  : path.resolve(process.cwd(), "../saju-core-lib");
const upstreamFacadePath = path.resolve(upstreamRoot, "dist/esm/facade.js");
const driftEnabled = existsSync(upstreamFacadePath);

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

const driftDescribe = driftEnabled ? describe : describe.skip;

driftDescribe("saju contract drift snapshot (next_mflow vs saju-core-lib@6aac047)", () => {
  let warnSpy: ReturnType<typeof vi.spyOn> | null = null;

  beforeAll(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterAll(() => {
    warnSpy?.mockRestore();
  });

  it("calculateSaju drift is limited to inputData.jumno", async () => {
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

    expect(adapterOnly).toEqual(["jumno"]);
    expect(upstreamOnly).toEqual([]);
  });

  it("basic fortune drift is captured as known adapter-only extensions", async () => {
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
    expect(Boolean(upstreamResult.fortuneProfileResult)).toBe(false);

    const adapterKeys = Object.keys(adapterResult.inputData ?? {}).sort();
    const upstreamKeys = Object.keys(upstreamResult.inputData ?? {}).sort();
    const adapterOnly = adapterKeys.filter((key) => !upstreamKeys.includes(key)).sort();

    expect(adapterOnly).toEqual([
      "fortune_type_description",
      "jumno",
      "profile_id",
      "theme_interpretation",
    ]);
  });
});
