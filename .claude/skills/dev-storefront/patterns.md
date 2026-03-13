# Storefront Code Patterns

## 1. Preact Component Pattern (Minimal)

```typescript
import { h, FunctionComponent } from "preact";
import { signal } from "@preact/signals";

interface AppWidgetProps {
  productId: string;
  shopDomain: string;
}

// Signals for shared state (outside component = singleton)
const isVisible = signal(false);

const AppWidget: FunctionComponent<AppWidgetProps> = ({
  productId,
  shopDomain,
}) => {
  if (!isVisible.value) return null;

  return (
    <div class="app-widget">
      <button
        class="app-widget__btn"
        onClick={() => trackEvent("widget_click", { productId })}
      >
        Learn more
      </button>
    </div>
  );
};

export default AppWidget;
```

## 2. Signals State Management

```typescript
import { signal, computed, effect } from "@preact/signals";

// Global store — singleton, shared across components
export const appStore = {
  // State
  settings: signal<Record<string, unknown> | null>(null),
  isLoading: signal(false),
  userId: signal<string | null>(null),

  // Computed
  hasSettings: computed(() => appStore.settings.value !== null),
  isReady: computed(
    () => !appStore.isLoading.value && appStore.hasSettings.value
  ),

  // Actions
  async fetchSettings(shopDomain: string) {
    appStore.isLoading.value = true;
    try {
      const res = await fetch(`/apps/proxy/api?action=get-settings&shop=${shopDomain}`);
      const data = await res.json();
      appStore.settings.value = data.settings;
    } finally {
      appStore.isLoading.value = false;
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
  "[data-app-widget]",
  () => import("./components/AppWidget"),
);

lazyMount(
  "[data-promo-banner]",
  () => import("./components/PromoBanner"),
);
```

## 4. Theme App Extension Block (Liquid)

```liquid
{% comment %}
  blocks/app-block.liquid
  Renders an interactive widget for customers
{% endcomment %}

{% if customer %}
  <div
    class="app-block"
    data-app-widget
    data-props='{ "productId": "{{ product.id }}", "shopDomain": "{{ shop.domain }}" }'
  >
    {%- comment -%} Fallback content when JS is disabled {%- endcomment -%}
    <noscript>
      <a href="/pages/info" class="app-block__fallback">
        {{ block.settings.fallback_text | default: "Learn more" }}
      </a>
    </noscript>
  </div>
{% endif %}

{% schema %}
{
  "name": "App Widget",
  "target": "section",
  "settings": [
    {
      "type": "text",
      "id": "fallback_text",
      "label": "Fallback text (no JS)",
      "default": "Learn more"
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

const PROXY_BASE = "/apps/proxy/api";

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
// const data = await apiFetch<{ settings: object }>("/settings");
```

## 6. Tracking Pixel Pattern (Lightweight)

```typescript
// Minimal tracking — no heavy analytics libraries
const PROXY_BASE = "/apps/proxy/api";

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
// trackEvent("widget_click", { productId: "123" });
// trackEvent("banner_view", { page: "product" });
```

## 7. CSS Scoping Pattern

```css
/*
 * app-widget.css
 * Prefix ALL classes with "app-" to prevent theme conflicts
 * BEM naming: app-{block}__{element}--{modifier}
 */

.app-widget {
  /* Reset — don't inherit theme styles */
  all: initial;
  display: block;
  font-family: inherit;
  color: inherit;
}

.app-widget__btn {
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
  cursor: pointer;
  background: transparent;
}

.app-widget__btn:hover {
  opacity: 0.8;
}

/* Use CSS custom properties for merchant theming */
.app-widget--themed {
  --app-accent: var(--app-merchant-color, #4A90D9);
  border-color: var(--app-accent);
  color: var(--app-accent);
}

/* Responsive — mobile first */
@media (max-width: 749px) {
  .app-widget__btn {
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
  "[data-app-widget]",
  () => import("./components/AppWidget"),
);

lazyMount(
  "[data-promo-banner]",
  () => import("./components/PromoBanner"),
);

// Initialize tracking only if elements exist
if (document.querySelector("[data-app-track]")) {
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
      fileName: "app-widget",
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
