---
name: saju-debug
description: 사주 엔진 디버깅을 위한 도메인 컨텍스트 로드. 천간지지·오행·십신 관련 버그 수정 전 반드시 실행합니다.
user-invocable: false
---

# 사주 엔진 디버깅 컨텍스트

사주 관련 버그를 수정하기 전, 아래 순서로 도메인 컨텍스트를 파악합니다.

## 1. 핵심 진입점 파악
```
lib/saju-core/facade.ts       — FortuneTellerService (단일 진입점)
lib/schemas/birth-info.ts     — BirthInfo 입력 스키마 (Zod)
```

## 2. 도메인 개념 이해
```
lib/saju-core/                — 사주 계산 엔진 전체
  ├── 천간 (Heavenly Stems)   — 甲乙丙丁戊己庚辛壬癸
  ├── 지지 (Earthly Branches) — 子丑寅卯辰巳午未申酉戌亥
  ├── 오행 (Five Elements)    — 木火土金水
  ├── 십신 (Ten Gods)         — 비견·겁재·식신·상관·편재·정재·편관·정관·편인·정인
  └── 신강신약 (Energy)       — 일간 강약 판단
```

## 3. AI 연동 확인
```
lib/mastra/agents/            — Mastra AI 에이전트 정의
app/api/saju/analyze/         — 분석 API 라우트
app/api/chat/                 — AI 채팅 스트리밍
```

## 4. 프론트엔드 컨텍스트
```
lib/contexts/                 — SajuContext (전역 상태)
components/saju/              — 사주 UI 컴포넌트들
```

## 디버깅 패턴

### 계산 결과가 이상한 경우
1. `lib/saju-core/facade.ts`에서 `FortuneTellerService` 입력/출력 확인
2. 단위 테스트: `__tests__/` 폴더에서 관련 테스트 실행
   ```bash
   npx vitest run --reporter=verbose <테스트파일>
   ```

### AI 응답이 이상한 경우
1. `MASTRA_SAJU_MODEL` 환경변수 확인 (`gpt-4o-mini` 기본값)
2. `lib/mastra/agents/`에서 system prompt 확인
3. `app/api/chat/route.ts`에서 컨텍스트 전달 방식 확인

### 크레딧 소비 오류
1. `lib/credit-service.ts` — 크레딧 차감 로직
2. `ENABLE_CREDIT_SYSTEM` 환경변수 확인 (false = 무제한)
