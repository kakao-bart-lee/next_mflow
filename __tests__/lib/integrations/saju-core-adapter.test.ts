import { describe, expect, it } from "vitest";
import type { BirthInfo } from "@/lib/schemas/birth-info";
import {
  SAJU_CORE_BASELINE_SHA,
  SAJU_CORE_BASELINE_SHORT_SHA,
  getSajuCoreEngineMetadata,
  toFortuneRequest,
} from "@/lib/integrations/saju-core-adapter";

describe("saju-core adapter", () => {
  it("pins baseline sha in adapter metadata", () => {
    const metadata = getSajuCoreEngineMetadata();
    expect(metadata.source).toBe("saju-core-lib");
    expect(metadata.baselineSha).toBe(SAJU_CORE_BASELINE_SHA);
    expect(SAJU_CORE_BASELINE_SHORT_SHA).toBe("1e57848");
  });

  it("normalizes unknown birth time to noon", () => {
    const birthInfo: BirthInfo = {
      birthDate: "1990-01-15",
      birthTime: null,
      isTimeUnknown: true,
      timezone: "Asia/Seoul",
      gender: "M",
    };

    expect(toFortuneRequest(birthInfo)).toEqual({
      birthDate: "1990-01-15",
      birthTime: "12:00",
      gender: "M",
      timezone: "Asia/Seoul",
    });
  });
});
