# Coding Conventions

## Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| **Files — components** | PascalCase | `StatusBadge.tsx`, `CampaignTable.tsx` |
| **Files — utils/hooks** | camelCase | `formatCurrency.ts`, `useDebounce.ts` |
| **Files — models/services** | camelCase + `.server.ts` | `campaign.server.ts` |
| **Files — routes** | dot-separated | `app.campaigns.$id.tsx` |
| **Files — types** | camelCase | `campaign.ts`, `api.ts` |
| **Files — tests** | `.test.ts` suffix | `campaign.server.test.ts` |
| **Components** | PascalCase | `export function StatusBadge()` |
| **Hooks** | `use` prefix | `useAffiliate()`, `useDebounce()` |
| **Constants** | SCREAMING_SNAKE | `MAX_COMMISSION_RATE`, `API_VERSION` |
| **Enums (Prisma)** | PascalCase members | `ACTIVE`, `DRAFT`, `PAUSED` |
| **Types/Interfaces** | PascalCase | `Campaign`, `CreateCampaignInput` |
| **Variables/functions** | camelCase | `campaignList`, `calculateCommission` |
| **Boolean vars** | `is`/`has`/`can` prefix | `isActive`, `hasPermission`, `canEdit` |
| **Event handlers** | `handle` prefix | `handleSubmit`, `handleDelete` |
| **Callbacks (props)** | `on` prefix | `onSave`, `onDelete`, `onChange` |

## File Organization — Colocation

```
Liên quan → cùng folder. Không tách test/type/style ra folder riêng.

✅ Colocated:
components/organisms/CampaignTable/
├── CampaignTable.tsx
├── CampaignTable.test.tsx
└── index.ts                    # re-export

✅ Simple (no test yet):
components/atoms/StatusBadge.tsx  # Single file OK for atoms

❌ Anti-pattern:
components/CampaignTable.tsx
__tests__/CampaignTable.test.tsx  # Tách ra folder khác
types/CampaignTable.ts            # Tách types ra folder khác
```

## DRY Rules

### Khi nào extract?

```
Copy-paste 1 lần  → OK, chưa cần extract
Copy-paste 2 lần  → Consider extract (dùng judgement)
Copy-paste 3 lần  → PHẢI extract

Nhưng: KHÔNG extract nếu 2 chỗ dùng chỉ "trông giống nhau" nhưng
serve mục đích khác nhau. Similar code ≠ Duplicate code.
```

### Extract thành gì?

| Duplicated Code | Extract To | Location |
|----------------|-----------|----------|
| UI element | Atom/Molecule component | `components/atoms/` |
| UI section | Organism component | `components/organisms/` |
| State logic | Custom hook | `hooks/use*.ts` |
| Data transform | Utility function | `utils/*.ts` |
| Prisma query | Model function | `models/*.server.ts` |
| Business flow | Service function | `services/*.server.ts` |
| Zod schema | Validation schema | `utils/validation.server.ts` |
| TypeScript type | Type definition | `types/*.ts` |
| GraphQL query | Query constant | `graphql/*.ts` |

### DRY Exceptions

```
✅ OK to duplicate:
  - Test setup code (each test should be self-contained)
  - Error messages (context-specific wording)
  - Prisma where clauses (over-abstracting makes queries unreadable)
  - Route loader/action boilerplate (auth + validation pattern)

❌ KHÔNG OK to duplicate:
  - Business rules (commission calculation, eligibility checks)
  - Validation schemas (Zod schemas)
  - API query patterns (GraphQL queries)
  - Component logic (state management, event handlers)
```

## Error Handling Pattern

### Early Return
```typescript
// ✅ Early return — flat, readable
export async function getCampaign(id: string, shop: string) {
  const campaign = await campaignModel.getCampaignById(id, shop);
  if (!campaign) {
    throw new AppError("NOT_FOUND", "Campaign not found", 404);
  }
  if (campaign.status === "ARCHIVED") {
    throw new AppError("ARCHIVED", "Campaign is archived", 410);
  }
  return campaign;
}

// ❌ Nested — hard to read
export async function getCampaign(id: string, shop: string) {
  const campaign = await campaignModel.getCampaignById(id, shop);
  if (campaign) {
    if (campaign.status !== "ARCHIVED") {
      return campaign;
    } else {
      throw new AppError("ARCHIVED", "Campaign is archived", 410);
    }
  } else {
    throw new AppError("NOT_FOUND", "Campaign not found", 404);
  }
}
```

### Error Hierarchy
```
AppError (business errors — expected, handled)
  ├── 400 Bad Request     — invalid input
  ├── 404 Not Found       — resource missing
  ├── 409 Conflict        — duplicate, state conflict
  └── 422 Unprocessable   — validation failed

Unexpected errors → let ErrorBoundary handle (500)
  ├── Database connection errors
  ├── External API failures
  └── Unhandled exceptions
```

## Import Order

```typescript
// 1. Node/Remix imports
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

// 2. Third-party packages
import { Page, Layout, Card } from "@shopify/polaris";
import { z } from "zod";

// 3. Internal — services/models (server)
import { authenticate } from "~/shopify.server";
import * as campaignModel from "~/models/campaign.server";

// 4. Internal — components (from atoms → organisms)
import { StatusBadge } from "~/components/atoms/StatusBadge";
import { CampaignTable } from "~/components/organisms/CampaignTable";

// 5. Internal — hooks, utils, types
import { useDebounce } from "~/hooks/useDebounce";
import { formatDate } from "~/utils/format";
import type { Campaign } from "~/types/campaign";
```

## TypeScript Rules

```typescript
// ✅ DO
const campaigns: Campaign[] = [];           // Explicit types at boundaries
function calculate(rate: number): number {} // Function signatures
type Props = { name: string };              // Component props as type
export type { Campaign };                   // Re-export types

// ❌ DON'T
const x: any = {};                         // No any
const data = response as Campaign;         // No type assertions (use type guards)
// @ts-ignore                              // No suppression comments
```

### Type Guards over Assertions
```typescript
// ✅ Type guard — runtime safe
function isCampaign(data: unknown): data is Campaign {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "name" in data
  );
}

// ❌ Type assertion — unsafe
const campaign = data as Campaign;
```

## Immutability

```typescript
// ✅ Immutable patterns
const updated = { ...campaign, status: "ACTIVE" };
const filtered = campaigns.filter((c) => c.status === "ACTIVE");
const mapped = campaigns.map((c) => ({ ...c, display: true }));

// ❌ Mutation
campaign.status = "ACTIVE";
campaigns.push(newCampaign);
campaigns.sort((a, b) => a.name.localeCompare(b.name)); // Mutates in-place

// ✅ Sort without mutation
const sorted = [...campaigns].sort((a, b) => a.name.localeCompare(b.name));
```
