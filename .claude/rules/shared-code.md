# Glob: app/lib/**,app/utils/**,app/types/**,app/hooks/**

## Shared Code Rules

### app/lib/ — Infrastructure & Config
- Chỉ chứa app-level setup: `db.server.ts`, `shopify.server.ts`, `logger.server.ts`
- KHÔNG chứa business logic — đó là việc của services/
- `.server.ts` suffix bắt buộc (trừ shared types)
- KHÔNG import từ routes, components, models, services

### app/utils/ — Pure Utility Functions
- Stateless, side-effect free (pure functions)
- KHÔNG import từ models, services, routes, components
- KHÔNG import Prisma, Shopify SDK trực tiếp
- kebab-case file names: `format-currency.ts`, `parse-date.ts`
- Mỗi file export related utilities, không tạo "god util" file

### app/types/ — Type Definitions
- Chỉ chứa TypeScript types/interfaces, không có runtime code
- camelCase file names: `product.ts`, `order.ts`
- Shared types dùng across layers đặt ở đây
- Component-specific types collocate cùng component

### app/hooks/ — React Custom Hooks
- `useXxx` naming convention
- Client-side only — KHÔNG `.server.ts`
- KHÔNG chứa business logic — chỉ UI state/effects
- KHÔNG import từ models, services

## See Also
- Architecture layers: `.claude/skills/dev-patterns/architecture.md`
- Coding conventions: `.claude/skills/dev-patterns/conventions.md`

## Import Direction
```
lib/     → KHÔNG import từ app code (chỉ external packages)
utils/   → KHÔNG import từ app code (chỉ types/)
types/   → KHÔNG import từ app code (standalone)
hooks/   → có thể import utils/, types/, lib/ (client-safe only)
```
