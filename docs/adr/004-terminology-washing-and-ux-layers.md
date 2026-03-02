# ADR-004: 용어 워싱과 UX 깊이 레이어

- **날짜**: 2026-03-03
- **상태**: Accepted

## Context

사주/점성술 서비스에서 "오행", "십신", "일주", "사주명리학 전문가" 같은 도메인 전문 용어가 사용자 1차 화면에 직접 노출되고 있었다. 또한 "이 내용에 대해 더 이야기하기" AI 채팅 CTA가 모든 화면에 바로 드러나 있어, 일반 사용자에게 진입 장벽이 높고 서비스가 "점술 앱"으로 인식될 위험이 있었다.

### 핵심 문제

1. **용어 장벽**: "목(木)의 기운이 강합니다" 같은 표현이 비전문가에게 이질적
2. **AI 대화 노출 과다**: 1차 화면마다 AI 채팅 버튼이 있어 정보 과부하
3. **근거 불투명**: 왜 이런 결과가 나왔는지 전문적 근거를 볼 수 있는 경로 부재

## Decision

### 원칙 1: 화면별 용어 수준 분리

| 레이어 | 용어 수준 | 대상 화면 |
|--------|-----------|-----------|
| **1차 화면** (오늘/주간/결정) | 라이프스타일 언어만 | today-screen, week-screen, decision-helper |
| **근거 레이어** (DeepDiveSheet) | 전문 용어 허용 | deep-dive-sheet 내부 |
| **탐색 페이지** (Explore) | 전문 용어 전면 허용 | explore 탭 전체 |

### 원칙 2: AI 채팅 접근 경로 변경

```
[이전] 1차 화면 → AI 채팅 (직접 접근)
[이후] 1차 화면 → "왜 이렇게 나왔나요?" → DeepDiveSheet → AI 대화 (3-depth)
```

- 1차 화면의 모든 "이 내용에 대해 더 이야기하기" CTA 삭제
- `WhyThisResult` 공유 버튼 → `DeepDiveSheet` → 하단 "이 분석에 대해 AI와 대화하기"
- 탐색 페이지는 기존 AI CTA 유지 (전문 모드)

### 원칙 3: 용어 워싱 유틸리티

`lib/terminology.ts`에 런타임 치환 함수 `washTerminology()` 제공:

| 원본 | 대체 |
|------|------|
| 사주 에너지 | 오늘의 흐름 |
| 목(木)의 기운/에너지 | 성장의 에너지 |
| 화(火)의 기운/에너지 | 열정의 에너지 |
| 토(土)의 기운/에너지 | 안정의 에너지 |
| 금(金)의 기운/에너지 | 결단의 에너지 |
| 수(水)의 기운/에너지 | 지혜의 에너지 |
| 오행 | 에너지 흐름 |
| 십신 | 에너지 관계 |
| 일주 | 나의 기본 성향 |
| 사주명리학 전문가 | 라이프 가이드 전문가 |

LLM 응답에도 적용 가능하며, 시스템 프롬프트에 "전문 용어 직접 사용 금지" 규칙을 추가하여 이중 방어한다.

### 원칙 4: 결정 허브 확장 패턴

기존 단일 "A vs B 결정" 기능을 허브 패턴으로 확장:

```
결정 탭 → DecisionHub
  ├── A vs B 결정 (기존 DecisionHelper)
  ├── 궁합 분석 (새 CompatibilityScreen + API)
  └── 자주 묻는 질문 (새 CommonQuestionsScreen)
```

- 상태 기반 내부 네비게이션 (`HubView = "hub" | "decision" | "compatibility" | "questions"`)
- 기존 `GunghapAnalyzer` 엔진 재활용 (`lib/saju-core/saju/gunghap.ts`)
- 새 API 엔드포인트: `POST /api/saju/compatibility`

## Consequences

### 긍정적

- 일반 사용자 진입 장벽 낮아짐 ("점술 앱" → "라이프 가이드" 포지셔닝)
- 전문 정보를 원하는 사용자에게는 근거 레이어에서 충분한 깊이 제공
- AI 대화가 맥락적으로 제공되어 대화 품질 향상 (근거를 본 후 대화 진입)
- 결정 탭이 허브로 확장되어 재방문 이유 증가

### 주의사항

- **DB 저장된 시스템 프롬프트**: `/admin/settings`에서 수동 업데이트 필요 (코드의 `DEFAULT_*_PROMPT`는 DB에 값이 없을 때만 적용)
- **washTerminology 정규식 순서**: 긴 표현이 먼저 매칭되어야 함 (예: "사주 에너지" → "사주" 보다 먼저)
- **탐색 페이지 예외**: 탐색 탭은 전문 모드이므로 용어 워싱 미적용 — 추후 리디자인 시 재검토
- **궁합 API**: 현재 순수 계산 기반 (LLM 내러티브 미포함) — 필요 시 LLM 해석 레이어 추가 가능

## 관련 파일

| 파일 | 역할 |
|------|------|
| `lib/terminology.ts` | 용어 워싱 유틸리티 |
| `components/saju/why-this-result.tsx` | 공유 "왜 이렇게 나왔나요?" 버튼 |
| `components/saju/deep-dive-sheet.tsx` | 멀티 컨텍스트 근거 레이어 |
| `components/saju/decision-hub.tsx` | 결정 허브 |
| `components/saju/compatibility-screen.tsx` | 궁합 분석 UI |
| `components/saju/common-questions-screen.tsx` | 자주 묻는 질문 |
| `app/api/saju/compatibility/route.ts` | 궁합 분석 API |
