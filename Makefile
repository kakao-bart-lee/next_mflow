# ============================================================
# next-mflow Makefile
# ============================================================
# 사용법: make <target>   (예: make setup, make dev, make test)
# ============================================================

.DEFAULT_GOAL := help
.PHONY: help setup install env dev dev-clean build lint \
        db-up db-down db-wait db-push db-migrate db-seed \
        db-reset db-studio db-shell logs ps \
        test test-watch test-cov e2e \
        mail-up mail-down clean

DOCKER_COMPOSE := docker compose
NEXT_PORT          := 4830
PRISMA_STUDIO_PORT := 6830

# ── 도움말 ────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  next-mflow 개발 커맨드"
	@echo ""
	@echo "  [초기 설정]"
	@echo "    make setup         처음 한 번만 실행: install + DB 시작 + 스키마 + 시드"
	@echo "    make env           .env.local 생성 (.env.example 기반)"
	@echo "    make install       npm install + prisma generate"
	@echo ""
	@echo "  [개발]"
	@echo "    make dev           개발 서버 시작 (SKIP_AUTH=true, http://localhost:$(NEXT_PORT))"
	@echo "    make dev-clean     .next 캐시 삭제 후 개발 서버 시작"
	@echo "    make build         프로덕션 빌드"
	@echo "    make lint          ESLint 검사"
	@echo ""
	@echo "  [데이터베이스]"
	@echo "    make db-up         PostgreSQL 컨테이너 시작 (포트 6532)"
	@echo "    make db-down       컨테이너 중지"
	@echo "    make db-push       prisma db push (스키마 적용)"
	@echo "    make db-migrate    prisma migrate dev (마이그레이션 생성)"
	@echo "    make db-seed       시드 데이터 삽입"
	@echo "    make db-reset      DB 초기화 + 시드 재실행"
	@echo "    make db-studio     Prisma Studio 열기 (포트 $(PRISMA_STUDIO_PORT))"
	@echo "    make db-shell      PostgreSQL 쉘 접속"
	@echo ""
	@echo "  [이메일 (선택)]"
	@echo "    make mail-up       Mailhog 시작 (SMTP:2830, UI:http://localhost:9830)"
	@echo "    make mail-down     Mailhog 중지"
	@echo ""
	@echo "  [테스트]"
	@echo "    make test          단위/통합 테스트 (vitest run)"
	@echo "    make test-watch    테스트 감시 모드"
	@echo "    make test-cov      커버리지 리포트"
	@echo "    make e2e           E2E 테스트 (playwright)"
	@echo ""
	@echo "  [기타]"
	@echo "    make logs          Docker 로그 확인"
	@echo "    make ps            컨테이너 상태 확인"
	@echo "    make clean         빌드 캐시 삭제 (.next)"
	@echo ""

# ── 초기 설정 ─────────────────────────────────────────────────
setup: install env db-up db-wait db-push db-seed
	@echo ""
	@echo "✓ 설정 완료!"
	@echo ""
	@echo "  다음 단계:"
	@echo "  1. .env.local에서 OPENAI_API_KEY 설정"
	@echo "  2. make dev  →  http://localhost:$(NEXT_PORT)"
	@echo "  3. 관리자 패널: http://localhost:$(NEXT_PORT)/admin (SKIP_AUTH=true로 자동 로그인)"
	@echo ""

env:
	@if [ ! -f .env.local ]; then \
		cp .env.example .env.local; \
		echo "✓ .env.local 생성됨"; \
		echo "  → DATABASE_URL, OPENAI_API_KEY, AUTH_SECRET 등을 확인하세요"; \
	else \
		echo "  .env.local 이미 존재합니다 (변경 없음)"; \
	fi

install:
	npm install
	npx prisma generate
	@echo "✓ 패키지 설치 완료"

# ── 개발 서버 ─────────────────────────────────────────────────
dev:
	SKIP_AUTH=true npm run dev -- --port $(NEXT_PORT)

dev-clean:
	rm -rf .next
	SKIP_AUTH=true npm run dev -- --port $(NEXT_PORT)

build:
	npm run build

lint:
	npm run lint

# ── 데이터베이스 ──────────────────────────────────────────────
db-up:
	$(DOCKER_COMPOSE) up -d db
	@echo "  PostgreSQL 시작 중... (포트 6532)"

db-down:
	$(DOCKER_COMPOSE) down

db-wait:
	@echo "  DB 준비 대기..."
	@until $(DOCKER_COMPOSE) exec -T db pg_isready -U mflow -d next_mflow > /dev/null 2>&1; do \
		sleep 1; \
	done
	@echo "✓ DB 준비됨"

db-push:
	@set -a; . ./.env.local; set +a; npx prisma db push
	@echo "✓ 스키마 적용됨"

db-migrate:
	@set -a; . ./.env.local; set +a; npx prisma migrate dev

db-seed:
	@set -a; . ./.env.local; set +a; npx prisma db seed
	@echo "✓ 시드 데이터 삽입됨"

db-reset:
	@echo "  DB 초기화 중..."
	@set -a; . ./.env.local; set +a; npx prisma db push --force-reset
	$(MAKE) db-seed
	@echo "✓ DB 초기화 및 시드 완료"

db-studio:
	@echo "  Prisma Studio: http://localhost:$(PRISMA_STUDIO_PORT)"
	@set -a; . ./.env.local; set +a; npx prisma studio --port $(PRISMA_STUDIO_PORT)

db-shell:
	$(DOCKER_COMPOSE) exec db psql -U mflow -d next_mflow

# ── 이메일 (선택) ────────────────────────────────────────────
mail-up:
	$(DOCKER_COMPOSE) --profile mail up -d mail
	@echo "✓ Mailhog 시작됨"
	@echo "  SMTP: localhost:2830"
	@echo "  Web UI: http://localhost:9830"

mail-down:
	$(DOCKER_COMPOSE) --profile mail stop mail

# ── 테스트 ────────────────────────────────────────────────────
test:
	npm run test:run

test-watch:
	npm run test

test-cov:
	npm run test:coverage
	@echo "  커버리지 리포트: open coverage/index.html"

e2e:
	npm run test:e2e

# ── 유틸리티 ─────────────────────────────────────────────────
logs:
	$(DOCKER_COMPOSE) logs -f

ps:
	$(DOCKER_COMPOSE) ps

clean:
	rm -rf .next
	@echo "✓ 빌드 캐시 삭제됨"
