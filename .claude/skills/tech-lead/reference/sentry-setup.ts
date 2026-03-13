/**
 * Sentry + Structured Logger Setup — Error Tracking & Monitoring
 *
 * Usage:
 *   1. Install: npm install @sentry/remix @sentry/node
 *   2. Copy this file to app/lib/monitoring.server.ts
 *   3. Add SENTRY_DSN to .env
 *   4. Import and use in entry.server.tsx and routes
 *
 * What it does:
 *   - Captures unhandled errors and sends to Sentry dashboard
 *   - Structured JSON logging (replaces console.log)
 *   - Request tracing (how long each request takes)
 *   - User context (which shop triggered the error)
 *
 * When to enable:
 *   - After first deploy to production
 *   - When you need visibility into errors across merchants
 *
 * Cost:
 *   - Sentry free tier: 5K errors/month (enough for MVP)
 *   - Upgrade when needed: $26/month for 50K errors
 */

import * as Sentry from "@sentry/remix";

// ============================================================
// Sentry Initialization — call once in entry.server.tsx
// ============================================================

export function initMonitoring() {
  if (!process.env.SENTRY_DSN) {
    console.warn("[Monitoring] SENTRY_DSN not set, skipping Sentry init");
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",

    // Sample 100% of errors, 10% of transactions (performance)
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Filter out noisy errors
    beforeSend(event) {
      // Don't send 404s to Sentry (not real errors)
      if (event.exception?.values?.[0]?.type === "NotFoundError") {
        return null;
      }
      return event;
    },

    // Tag errors with app version
    release: process.env.npm_package_version,
  });
}

// ============================================================
// Structured Logger — replaces console.log
// ============================================================

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  shop?: string;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Structured JSON logger.
 *
 * Why not console.log?
 * - JSON format is parseable by log aggregators (Datadog, CloudWatch, etc.)
 * - Consistent structure makes searching/filtering easy
 * - Includes timestamp, level, context automatically
 *
 * Usage:
 *   logger.info("Order processed", { shop: "store.myshopify.com", orderId: "123" });
 *   logger.error("Payment failed", { shop, error: err.message });
 */
export const logger = {
  info: (message: string, context?: LogContext) =>
    log("info", message, context),
  warn: (message: string, context?: LogContext) =>
    log("warn", message, context),
  error: (message: string, context?: LogContext) =>
    log("error", message, context),
  debug: (message: string, context?: LogContext) =>
    log("debug", message, context),
};

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  // In production: JSON output for log aggregators
  // In development: human-readable output
  if (process.env.NODE_ENV === "production") {
    const output = JSON.stringify(entry);
    if (level === "error") {
      process.stderr.write(output + "\n");
    } else {
      process.stdout.write(output + "\n");
    }
  } else {
    const prefix = { info: "ℹ️", warn: "⚠️", error: "❌", debug: "🔍" }[
      level
    ];
    console.log(`${prefix} [${level.toUpperCase()}] ${message}`, context || "");
  }

  // Also send errors to Sentry
  if (level === "error") {
    Sentry.captureMessage(message, {
      level: "error",
      extra: context,
    });
  }
}

// ============================================================
// Request Context Helper — add shop info to all logs/errors
// ============================================================

/**
 * Wrap a request handler to automatically tag Sentry and logs
 * with the current shop domain.
 *
 * Usage in loader/action:
 *   const { admin, session } = await authenticate.admin(request);
 *   withShopContext(session.shop, () => {
 *     logger.info("Processing request", { shop: session.shop });
 *   });
 */
export function withShopContext<T>(shop: string, fn: () => T): T {
  Sentry.setTag("shop", shop);
  Sentry.setUser({ id: shop });
  return fn();
}

// ============================================================
// Error Boundary Helper — capture route errors
// ============================================================

/**
 * Use in route ErrorBoundary to send errors to Sentry.
 *
 * Usage:
 *   export function ErrorBoundary() {
 *     const error = useRouteError();
 *     captureRouteError(error);
 *     return <ErrorPage error={error} />;
 *   }
 */
export function captureRouteError(error: unknown) {
  if (error instanceof Error) {
    Sentry.captureException(error);
  } else {
    Sentry.captureMessage(`Route error: ${String(error)}`, {
      level: "error",
    });
  }
}
