# Metafields & Metaobjects Conventions

## Metafield Namespace Rules

### App-owned Metafields (chỉ app đọc/ghi)
```
Namespace: $app:<key>
Ví dụ:    $app:affiliate_code
           $app:commission_rate
           $app:tracking_id
```
- Shopify tự reserved namespace `$app:` cho app hiện tại
- Merchant KHÔNG thể edit trực tiếp trong admin
- Bị xóa khi app uninstall (nếu app yêu cầu)

### Merchant-editable Metafields
```
Namespace: custom
Key:       snake_case, descriptive
Ví dụ:    custom.affiliate_enabled
           custom.commission_override
```
- Merchant có thể edit trong admin UI
- Pin metafield definition để hiện trong admin form

### Naming Conventions
```
✅ DO:
  - snake_case cho keys: commission_rate, tracking_id
  - Descriptive names: affiliate_referral_code (not ref_code)
  - Group related keys: affiliate_code, affiliate_status, affiliate_tier

❌ DON'T:
  - camelCase: commissionRate
  - Abbreviations unclear: aff_cd, trk_id
  - Generic names: data, value, info
```

## Metafield Types Reference

| Type | Use Case | Example Value |
|------|----------|---------------|
| `single_line_text_field` | Short text, codes | `"REF-ABC123"` |
| `multi_line_text_field` | Long text, descriptions | `"Terms and conditions..."` |
| `number_integer` | Counts, IDs | `42` |
| `number_decimal` | Rates, percentages | `"15.5"` |
| `boolean` | Toggles, flags | `true` |
| `date` | Dates without time | `"2025-03-15"` |
| `date_time` | Timestamps | `"2025-03-15T10:30:00Z"` |
| `json` | Complex structured data | `{"tier": "gold", "rate": 15}` |
| `url` | Links | `"https://example.com"` |
| `color` | Hex colors | `"#FF5733"` |
| `money` | Currency amounts | `{"amount": "10.00", "currency_code": "USD"}` |
| `rating` | Scores | `{"value": "4.5", "scale_min": "1.0", "scale_max": "5.0"}` |
| `list.single_line_text_field` | Tags, lists | `["tag1", "tag2"]` |
| `mixed_reference` | References to resources | `"gid://shopify/Product/123"` |

## Metafield Definition Pattern (GraphQL)

```typescript
// LUÔN tạo definition trước khi write metafield values
// Definition = schema, đảm bảo type safety + admin UI

const CREATE_METAFIELD_DEFINITION = `
  #graphql
  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        name
        namespace
        key
        type {
          name
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Usage
await admin.graphql(CREATE_METAFIELD_DEFINITION, {
  variables: {
    definition: {
      name: "Affiliate Code",
      namespace: "$app:affiliate",
      key: "code",
      type: "single_line_text_field",
      description: "Unique affiliate referral code",
      ownerType: "CUSTOMER",
      pin: true, // Show in admin UI
      validations: [
        {
          name: "min",
          value: "3",
        },
        {
          name: "max",
          value: "50",
        },
        {
          name: "regex",
          value: "^[A-Z0-9-]+$",
        },
      ],
    },
  },
});
```

## Read/Write Metafield Patterns

### Read Metafields
```typescript
// Single metafield on a resource
const GET_PRODUCT_METAFIELD = `
  #graphql
  query GetProductMetafield($id: ID!, $namespace: String!, $key: String!) {
    product(id: $id) {
      metafield(namespace: $namespace, key: $key) {
        id
        value
        type
      }
    }
  }
`;

// Multiple metafields on a resource
const GET_CUSTOMER_METAFIELDS = `
  #graphql
  query GetCustomerMetafields($id: ID!) {
    customer(id: $id) {
      metafields(first: 10, namespace: "$app:affiliate") {
        edges {
          node {
            id
            namespace
            key
            value
            type
          }
        }
      }
    }
  }
`;
```

### Write Metafields
```typescript
// Set metafield on a resource (upsert behavior)
const SET_METAFIELDS = `
  #graphql
  mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Usage — batch set (more efficient than individual calls)
await admin.graphql(SET_METAFIELDS, {
  variables: {
    metafields: [
      {
        ownerId: "gid://shopify/Customer/123",
        namespace: "$app:affiliate",
        key: "code",
        type: "single_line_text_field",
        value: "REF-ABC123",
      },
      {
        ownerId: "gid://shopify/Customer/123",
        namespace: "$app:affiliate",
        key: "tier",
        type: "single_line_text_field",
        value: "gold",
      },
    ],
  },
});
```

## Metaobject Pattern

### Khi nào dùng Metaobject thay vì Metafield?

```
Metafield: Attach data lên existing resource (product, customer, order)
  → Customer có metafield "affiliate_code"

Metaobject: Tạo custom data type hoàn toàn mới
  → "AffiliateProfile" object với nhiều fields + relationships

Rule of thumb:
  - 1-3 fields đơn giản → JSON metafield
  - 4+ fields, cần query/filter → Metaobject
  - Cần relate to multiple resources → Metaobject + mixed_reference
```

### Define Metaobject
```typescript
const CREATE_METAOBJECT_DEFINITION = `
  #graphql
  mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        id
        type
        name
      }
      userErrors {
        field
        message
      }
    }
  }
`;

await admin.graphql(CREATE_METAOBJECT_DEFINITION, {
  variables: {
    definition: {
      type: "$app:affiliate_profile",
      name: "Affiliate Profile",
      description: "Affiliate partner profile and settings",
      access: {
        admin: "MERCHANT_READ",        // Merchant can read in admin
        storefront: "PUBLIC_READ",     // Visible in storefront
      },
      capabilities: {
        publishable: { enabled: true },
      },
      fieldDefinitions: [
        {
          key: "display_name",
          name: "Display Name",
          type: "single_line_text_field",
          required: true,
          validations: [
            { name: "min", value: "2" },
            { name: "max", value: "100" },
          ],
        },
        {
          key: "commission_rate",
          name: "Commission Rate (%)",
          type: "number_decimal",
          validations: [
            { name: "min", value: "0" },
            { name: "max", value: "100" },
          ],
        },
        {
          key: "avatar",
          name: "Avatar",
          type: "file_reference",
        },
        {
          key: "social_links",
          name: "Social Links",
          type: "json",
        },
        {
          key: "customer",
          name: "Linked Customer",
          type: "mixed_reference",
        },
      ],
    },
  },
});
```

### Query Metaobjects
```typescript
const GET_AFFILIATE_PROFILES = `
  #graphql
  query GetAffiliateProfiles($type: String!, $first: Int!) {
    metaobjects(type: $type, first: $first) {
      edges {
        node {
          id
          handle
          fields {
            key
            value
            type
          }
        }
      }
    }
  }
`;

// Storefront API — for customer-facing pages
const STOREFRONT_QUERY = `
  query GetAffiliateByHandle($handle: MetaobjectHandleInput!) {
    metaobject(handle: $handle) {
      fields {
        key
        value
      }
    }
  }
`;
```

## Metafield Migration Pattern

```typescript
// Khi cần migrate metafield data (change type, namespace, etc.)
// LUÔN chạy migration trong background job

import { db } from "~/db.server";
import { logger } from "~/utils/logger.server";

export async function migrateMetafields(
  admin: AdminApiContext,
  shop: string,
) {
  const BATCH_SIZE = 50; // Respect API rate limits
  let cursor: string | null = null;
  let migrated = 0;

  do {
    const response = await admin.graphql(`
      #graphql
      query GetOldMetafields($first: Int!, $after: String) {
        customers(first: $first, after: $after) {
          edges {
            node {
              id
              metafield(namespace: "old_namespace", key: "old_key") {
                value
              }
            }
            cursor
          }
          pageInfo { hasNextPage }
        }
      }
    `, { variables: { first: BATCH_SIZE, after: cursor } });

    const data = await response.json();
    const customers = data.data.customers.edges;

    // Batch set new metafields
    const metafields = customers
      .filter((c: any) => c.node.metafield?.value)
      .map((c: any) => ({
        ownerId: c.node.id,
        namespace: "$app:affiliate",
        key: "code",
        type: "single_line_text_field",
        value: c.node.metafield.value,
      }));

    if (metafields.length > 0) {
      await admin.graphql(SET_METAFIELDS, {
        variables: { metafields },
      });
      migrated += metafields.length;
    }

    cursor = customers.length > 0
      ? customers[customers.length - 1].cursor
      : null;

    logger.info("metafield_migration_progress", {
      shop, migrated, batch: customers.length,
    });

    // Respect rate limits
    await new Promise((r) => setTimeout(r, 500));
  } while (cursor);

  logger.info("metafield_migration_complete", { shop, total: migrated });
}
```
