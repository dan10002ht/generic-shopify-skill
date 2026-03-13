/**
 * k6 Load Test — Shopify App API Endpoints
 *
 * Usage:
 *   1. Install k6: brew install k6 (macOS) or https://k6.io/docs/get-started/installation/
 *   2. Copy this file to tests/load/api-load.js
 *   3. Run: k6 run tests/load/api-load.js
 *   4. Run with more VUs: k6 run --vus 50 --duration 60s tests/load/api-load.js
 *
 * What it does:
 *   - Simulates multiple merchants hitting your API simultaneously
 *   - Measures response time, error rate, throughput
 *   - Validates response times stay under thresholds
 *   - Tests your app under realistic load patterns
 *
 * When to use:
 *   - Before production launch (validate capacity)
 *   - After major changes to API/DB queries
 *   - When onboarding many merchants at once
 *
 * k6 Concepts:
 *   - VU (Virtual User): simulated concurrent user
 *   - Iteration: one complete run of the default function
 *   - Stages: ramp up/down VUs over time (realistic traffic pattern)
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// ============================================================
// Configuration
// ============================================================

// Custom metrics for tracking
const errorRate = new Rate("errors");
const productListDuration = new Trend("product_list_duration");
const productCreateDuration = new Trend("product_create_duration");

// Test configuration
export const options = {
  // --- Scenario: Ramp up → steady → ramp down ---
  // Simulates realistic traffic pattern
  stages: [
    { duration: "30s", target: 10 }, // Ramp up to 10 VUs over 30s
    { duration: "1m", target: 10 }, // Stay at 10 VUs for 1 minute
    { duration: "30s", target: 20 }, // Ramp up to 20 VUs (peak)
    { duration: "1m", target: 20 }, // Stay at peak for 1 minute
    { duration: "30s", target: 0 }, // Ramp down to 0
  ],

  // --- Performance thresholds (fail test if exceeded) ---
  thresholds: {
    // 95% of requests must complete within 500ms
    http_req_duration: ["p(95)<500", "p(99)<1000"],

    // Error rate must be below 1%
    errors: ["rate<0.01"],

    // Custom metric thresholds
    product_list_duration: ["p(95)<300"], // List products: < 300ms
    product_create_duration: ["p(95)<500"], // Create product: < 500ms
  },
};

// ============================================================
// Setup — runs once before test starts
// ============================================================

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Simulated shop sessions (in real test, use actual session tokens)
const SHOPS = [
  "shop-1.myshopify.com",
  "shop-2.myshopify.com",
  "shop-3.myshopify.com",
  "shop-4.myshopify.com",
  "shop-5.myshopify.com",
];

// Common headers
function getHeaders(shop) {
  return {
    "Content-Type": "application/json",
    // In real test, use actual session/auth tokens
    "X-Test-Shop": shop,
  };
}

// ============================================================
// Test Scenarios — each VU runs these in sequence
// ============================================================

export default function () {
  // Pick a random shop (simulate multi-tenant traffic)
  const shop = SHOPS[Math.floor(Math.random() * SHOPS.length)];
  const headers = getHeaders(shop);

  // --- Scenario 1: List products (most common operation) ---
  {
    const res = http.get(`${BASE_URL}/app/products`, { headers });
    productListDuration.add(res.timings.duration);

    const success = check(res, {
      "list products: status 200": (r) => r.status === 200,
      "list products: has data": (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.products);
        } catch {
          return false;
        }
      },
      "list products: < 300ms": (r) => r.timings.duration < 300,
    });

    errorRate.add(!success);
  }

  sleep(1); // Wait 1s between requests (realistic user behavior)

  // --- Scenario 2: Get single product ---
  {
    const res = http.get(`${BASE_URL}/app/products/test-product-1`, {
      headers,
    });

    check(res, {
      "get product: status 200 or 404": (r) =>
        r.status === 200 || r.status === 404,
      "get product: < 200ms": (r) => r.timings.duration < 200,
    });
  }

  sleep(0.5);

  // --- Scenario 3: Create product (write operation, less frequent) ---
  // Only 20% of iterations create a product (realistic ratio)
  if (Math.random() < 0.2) {
    const payload = JSON.stringify({
      title: `Load Test Product ${Date.now()}`,
      status: "DRAFT",
      description: "Created by k6 load test",
    });

    const res = http.post(`${BASE_URL}/app/products`, payload, { headers });
    productCreateDuration.add(res.timings.duration);

    const success = check(res, {
      "create product: status 200 or 201": (r) =>
        r.status === 200 || r.status === 201,
      "create product: < 500ms": (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
  }

  sleep(1);

  // --- Scenario 4: Health check (monitoring endpoint) ---
  {
    const res = http.get(`${BASE_URL}/healthcheck`);

    check(res, {
      "healthcheck: status 200": (r) => r.status === 200,
      "healthcheck: < 100ms": (r) => r.timings.duration < 100,
    });
  }

  sleep(0.5);
}

// ============================================================
// Teardown — runs once after test ends
// ============================================================

export function handleSummary(data) {
  // Print summary to console
  const summary = {
    totalRequests: data.metrics.http_reqs.values.count,
    avgResponseTime: Math.round(
      data.metrics.http_req_duration.values.avg,
    ),
    p95ResponseTime: Math.round(
      data.metrics.http_req_duration.values["p(95)"],
    ),
    p99ResponseTime: Math.round(
      data.metrics.http_req_duration.values["p(99)"],
    ),
    errorRate: (data.metrics.errors?.values?.rate || 0) * 100,
    throughput: Math.round(
      data.metrics.http_reqs.values.count /
        (data.state.testRunDurationMs / 1000),
    ),
  };

  console.log("\n══════════════════════════════════════");
  console.log("  Load Test Summary");
  console.log("══════════════════════════════════════");
  console.log(`  Total Requests:  ${summary.totalRequests}`);
  console.log(`  Throughput:      ${summary.throughput} req/s`);
  console.log(`  Avg Response:    ${summary.avgResponseTime}ms`);
  console.log(`  P95 Response:    ${summary.p95ResponseTime}ms`);
  console.log(`  P99 Response:    ${summary.p99ResponseTime}ms`);
  console.log(`  Error Rate:      ${summary.errorRate.toFixed(2)}%`);
  console.log("══════════════════════════════════════\n");

  return {
    // Also output JSON report for CI integration
    "load-test-report.json": JSON.stringify(summary, null, 2),
  };
}
