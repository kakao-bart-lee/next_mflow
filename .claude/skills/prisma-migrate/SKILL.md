---
name: prisma-migrate
description: Prisma 마이그레이션 생성 및 검증 워크플로. 스키마 변경 후 안전하게 마이그레이션을 적용하고 영향 범위를 파악합니다.
---

# Prisma 마이그레이션 워크플로

## 실행 단계

### 1. 현재 스키마 변경사항 확인
`prisma/schema.prisma`를 읽어 어떤 모델이 변경됐는지 파악합니다.

```bash
git diff prisma/schema.prisma
```

### 2. 마이그레이션 안전성 체크리스트
다음 항목을 확인 후 진행합니다:
- [ ] 기존 컬럼 삭제 시 데이터 손실 여부 검토
- [ ] NOT NULL 컬럼 추가 시 기본값(default) 지정 여부
- [ ] 인덱스 추가가 대용량 테이블에 미치는 영향
- [ ] 관계(relation) 변경 시 기존 데이터 정합성

### 3. 마이그레이션 생성
```bash
# 개발 환경 (migration 파일 생성 + DB 적용)
npx prisma migrate dev --name <변경_내용_요약>

# 예시:
# npx prisma migrate dev --name add-user-preferences
# npx prisma migrate dev --name add-subscription-plan-field
```

### 4. Prisma Client 재생성
```bash
npx prisma generate
```

### 5. 영향 받는 코드 확인
마이그레이션된 모델을 사용하는 파일을 검색합니다:
```bash
grep -r "prisma\.<모델명>" lib/ app/ --include="*.ts" --include="*.tsx"
```

### 6. 타입 오류 검사
```bash
npx tsc --noEmit
```

## 프로덕션 배포 시
```bash
# migration 파일만 생성 (DB 적용 안 함)
npx prisma migrate dev --create-only --name <이름>

# 생성된 SQL 검토 후
npx prisma migrate deploy
```

## 참고 파일
- `prisma/schema.prisma` — 스키마 정의
- `lib/db/` — Prisma client 인스턴스
- `prisma/seed.ts` — 시드 데이터
