# Haruna Horizons API Client (Astrology Runtime)

점성술 정적 분석에서 사용하는 Haruna Horizons 연동 문서입니다.

## 1) 실제 런타임 경로

- API 진입점: [app/api/astrology/static/route.ts](/Users/bart/workspace/talelapse/next-mflow/app/api/astrology/static/route.ts)
- 유스케이스(외부 호출 + 폴백): [lib/use-cases/analyze-astrology-static.ts](/Users/bart/workspace/talelapse/next-mflow/lib/use-cases/analyze-astrology-static.ts)
- Horizons 전용 클라이언트: [lib/astrology/horizons-client.ts](/Users/bart/workspace/talelapse/next-mflow/lib/astrology/horizons-client.ts)

참고:
- [lib/integrations/haruna-horizons-client.ts](/Users/bart/workspace/talelapse/next-mflow/lib/integrations/haruna-horizons-client.ts)는 범용 계약 테스트/유틸 성격의 클라이언트이며,
  현재 점성 정적 분석 런타임에서는 `lib/astrology/horizons-client.ts`를 사용합니다.

## 2) 사용 API

현재 서비스에서 실제 호출하는 엔드포인트는 아래 하나입니다.

- `POST /v1/ephemeris/positions`

요청 body 핵심 값:
- `birth.local_datetime`, `birth.timezone`, `birth.time_accuracy`
- `location.longitude_deg`, `location.latitude_deg`, `location.altitude_m`
- `bodies`: `SUN, MOON, MERCURY, VENUS, MARS, JUPITER, SATURN`
- `options`: `STANDARD / TRUE_ECLIPTIC_OF_DATE / GEOCENTRIC / with_velocity=false`

## 3) 환경변수

- `HARUNA_HORIZONS_BASE_URL`
  - 값이 설정되어 있고 `ASTROLOGY_USE_HORIZONS !== "false"`일 때 외부 호출 활성화
- `HARUNA_HORIZONS_API_KEY`
  - 선택, 설정 시 `Authorization: Bearer <token>` 전송
- `HARUNA_HORIZONS_TIMEOUT_MS`
  - 선택, 기본 `5000`
- `ASTROLOGY_USE_HORIZONS`
  - `false`면 외부 호출 비활성화하고 로컬 정적 계산만 사용

## 4) 오류 코드 매핑

Haruna 오류 코드는 내부 코드로 매핑됩니다.

- `invalid_request` -> `HORIZONS_INVALID_REQUEST` (400)
- `unsupported_option` -> `HORIZONS_UNSUPPORTED_OPTION` (422)
- `kernel_unavailable` -> `HORIZONS_KERNEL_UNAVAILABLE` (503)
- 기타 비정상 응답 -> `HORIZONS_SERVICE_ERROR` / `HORIZONS_BAD_RESPONSE`
- 네트워크 오류 -> `HORIZONS_NETWORK_ERROR`
- 타임아웃 -> `HORIZONS_TIMEOUT`
- base url 미설정 -> `HORIZONS_NOT_CONFIGURED`

## 5) 폴백 정책

유스케이스 기준 정책:

- fail-fast (즉시 오류 반환)
  - `HORIZONS_INVALID_REQUEST`
  - `HORIZONS_UNSUPPORTED_OPTION`
- 로컬 정적 계산으로 폴백
  - 네트워크/타임아웃/서비스 오류
  - `ASTROLOGY_LOCATION_REQUIRED` 포함(위치 누락 시도 로컬 정적 계산으로 진행)

## 6) 로컬 스모크 테스트 예시

```bash
curl -sS http://localhost:18787/v1/health

curl -sS -X POST http://localhost:18787/v1/ephemeris/positions \
  -H 'Content-Type: application/json' \
  -d '{
    "birth": {
      "local_datetime": "1990-01-15T14:30:00",
      "timezone": "Asia/Seoul",
      "time_accuracy": "minute"
    },
    "location": {
      "longitude_deg": 126.978,
      "latitude_deg": 37.5665,
      "altitude_m": 0
    },
    "bodies": ["SUN","MOON","MERCURY","VENUS","MARS","JUPITER","SATURN"],
    "options": {
      "precision": "STANDARD",
      "frame_mode": "TRUE_ECLIPTIC_OF_DATE",
      "observer_mode": "GEOCENTRIC",
      "with_velocity": false
    }
  }'
```
