# Architecture Layers — Repository / Service / Route Pattern

## Layer Overview

```
┌─────────────────────────────────────────┐
│  Routes (app/routes/app.*.tsx)           │  ← HTTP layer: loader/action
│  Handles: auth, request/response, UI    │
├─────────────────────────────────────────┤
│  Services (app/services/*.server.ts)    │  ← Business logic layer
│  Handles: orchestration, rules, flows   │
├─────────────────────────────────────────┤
│  Models (app/models/*.server.ts)        │  ← Data access layer (Repository)
│  Handles: CRUD, queries, transactions   │
├─────────────────────────────────────────┤
│  Database (Prisma Client)               │  ← ORM layer
│  Handles: SQL generation, connection    │
└─────────────────────────────────────────┘
```

## Khi nào cần Service layer?

```
Route loader cần data đơn giản?
  → Route → Model (skip service)
  → Ví dụ: getCampaigns(shop) trong loader

Route action cần business logic phức tạp?
  → Route → Service → Model(s)
  → Ví dụ: processCommission() gọi nhiều models + side effects

Rule of thumb:
  - 1 model call = skip service
  - 2+ model calls hoặc có business rules = dùng service
  - Side effects (email, queue, webhook) = LUÔN dùng service
```

## Model Layer (Repository Pattern)

```typescript
// models/campaign.server.ts
// RULES:
//   - Chỉ CRUD operations, không business logic
//   - Mọi function nhận `shop` param (multi-tenant)
//   - Luôn filter deletedAt: null (soft delete)
//   - Return Prisma types, không transform
//   - Mỗi file = 1 Prisma model

import { db } from "~/db.server";
import { type Prisma, type Campaign } from "@prisma/client";

// READ
export function getCampaigns(shop: string, options?: {
  status?: Campaign["status"];
  limit?: number;
  cursor?: string;
}) {
  return db.campaign.findMany({
    where: { shop, deletedAt: null, ...(options?.status && { status: options.status }) },
    take: options?.limit ?? 25,
    ...(options?.cursor && { skip: 1, cursor: { id: options.cursor } }),
    orderBy: { createdAt: "desc" },
  });
}

export function getCampaignById(id: string, shop: string) {
  return db.campaign.findFirst({ where: { id, shop, deletedAt: null } });
}

// WRITE
export function createCampaign(data: Prisma.CampaignCreateInput) {
  return db.campaign.create({ data });
}

export function updateCampaign(id: string, shop: string, data: Prisma.CampaignUpdateInput) {
  return db.campaign.update({ where: { id, shop }, data });
}

// SOFT DELETE
export function deleteCampaign(id: string, shop: string) {
  return db.campaign.update({
    where: { id, shop },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });
}
```

## Service Layer (Business Logic)

```typescript
// services/commission.server.ts
// RULES:
//   - Orchestrate multiple models
//   - Contain business rules & validations
//   - Handle side effects (queue jobs, send notifications)
//   - Throw AppError cho business rule violations
//   - KHÔNG access request/response objects

import * as campaignModel from "~/models/campaign.server";
import * as affiliateModel from "~/models/affiliate.server";
import * as commissionModel from "~/models/commission.server";
import { commissionQueue } from "~/jobs/queue.server";
import { AppError } from "~/utils/errors.server";
import { logger } from "~/utils/logger.server";

interface CalculateCommissionInput {
  shop: string;
  orderId: string;
  orderTotal: number;
  affiliateCode: string;
}

export async function calculateCommission(input: CalculateCommissionInput) {
  const { shop, orderId, orderTotal, affiliateCode } = input;

  // 1. Business rule: find active affiliate
  const affiliate = await affiliateModel.getByCode(shop, affiliateCode);
  if (!affiliate) {
    throw new AppError("AFFILIATE_NOT_FOUND", "Invalid affiliate code", 404);
  }

  // 2. Business rule: campaign must be active
  const campaign = await campaignModel.getCampaignById(affiliate.campaignId, shop);
  if (!campaign || campaign.status !== "ACTIVE") {
    throw new AppError("CAMPAIGN_INACTIVE", "Campaign is not active", 400);
  }

  // 3. Business rule: no duplicate commission for same order
  const existing = await commissionModel.getByOrderId(shop, orderId);
  if (existing) {
    logger.warn("commission_duplicate_skipped", { shop, orderId });
    return existing;
  }

  // 4. Calculate amount
  const amount = orderTotal * (Number(campaign.commissionRate) / 100);

  // 5. Create commission record
  const commission = await commissionModel.create({
    shop,
    affiliateId: affiliate.id,
    campaignId: campaign.id,
    orderId,
    orderTotal,
    amount,
    status: "PENDING",
  });

  // 6. Side effect: notify affiliate (async)
  await commissionQueue.add("notify-affiliate", {
    affiliateId: affiliate.id,
    commissionId: commission.id,
    amount,
  });

  logger.info("commission_created", { shop, commissionId: commission.id, amount });
  return commission;
}
```

## Route Layer (HTTP Boundary)

```typescript
// routes/app.campaigns.tsx
// RULES:
//   - Handle authentication (authenticate.admin)
//   - Parse & validate request input (Zod)
//   - Call service or model
//   - Return response (json, redirect)
//   - KHÔNG contain business logic
//   - KHÔNG directly access Prisma

import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData } from "@remix-run/react";
import { authenticate } from "~/shopify.server";
import { CreateCampaignSchema } from "~/utils/validation.server";
import * as campaignModel from "~/models/campaign.server";
import { AppError } from "~/utils/errors.server";

// Loader: data fetching (GET)
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const campaigns = await campaignModel.getCampaigns(session.shop);
  return json({ campaigns });
};

// Action: mutations (POST/PUT/DELETE)
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const parsed = CreateCampaignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    await campaignModel.createCampaign({
      ...parsed.data,
      shop: session.shop,
    });
    return redirect("/app/campaigns");
  } catch (error) {
    if (error instanceof AppError) {
      return json({ errors: { form: [error.message] } }, { status: error.statusCode });
    }
    throw error; // Let ErrorBoundary handle unexpected errors
  }
};
```

## Layer Boundary Rules

| Rule | Description |
|------|-------------|
| **Models: no imports from services/routes** | Data layer is independent |
| **Services: no request/response** | Business logic is framework-agnostic |
| **Routes: no Prisma** | HTTP layer doesn't know about database |
| **Services: throw AppError** | Routes catch and format for HTTP response |
| **Models: return raw Prisma types** | Services transform if needed |
| **Side effects: only in services** | Queue jobs, notifications, external API calls |

## Testing Strategy per Layer

```
Models:
  → Integration tests với real DB (test database)
  → Test: queries return correct data, filters work, soft delete

Services:
  → Unit tests, mock models
  → Test: business rules, edge cases, error conditions

Routes:
  → Integration tests (loader/action)
  → Test: auth, validation, response format, error handling

Components:
  → Unit tests (React Testing Library)
  → Test: renders correctly, user interactions, props
```
