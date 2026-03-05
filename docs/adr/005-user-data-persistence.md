# ADR 005: 사용자 데이터 지속성

## 상태
Accepted (Approved by PM: 2026-03-05)

## 맥락
next-mflow는 LLM 결과를 저장하지 않아 페이지 접속마다 동일한 운세를 재생성(비용 + 신뢰성 문제), 채팅 대화가 새로고침 시 소멸, 일일 체크인/액션이 localStorage에만 존재(기기 간 동기화 불가)하는 문제가 있었다.

## 결정

### 1. LLM Fortune 결과 캐싱 — Analysis 테이블 재활용
- **선택**: 기존 `Analysis` 테이블의 `expertId` 필드를 `"daily"` / `"weekly"` / `"decision"`으로 확장
- **대안 거부**: 별도 `FortuneCache` 테이블 → 기존 journal 패턴과 동일한 구조를 중복 생성하게 됨
- **근거**: journal API가 이미 `expertId="journal"` + JSON path 쿼리 패턴을 사용 중. 동일한 패턴으로 fortune 캐싱을 자연스럽게 확장 가능

### 2. Mastra PgStore 채팅 지속성
- **선택**: `LibSQLStore` (SQLite) → `PostgresStore` (PostgreSQL) 전환
- **대안 거부**: Prisma `ChatSession`/`ChatMessage` 테이블에 직접 저장 → Mastra Memory의 recall/listThreads 등 내장 기능을 활용 불가
- **근거**:
  - 단일 DB 운영으로 인프라 단순화
  - `mastra_threads`/`mastra_messages` 테이블 자동 생성
  - Memory의 thread/message 관리, 자동 제목 생성 등 내장 기능 활용
  - 기존 Prisma `ChatSession`/`ChatMessage`는 deprecated 처리 (추후 제거)

### 3. Write-through localStorage 패턴
- **선택**: 일일 체크인/액션을 localStorage 1차 캐시 + API background POST로 DB 동기화
- **대안 거부**: DB만 사용 → 오프라인/API 장애 시 UX 저하
- **근거**:
  - 기존 localStorage 기반 UX가 즉각적으로 유지됨
  - API 실패 시에도 localStorage fallback 작동
  - DB 동기화로 기기 간 데이터 공유 가능

### 4. SajuContext 클라이언트 캐싱
- **선택**: 사주 계산(결정적) → 무한 유효 캐시, 점성술(날짜별) → 1일 TTL
- **근거**: 사주 계산은 같은 birthInfo에 대해 항상 동일한 결과. 불필요한 API 호출 제거로 초기 로딩 속도 향상

## 영향
- `lib/services/fortune-cache.ts`: 새 서비스 모듈
- `app/api/saju/interpret/route.ts`: 캐시 레이어 삽입
- `lib/mastra/storage.ts`: PostgresStore 전환
- `lib/mastra/agents/chat-agent.ts`: Memory 포함 채팅 에이전트
- `app/api/chat/`: 스트림 + 대화 이력 API
- `prisma/schema.prisma`: DailyCheckIn, DailyAction 모델 추가
- `app/api/user/daily-*`: 체크인/액션 CRUD API
- `lib/contexts/saju-context.tsx`: 클라이언트 캐시 레이어
