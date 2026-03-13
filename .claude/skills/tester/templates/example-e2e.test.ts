/**
 * Example: E2E Test (Playwright)
 * Framework: Playwright
 *
 * Pattern:
 * - Test critical user journeys end-to-end
 * - Use page object pattern for maintainability
 * - Each test is independent (no shared state)
 * - Test against real running app
 */

import { test, expect, type Page } from "@playwright/test";

// ============================================================
// Page Object — encapsulate page interactions
// ============================================================

class ProductListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/app/products");
    await this.page.waitForLoadState("networkidle");
  }

  async getProductCount() {
    return this.page.locator('[data-testid="product-row"]').count();
  }

  async clickCreateProduct() {
    await this.page.click('button:has-text("Create product")');
  }

  async searchProducts(query: string) {
    await this.page.fill('[placeholder="Search products"]', query);
    await this.page.waitForResponse("**/app/products?q=*");
  }

  async deleteProduct(title: string) {
    const row = this.page.locator(`[data-testid="product-row"]:has-text("${title}")`);
    await row.locator('button[aria-label="Delete"]').click();
    await this.page.click('button:has-text("Confirm")');
    await this.page.waitForResponse("**/app/products");
  }
}

class ProductFormPage {
  constructor(private page: Page) {}

  async fillTitle(title: string) {
    await this.page.fill('[name="title"]', title);
  }

  async fillDescription(description: string) {
    await this.page.fill('[name="description"]', description);
  }

  async selectStatus(status: string) {
    await this.page.selectOption('[name="status"]', status);
  }

  async submit() {
    await this.page.click('button:has-text("Save")');
    await this.page.waitForResponse("**/app/products/**");
  }
}

// ============================================================
// E2E Tests — critical user journeys
// ============================================================

test.describe("Product Management", () => {
  let productList: ProductListPage;
  let productForm: ProductFormPage;

  test.beforeEach(async ({ page }) => {
    productList = new ProductListPage(page);
    productForm = new ProductFormPage(page);
  });

  test("should create a new product", async ({ page }) => {
    // Navigate to products
    await productList.goto();
    const initialCount = await productList.getProductCount();

    // Create new product
    await productList.clickCreateProduct();
    await productForm.fillTitle("E2E Test Product");
    await productForm.fillDescription("Created by Playwright");
    await productForm.selectStatus("DRAFT");
    await productForm.submit();

    // Verify redirect to list with new product
    await expect(page).toHaveURL(/\/app\/products/);
    await expect(page.locator('text="E2E Test Product"')).toBeVisible();

    // Verify count increased
    const newCount = await productList.getProductCount();
    expect(newCount).toBe(initialCount + 1);
  });

  test("should search and filter products", async () => {
    await productList.goto();

    // Search for specific product
    await productList.searchProducts("E2E Test");

    // Verify filtered results
    const count = await productList.getProductCount();
    expect(count).toBeGreaterThan(0);
  });

  test("should show error for invalid product data", async ({ page }) => {
    await productList.goto();
    await productList.clickCreateProduct();

    // Submit empty form
    await productForm.submit();

    // Verify validation errors
    await expect(page.locator('text="Title is required"')).toBeVisible();
  });

  test("should handle loading states", async ({ page }) => {
    await productList.goto();

    // Verify skeleton loading appears then content replaces it
    // (for slow connections — simulate with network throttling)
    await page.route("**/app/products", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.reload();
    await expect(page.locator(".Polaris-SkeletonPage")).toBeVisible();
    await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible();
  });
});

// ============================================================
// Error Boundary Test
// ============================================================

test.describe("Error Handling", () => {
  test("should show error boundary on server error", async ({ page }) => {
    // Force a server error
    await page.route("**/app/products", (route) =>
      route.fulfill({ status: 500, body: "Internal Server Error" }),
    );

    await page.goto("/app/products");

    // Verify error boundary renders
    await expect(page.locator('text="Something went wrong"')).toBeVisible();
    await expect(page.locator('button:has-text("Try again")')).toBeVisible();
  });
});
