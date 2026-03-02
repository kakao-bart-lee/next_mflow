# Ziwei API Contract (V1.1)

## Endpoints

- `POST /api/ziwei/board`
- `POST /api/ziwei/runtime-overlay`

## Common Request Fields

```json
{
  "birthDate": "1993-10-08",
  "birthTime": "14:37",
  "isTimeUnknown": false,
  "timezone": "Asia/Seoul",
  "gender": "F",
  "latitude": 37.5665,
  "longitude": 126.978,
  "calendar": "SOLAR",
  "isLeapMonth": false,
  "school": "DEFAULT",
  "plugins": ["MUTAGEN"],
  "fixLeap": true,
  "language": "ko-KR",
  "shichen": "WEI"
}
```

### Optional Runtime Fields (`/runtime-overlay`)

```json
{
  "targetDate": "2026-03-03",
  "targetTime": "11:00",
  "targetTimezone": "Asia/Seoul",
  "targetShichen": "WU"
}
```

## Common Response Envelope

```json
{
  "meta": {
    "policy_version": "ziwei-v1.1.0",
    "engine": "iztro",
    "engine_version": "2.5.8",
    "school": "DEFAULT",
    "plugins": ["MUTAGEN"],
    "calendar": "SOLAR"
  },
  "assumptions": [],
  "input_tier": "L3",
  "quality_flags": {
    "houses_computed": true,
    "time_is_assumed": false,
    "location_is_assumed": false
  },
  "shichen_candidates": []
}
```

## Input Tier Policy

- `L3`: date + time + location
- `L2`: date + location
- `L1`: date + time
- `L0`: date only

`isTimeUnknown=true`인 경우:

- `quality_flags.time_is_assumed=true`
- 기본 계산 시간은 `12:00`
- `shichen` 미입력 시 13개 시진 후보(`ZI_EARLY`~`ZI_LATE`)를 반환

## Output Shapes

### `/api/ziwei/board`

- `board`: 명반 요약 + 12궁 팔레스 데이터

### `/api/ziwei/runtime-overlay`

- `board_ref`: 명반 핵심 참조 필드
- `timing`: `decadal`, `age`, `yearly`, `monthly`, `daily`, `hourly`

## Cross-Service Mapping

`lib/astrology/shared/input-normalization.ts`의 공용 매핑을 사용해
Ziwei 입력과 Haruna Horizons 호출 입력(local_datetime/time_accuracy/timezone)을 일관되게 유지한다.
