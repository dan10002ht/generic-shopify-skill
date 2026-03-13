# Glob: app/models/**,app/services/**,app/jobs/**

## Server-side Code Rules

- Mọi file PHẢI có suffix `.server.ts` (Remix tree-shaking)
- KHÔNG import từ routes hoặc components
- Mọi function nhận `shop` param đầu tiên (multi-tenant)
- Soft delete: luôn filter `deletedAt: null`
- KHÔNG `console.log` — dùng structured logger
- Validate input bằng Zod ở boundaries
- Transactions cho multi-step operations

## Layer Direction
```
✅ Routes → Services → Models → DB
✅ Jobs → Services → Models → DB
✅ Cron → Jobs (scheduled triggers)
❌ Models → Services (no upward dependency)
❌ Services → Routes (no upward dependency)
❌ Jobs → Routes (no upward dependency)
```

## Background Jobs
- DB-based queue (không cần Redis) — xem `jobs/queue.server.ts`
- node-cron cho scheduled tasks — xem `jobs/cron.server.ts`
- Upgrade lên BullMQ + Redis chỉ khi cần (>1 instance, complex retry logic)

## See Also
- Backend patterns: `.claude/skills/dev-api/patterns.md`
- Architecture layers: `.claude/skills/dev-patterns/architecture.md`
- Service test examples: `.claude/skills/tester/templates/example-service.test.ts`
- Prisma schema rules: `.claude/rules/prisma-schema.md`
