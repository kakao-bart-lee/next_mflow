import { describe, expect, it } from "vitest";

import {
  HarunaHorizonsClient,
  HarunaHorizonsError,
} from "@/lib/integrations/haruna-horizons-client";

describe("HarunaHorizonsClient", () => {
  it("calls health endpoint", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const client = new HarunaHorizonsClient({
      baseUrl: "http://localhost:8787",
      fetchImpl,
    });

    await expect(client.health()).resolves.toEqual({ status: "ok" });
  });

  it("calls positions endpoint", async () => {
    const payload = {
      meta: {
        kernel_profile: "de440s",
        precision: "STANDARD",
        abcorr: "LT+S",
        frame_mode: "TRUE_ECLIPTIC_OF_DATE",
        observer_mode: "GEOCENTRIC",
      },
      observation_time_utc: "2026-03-20T03:00:00Z",
      results: {
        SUN: {
          lon_deg: 10.5,
          lat_deg: 0.1,
          distance_km: 1,
          speed_km_s: null,
        },
      },
    };

    const fetchImpl: typeof fetch = async (_input, init) => {
      expect(init?.method).toBe("POST");
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const client = new HarunaHorizonsClient({
      baseUrl: "http://localhost:8787",
      fetchImpl,
    });

    const response = await client.positions({
      birth: {
        local_datetime: "1993-10-08T14:37:00",
        timezone: "Asia/Seoul",
      },
      location: { longitude_deg: 126.978, latitude_deg: 37.5665 },
      bodies: ["SUN"],
      options: {
        precision: "STANDARD",
        frame_mode: "TRUE_ECLIPTIC_OF_DATE",
        observer_mode: "GEOCENTRIC",
      },
    });

    expect(response.results.SUN.lon_deg).toBe(10.5);
  });

  it("throws HarunaHorizonsError on API failure", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "unsupported_option",
            message: "observer_mode is not supported.",
            details: [],
          },
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        },
      );

    const client = new HarunaHorizonsClient({
      baseUrl: "http://localhost:8787",
      fetchImpl,
    });

    await expect(
      client.positions({
        birth: {
          local_datetime: "1993-10-08T14:37:00",
          timezone: "Asia/Seoul",
        },
        location: { longitude_deg: 126.978, latitude_deg: 37.5665 },
        bodies: ["SUN"],
        options: {
          observer_mode: "TOPOCENTRIC",
        },
      }),
    ).rejects.toBeInstanceOf(HarunaHorizonsError);
  });
});
