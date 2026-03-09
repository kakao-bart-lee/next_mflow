import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  mockAuth,
  mockCalculateSajuFromBirthInfo,
  mockGetSajuCoreEngineMetadata,
  mockAnalyzeCompatibility,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCalculateSajuFromBirthInfo: vi.fn(),
  mockGetSajuCoreEngineMetadata: vi.fn(),
  mockAnalyzeCompatibility: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/integrations/saju-core-adapter", () => ({
  calculateSajuFromBirthInfo: mockCalculateSajuFromBirthInfo,
  getSajuCoreEngineMetadata: mockGetSajuCoreEngineMetadata,
}));

vi.mock("@/lib/saju-core/saju/gunghap", () => {
  class GunghapAnalyzer {
    analyzeCompatibility = mockAnalyzeCompatibility;
  }

  return {
    GunghapAnalyzer,
    CompatibilityType: {
      LOVE: "LOVE",
      MARRIAGE: "MARRIAGE",
      BUSINESS: "BUSINESS",
      FRIENDSHIP: "FRIENDSHIP",
      GENERAL: "GENERAL",
    },
  };
});

vi.mock("@/lib/saju-core/saju/legacyCompatibility", () => {
  const nil = vi.fn(() => null);
  return {
    buildLegacyBedroomInsight: nil,
    buildLegacyFutureSpouseInsight: nil,
    buildLegacyIntimacyInsight: nil,
    buildLegacyMarriageTimingTableInsight: nil,
    buildLegacySpouseCoreInsight: nil,
    buildLegacyPartnerRoleInsight: nil,
    buildLegacyRelationshipTimingInsight: nil,
    buildLegacyMarriageFlowInsight: nil,
    buildLegacyLoveStyleInsight: nil,
    buildLegacyLoveWeakPointInsight: nil,
    buildLegacyDestinyCoreInsight: nil,
    buildLegacyOuterCompatibilityInsight: nil,
    buildLegacyPartnerPersonalityInsight: nil,
    buildLegacyTraditionalCompatibilityInsight: nil,
    buildLegacyTypeProfileInsight: nil,
    buildLegacyYearlyLoveCycleInsight: nil,
    buildLegacyBasicCompatibilityInsight: nil,
    buildLegacyDetailedCompatibilityInsight: nil,
    buildLegacyZodiacCompatibilityInsight: nil,
    buildLegacyAnimalCompatibilityInsight: nil,
    buildLegacySasangCompatibilityInsight: nil,
  };
});

import { POST } from "@/app/api/saju/compatibility/route";

const PERSON = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M" as const,
};

const MOCK_FORTUNE = {
  sajuData: {
    pillars: {
      년: { 천간: "갑(甲)", 지지: "자(子)" },
      월: { 천간: "을(乙)", 지지: "축(丑)" },
      일: { 천간: "병(丙)", 지지: "인(寅)" },
      시: { 천간: "정(丁)", 지지: "묘(卯)" },
    },
  },
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/saju/compatibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/saju/compatibility", () => {
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

  afterAll(() => {
    infoSpy.mockRestore();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCalculateSajuFromBirthInfo.mockReturnValue(MOCK_FORTUNE);
    mockGetSajuCoreEngineMetadata.mockReturnValue({
      source: "saju-core-lib",
      baselineSha: "1e57848e115b2bee38149c76c63b3d4a487254d2",
      adapter: "next_mflow/lib/integrations/saju-core-adapter",
    });
    mockAnalyzeCompatibility.mockReturnValue({
      total_score: 82,
      personality_match: 80,
      fortune_match: 81,
      health_match: 79,
      wealth_match: 84,
      career_match: 83,
      overall_interpretation: "compat summary",
      recommendations: ["r1", "r2"],
    });
  });

  it("valid request returns compatibility payload", async () => {
    const response = await POST(
      makeRequest({
        personA: PERSON,
        personB: { ...PERSON, gender: "F" },
        type: "general",
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.total_score).toBe(82);
    expect(json.data.overall_interpretation).toBe("compat summary");
    expect(json.data.legacy_provenance?.source).toBe("saju-core-lib");
    expect(json.data.legacy_provenance?.baselineSha).toBe(
      "1e57848e115b2bee38149c76c63b3d4a487254d2"
    );
    expect(json.data.legacy_provenance?.entries?.legacy_bedroom?.status).toBe("lookup_not_found");
    expect(json.data.legacy_provenance?.entries?.legacy_sasang_compat?.status).toBe("missing_input");
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith(
      "[saju-compatibility] legacy provenance",
      expect.objectContaining({
        route: "/api/saju/compatibility",
        source: "saju-core-lib",
        baselineSha: "1e57848e115b2bee38149c76c63b3d4a487254d2",
        totalEntries: 24,
      })
    );
    expect(mockCalculateSajuFromBirthInfo).toHaveBeenCalledTimes(2);
  });

  it("invalid schema returns 422", async () => {
    const response = await POST(
      makeRequest({
        personA: { birthDate: "bad-date" },
        personB: PERSON,
      })
    );
    expect(response.status).toBe(422);
  });

  it("analysis exception returns 500", async () => {
    mockAnalyzeCompatibility.mockImplementation(() => {
      throw new Error("boom");
    });
    const response = await POST(
      makeRequest({
        personA: PERSON,
        personB: { ...PERSON, gender: "F" },
        type: "love",
      })
    );
    expect(response.status).toBe(500);
  });
});
