import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { BirthInfo } from "@/lib/schemas/birth-info";
import {
  SAJU_CORE_BASELINE_SHORT_SHA,
  calculateSajuFromBirthInfo,
} from "@/lib/integrations/saju-core-adapter";
import {
  buildLegacyAnimalCompatibilityInsight,
  buildLegacyBasicCompatibilityInsight,
  buildLegacyDetailedCompatibilityInsight,
  buildLegacySasangCompatibilityInsight,
  buildLegacyZodiacCompatibilityInsight,
  type SasangConstitution,
} from "@/lib/saju-core/saju/legacyCompatibility";
import fixtureJson from "../../fixtures/saju-legacy-gcode-parity-cases.json";

type InsightSummary = {
  sourceTable: string;
  lookupKey: string;
  score: number | null;
  textLength: number;
  textSha256: string;
};

type Case = {
  id: string;
  personA: BirthInfo & { sasangConstitution?: SasangConstitution };
  personB: BirthInfo & { sasangConstitution?: SasangConstitution };
  expected: {
    g003: InsightSummary;
    g012: InsightSummary;
    g019: InsightSummary;
    g026: InsightSummary;
    g028: InsightSummary;
  };
};

const cases = fixtureJson as Case[];

function summarizeInsight(value: {
  sourceTable: string;
  lookupKey: string;
  text: string;
  score?: number | null;
} | null): InsightSummary | null {
  if (!value) {
    return null;
  }

  return {
    sourceTable: value.sourceTable,
    lookupKey: value.lookupKey,
    score: value.score ?? null,
    textLength: value.text.length,
    textSha256: createHash("sha256").update(value.text, "utf8").digest("hex"),
  };
}

describe("saju legacy G-code parity snapshot", () => {
  it("uses pinned baseline short sha", () => {
    expect(SAJU_CORE_BASELINE_SHORT_SHA).toBe("cdbd4c7");
  });

  for (const testCase of cases) {
    it(`matches fixture snapshot for ${testCase.id}`, () => {
      const fortuneA = calculateSajuFromBirthInfo(testCase.personA);
      const fortuneB = calculateSajuFromBirthInfo(testCase.personB);

      const actual = {
        g003: summarizeInsight(buildLegacyBasicCompatibilityInsight(testCase.personA, fortuneA)),
        g012: summarizeInsight(buildLegacyDetailedCompatibilityInsight(fortuneA)),
        g019: summarizeInsight(buildLegacyZodiacCompatibilityInsight(testCase.personA)),
        g026: summarizeInsight(buildLegacyAnimalCompatibilityInsight(fortuneA, fortuneB)),
        g028: summarizeInsight(
          buildLegacySasangCompatibilityInsight(
            testCase.personA.sasangConstitution,
            testCase.personB.sasangConstitution
          )
        ),
      };

      expect(actual).toEqual(testCase.expected);
    });
  }
});
