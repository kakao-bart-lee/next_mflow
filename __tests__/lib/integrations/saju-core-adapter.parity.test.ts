import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
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

const cases = parityCases as ParityCase[];
const upstreamRoot = process.env.SAJU_CORE_LIB_PATH
  ? path.resolve(process.env.SAJU_CORE_LIB_PATH)
  : path.resolve(process.cwd(), "../saju-core-lib");
const upstreamFacadePath = path.resolve(upstreamRoot, "dist/esm/facade.js");
const parityEnabled = existsSync(upstreamFacadePath);

let upstreamService: UpstreamService | null = null;

async function getUpstreamService(): Promise<UpstreamService> {
  if (upstreamService) {
    return upstreamService;
  }

  const moduleUrl = pathToFileURL(upstreamFacadePath).href;
  const module = (await import(moduleUrl)) as {
    FortuneTellerService: new () => UpstreamService;
  };
  upstreamService = new module.FortuneTellerService();
  return upstreamService;
}

function toFortuneRequest(testCase: ParityCase): FortuneRequest {
  return {
    birthDate: testCase.birthDate,
    birthTime: testCase.birthTime,
    gender: testCase.gender,
    timezone: testCase.timezone,
  };
}

function normalizeCoreFortune(result: FortuneResponse): unknown {
  const pillars = result.sajuData.pillars;
  const normalizePillar = (pillar: (typeof pillars)[keyof typeof pillars]) => ({
    천간: pillar.천간,
    지지: pillar.지지,
    오행: pillar.오행,
    십이운성: pillar.십이운성,
    신살: [...pillar.신살].sort(),
    지장간: pillar.지장간.map((item) => ({ 간: item.간, 십신: item.십신 })),
  });

  return {
    basicInfo: result.sajuData.basicInfo,
    pillars: {
      년: normalizePillar(pillars.년),
      월: normalizePillar(pillars.월),
      일: normalizePillar(pillars.일),
      시: normalizePillar(pillars.시),
    },
    sipsin: result.sipsin ?? null,
    sinyakSingang: result.sinyakSingang ?? null,
    greatFortune: result.greatFortune ?? null,
    hyungchung: result.hyungchung ?? null,
  };
}

const parityDescribe = parityEnabled ? describe : describe.skip;

parityDescribe("saju-core parity (next_mflow adapter vs saju-core-lib baseline)", () => {
  let warnSpy: ReturnType<typeof vi.spyOn> | null = null;

  beforeAll(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterAll(() => {
    warnSpy?.mockRestore();
  });

  it("uses pinned baseline short sha", () => {
    expect(SAJU_CORE_BASELINE_SHORT_SHA).toBe("6aac047");
  });

  for (const testCase of cases) {
    it(`calculateSaju parity: ${testCase.id}`, async () => {
      const upstream = await getUpstreamService();

      const adapterResult = calculateSajuFromBirthInfo({
        ...testCase,
        isTimeUnknown: false,
      });
      const upstreamResult = upstream.calculateSaju(toFortuneRequest(testCase));

      expect(normalizeCoreFortune(adapterResult)).toEqual(
        normalizeCoreFortune(upstreamResult)
      );
    });
  }

  for (const testCase of cases) {
    it(`basic profile core parity: ${testCase.id}`, async () => {
      const upstream = await getUpstreamService();

      const adapterResult = getSajuFortuneFromBirthInfo(
        {
          ...testCase,
          isTimeUnknown: false,
        },
        "basic"
      );
      const upstreamResult = upstream.getSajuFortune(
        toFortuneRequest(testCase),
        "basic"
      );

      expect(normalizeCoreFortune(adapterResult)).toEqual(
        normalizeCoreFortune(upstreamResult)
      );
    });
  }
});
