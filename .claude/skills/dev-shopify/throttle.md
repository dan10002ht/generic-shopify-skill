# Shopify API Throttle Handling

## GraphQL — Calculated Query Cost (Leaky Bucket)

```
Bucket: 1,000 points | Restore: 50 points/sec | Continuous refill
```

### Cost từ response
```typescript
const data = await response.json();
const { actualQueryCost, throttleStatus } = data.extensions.cost;
// throttleStatus: { maximumAvailable: 1000, currentlyAvailable: 962, restoreRate: 50 }
```

### Cost estimation
| Query Pattern | Approximate Cost |
|--------------|-----------------|
| `products(first: 10) { id title }` | ~12 |
| `products(first: 10) { variants(first: 5) }` | ~52 |
| `orders(first: 50) { lineItems(first: 20) }` | ~1050 (vượt bucket!) |
| Simple mutation | ~10-20 |

### Throttle-aware Client

```typescript
export async function shopifyGraphQL<T>(
  admin: AdminApiContext,
  query: string,
  variables?: Record<string, unknown>,
  maxRetries = 3,
): Promise<{ data: T; cost?: any }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await admin.graphql(query, { variables });
    const result = await response.json();

    // Check throttle error
    const isThrottled = result.errors?.some(
      (e: any) => e.extensions?.code === "THROTTLED",
    );

    if (isThrottled && attempt < maxRetries) {
      const { currentlyAvailable, restoreRate } =
        result.extensions?.cost?.throttleStatus ?? {};
      const needed = (result.extensions?.cost?.requestedQueryCost ?? 100) - (currentlyAvailable ?? 0);
      const waitMs = Math.min(Math.ceil(needed / (restoreRate ?? 50)) * 1000 + 1000, 30000);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (result.errors?.length && !isThrottled) {
      throw new Error(result.errors.map((e: any) => e.message).join(", "));
    }

    return { data: result.data, cost: result.extensions?.cost };
  }

  throw new Error("GraphQL request failed after retries");
}
```

### Cost-aware Pagination

```typescript
export async function paginateAll<T>(
  admin: AdminApiContext,
  query: string,
  variables: Record<string, unknown>,
  getConnection: (data: any) => {
    edges: Array<{ node: T; cursor: string }>;
    pageInfo: { hasNextPage: boolean };
  },
): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | null = null;

  while (true) {
    const { data, cost } = await shopifyGraphQL(admin, query, {
      ...variables,
      after: cursor,
    });

    const conn = getConnection(data);
    results.push(...conn.edges.map((e) => e.node));

    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.edges[conn.edges.length - 1].cursor;

    // Pause if budget low
    const available = cost?.throttleStatus?.currentlyAvailable ?? 1000;
    if (available < 200) {
      const restoreRate = cost?.throttleStatus?.restoreRate ?? 50;
      await new Promise((r) => setTimeout(r, Math.ceil((800 - available) / restoreRate) * 1000));
    }
  }

  return results;
}
```

---

## Bulk Operations (> 250 items)

**LUÔN dùng Bulk Operations** khi cần process > 250 items. Shopify runs query async, trả về JSONL file.

```typescript
// 1. Start
const { data } = await shopifyGraphQL(admin, `
  mutation { bulkOperationRunQuery(query: $query) {
    bulkOperation { id status }
    userErrors { field message }
  }}
`, { query: bulkQuery });

// 2. Poll (hoặc dùng webhook bulk_operations/finish)
async function pollBulkOp(admin: AdminApiContext): Promise<string> {
  while (true) {
    const { data } = await shopifyGraphQL(admin, `
      query { currentBulkOperation { id status errorCode url } }
    `);
    const op = data.currentBulkOperation;
    if (op.status === "COMPLETED") return op.url;
    if (op.status === "FAILED") throw new Error(`Bulk failed: ${op.errorCode}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

// 3. Process JSONL
const text = await (await fetch(url)).text();
const items = text.trim().split("\n").map((line) => JSON.parse(line));
```

---

## REST API Rate Limiting

```
Standard: 40 req bucket | 2/sec restore
Plus:     80 req bucket | 4/sec restore
Header:   X-Shopify-Shop-Api-Call-Limit: "32/40"
429:      Retry-After header (seconds)
```

```typescript
// Check approach limit
const callLimit = response.headers.get("X-Shopify-Shop-Api-Call-Limit");
if (callLimit) {
  const [used, max] = callLimit.split("/").map(Number);
  if (used > max * 0.8) {
    // Approaching limit — slow down
    await new Promise((r) => setTimeout(r, 500));
  }
}
```

---

## Quick Rules

| Rule | Detail |
|------|--------|
| **Luôn check cost** | Read `extensions.cost` từ mọi GraphQL response |
| **Retry with backoff** | Calculate wait từ `restoreRate`, max 30s, max 3 retries |
| **Pagination < 250** | Dùng cursor pagination + cost-aware pausing |
| **Pagination > 250** | Dùng Bulk Operations (async JSONL) |
| **Nested connections** | Giữ `first` nhỏ — `products(first:10) { variants(first:5) }` = 50 cost |
| **Cache** | Redis cache cho repeated queries (shop info, product lists) |
| **Monitor** | Log throttle events, alert khi budget < 100 points |
| **KHÔNG** | Fire-and-forget, retry ngay không backoff, ignore cost |
