# Storefront Code Patterns

## 1. Preact Component Pattern (Minimal)

```typescript
import { h, FunctionComponent } from "preact";
import { signal } from "@preact/signals";

interface AffiliateWidgetProps {
  productId: string;
  shopDomain: string;
}

// Signals for shared state (outside component = singleton)
const referralCode = signal<string | null>(null);

const AffiliateWidget: FunctionComponent<AffiliateWidgetProps> = ({
  productId,
  shopDomain,
}) => {
  if (!referralCode.value) return null;

  return (
    <div class="aff-widget">
      <a
        class="aff-widget__link"
        href={`/products/${productId}?ref=${referralCode.value}`}
      >
        Share & Earn
      </a>
    </div>
  );
};

export default AffiliateWidget;
```

## 2. Signals State Management

```typescript
import { signal, computed, effect } from "@preact/signals";

// Global store — singleton, shared across components
export const affiliateStore = {
  // State
  code: signal<string | null>(null),
  earnings: signal<number>(0),
  isLoading: signal(false),

  // Computed
  hasCode: computed(() => affiliateStore.code.value !== null),
  formattedEarnings: computed(
    () => `$${affiliateStore.earnings.value.toFixed(2)}`
  ),

  // Actions
  async fetchCode(customerId: string) {
    affiliateStore.isLoading.value = true;
    try {
      const res = await fetch(`/apps/affiliate/api/code?c=${customerId}`);
      const data = await res.json();
      affiliateStore.code.value = data.code;
      affiliateStore.earnings.value = data.earnings;
    } finally {
      affiliateStore.isLoading.value = false;
    }
  },
};
```

## 3. Lazy Loading Pattern

```typescript
import { h, render } from "preact";

// Only load and render when element is visible
function lazyMount(
  selector: string,
  importFn: () => Promise<{ default: any }>,
) {
  const targets = document.querySelectorAll(selector);
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          const { default: Component } = await importFn();
          const props = JSON.parse(
            entry.target.getAttribute("data-props") || "{}"
          );
          render(h(Component, props), entry.target);
        }
      });
    },
    { rootMargin: "200px" }, // Pre-load 200px before visible
  );

  targets.forEach((el) => observer.observe(el));
}

// Usage — entry point
lazyMount(
  "[data-affiliate-widget]",
  () => import("./components/AffiliateWidget"),
);

lazyMount(
  "[data-referral-banner]",
  () => import("./components/ReferralBanner"),
);
```

## 4. Theme App Extension Block (Liquid)

```liquid
{% comment %}
  blocks/affiliate-link.liquid
  Renders an affiliate share button for logged-in customers
{% endcomment %}

{% if customer %}
  <div
    class="aff-block"
    data-affiliate-widget
    data-props='{ "productId": "{{ product.id }}", "shopDomain": "{{ shop.domain }}" }'
  >
    {%- comment -%} Fallback content when JS is disabled {%- endcomment -%}
    <noscript>
      <a href="/account" class="aff-block__fallback">
        {{ block.settings.fallback_text | default: "Join our affiliate program" }}
      </a>
    </noscript>
  </div>
{% endif %}

{% schema %}
{
  "name": "Affiliate Link",
  "target": "section",
  "settings": [
    {
      "type": "text",
      "id": "fallback_text",
      "label": "Fallback text (no JS)",
      "default": "Join our affiliate program"
    },
    {
      "type": "select",
      "id": "position",
      "label": "Position",
      "options": [
        { "value": "below_price", "label": "Below price" },
        { "value": "below_add_to_cart", "label": "Below Add to Cart" }
      ],
      "default": "below_add_to_cart"
    },
    {
      "type": "color",
      "id": "accent_color",
      "label": "Accent color",
      "default": "#4A90D9"
    }
  ]
}
{% endschema %}
```

## 5. Storefront API Fetch Pattern

```typescript
// utils/api.ts — Lightweight fetch wrapper for storefront

const PROXY_BASE = "/apps/affiliate/api";

interface FetchOptions {
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  signal?: AbortSignal;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;

  const res = await fetch(`${PROXY_BASE}${endpoint}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

// Usage
// const data = await apiFetch<{ code: string }>("/referral-code");
```

## 6. Tracking Pixel Pattern (Lightweight)

```typescript
// Minimal tracking — no heavy analytics libraries
export function trackEvent(event: string, data?: Record<string, string>) {
  // Use sendBeacon for non-blocking, reliable delivery
  const payload = JSON.stringify({
    event,
    ...data,
    ts: Date.now(),
    url: location.pathname,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(`${PROXY_BASE}/track`, payload);
  } else {
    // Fallback: fire-and-forget fetch
    fetch(`${PROXY_BASE}/track`, {
      method: "POST",
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}

// Usage
// trackEvent("affiliate_link_click", { productId: "123", code: "ABC" });
// trackEvent("referral_banner_view");
```

## 7. CSS Scoping Pattern

```css
/*
 * affiliate-widget.css
 * Prefix ALL classes with "aff-" to prevent theme conflicts
 * BEM naming: aff-{block}__{element}--{modifier}
 */

.aff-widget {
  /* Reset — don't inherit theme styles */
  all: initial;
  display: block;
  font-family: inherit;
  color: inherit;
}

.aff-widget__link {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.5em 1em;
  border: 1px solid currentColor;
  border-radius: 4px;
  text-decoration: none;
  color: inherit;
  font-size: 0.875rem;
  transition: opacity 0.15s ease;
}

.aff-widget__link:hover {
  opacity: 0.8;
}

/* Use CSS custom properties for merchant theming */
.aff-widget--themed {
  --aff-accent: var(--aff-merchant-color, #4A90D9);
  border-color: var(--aff-accent);
  color: var(--aff-accent);
}

/* Responsive — mobile first */
@media (max-width: 749px) {
  .aff-widget__link {
    width: 100%;
    justify-content: center;
  }
}
```

## 8. Bundle Entry Point Pattern

```typescript
// src/index.tsx — Entry point, must be minimal
import { lazyMount } from "./utils/lazy-mount";

// Lazy load everything — nothing eager except the mount logic
lazyMount(
  "[data-affiliate-widget]",
  () => import("./components/AffiliateWidget"),
);

lazyMount(
  "[data-referral-banner]",
  () => import("./components/ReferralBanner"),
);

// Initialize tracking only if elements exist
if (document.querySelector("[data-aff-track]")) {
  import("./utils/tracking").then(({ initTracking }) => initTracking());
}
```

## 9. Vite Build Config (Storefront)

```typescript
// vite.config.storefront.ts
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: "extensions/theme-app-extension/assets",
    lib: {
      entry: "extensions/src/index.tsx",
      formats: ["es"],
      fileName: "affiliate-widget",
    },
    rollupOptions: {
      output: {
        // No chunk splitting — single file for simplicity
        inlineDynamicImports: false,
        manualChunks: undefined,
      },
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        passes: 2,
      },
    },
    // Report bundle size
    reportCompressedSize: true,
  },
});
```
