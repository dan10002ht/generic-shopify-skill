# Built for Shopify (BfS) Criteria & App Review

## Built for Shopify Badge Requirements

BfS badge = highest quality tier trên Shopify App Store. Mọi feature phải target BfS compliance.

### 1. Performance

| Metric | Requirement | How to Test |
|--------|-------------|-------------|
| App load time | < 3 seconds | Lighthouse, Web Vitals |
| LCP (Largest Contentful Paint) | < 2.5s | Chrome DevTools |
| FID (First Input Delay) | < 100ms | Chrome DevTools |
| CLS (Cumulative Layout Shift) | < 0.1 | Chrome DevTools |
| Storefront impact | Minimal JS/CSS added | Bundle analyzer |
| API response time | < 500ms p95 | Server-side monitoring |

**Implementation checklist:**
- [ ] Polaris `SkeletonPage` cho loading states (không blank screen)
- [ ] Code splitting cho admin routes (Remix handles this)
- [ ] Storefront JS < 30KB gzipped (target < 15KB)
- [ ] Lazy load non-critical components
- [ ] Image optimization (WebP, responsive sizes)
- [ ] Redis caching cho frequently accessed data

### 2. Design & UX

| Requirement | Detail |
|-------------|--------|
| **Polaris compliance** | 100% admin UI dùng Polaris components |
| **App Bridge 4.x** | Navigation, modals, toasts qua App Bridge |
| **Responsive** | Work on mobile admin app |
| **Accessibility** | WCAG 2.1 AA compliance |
| **Empty states** | Meaningful empty states với clear CTA |
| **Onboarding** | First-time setup flow, không drop user vào blank page |
| **Error messages** | User-friendly, actionable (không raw error codes) |

**Implementation checklist:**
- [ ] KHÔNG custom CSS override Polaris
- [ ] TitleBar via App Bridge (không custom header)
- [ ] Navigation via App Bridge sidebar
- [ ] Toast notifications via `shopify.toast.show()`
- [ ] Modal dialogs via App Bridge Modal
- [ ] Empty states dùng Polaris `EmptyState` component
- [ ] Loading states dùng Polaris Skeleton components
- [ ] Error states dùng Polaris `Banner` (tone="critical")
- [ ] Form validation inline (Polaris `InlineError`)
- [ ] Keyboard navigation work correctly
- [ ] Screen reader support (aria labels)

### 3. Security

| Requirement | Detail |
|-------------|--------|
| **OAuth 2.0** | Proper Shopify OAuth flow via `@shopify/shopify-app-remix` |
| **HMAC validation** | Validate ALL webhook signatures |
| **Session management** | Use Shopify session tokens, not custom sessions |
| **HTTPS** | All endpoints HTTPS only |
| **CSP headers** | Content Security Policy configured |
| **No secrets in client** | API keys, tokens NEVER in frontend code |
| **Input validation** | Server-side validation on ALL inputs |
| **SQL injection** | Use Prisma (parameterized queries) — KHÔNG raw SQL |
| **XSS prevention** | React auto-escapes, nhưng validate `dangerouslySetInnerHTML` |

**Implementation checklist:**
- [ ] `authenticate.admin(request)` trên mọi admin route
- [ ] `authenticate.public.appProxy(request)` cho app proxy routes
- [ ] Webhook HMAC verification via Shopify library
- [ ] Environment variables cho ALL secrets (không hardcode)
- [ ] Rate limiting trên public endpoints
- [ ] CORS configured correctly
- [ ] No `eval()`, `Function()`, hoặc dynamic code execution
- [ ] Dependency audit: `npm audit` no critical vulnerabilities

### 4. Functionality & Stability

| Requirement | Detail |
|-------------|--------|
| **No beta features** | App phải stable, production-ready |
| **Error boundaries** | Mọi route có ErrorBoundary |
| **Graceful degradation** | Handle Shopify API downtime gracefully |
| **Uninstall cleanup** | Clean up data khi merchant uninstall (GDPR) |
| **Billing** | Proper Shopify Billing API integration (nếu paid app) |
| **Webhooks** | Handle mandatory webhooks (GDPR) |

**Mandatory webhooks (GDPR compliance):**
```typescript
// Bắt buộc implement 3 webhooks này:

// 1. customers/data_request — Merchant request customer data
"CUSTOMERS_DATA_REQUEST"

// 2. customers/redact — Delete customer data
"CUSTOMERS_REDACT"

// 3. shop/redact — Delete shop data after uninstall
"SHOP_REDACT"
```

### 5. App Scopes

```
Rule: Request MINIMUM scopes cần thiết

✅ Typical Shopify app scopes:
  - read_products          (access product data)
  - read_orders            (access order data)
  - read_customers         (access customer data)
  - write_customers        (update customer metafields)
  - read_themes            (Theme App Extension check)

❌ KHÔNG request nếu không cần:
  - write_orders           (chỉ cần nếu modify orders)
  - write_products         (chỉ cần nếu modify product data)
  - read_all_orders        (chỉ cần nếu access orders > 60 days)
  - write_themes           (Theme App Extension tự handle)
```

### 6. App Store Listing

| Element | Requirement |
|---------|-------------|
| **App name** | Clear, descriptive, không keyword stuffing |
| **Description** | Value proposition rõ ràng, use cases |
| **Screenshots** | Min 3, annotated, show actual functionality |
| **Pricing** | Transparent, đúng Shopify Billing API |
| **Support** | Email/chat contact, response within 48h |
| **Privacy policy** | Link to privacy policy, GDPR compliant |
| **Documentation** | Help center / setup guide |

---

## Common App Review Rejection Reasons

### 1. Performance Issues
```
❌ "App takes more than 5 seconds to load"
→ Fix: Implement skeleton loading, code split routes, cache API data

❌ "Storefront script blocks rendering"
→ Fix: Use async/defer, lazy load, keep bundle < 30KB
```

### 2. Design Non-compliance
```
❌ "App uses custom UI instead of Polaris"
→ Fix: Replace ALL custom components with Polaris equivalents

❌ "Missing loading states"
→ Fix: Add SkeletonPage/SkeletonBodyText cho every data-dependent view

❌ "Missing empty states"
→ Fix: Add Polaris EmptyState với clear CTA khi no data
```

### 3. Security Violations
```
❌ "API key exposed in client-side code"
→ Fix: Move to environment variables, server-side only

❌ "Webhook signatures not validated"
→ Fix: Use Shopify's built-in HMAC validation

❌ "Requesting excessive scopes"
→ Fix: Justify every scope, remove unused ones
```

### 4. Functionality Gaps
```
❌ "App crashes when shop has no products"
→ Fix: Handle empty states, null checks, ErrorBoundary

❌ "No uninstall cleanup (GDPR)"
→ Fix: Implement SHOP_REDACT webhook, clean up app data

❌ "Billing flow broken"
→ Fix: Test recurring charges, free trial, plan changes
```

### 5. Missing GDPR Compliance
```
❌ "No privacy policy"
→ Fix: Add privacy policy link, implement data request/redact webhooks

❌ "Missing mandatory GDPR webhooks"
→ Fix: Implement CUSTOMERS_DATA_REQUEST, CUSTOMERS_REDACT, SHOP_REDACT
```

---

## Pre-submission Checklist

### Must-have (Blocking)
- [ ] All Polaris components, no custom CSS in admin
- [ ] App Bridge 4.x for navigation/modals/toasts
- [ ] ErrorBoundary on every route
- [ ] Loading skeleton on every data-dependent page
- [ ] Empty states with clear CTA
- [ ] OAuth flow works (install → permission → redirect)
- [ ] HMAC validation on all webhooks
- [ ] GDPR webhooks implemented (3 mandatory)
- [ ] Environment variables for all secrets
- [ ] `npm audit` — no critical vulnerabilities
- [ ] App loads in < 3 seconds
- [ ] Core Web Vitals pass
- [ ] Privacy policy URL set
- [ ] Support contact information
- [ ] Minimum required scopes only

### Should-have (Improves approval chance)
- [ ] Onboarding flow for first-time users
- [ ] In-app help/documentation
- [ ] Responsive on mobile admin
- [ ] Proper Shopify Billing API integration
- [ ] Localization support (at least English)
- [ ] Keyboard accessibility
- [ ] Analytics/metrics dashboard for merchant
