/**
 * Example: Shopify Webhook Handler Test
 * Framework: Vitest
 *
 * Pattern:
 * - Mock HMAC signature to simulate Shopify webhooks
 * - Test HMAC validation (valid + invalid)
 * - Test idempotency (duplicate webhook handling)
 * - Test error handling (malformed payload, missing fields)
 *
 * When to use:
 * - When implementing webhook handlers (orders/create, app/uninstalled, etc.)
 * - GDPR webhooks (customers/data_request, customers/redact, shop/redact)
 */

import crypto from "crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "~/lib/db.server";

// ============================================================
// Helper: Create a valid Shopify webhook request
// ============================================================

const WEBHOOK_SECRET = "test-webhook-secret";
const TEST_SHOP = "test-shop.myshopify.com";

/**
 * Generates a mock Shopify webhook request with valid HMAC signature.
 *
 * Shopify signs every webhook with HMAC-SHA256 using the app's API secret.
 * This helper replicates that signing process for testing.
 */
function createWebhookRequest(
  topic: string,
  body: object,
  options?: {
    secret?: string; // Override secret (use wrong secret to test rejection)
    shopDomain?: string;
  },
) {
  const payload = JSON.stringify(body);
  const secret = options?.secret ?? WEBHOOK_SECRET;
  const shop = options?.shopDomain ?? TEST_SHOP;

  // Generate HMAC exactly like Shopify does
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf-8")
    .digest("base64");

  return new Request("http://localhost:3000/webhooks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Topic": topic,
      "X-Shopify-Hmac-SHA256": hmac,
      "X-Shopify-Shop-Domain": shop,
      "X-Shopify-Webhook-Id": `wh_${Date.now()}`, // Unique webhook ID
    },
    body: payload,
  });
}

// ============================================================
// HMAC Validation Tests
// ============================================================

describe("Webhook HMAC Validation", () => {
  it("should accept webhook with valid HMAC", async () => {
    // Arrange — create request with correct secret
    const request = createWebhookRequest("orders/create", {
      id: 12345,
      email: "customer@example.com",
      total_price: "99.99",
    });

    // Act
    const response = await handleWebhook(request);

    // Assert — should be accepted
    expect(response.status).toBe(200);
  });

  it("should reject webhook with invalid HMAC", async () => {
    // Arrange — create request with WRONG secret
    const request = createWebhookRequest(
      "orders/create",
      { id: 12345 },
      { secret: "wrong-secret-from-attacker" },
    );

    // Act
    const response = await handleWebhook(request);

    // Assert — should be rejected (401 Unauthorized)
    expect(response.status).toBe(401);
  });

  it("should reject webhook with missing HMAC header", async () => {
    // Arrange — create request without HMAC
    const request = new Request("http://localhost:3000/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Topic": "orders/create",
      },
      body: JSON.stringify({ id: 12345 }),
    });

    // Act
    const response = await handleWebhook(request);

    // Assert
    expect(response.status).toBe(401);
  });

  it("should reject webhook with empty body", async () => {
    const request = new Request("http://localhost:3000/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Topic": "orders/create",
        "X-Shopify-Hmac-SHA256": "invalid",
      },
      body: "",
    });

    const response = await handleWebhook(request);
    expect(response.status).toBe(401);
  });
});

// ============================================================
// Idempotency Tests — Shopify may send the same webhook multiple times
// ============================================================

describe("Webhook Idempotency", () => {
  const ORDER_ID = 67890;

  beforeEach(async () => {
    // Clean up test data
    await prisma.webhookLog.deleteMany({ where: { shop: TEST_SHOP } });
    await prisma.order.deleteMany({ where: { shop: TEST_SHOP } });
  });

  afterEach(async () => {
    await prisma.webhookLog.deleteMany({ where: { shop: TEST_SHOP } });
    await prisma.order.deleteMany({ where: { shop: TEST_SHOP } });
  });

  it("should process webhook on first delivery", async () => {
    // Arrange
    const request = createWebhookRequest("orders/create", {
      id: ORDER_ID,
      email: "customer@example.com",
      total_price: "99.99",
    });

    // Act
    const response = await handleWebhook(request);

    // Assert — should process and create order
    expect(response.status).toBe(200);
    const order = await prisma.order.findFirst({
      where: { shop: TEST_SHOP, shopifyId: String(ORDER_ID) },
    });
    expect(order).not.toBeNull();
  });

  it("should skip duplicate webhook (same webhook ID)", async () => {
    // Arrange — simulate same webhook sent twice
    const webhookId = "wh_duplicate_123";
    const body = { id: ORDER_ID, email: "customer@example.com" };
    const payload = JSON.stringify(body);
    const hmac = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(payload, "utf-8")
      .digest("base64");

    const makeRequest = () =>
      new Request("http://localhost:3000/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Topic": "orders/create",
          "X-Shopify-Hmac-SHA256": hmac,
          "X-Shopify-Shop-Domain": TEST_SHOP,
          "X-Shopify-Webhook-Id": webhookId, // Same ID both times
        },
        body: payload,
      });

    // Act — send webhook twice
    await handleWebhook(makeRequest());
    const secondResponse = await handleWebhook(makeRequest());

    // Assert — second delivery should be skipped (200 OK but no duplicate)
    expect(secondResponse.status).toBe(200);
    const orders = await prisma.order.findMany({
      where: { shop: TEST_SHOP, shopifyId: String(ORDER_ID) },
    });
    expect(orders).toHaveLength(1); // Only 1 order, not 2
  });
});

// ============================================================
// Topic-specific Handler Tests
// ============================================================

describe("Webhook: orders/create", () => {
  beforeEach(async () => {
    await prisma.order.deleteMany({ where: { shop: TEST_SHOP } });
  });

  it("should create order from webhook payload", async () => {
    const request = createWebhookRequest("orders/create", {
      id: 11111,
      email: "buyer@example.com",
      total_price: "149.99",
      currency: "USD",
      line_items: [
        { title: "Product A", quantity: 2, price: "49.99" },
        { title: "Product B", quantity: 1, price: "50.01" },
      ],
    });

    const response = await handleWebhook(request);

    expect(response.status).toBe(200);
    const order = await prisma.order.findFirst({
      where: { shop: TEST_SHOP, shopifyId: "11111" },
    });
    expect(order).toMatchObject({
      shop: TEST_SHOP,
      totalPrice: 149.99,
      currency: "USD",
    });
  });
});

describe("Webhook: app/uninstalled", () => {
  it("should mark shop as uninstalled (soft delete)", async () => {
    // Arrange — ensure shop exists
    await prisma.shop.upsert({
      where: { domain: TEST_SHOP },
      create: { domain: TEST_SHOP, accessToken: "test-token" },
      update: {},
    });

    // Act
    const request = createWebhookRequest("app/uninstalled", {
      id: 99999,
      domain: TEST_SHOP,
    });
    const response = await handleWebhook(request);

    // Assert — shop should be soft-deleted, not hard-deleted
    expect(response.status).toBe(200);
    const shop = await prisma.shop.findUnique({
      where: { domain: TEST_SHOP },
    });
    expect(shop?.deletedAt).not.toBeNull();
    expect(shop?.accessToken).toBeNull(); // Token should be cleared for security
  });
});

// ============================================================
// GDPR Webhook Tests — Required for Shopify App Store
// ============================================================

describe("GDPR Webhooks", () => {
  it("should handle customers/data_request", async () => {
    const request = createWebhookRequest("customers/data_request", {
      shop_id: 99999,
      shop_domain: TEST_SHOP,
      customer: { id: 123, email: "customer@example.com" },
      orders_requested: [111, 222],
    });

    const response = await handleWebhook(request);
    expect(response.status).toBe(200);
    // Verify: data export job was queued (check job queue)
  });

  it("should handle customers/redact", async () => {
    const request = createWebhookRequest("customers/redact", {
      shop_id: 99999,
      shop_domain: TEST_SHOP,
      customer: { id: 123, email: "customer@example.com" },
      orders_to_redact: [111],
    });

    const response = await handleWebhook(request);
    expect(response.status).toBe(200);
    // Verify: customer data was anonymized/deleted
  });

  it("should handle shop/redact", async () => {
    const request = createWebhookRequest("shop/redact", {
      shop_id: 99999,
      shop_domain: TEST_SHOP,
    });

    const response = await handleWebhook(request);
    expect(response.status).toBe(200);
    // Verify: all shop data was purged
  });
});

// ============================================================
// Placeholder — replace with your actual webhook handler import
// ============================================================

async function handleWebhook(request: Request): Promise<Response> {
  // TODO: Replace with actual import:
  // import { action } from "~/routes/webhooks";
  // return action({ request, params: {}, context: {} });
  throw new Error("Replace with actual webhook handler");
}
