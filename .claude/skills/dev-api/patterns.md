# Backend API Code Patterns

## 1. Prisma Model Helper Pattern

```typescript
// models/resource.server.ts
import { type Prisma } from "@prisma/client";
import { db } from "~/db.server";

// Type-safe query helpers — thin layer, no business logic

export function getResources(shop: string, options?: {
  status?: ResourceStatus;
  page?: number;
  limit?: number;
}) {
  const { status, page = 1, limit = 25 } = options ?? {};

  return db.resource.findMany({
    where: {
      shop,
      deletedAt: null, // Always exclude soft-deleted
      ...(status && { status }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      _count: { select: { items: true } },
    },
  });
}

export function getResourceBySlug(shop: string, slug: string) {
  return db.resource.findUnique({
    where: {
      shop_slug: { shop, slug },
      deletedAt: null,
    },
  });
}

export function createResource(
  data: Prisma.ResourceCreateInput,
) {
  return db.resource.create({ data });
}

export function softDeleteResource(id: string, shop: string) {
  return db.resource.update({
    where: { id, shop },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });
}
```

## 2. Webhook Handler Pattern

```typescript
// webhooks/orders-create.ts
import { type WebhookHandler } from "~/webhooks";
import { db } from "~/db.server";
import { orderQueue } from "~/jobs/queue.server";
import { z } from "zod";

const OrderWebhookSchema = z.object({
  id: z.number(),
  order_number: z.number(),
  total_price: z.string(),
  line_items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number(),
    price: z.string(),
  })),
  note_attributes: z.array(z.object({
    name: z.string(),
    value: z.string(),
  })).optional(),
});

export const handleOrdersCreate: WebhookHandler = async ({
  shop,
  payload,
}) => {
  const parsed = OrderWebhookSchema.safeParse(payload);
  if (!parsed.success) {
    console.error(JSON.stringify({
      event: "webhook_validation_failed",
      shop,
      topic: "orders/create",
      errors: parsed.error.flatten(),
    }));
    return; // Don't throw — return 200 to Shopify
  }

  const order = parsed.data;

  // Idempotency check — prevent duplicate processing
  const existing = await db.webhookLog.findUnique({
    where: {
      shop_topic_externalId: {
        shop,
        topic: "orders/create",
        externalId: String(order.id),
      },
    },
  });

  if (existing) {
    console.info(JSON.stringify({
      event: "webhook_duplicate_skipped",
      shop,
      orderId: order.id,
    }));
    return;
  }

  // Log webhook receipt
  await db.webhookLog.create({
    data: {
      shop,
      topic: "orders/create",
      externalId: String(order.id),
      payload: payload as any,
    },
  });

  // Queue heavy processing — don't block webhook response
  await orderQueue.add("process-order", {
    shop,
    orderId: order.id,
    orderNumber: order.order_number,
    totalPrice: order.total_price,
    lineItems: order.line_items,
  });
};
```

## 3. BullMQ Job Pattern

```typescript
// jobs/queue.server.ts
import { Queue, Worker } from "bullmq";
import { redis } from "~/redis.server";

const connection = { connection: redis };

export const orderQueue = new Queue("orders", connection);

// jobs/processOrder.ts
import { type Job } from "bullmq";
import { db } from "~/db.server";

interface ProcessOrderData {
  shop: string;
  orderId: number;
  totalPrice: string;
  lineItems: Array<{
    product_id: number;
    quantity: number;
    price: string;
  }>;
}

export async function processOrderJob(
  job: Job<ProcessOrderData>,
) {
  const { shop, orderId, totalPrice, lineItems } = job.data;

  // Check if order already processed
  const existing = await db.processedOrder.findUnique({
    where: { shop_orderId: { shop, orderId: String(orderId) } },
  });

  if (existing) {
    job.log("Order already processed, skipping");
    return { status: "skipped", reason: "already_processed" };
  }

  // Process order in a transaction
  const result = await db.$transaction(async (tx) => {
    // 1. Create processed order record
    const record = await tx.processedOrder.create({
      data: {
        shop,
        orderId: String(orderId),
        totalPrice: parseFloat(totalPrice),
        itemCount: lineItems.length,
        status: "COMPLETED",
      },
    });

    // 2. Update related resources
    for (const item of lineItems) {
      await tx.productStat.upsert({
        where: { shop_productId: { shop, productId: String(item.product_id) } },
        create: {
          shop,
          productId: String(item.product_id),
          totalSold: item.quantity,
        },
        update: {
          totalSold: { increment: item.quantity },
        },
      });
    }

    return record;
  });

  job.log(`Order processed: ${result.id}`);
  return { status: "success", recordId: result.id };
}
```

## 4. API Response Pattern

```typescript
// utils/errors.server.ts
import { json } from "@remix-run/node";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

// Structured success response
export function apiSuccess<T>(data: T, status = 200) {
  return json({ data, error: null }, { status });
}

// Structured error response
export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>,
) {
  return json(
    {
      data: null,
      error: { code, message, ...(details && { details }) },
    },
    { status },
  );
}

// Usage in action
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // ... business logic
    return apiSuccess({ resource });
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.code, error.message, error.statusCode);
    }
    // Don't expose internal errors
    console.error(JSON.stringify({
      event: "unhandled_error",
      error: error instanceof Error ? error.message : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
    }));
    return apiError("INTERNAL_ERROR", "Something went wrong", 500);
  }
};
```

## 5. Zod Validation Pattern

```typescript
// utils/validation.server.ts
import { z } from "zod";

// Reusable schema fragments
const shopDomain = z.string().regex(
  /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/,
  "Invalid shop domain",
);

const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

// Feature-specific schemas
export const CreateResourceSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(1000).optional(),
  status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),
});

export const UpdateResourceSchema = CreateResourceSchema.partial();

// Validate request helper
export function validateFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): z.infer<T> {
  const raw = Object.fromEntries(formData);
  return schema.parse(raw);
}
```

## 6. Rate Limiting Pattern

```typescript
// utils/rateLimit.server.ts
import { redis } from "~/redis.server";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`;

  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, windowSeconds);
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: (Math.floor(now / windowSeconds) + 1) * windowSeconds,
  };
}

// Usage in loader/action
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed, remaining } = await checkRateLimit(
    `api:${ip}`,
    100,  // 100 requests
    60,   // per 60 seconds
  );

  if (!allowed) {
    throw new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  // ... continue
};
```

## 7. App Proxy Endpoint Pattern

```typescript
// routes/app.proxy.tsx — Handles requests from storefront via App Proxy
import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // App Proxy requests are authenticated differently
  const { liquid, session } = await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  switch (action) {
    case "get-settings": {
      const settings = await db.appSetting.findFirst({
        where: { shop: session.shop },
      });
      return json({ settings: settings?.config ?? {} });
    }

    case "track-event": {
      const eventType = url.searchParams.get("type");
      const resourceId = url.searchParams.get("resource_id");
      if (eventType && resourceId) {
        await db.trackingEvent.create({
          data: {
            shop: session.shop,
            type: eventType,
            resourceId,
            ip: request.headers.get("x-forwarded-for"),
            userAgent: request.headers.get("user-agent"),
          },
        });
      }
      return json({ ok: true });
    }

    default:
      return json({ error: "Unknown action" }, { status: 400 });
  }
};
```

## 8. Prisma Transaction Pattern

```typescript
// services/batch-processing.server.ts
import { db } from "~/db.server";
import { AppError } from "~/utils/errors.server";

export async function processBatch(
  shop: string,
  resourceId: string,
) {
  return db.$transaction(async (tx) => {
    // 1. Get pending items
    const items = await tx.item.findMany({
      where: {
        shop,
        resourceId,
        status: "PENDING",
        batchId: null,
      },
      orderBy: { createdAt: "asc" },
    });

    if (items.length === 0) {
      throw new AppError("NO_ITEMS", "No pending items to process");
    }

    // 2. Calculate totals
    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    // 3. Create batch record
    const batch = await tx.batch.create({
      data: {
        shop,
        resourceId,
        amount: totalAmount,
        itemCount: items.length,
        status: "PROCESSING",
      },
    });

    // 4. Link items to batch
    await tx.item.updateMany({
      where: {
        id: { in: items.map((i) => i.id) },
      },
      data: {
        batchId: batch.id,
        status: "PROCESSED",
      },
    });

    return batch;
  });
}
```

## 9. Structured Logging Pattern

```typescript
// utils/logger.server.ts

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  event: string;
  shop?: string;
  [key: string]: unknown;
}

function log(entry: LogEntry) {
  const output = {
    ...entry,
    timestamp: new Date().toISOString(),
    service: "shopify-app",
  };

  switch (entry.level) {
    case "error":
      console.error(JSON.stringify(output));
      break;
    case "warn":
      console.warn(JSON.stringify(output));
      break;
    default:
      console.log(JSON.stringify(output));
  }
}

export const logger = {
  info: (event: string, data?: Record<string, unknown>) =>
    log({ level: "info", event, ...data }),
  warn: (event: string, data?: Record<string, unknown>) =>
    log({ level: "warn", event, ...data }),
  error: (event: string, data?: Record<string, unknown>) =>
    log({ level: "error", event, ...data }),
};

// Usage
// logger.info("order_processed", { shop, orderId, amount });
// logger.error("webhook_processing_failed", { shop, error: err.message });
```
