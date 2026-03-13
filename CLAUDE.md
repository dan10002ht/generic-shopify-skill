# Shopify App Project

## Project Overview
Shopify app project — built with Remix + Polaris + Prisma stack.

## Team Structure (Skills: `.claude/skills/`)
- `/pm` - CPO / Senior Product Manager (C-level) — strategy, roadmap, prioritization
- `/ba` - Principal Business Analyst — requirements, specs, data modeling
- `/tech-lead` - Principal Engineer / Tech Lead — architecture, code, DevOps
- `/tester` - Principal QA Engineer / SDET — test strategy, automation, quality
- `/team` - Triệu tập cả team để meeting/discussion (runs in forked context)

## Commands (`.claude/commands/`)

### Planning
- `/kickoff` - Init app mới: research → competitors → MVP → go-to-market → roadmap (6 phases, interactive)
- `/plan-feature` - Plan 1 feature: PM → BA → Tech Lead với stakeholder checkpoints

### Development
- `/scaffold` - Scaffold files theo conventions
- `/db` - Prisma operations (migrate, generate, status, seed)
- `/review` - Review code changes
- `/check` - Full quality pipeline (typecheck, lint, test, build)
- `/test` - Smart test runner: targeted tests, coverage report, failure analysis
- `/refactor` - Guided refactoring: analyze smells → plan → execute từng bước

### Operations
- `/deploy` - Pre-checks → confirm → deploy → verify
- `/hotfix` - Investigate → diagnose → fix → test → deploy (production bugs)
- `/status` - Project overview
- `/onboard` - Generate onboarding guide cho dev mới hoặc quay lại project

## Dev Skills (Auto-invoked — Claude tự apply khi detect context)
- `dev-admin` - Remix + Polaris + App Bridge 4.x patterns (admin embedded app)
- `dev-storefront` - Preact + Theme App Extensions (customer-facing, performance-first)
- `dev-api` - Webhooks, Prisma, background jobs, authentication (backend)
- `dev-shopify` - Platform conventions: metafields, Built for Shopify criteria, API throttle handling
- `dev-patterns` - System architecture: Atomic Design, Repository Pattern, DRY, conventions

## Workflow Rules

### Development Workflow
1. **Understand first**: Đọc code liên quan trước khi sửa. Không đoán.
2. **Plan before code**: Với task > 30 phút, tạo plan trước khi implement
3. **Small commits**: Mỗi commit chỉ chứa 1 logical change
4. **Test alongside code**: Viết/update test cùng lúc với code, không để sau
5. **Review before done**: Chạy `/simplify` sau khi hoàn thành feature

### Context Loading Strategy
Khi bắt đầu task mới, Claude nên:
1. Đọc CLAUDE.md (auto-loaded)
2. Check memory cho relevant context
3. Đọc files liên quan trực tiếp đến task
4. Chỉ load dev skills khi thực sự cần (không load all)

## Git Conventions

### Branch Naming
```
feat/short-description     # New feature
fix/short-description      # Bug fix
refactor/short-description # Refactoring
chore/short-description    # Maintenance, deps, config
docs/short-description     # Documentation only
```

### Commit Messages
Format: `<type>(<scope>): <description>`

```
feat(products): add bulk import from CSV
fix(webhook): handle duplicate order events
refactor(models): extract shared validation logic
chore(deps): upgrade prisma to 6.x
test(billing): add subscription lifecycle tests
```

Rules:
- Viết bằng tiếng Anh, lowercase, no period at end
- Dòng đầu <= 72 chars
- Body (optional): explain "why", not "what"
- Scope = module/area affected

### PR Conventions
- Title: same format as commit message
- Body: Summary (bullet points) + Test plan
- Squash merge to main

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

## Testing Standards
- **Unit tests**: Vitest — mọi service, model, utility function
- **Component tests**: React Testing Library — interaction flows
- **E2E tests**: Playwright — critical user journeys
- **Coverage target**: >= 80% cho critical paths (services/, models/)
- **Naming**: `describe("ModuleName")` → `it("should do expected behavior")`
- **No mocks cho DB**: Dùng test database thật, không mock Prisma
- **CI pipeline**: Xem `.claude/skills/tester/templates/ci-pipeline.yml`
- **Test examples**: Xem `.claude/skills/tester/templates/example-*.test.*`

## Error Handling Pattern
```typescript
// ✅ Early return, specific errors
export async function getResource(id: string) {
  const resource = await db.resource.findUnique({ where: { id } });
  if (!resource) {
    throw new NotFoundError(`Resource ${id} not found`);
  }
  return resource;
}

// ❌ Don't: generic try-catch wrapping everything
```

## File Naming Conventions
```
components/atoms/Button.tsx          # PascalCase for components
models/product.server.ts             # camelCase.server.ts for server-only
services/order.server.ts             # camelCase.server.ts
hooks/useResourceData.ts             # useXxx for hooks
utils/format-currency.ts             # kebab-case for utilities
types/product.ts                     # camelCase for type files
routes/app.products.$id.tsx          # Remix flat route convention
```

## Tech Stack (Planned — Cost-Optimized Solo Dev)
- **Framework**: Remix (Shopify App Template)
- **UI**: Polaris + App Bridge 4.x
- **Storefront**: Preact (lightweight)
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma
- **Database**: SQLite (dev/start) → PostgreSQL (khi cần scale)
- **Queue**: DB-based queue (không cần Redis) → BullMQ khi cần
- **Cron**: node-cron (in-process scheduled tasks)
- **Testing**: Vitest + RTL + Playwright
- **Deployment**: Railway / Fly.io (single instance ~$5-10/mo)

### Scale Path
```
Phase 1 (MVP):     SQLite + DB queue + node-cron     → $5-10/mo
Phase 2 (Growth):  PostgreSQL + DB queue              → $15-20/mo
Phase 3 (Scale):   PostgreSQL + Redis + BullMQ        → $30-50/mo
```
Chỉ upgrade khi có pain point thực tế, không optimize sớm.

## Language
- Team communication: Tiếng Việt
- Technical terms: English
- Code, comments, commit messages: English
