export type Precision = "FAST" | "STANDARD" | "HIGH";
export type FrameMode = "ECLIPJ2000" | "TRUE_ECLIPTIC_OF_DATE";
export type ObserverMode = "GEOCENTRIC" | "TOPOCENTRIC";
export type TimeAccuracy = "minute" | "hour" | "day" | "unknown";

export interface BirthInput {
  local_datetime: string;
  timezone: string;
  time_accuracy?: TimeAccuracy;
}

export interface LocationInput {
  longitude_deg: number;
  latitude_deg: number;
  altitude_m?: number;
}

export interface PositionOptions {
  precision?: Precision;
  frame_mode?: FrameMode;
  observer_mode?: ObserverMode;
  with_velocity?: boolean;
}

export interface DateRangeInput {
  start_local_datetime: string;
  end_local_datetime: string;
  timezone: string;
}

export interface PositionsRequest {
  birth: BirthInput;
  location: LocationInput;
  bodies?: string[];
  options?: PositionOptions;
}

export interface SolarLongitudeRequest {
  birth: BirthInput;
  options?: PositionOptions;
}

export interface SolarTermRequest {
  target_lon_deg: number;
  date_range: DateRangeInput;
  options?: PositionOptions;
}

export interface PositionValue {
  lon_deg: number;
  lat_deg: number;
  distance_km: number;
  speed_km_s: number | null;
}

export interface MetaResponse {
  kernel_profile: string;
  precision: Precision;
  abcorr: string;
  frame_mode: FrameMode;
  observer_mode: ObserverMode;
}

export interface PositionsResponse {
  meta: MetaResponse;
  observation_time_utc: string;
  results: Record<string, PositionValue>;
}

export interface SolarLongitudeResponse {
  observation_time_utc: string;
  solar_longitude_deg: number;
  meta: MetaResponse;
}

export interface SolarTermResponse {
  target_lon_deg: number;
  result_time_utc: string;
  result_time_local: string;
  iterations: number;
  achieved_error_deg: number;
  meta: MetaResponse;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details: string[];
  };
}

export class HarunaHorizonsError extends Error {
  status: number;
  payload?: ErrorResponse;

  constructor(message: string, status: number, payload?: ErrorResponse) {
    super(message);
    this.name = "HarunaHorizonsError";
    this.status = status;
    this.payload = payload;
  }
}

export interface HarunaHorizonsClientOptions {
  baseUrl?: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

const DEFAULT_BASE_URL =
  process.env.HARUNA_HORIZONS_BASE_URL ?? "http://localhost:8787";

export class HarunaHorizonsClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: HarunaHorizonsClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.token = options.token;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async health(): Promise<{ status: string }> {
    return this.request<{ status: string }>("GET", "/v1/health");
  }

  async positions(payload: PositionsRequest): Promise<PositionsResponse> {
    return this.request<PositionsResponse>(
      "POST",
      "/v1/ephemeris/positions",
      payload,
    );
  }

  async solarLongitude(
    payload: SolarLongitudeRequest,
  ): Promise<SolarLongitudeResponse> {
    return this.request<SolarLongitudeResponse>(
      "POST",
      "/v1/saju/solar-longitude",
      payload,
    );
  }

  async solarTermTime(payload: SolarTermRequest): Promise<SolarTermResponse> {
    return this.request<SolarTermResponse>(
      "POST",
      "/v1/saju/solar-term-time",
      payload,
    );
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch {
      parsed = undefined;
    }

    if (!response.ok) {
      const payload = parsed as ErrorResponse | undefined;
      const message = payload?.error?.message ?? `Request failed: ${response.status}`;
      throw new HarunaHorizonsError(message, response.status, payload);
    }

    return parsed as T;
  }
}
