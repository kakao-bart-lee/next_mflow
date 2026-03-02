# next-mflow

Korean fortune-telling service: saju (사주/Four Pillars) + Western astrology → unified destiny readings via AI.

## Commands

```bash
make setup          # First time: install + DB + schema + seed
make dev            # Dev server → http://localhost:4830 (SKIP_AUTH=true)
make test           # Unit/integration tests (vitest run)
make test-watch     # Vitest watch mode
make test-cov       # Coverage report (v8)
make e2e            # Playwright E2E tests (requires dev server on 4830)
make build          # Production build
make lint           # ESLint
make db-up          # Start PostgreSQL container (port 6532)
make db-push        # Apply Prisma schema
make db-migrate     # Create Prisma migration
make db-studio      # Prisma Studio → http://localhost:6830
make db-reset       # Reset DB + re-seed
```

## Architecture

```
app/                    # Next.js App Router
├── (main)/             # Authenticated pages (today, explore, week, decision)
├── admin/              # Admin panel (settings, users)
├── api/
│   ├── saju/           # /analyze (static calc), /interpret (LLM)
│   ├── astrology/      # /static (planetary positions)
│   ├── chat/           # AI chat (OpenAI via Mastra)
│   ├── admin/settings/ # System prompt CRUD
│   ├── auth/           # NextAuth v5
│   ├── credits/        # Credit system
│   └── user/           # User profile
├── onboarding/         # Birth info input
lib/
├── saju-core/          # Saju engine (see lib/saju-core/AGENTS.md)
├── astrology/          # Planetary calculator + Horizons fallback
├── use-cases/          # interpret-saju, analyze-astrology-static
├── hooks/              # React hooks (use-saju-interpret)
├── contexts/           # SajuContext (parallel fetch saju + astrology)
├── auth/               # NextAuth config + requireAdmin()
├── mastra/             # AI agent definitions
├── schemas/            # Zod schemas (birth-info)
├── system-settings.ts  # DB-backed system settings (transactional upsert)
└── credit-service.ts   # Credit deduction logic
components/saju/        # Screen components (today, explore, week, decision)
prisma/schema.prisma    # PostgreSQL schema (User, Chat, Credit, SystemSettings)
```

## Key Paths

| Task | File |
|------|------|
| Saju calculation | `lib/saju-core/facade.ts` → `FortuneTellerService` |
| Astrology calc | `lib/astrology/static/calculator.ts` |
| LLM interpretation | `lib/use-cases/interpret-saju.ts` |
| Chat system prompt | `app/api/chat/route.ts` (loads from DB via SystemSettings) |
| Admin settings | `app/api/admin/settings/route.ts` + `app/admin/settings/page.tsx` |
| Auth guard | `lib/auth/admin.ts` → `requireAdmin()` |
| Credit system | `lib/credit-service.ts` (fail-closed, deduct after LLM success) |
| Birth info schema | `lib/schemas/birth-info.ts` |

## Testing

- **Unit/Integration**: `__tests__/` — Vitest, jsdom, `@testing-library/jest-dom`
- **E2E**: `e2e/` — Playwright (chromium/firefox/webkit), baseURL `localhost:4830`
- **Setup**: `vitest.setup.ts` imports jest-dom
- **Coverage**: v8 provider, excludes node_modules/.next/e2e
- Run single file: `npx vitest run __tests__/path/to/file.test.ts`

## Environment

Copy `.env.example` → `.env.local`. Required:
- `DATABASE_URL` — PostgreSQL (default: port 6532 via Docker)
- `AUTH_SECRET` — `openssl rand -base64 32`
- `OPENAI_API_KEY` — For AI chat + interpretation

Optional:
- `SKIP_AUTH=true` — Auto-login as dev user (make dev sets this)
- `ENABLE_CREDIT_SYSTEM=false` — Unlimited credits (default)
- `HARUNA_HORIZONS_BASE_URL` — External planetary API (falls back to static calc)

## Code Style

- **Path aliases**: `@/*` → `./*` (e.g., `import { auth } from '@/lib/auth'`)
- **Validation**: Zod schemas for all API inputs
- **Korean domain terms**: 천간(Heavenly Stems), 지지(Earthly Branches), 오행(Five Elements), 십신(Ten Spirits)
- **Korean format**: `갑(甲)` — Korean followed by Hanja in parentheses
- **Comments**: Korean for domain logic, English for technical
- **TypeScript**: `strict: true`, never use `as any` / `@ts-ignore`

## Gotchas

- **Port 4830**: Dev server, Playwright, Prisma Studio all use non-standard ports (4830, 4830, 6830)
- **ignoreBuildErrors**: `next.config.mjs` skips TS errors at build — always run `npx tsc --noEmit` to verify
- **61MB data files**: `lib/saju-core/data/` — never import directly, use `getDataLoader()` singleton
- **PostToolUse hook**: `.claude/settings.json` auto-runs `tsc --noEmit` after every .ts/.tsx edit
- **PreToolUse hook**: Blocks direct edits to `.env.local`
- **Astrology dual-mode**: Tries Horizons API first, falls back to deterministic static calculator
- **시진 boundary**: saju-core treats exact even hours as previous time period (school difference)
- **System prompts**: Stored in DB `SystemSettings` table, managed via `/admin/settings`

## Forbidden

- NEVER modify JSON data files in `lib/saju-core/data/` directly
- NEVER hardcode time corrections (use `SOLAR_TIME_CORRECTIONS`)
- NEVER skip jeolip (절입) adjustment for date calculations
- NEVER edit `.env.local` directly (blocked by hook — use `.env.example` as reference)
- NEVER suppress type errors with `as any`, `@ts-ignore`, `@ts-expect-error`
