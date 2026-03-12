# Backend API Code Patterns

## 1. Prisma Model Helper Pattern

```typescript
// models/campaign.server.ts
import { type Prisma } from "@prisma/client";
import { db } from "~/db.server";

// Type-safe query helpers — thin layer, no business logic

export function getCampaigns(shop: string, options?: {
  status?: CampaignStatus;
  page?: number;
  limit?: number;
}) {
  const { status, page = 1, limit = 25 } = options ?? {};

  return db.campaign.findMany({
    where: {
      shop,
      deletedAt: null, // Always exclude soft-deleted
      ...(status && { status }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      _count: { select: { affiliates: true } },
    },
  });
}

export function getCampaignBySlug(shop: string, slug: string) {
  return db.campaign.findUnique({
    where: {
      shop_slug: { shop, slug },
      deletedAt: null,
    },
  });
}

export function createCampaign(
  data: Prisma.CampaignCreateInput,
) {
  return db.campaign.create({ data });
}

export function softDeleteCampaign(id: string, shop: string) {
  return db.campaign.update({
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
import { commissionQueue } from "~/jobs/queue.server";
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
  await commissionQueue.add("calculate-commission", {
    shop,
    orderId: order.id,
    orderNumber: order.order_number,
    totalPrice: order.total_price,
    lineItems: order.line_items,
    noteAttributes: order.note_attributes,
  });
};
```

## 3. BullMQ Job Pattern

```typescript
// jobs/queue.server.ts
import { Queue, Worker } from "bullmq";
import { redis } from "~/redis.server";

const connection = { connection: redis };

export const commissionQueue = new Queue("commission", connection);

// jobs/calculateCommission.ts
import { type Job } from "bullmq";
import { db } from "~/db.server";

interface CalculateCommissionData {
  shop: string;
  orderId: number;
  totalPrice: string;
  lineItems: Array<{
    product_id: number;
    quantity: number;
    price: string;
  }>;
  noteAttributes?: Array<{ name: string; value: string }>;
}

export async function processCommissionJob(
  job: Job<CalculateCommissionData>,
) {
  const { shop, orderId, totalPrice, noteAttributes } = job.data;

  // Extract affiliate code from note attributes
  const refCode = noteAttributes?.find(
    (attr) => attr.name === "ref",
  )?.value;

  if (!refCode) {
    job.log("No referral code found, skipping");
    return { status: "skipped", reason: "no_referral_code" };
  }

  // Find affiliate and campaign
  const affiliate = await db.affiliate.findFirst({
    where: { shop, code: refCode, status: "ACTIVE" },
    include: { campaign: true },
  });

  if (!affiliate || !affiliate.campaign) {
    job.log(`Affiliate not found for code: ${refCode}`);
    return { status: "skipped", reason: "affiliate_not_found" };
  }

  // Calculate commission in a transaction
  const commission = await db.$transaction(async (tx) => {
    const amount =
      parseFloat(totalPrice) *
      (Number(affiliate.campaign.commissionRate) / 100);

    return tx.commission.create({
      data: {
        shop,
        affiliateId: affiliate.id,
        campaignId: affiliate.campaignId,
        orderId: String(orderId),
        orderTotal: parseFloat(totalPrice),
        amount,
        status: "PENDING",
      },
    });
  });

  job.log(`Commission created: ${commission.id}, amount: ${commission.amount}`);
  return { status: "success", commissionId: commission.id };
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
    return apiSuccess({ campaign });
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
export const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  commissionRate: z.coerce.number().min(0).max(100),
  status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),
});

export const UpdateCampaignSchema = CreateCampaignSchema.partial();

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
    case "get-referral-code": {
      const customerId = url.searchParams.get("customer_id");
      if (!customerId) {
        return json({ error: "Missing customer_id" }, { status: 400 });
      }
      const affiliate = await db.affiliate.findFirst({
        where: { shop: session.shop, customerId },
      });
      return json({ code: affiliate?.code ?? null });
    }

    case "track-click": {
      const code = url.searchParams.get("code");
      if (code) {
        await db.trackingEvent.create({
          data: {
            shop: session.shop,
            type: "CLICK",
            affiliateCode: code,
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
// services/payout.server.ts
import { db } from "~/db.server";
import { AppError } from "~/utils/errors.server";

export async function processPayoutBatch(
  shop: string,
  affiliateId: string,
) {
  return db.$transaction(async (tx) => {
    // 1. Lock and get pending commissions
    const commissions = await tx.commission.findMany({
      where: {
        shop,
        affiliateId,
        status: "APPROVED",
        payoutId: null,
      },
      orderBy: { createdAt: "asc" },
    });

    if (commissions.length === 0) {
      throw new AppError("NO_COMMISSIONS", "No approved commissions to pay");
    }

    // 2. Calculate total
    const totalAmount = commissions.reduce(
      (sum, c) => sum + Number(c.amount),
      0,
    );

    // 3. Create payout record
    const payout = await tx.payout.create({
      data: {
        shop,
        affiliateId,
        amount: totalAmount,
        commissionCount: commissions.length,
        status: "PENDING",
      },
    });

    // 4. Link commissions to payout
    await tx.commission.updateMany({
      where: {
        id: { in: commissions.map((c) => c.id) },
      },
      data: {
        payoutId: payout.id,
        status: "PAID",
      },
    });

    return payout;
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
    service: "affiliate-app",
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
// logger.info("commission_created", { shop, affiliateId, amount });
// logger.error("webhook_processing_failed", { shop, error: err.message });
```
