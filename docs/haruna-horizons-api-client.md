# Haruna Horizons API Client

Internal client for the Python ephemeris service.

File:
- [lib/integrations/haruna-horizons-client.ts](/Users/bart/workspace/talelapse/next-mflow/lib/integrations/haruna-horizons-client.ts)

## Env

- `HARUNA_HORIZONS_BASE_URL` (default: `http://localhost:8787`)

## Example

```ts
import { HarunaHorizonsClient } from "@/lib/integrations/haruna-horizons-client";

const client = new HarunaHorizonsClient();

const positions = await client.positions({
  birth: {
    local_datetime: "1993-10-08T14:37:00",
    timezone: "Asia/Seoul",
    time_accuracy: "minute",
  },
  location: {
    longitude_deg: 126.978,
    latitude_deg: 37.5665,
    altitude_m: 30,
  },
  bodies: ["SUN", "MOON", "MARS"],
  options: {
    precision: "STANDARD",
    frame_mode: "TRUE_ECLIPTIC_OF_DATE",
    observer_mode: "GEOCENTRIC",
    with_velocity: true,
  },
});
```
