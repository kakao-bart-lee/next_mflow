# API Contract v1 (Draft)

목표:
- `next-mflow`와 병렬 개발 가능한 고정 계약 제공
- 계산 서비스는 수치 결과만 반환하고, 해석/문구는 호출측(Next.js)에서 처리

## 1) 입력 모델 (공통)

질문하신 입력은 거의 맞습니다.  
실무적으로는 아래를 권장합니다.

```json
{
  "birth": {
    "local_datetime": "1993-10-08T14:37:00",
    "timezone": "Asia/Seoul",
    "time_accuracy": "minute"
  },
  "location": {
    "longitude_deg": 126.978,
    "latitude_deg": 37.5665,
    "altitude_m": 30.0
  },
  "options": {
    "precision": "STANDARD",
    "frame_mode": "TRUE_ECLIPTIC_OF_DATE",
    "observer_mode": "GEOCENTRIC",
    "with_velocity": false
  }
}
```

### 필드 의미
- `birth.local_datetime`: 출생지 로컬 시각(오프셋 미포함 ISO8601 권장)
- `birth.timezone`: IANA timezone (`Asia/Seoul`, `America/New_York` 등)
- `birth.time_accuracy`: `minute | hour | day | unknown`
- `location.longitude_deg`, `location.latitude_deg`: WGS84 기준
- `location.altitude_m`: 선택(없으면 0)
- `options.precision`: `FAST | STANDARD | HIGH`
- `options.frame_mode`: `ECLIPJ2000 | TRUE_ECLIPTIC_OF_DATE`
- `options.observer_mode`: `GEOCENTRIC | TOPOCENTRIC` (v1은 GEOCENTRIC 우선, TOPOCENTRIC는 옵션 모드)

## 2) 엔드포인트

## 2.1 POST `/v1/ephemeris/positions`
다중 천체 lon/lat(+distance/speed) 계산

Request:
```json
{
  "birth": {
    "local_datetime": "1993-10-08T14:37:00",
    "timezone": "Asia/Seoul",
    "time_accuracy": "minute"
  },
  "location": {
    "longitude_deg": 126.978,
    "latitude_deg": 37.5665,
    "altitude_m": 30.0
  },
  "bodies": ["SUN", "MOON", "MARS"],
  "options": {
    "precision": "STANDARD",
    "frame_mode": "TRUE_ECLIPTIC_OF_DATE",
    "observer_mode": "GEOCENTRIC",
    "with_velocity": true
  }
}
```

Response:
```json
{
  "meta": {
    "kernel_profile": "de440s",
    "precision": "STANDARD",
    "abcorr": "LT+S",
    "frame_mode": "TRUE_ECLIPTIC_OF_DATE",
    "observer_mode": "GEOCENTRIC"
  },
  "observation_time_utc": "1993-10-08T05:37:00Z",
  "results": {
    "SUN": {
      "lon_deg": 195.123,
      "lat_deg": -0.001,
      "distance_km": 149000000.0,
      "speed_km_s": 30.12
    },
    "MOON": {
      "lon_deg": 278.456,
      "lat_deg": 2.115,
      "distance_km": 384400.0,
      "speed_km_s": 1.02
    }
  }
}
```

## 2.2 POST `/v1/saju/solar-longitude`
태양 황도경도 계산

Request:
```json
{
  "birth": {
    "local_datetime": "1993-10-08T14:37:00",
    "timezone": "Asia/Seoul",
    "time_accuracy": "minute"
  },
  "options": {
    "precision": "STANDARD",
    "frame_mode": "TRUE_ECLIPTIC_OF_DATE"
  }
}
```

Response:
```json
{
  "observation_time_utc": "1993-10-08T05:37:00Z",
  "solar_longitude_deg": 195.123,
  "meta": {
    "precision": "STANDARD",
    "abcorr": "LT+S",
    "frame_mode": "TRUE_ECLIPTIC_OF_DATE"
  }
}
```

## 2.3 POST `/v1/saju/solar-term-time`
특정 목표 경도(예: 0, 15, 30...)에 도달하는 시각 계산

Request:
```json
{
  "target_lon_deg": 0.0,
  "date_range": {
    "start_local_datetime": "2026-03-19T00:00:00",
    "end_local_datetime": "2026-03-22T00:00:00",
    "timezone": "Asia/Seoul"
  },
  "options": {
    "precision": "STANDARD",
    "frame_mode": "TRUE_ECLIPTIC_OF_DATE"
  }
}
```

Response:
```json
{
  "target_lon_deg": 0.0,
  "result_time_utc": "2026-03-20T09:01:23Z",
  "result_time_local": "2026-03-20T18:01:23+09:00",
  "iterations": 23,
  "achieved_error_deg": 0.0004,
  "meta": {
    "precision": "STANDARD",
    "frame_mode": "TRUE_ECLIPTIC_OF_DATE"
  }
}
```

## 3) 에러 계약

- `400 invalid_request`: 필수 필드 누락, 숫자 범위 오류
- `422 unsupported_option`: precision/frame/observer 모드 미지원
- `503 kernel_unavailable`: 커널 누락/로딩 실패

에러 응답 예:
```json
{
  "error": {
    "code": "kernel_unavailable",
    "message": "Missing kernel files referenced by meta-kernel",
    "details": ["de440s.bsp not found"]
  }
}
```

## 4) 병렬 개발을 위한 고정 룰

- 모든 요청은 로컬시각+timezone로 받아 내부 UTC로 정규화
- `observer_mode=GEOCENTRIC`를 v1 기본값으로 고정
- `TOPOCENTRIC`는 v1 옵션(미구현 시 `422 unsupported_option`)
- 응답에는 항상 `meta`를 넣어 계산 조건 추적 가능하게 유지
- `kernel_profile`/`precision`/`frame_mode` 변경은 버전 명시(`v1` 유지 시 하위호환)

## 5) 질문에 대한 직접 답변

네, `생년월일시 + 태어난 장소의 경도/위도`를 입력으로 받는 게 맞습니다.  
추가로 `timezone`(필수)와 `time_accuracy`(권장)를 같이 받는 것을 권장합니다.
