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
  → Ví dụ: getResources(shop) trong loader

Route action cần business logic phức tạp?
  → Route → Service → Model(s)
  → Ví dụ: processOrder() gọi nhiều models + side effects

Rule of thumb:
  - 1 model call = skip service
  - 2+ model calls hoặc có business rules = dùng service
  - Side effects (email, queue, webhook) = LUÔN dùng service
```

## Model Layer (Repository Pattern)

```typescript
// models/resource.server.ts
// RULES:
//   - Chỉ CRUD operations, không business logic
//   - Mọi function nhận `shop` param (multi-tenant)
//   - Luôn filter deletedAt: null (soft delete)
//   - Return Prisma types, không transform
//   - Mỗi file = 1 Prisma model

import { db } from "~/db.server";
import { type Prisma, type Resource } from "@prisma/client";

// READ
export function getResources(shop: string, options?: {
  status?: Resource["status"];
  limit?: number;
  cursor?: string;
}) {
  return db.resource.findMany({
    where: { shop, deletedAt: null, ...(options?.status && { status: options.status }) },
    take: options?.limit ?? 25,
    ...(options?.cursor && { skip: 1, cursor: { id: options.cursor } }),
    orderBy: { createdAt: "desc" },
  });
}

export function getResourceById(id: string, shop: string) {
  return db.resource.findFirst({ where: { id, shop, deletedAt: null } });
}

// WRITE
export function createResource(data: Prisma.ResourceCreateInput) {
  return db.resource.create({ data });
}

export function updateResource(id: string, shop: string, data: Prisma.ResourceUpdateInput) {
  return db.resource.update({ where: { id, shop }, data });
}

// SOFT DELETE
export function deleteResource(id: string, shop: string) {
  return db.resource.update({
    where: { id, shop },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });
}
```

## Service Layer (Business Logic)

```typescript
// services/order-processing.server.ts
// RULES:
//   - Orchestrate multiple models
//   - Contain business rules & validations
//   - Handle side effects (queue jobs, send notifications)
//   - Throw AppError cho business rule violations
//   - KHÔNG access request/response objects

import * as resourceModel from "~/models/resource.server";
import * as itemModel from "~/models/item.server";
import * as logModel from "~/models/log.server";
import { notificationQueue } from "~/jobs/queue.server";
import { AppError } from "~/utils/errors.server";
import { logger } from "~/utils/logger.server";

interface ProcessOrderInput {
  shop: string;
  orderId: string;
  orderTotal: number;
  resourceCode: string;
}

export async function processOrder(input: ProcessOrderInput) {
  const { shop, orderId, orderTotal, resourceCode } = input;

  // 1. Business rule: find active resource
  const resource = await resourceModel.getByCode(shop, resourceCode);
  if (!resource) {
    throw new AppError("RESOURCE_NOT_FOUND", "Invalid resource code", 404);
  }

  // 2. Business rule: resource must be active
  if (resource.status !== "ACTIVE") {
    throw new AppError("RESOURCE_INACTIVE", "Resource is not active", 400);
  }

  // 3. Business rule: no duplicate processing for same order
  const existing = await logModel.getByOrderId(shop, orderId);
  if (existing) {
    logger.warn("order_duplicate_skipped", { shop, orderId });
    return existing;
  }

  // 4. Create log record
  const logEntry = await logModel.create({
    shop,
    resourceId: resource.id,
    orderId,
    orderTotal,
    status: "COMPLETED",
  });

  // 5. Side effect: send notification (async)
  await notificationQueue.add("notify-order", {
    resourceId: resource.id,
    logId: logEntry.id,
    orderTotal,
  });

  logger.info("order_processed", { shop, logId: logEntry.id, orderTotal });
  return logEntry;
}
```

## Route Layer (HTTP Boundary)

```typescript
// routes/app.resources.tsx
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
import { CreateResourceSchema } from "~/utils/validation.server";
import * as resourceModel from "~/models/resource.server";
import { AppError } from "~/utils/errors.server";

// Loader: data fetching (GET)
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const resources = await resourceModel.getResources(session.shop);
  return json({ resources });
};

// Action: mutations (POST/PUT/DELETE)
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const parsed = CreateResourceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    await resourceModel.createResource({
      ...parsed.data,
      shop: session.shop,
    });
    return redirect("/app/resources");
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
