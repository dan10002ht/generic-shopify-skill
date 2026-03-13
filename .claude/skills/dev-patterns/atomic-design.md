# Atomic Design Pattern

## Hierarchy

```
Pages (routes/app.*.tsx)
  └── Templates (components/templates/)
       └── Organisms (components/organisms/)
            └── Molecules (components/molecules/)
                 └── Atoms (components/atoms/)
```

## Level Definitions

### Atoms — Smallest, no business logic
```
Ví dụ: StatusBadge, CurrencyText, PercentageInput, CopyButton, UserAvatar

Rules:
  - Chỉ nhận props, không fetch data
  - Không import organisms hoặc molecules
  - Wrap Polaris components nếu cần custom behavior
  - Có thể dùng ở MỌI NƠI trong app
```

```typescript
// components/atoms/StatusBadge.tsx
import { Badge, type BadgeProps } from "@shopify/polaris";

type Status = "active" | "draft" | "paused" | "archived";

const STATUS_MAP: Record<Status, { tone: BadgeProps["tone"]; label: string }> = {
  active: { tone: "success", label: "Active" },
  draft: { tone: undefined, label: "Draft" },
  paused: { tone: "attention", label: "Paused" },
  archived: { tone: "info", label: "Archived" },
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
```

```typescript
// components/atoms/CurrencyText.tsx
import { Text } from "@shopify/polaris";

interface CurrencyTextProps {
  amount: number;
  currency?: string;
}

export function CurrencyText({ amount, currency = "USD" }: CurrencyTextProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

  return <Text as="span" variant="bodyMd" fontWeight="semibold">{formatted}</Text>;
}
```

### Molecules — Combine 2-3 atoms, minimal logic
```
Ví dụ: ResourceCard, ItemRow, SummaryCard, StatCard, FormField

Rules:
  - Combine atoms thành meaningful group
  - Có thể có simple conditional logic
  - Không fetch data, nhận via props
  - Không import organisms
```

```typescript
// components/molecules/StatCard.tsx
import { Card, BlockStack, Text } from "@shopify/polaris";
import { CurrencyText } from "~/components/atoms/CurrencyText";

interface StatCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
  trend?: { value: number; direction: "up" | "down" };
}

export function StatCard({ title, value, isCurrency, trend }: StatCardProps) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="p" variant="bodySm" tone="subdued">{title}</Text>
        {isCurrency ? (
          <CurrencyText amount={value} />
        ) : (
          <Text as="p" variant="headingLg">{value.toLocaleString()}</Text>
        )}
        {trend && (
          <Text
            as="p"
            variant="bodySm"
            tone={trend.direction === "up" ? "success" : "critical"}
          >
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}
```

```typescript
// components/molecules/ResourceCard.tsx
import { Card, BlockStack, InlineStack, Text, Button } from "@shopify/polaris";
import { StatusBadge } from "~/components/atoms/StatusBadge";

interface ResourceCardProps {
  name: string;
  status: "active" | "draft" | "paused" | "archived";
  itemCount: number;
  description?: string;
  onEdit: () => void;
}

export function ResourceCard({
  name, status, itemCount, description, onEdit,
}: ResourceCardProps) {
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingMd">{name}</Text>
          <StatusBadge status={status} />
        </InlineStack>
        {description && (
          <Text as="p" variant="bodySm" tone="subdued">{description}</Text>
        )}
        <Text as="p" variant="bodySm">{itemCount} items</Text>
        <Button onClick={onEdit}>Edit</Button>
      </BlockStack>
    </Card>
  );
}
```

### Organisms — Complex sections, may have internal state
```
Ví dụ: ResourceTable, ItemList, DashboardMetrics, OnboardingWizard

Rules:
  - Combine molecules + atoms thành complete UI section
  - CÓ THỂ có internal state (filters, pagination, selection)
  - CÓ THỂ dùng hooks (useCallback, useMemo, custom hooks)
  - Nhận data via props (từ route loader)
  - KHÔNG fetch data trực tiếp
```

```typescript
// components/organisms/ResourceTable.tsx
import {
  IndexTable,
  useIndexResourceState,
  Text,
  Filters,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { StatusBadge } from "~/components/atoms/StatusBadge";

interface Resource {
  id: string;
  name: string;
  status: "active" | "draft" | "paused" | "archived";
  itemCount: number;
  createdAt: string;
}

interface ResourceTableProps {
  resources: Resource[];
  onBulkActivate: (ids: string[]) => void;
  onBulkDeactivate: (ids: string[]) => void;
}

export function ResourceTable({
  resources,
  onBulkActivate,
  onBulkDeactivate,
}: ResourceTableProps) {
  const [queryValue, setQueryValue] = useState("");
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(resources);

  const filtered = resources.filter((r) =>
    r.name.toLowerCase().includes(queryValue.toLowerCase()),
  );

  const handleQueryChange = useCallback(
    (value: string) => setQueryValue(value),
    [],
  );

  return (
    <>
      <Filters
        queryValue={queryValue}
        onQueryChange={handleQueryChange}
        onQueryClear={() => setQueryValue("")}
        filters={[]}
      />
      <IndexTable
        resourceName={{ singular: "resource", plural: "resources" }}
        itemCount={filtered.length}
        selectedItemsCount={
          allResourcesSelected ? "All" : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        promotedBulkActions={[
          { content: "Activate", onAction: () => onBulkActivate(selectedResources) },
          { content: "Deactivate", onAction: () => onBulkDeactivate(selectedResources) },
        ]}
        headings={[
          { title: "Name" },
          { title: "Status" },
          { title: "Items" },
          { title: "Created" },
        ]}
      >
        {filtered.map((resource, index) => (
          <IndexTable.Row
            id={resource.id}
            key={resource.id}
            position={index}
            selected={selectedResources.includes(resource.id)}
          >
            <IndexTable.Cell>
              <Text as="span" fontWeight="semibold">{resource.name}</Text>
            </IndexTable.Cell>
            <IndexTable.Cell>
              <StatusBadge status={resource.status} />
            </IndexTable.Cell>
            <IndexTable.Cell>{resource.itemCount}</IndexTable.Cell>
            <IndexTable.Cell>{resource.createdAt}</IndexTable.Cell>
          </IndexTable.Row>
        ))}
      </IndexTable>
    </>
  );
}
```

### Templates — Page layouts, no business logic
```
Ví dụ: AdminLayout, OnboardingLayout, SettingsLayout

Rules:
  - Define layout structure (sidebar, header, content areas)
  - Accept children/slots
  - Không chứa business logic hay data fetching
  - Reuse across multiple pages
```

```typescript
// components/templates/AdminLayout.tsx
import { Page, Layout, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import type { ReactNode } from "react";

interface AdminLayoutProps {
  title: string;
  primaryAction?: { content: string; onAction: () => void };
  children: ReactNode;
  sidebar?: ReactNode;
}

export function AdminLayout({
  title,
  primaryAction,
  children,
  sidebar,
}: AdminLayoutProps) {
  return (
    <Page>
      <TitleBar title={title}>
        {primaryAction && (
          <button variant="primary" onClick={primaryAction.onAction}>
            {primaryAction.content}
          </button>
        )}
      </TitleBar>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">{children}</BlockStack>
        </Layout.Section>
        {sidebar && (
          <Layout.Section variant="oneThird">{sidebar}</Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
```

### Pages — Remix routes, data fetching happens here
```
Ví dụ: routes/app.resources.tsx, routes/app.settings.tsx

Rules:
  - loader() fetch data via services/models
  - action() handle mutations via services
  - Component assemble templates + organisms + data
  - ErrorBoundary handle route errors
  - KHÔNG chứa reusable UI logic (extract to organisms)
```

## Import Rules

```
atoms/       → chỉ import: Polaris, utils, types
molecules/   → import: atoms, Polaris, utils, types, hooks
organisms/   → import: molecules, atoms, Polaris, utils, types, hooks
templates/   → import: Polaris, types (NO business components)
routes/      → import: tất cả layers + services + models

KHÔNG BAO GIỜ:
  ❌ atoms → molecules/organisms
  ❌ molecules → organisms
  ❌ components → routes
  ❌ components → services/models (trừ types)
```

## When to Promote a Component

```
Component quá phức tạp cho level hiện tại? → Promote lên level trên

Atom có > 1 internal state?         → Promote to Molecule
Molecule có > 3 sub-components?     → Promote to Organism
Organism dùng lại ở > 2 pages?      → OK, giữ nguyên Organism
Organism chỉ dùng ở 1 page?         → Inline trong route, không extract
```

## Storefront Exception

```
Storefront (extensions/src/) KHÔNG dùng Atomic Design.
Reason: Bundle size constraint (< 15KB). Flat component structure:

extensions/src/
├── components/
│   ├── AppWidget.tsx          # Self-contained
│   └── PromoBanner.tsx        # Self-contained
├── hooks/
└── utils/

Mỗi component là self-contained, không shared atoms/molecules.
Vì storefront quá nhỏ để justify abstraction layers.
```
