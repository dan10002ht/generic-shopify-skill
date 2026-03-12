# Affiliate - Shopify App Project

## Project Overview
Shopify app project đang trong giai đoạn research & planning.

## Team Structure (Skills: `.claude/skills/`)
- `/pm` - CPO / Senior Product Manager (C-level) — strategy, roadmap, prioritization
- `/ba` - Principal Business Analyst — requirements, specs, data modeling
- `/tech-lead` - Principal Engineer / Tech Lead — architecture, code, DevOps
- `/tester` - Principal QA Engineer / SDET — test strategy, automation, quality
- `/team` - Triệu tập cả team để meeting/discussion (runs in forked context)

## Dev Skills (Auto-invoked — Claude tự apply khi detect context)
- `dev-admin` - Remix + Polaris + App Bridge 4.x patterns (admin embedded app)
- `dev-storefront` - Preact + Theme App Extensions (customer-facing, performance-first)
- `dev-api` - Webhooks, Prisma, BullMQ, authentication (backend)
- `dev-shopify` - Platform conventions: metafields, Built for Shopify criteria, API throttle handling
- `dev-patterns` - System architecture: Atomic Design, Repository Pattern, DRY, conventions

## Core Coding Rules (ALWAYS apply)
1. **Atomic Design**: Components tổ chức theo Atoms → Molecules → Organisms → Templates → Pages
2. **Repository Pattern**: Data access (models/) → Business logic (services/) → Routes (loaders/actions)
3. **DRY**: Nếu copy-paste > 2 lần → extract thành shared utility/component/hook
4. **Single Responsibility**: Mỗi file/function/component chỉ làm 1 việc
5. **Colocation**: File liên quan đặt cùng folder (component + test + styles + types)
6. **Explicit over Implicit**: Named exports, clear function names, no magic strings
7. **Type Safety**: Strict TypeScript, Zod ở boundaries, no `any`
8. **Error First**: Handle errors trước happy path, early return pattern
9. **Immutable by Default**: `const`, `readonly`, avoid mutation
10. **Server-first**: Fetch data trong loader, mutate trong action — minimize client state

## Tech Stack (Planned)
- **Framework**: Remix (Shopify App Template)
- **UI**: Polaris + App Bridge 4.x
- **Storefront**: Preact (lightweight)
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache**: Redis
- **Deployment**: TBD (Fly.io / Railway / AWS)

## Language
- Team communication: Tiếng Việt
- Technical terms: English
