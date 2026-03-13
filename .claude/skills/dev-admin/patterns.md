# Admin App Code Patterns

## 1. Loader Pattern (Data Fetching)

```typescript
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query GetProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        edges {
          node {
            id
            title
            status
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `, { variables: { first: 25 } });

  const data = await response.json();
  return json({
    items: data.data.products.edges.map((e: any) => e.node),
    pageInfo: data.data.products.pageInfo,
    shop: session.shop,
  });
};
```

## 2. Action Pattern (Form Handling)

```typescript
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { z } from "zod";

const CreateResourceSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional(),
  status: z.enum(["active", "draft", "archived"]),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const formData = await request.formData();
  const parsed = CreateResourceSchema.safeParse(
    Object.fromEntries(formData)
  );

  if (!parsed.success) {
    return json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const resource = await db.resource.create({
      data: {
        ...parsed.data,
        shopId: session.shop,
      },
    });

    return json({ resource, success: true });
  } catch (error) {
    return json(
      { errors: { form: ["Failed to create resource"] } },
      { status: 500 }
    );
  }
};
```

## 3. Page Layout Pattern

```typescript
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Banner,
  SkeletonPage,
  SkeletonBodyText,
} from "@shopify/polaris";
import { useNavigation } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";

export default function ResourceListPage() {
  const { items } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  if (isLoading) {
    return (
      <SkeletonPage primaryAction>
        <Layout>
          <Layout.Section>
            <Card>
              <SkeletonBodyText lines={5} />
            </Card>
          </Layout.Section>
        </Layout>
      </SkeletonPage>
    );
  }

  return (
    <Page>
      <TitleBar title="Resources">
        <button variant="primary" onClick={() => navigate("/app/resources/new")}>
          Create resource
        </button>
      </TitleBar>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              {/* Content */}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
```

## 4. Error Boundary Pattern

```typescript
import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { Card, EmptyState, Page } from "@shopify/polaris";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <Page>
        <Card>
          <EmptyState
            heading={`${error.status} ${error.statusText}`}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>{error.data?.message ?? "Something went wrong"}</p>
          </EmptyState>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <Card>
        <EmptyState
          heading="Unexpected error"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Please try again later or contact support.</p>
        </EmptyState>
      </Card>
    </Page>
  );
}
```

## 5. GraphQL Query Pattern (Shopify Admin API)

```typescript
// graphql/products.ts
export const GET_PRODUCTS = `
  #graphql
  query GetProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      edges {
        node {
          id
          title
          handle
          status
          totalInventory
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 5) {
            edges {
              node {
                id
                title
                price
              }
            }
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

// Usage in loader
const response = await admin.graphql(GET_PRODUCTS, {
  variables: { first: 25, query: searchQuery },
});
```

## 6. Resource Picker Pattern (App Bridge)

```typescript
import { useAppBridge } from "@shopify/app-bridge-react";

function ProductPicker() {
  const shopify = useAppBridge();

  const handlePickProducts = async () => {
    const selected = await shopify.resourcePicker({
      type: "product",
      multiple: true,
      filter: { variants: false },
    });

    if (selected) {
      // Handle selected products
      const productIds = selected.map((p) => p.id);
      // Submit via form or fetcher
    }
  };

  return (
    <Button onClick={handlePickProducts}>
      Select products
    </Button>
  );
}
```

## 7. Toast & Banner Pattern

```typescript
import { useAppBridge } from "@shopify/app-bridge-react";
import { Banner } from "@shopify/polaris";

// Toast (transient notification)
function SaveButton() {
  const shopify = useAppBridge();
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("Saved successfully");
    }
  }, [fetcher.data]);

  return (
    <fetcher.Form method="post">
      <Button submit loading={fetcher.state !== "idle"}>
        Save
      </Button>
    </fetcher.Form>
  );
}

// Banner (persistent notification)
function SettingsPage() {
  const actionData = useActionData<typeof action>();

  return (
    <Page>
      {actionData?.errors?.form && (
        <Banner tone="critical" title="Error saving settings">
          <p>{actionData.errors.form[0]}</p>
        </Banner>
      )}
      {/* ... */}
    </Page>
  );
}
```

## 8. Pagination Pattern (Cursor-based)

```typescript
import { IndexTable, Pagination } from "@shopify/polaris";
import { useSearchParams } from "@remix-run/react";

function ResourceList() {
  const { items, pageInfo } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <>
      <IndexTable
        resourceName={{ singular: "item", plural: "items" }}
        itemCount={items.length}
        headings={[
          { title: "Name" },
          { title: "Status" },
          { title: "Created" },
        ]}
      >
        {items.map((item, index) => (
          <IndexTable.Row id={item.id} key={item.id} position={index}>
            <IndexTable.Cell>{item.name}</IndexTable.Cell>
            <IndexTable.Cell>{item.status}</IndexTable.Cell>
            <IndexTable.Cell>{item.createdAt}</IndexTable.Cell>
          </IndexTable.Row>
        ))}
      </IndexTable>

      <Pagination
        hasPrevious={pageInfo.hasPreviousPage}
        hasNext={pageInfo.hasNextPage}
        onPrevious={() => {
          setSearchParams({ before: pageInfo.startCursor });
        }}
        onNext={() => {
          setSearchParams({ after: pageInfo.endCursor });
        }}
      />
    </>
  );
}
```

## 9. Bulk Action Pattern

```typescript
import { IndexTable, useIndexResourceState } from "@shopify/polaris";

function ResourceList() {
  const { items } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(items);

  const promotedBulkActions = [
    {
      content: "Activate",
      onAction: () => {
        fetcher.submit(
          { ids: selectedResources, action: "activate" },
          { method: "post" }
        );
      },
    },
    {
      content: "Deactivate",
      onAction: () => {
        fetcher.submit(
          { ids: selectedResources, action: "deactivate" },
          { method: "post" }
        );
      },
    },
  ];

  return (
    <IndexTable
      resourceName={{ singular: "item", plural: "items" }}
      itemCount={items.length}
      selectedItemsCount={
        allResourcesSelected ? "All" : selectedResources.length
      }
      onSelectionChange={handleSelectionChange}
      promotedBulkActions={promotedBulkActions}
      headings={[{ title: "Name" }, { title: "Status" }]}
    >
      {/* rows */}
    </IndexTable>
  );
}
```
