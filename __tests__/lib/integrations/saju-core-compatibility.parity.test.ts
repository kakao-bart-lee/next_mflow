import { describe, expect, it } from "vitest";
import { pathToFileURL } from "node:url";
import {
  assertSajuSyncPreconditions,
  getRequiredArtifactPath,
} from "../../../scripts/saju-sync-preconditions";
import type { BirthInfo } from "@/lib/schemas/birth-info";
import type { FortuneResponse } from "@/lib/saju-core";
import {
  GunghapAnalyzer,
  CompatibilityType,
  type SajuData,
  type GunghapResult,
} from "@/lib/saju-core/saju/gunghap";
import { calculateSajuFromBirthInfo } from "@/lib/integrations/saju-core-adapter";
import casesJson from "../../fixtures/saju-compatibility-parity-cases.json";

type Case = {
  id: string;
  type: "love" | "marriage" | "business" | "friendship" | "general";
  personA: BirthInfo;
  personB: BirthInfo;
};

type UpstreamFacadeService = {
  calculateSaju: (request: {
    birthDate: string;
    birthTime: string;
    gender: "M" | "F";
    timezone: string;
  }) => FortuneResponse;
};

type UpstreamGunghapAnalyzerType = {
  analyzeCompatibility: (
    first: SajuData,
    second: SajuData,
    type: CompatibilityType
  ) => GunghapResult;
};

const TYPE_MAP: Record<Case["type"], CompatibilityType> = {
  love: CompatibilityType.LOVE,
  marriage: CompatibilityType.MARRIAGE,
  business: CompatibilityType.BUSINESS,
  friendship: CompatibilityType.FRIENDSHIP,
  general: CompatibilityType.GENERAL,
};

const cases = casesJson as Case[];
const preconditions = assertSajuSyncPreconditions(["facade-dist", "gunghap-dist"]);
const upstreamFacadePath = getRequiredArtifactPath(preconditions, "facade-dist");
const upstreamGunghapPath = getRequiredArtifactPath(preconditions, "gunghap-dist");

let upstreamFacade: UpstreamFacadeService | null = null;
let UpstreamGunghapAnalyzer: (new () => UpstreamGunghapAnalyzerType) | null = null;

async function loadUpstreamModules(): Promise<{
  facade: UpstreamFacadeService;
  GunghapAnalyzerClass: new () => UpstreamGunghapAnalyzerType;
}> {
  if (!upstreamFacade || !UpstreamGunghapAnalyzer) {
    const facadeModule = (await import(pathToFileURL(upstreamFacadePath).href)) as {
      FortuneTellerService: new () => UpstreamFacadeService;
    };
    const gunghapModule = (await import(pathToFileURL(upstreamGunghapPath).href)) as {
      GunghapAnalyzer: new () => UpstreamGunghapAnalyzerType;
    };
    upstreamFacade = new facadeModule.FortuneTellerService();
    UpstreamGunghapAnalyzer = gunghapModule.GunghapAnalyzer;
  }

  return {
    facade: upstreamFacade,
    GunghapAnalyzerClass: UpstreamGunghapAnalyzer,
  };
}

function toGunghapSajuData(fortune: FortuneResponse): SajuData {
  const p = fortune.sajuData.pillars;
  return {
    four_pillars: {
      년주: { 천간: p.년.천간, 지지: p.년.지지 },
      월주: { 천간: p.월.천간, 지지: p.월.지지 },
      일주: { 천간: p.일.천간, 지지: p.일.지지 },
      시주: { 천간: p.시.천간, 지지: p.시.지지 },
    },
  };
}

describe("saju compatibility parity (next_mflow vs saju-core-lib baseline)", () => {
  for (const testCase of cases) {
    it(`compatibility parity: ${testCase.id}`, async () => {
      const { facade, GunghapAnalyzerClass } = await loadUpstreamModules();

      const nextA = calculateSajuFromBirthInfo(testCase.personA);
      const nextB = calculateSajuFromBirthInfo(testCase.personB);
      const nextAnalyzer = new GunghapAnalyzer();
      const nextResult = nextAnalyzer.analyzeCompatibility(
        toGunghapSajuData(nextA),
        toGunghapSajuData(nextB),
        TYPE_MAP[testCase.type]
      );

      const upstreamA = facade.calculateSaju({
        birthDate: testCase.personA.birthDate,
        birthTime: testCase.personA.birthTime ?? "12:00",
        gender: testCase.personA.gender,
        timezone: testCase.personA.timezone,
      });
      const upstreamB = facade.calculateSaju({
        birthDate: testCase.personB.birthDate,
        birthTime: testCase.personB.birthTime ?? "12:00",
        gender: testCase.personB.gender,
        timezone: testCase.personB.timezone,
      });
      const upstreamAnalyzer = new GunghapAnalyzerClass();
      const upstreamResult = upstreamAnalyzer.analyzeCompatibility(
        toGunghapSajuData(upstreamA),
        toGunghapSajuData(upstreamB),
        TYPE_MAP[testCase.type]
      );

      expect(nextResult).toEqual(upstreamResult);
    });
  }
});
