/**
 * Lighthouse CI Configuration — Performance Budget Enforcement
 *
 * Usage:
 *   1. Copy this file to project root as `lighthouserc.js`
 *   2. Install: npm install -D @lhci/cli
 *   3. Add script: "lighthouse": "lhci autorun" in package.json
 *   4. Run: npm run lighthouse
 *   5. Add to CI: see ci-pipeline.yml for GitHub Actions integration
 *
 * What it does:
 *   - Runs Lighthouse against your storefront URLs
 *   - Checks performance metrics against budgets
 *   - Fails CI if budgets are exceeded
 *   - Uploads reports for PR review
 *
 * When to enable:
 *   - When you have a Theme App Extension with real storefront code
 *   - After initial storefront is deployed to staging/production
 *
 * Metrics explained:
 *   - FCP (First Contentful Paint): when first text/image appears
 *   - LCP (Largest Contentful Paint): when main content is visible
 *   - CLS (Cumulative Layout Shift): visual stability (no jumping content)
 *   - TBT (Total Blocking Time): how long main thread is blocked
 *   - TTI (Time to Interactive): when page becomes fully interactive
 */

module.exports = {
  ci: {
    // ============================================================
    // Collect — which pages to test and how
    // ============================================================
    collect: {
      // URLs to test — update these for your storefront
      url: [
        // Dev/staging storefront with your app extension loaded
        "http://localhost:3000/test-storefront",
        // Or use a real staging store:
        // "https://your-dev-store.myshopify.com/",
      ],

      // Run 3 times and take median (reduces flaky results)
      numberOfRuns: 3,

      settings: {
        // Only test performance (skip SEO, accessibility for speed)
        onlyCategories: ["performance"],

        // Simulate mobile device (where performance matters most)
        preset: "desktop",
        // Use "perf" for mobile simulation:
        // preset: "perf",

        // Throttling — simulate real network conditions
        // "provided" = use real network (for local dev)
        // "simulated" = simulate 4G (for CI)
        throttlingMethod: "provided",
      },
    },

    // ============================================================
    // Assert — performance budgets (fail CI if exceeded)
    // ============================================================
    assert: {
      assertions: {
        // --- Core Web Vitals ---

        // First Contentful Paint: < 1.8s (Good), < 3s (Needs Improvement)
        "first-contentful-paint": ["warn", { maxNumericValue: 1800 }],

        // Largest Contentful Paint: < 2.5s (Good) — Google's threshold
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],

        // Cumulative Layout Shift: < 0.1 (Good) — no jumping content
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],

        // Total Blocking Time: < 200ms (Good)
        "total-blocking-time": ["warn", { maxNumericValue: 200 }],

        // --- Resource Budgets ---

        // Total JS size: < 30KB (our storefront target is 15KB gzipped)
        // This checks uncompressed size, so ~45KB ≈ 15KB gzipped
        "resource-summary:script:size": [
          "error",
          { maxNumericValue: 46080 }, // 45KB uncompressed ≈ 15KB gzipped
        ],

        // Total CSS size: < 15KB uncompressed ≈ 5KB gzipped
        "resource-summary:stylesheet:size": [
          "warn",
          { maxNumericValue: 15360 },
        ],

        // Total third-party size: should be 0 for our storefront
        "resource-summary:third-party:size": [
          "warn",
          { maxNumericValue: 0 },
        ],

        // --- Performance Score ---

        // Overall Lighthouse performance score: >= 90
        "categories:performance": ["error", { minScore: 0.9 }],
      },
    },

    // ============================================================
    // Upload — where to store reports
    // ============================================================
    upload: {
      // "temporary-public-storage" = free, generates a URL for each run
      // Link appears in CI output / PR comment
      target: "temporary-public-storage",

      // Alternative: use Lighthouse CI Server (self-hosted)
      // target: "lhci",
      // serverBaseUrl: "https://your-lhci-server.example.com",
      // token: process.env.LHCI_TOKEN,
    },
  },
};
