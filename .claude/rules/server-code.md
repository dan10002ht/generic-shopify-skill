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
❌ Models → Services (no upward dependency)
❌ Services → Routes (no upward dependency)
```
