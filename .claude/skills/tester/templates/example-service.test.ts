/**
 * Example: Service Unit Test
 * Framework: Vitest + real test database (no mocks)
 *
 * Pattern:
 * - describe("ServiceName") → it("should do expected behavior")
 * - Arrange → Act → Assert
 * - Each test is self-contained (no shared mutable state)
 * - Uses real DB, not Prisma mocks
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "~/lib/db.server";
import * as productModel from "~/models/product.server";

// ============================================================
// Test Setup — real database, clean state per test
// ============================================================

const TEST_SHOP = "test-shop.myshopify.com";

beforeEach(async () => {
  // Clean up test data before each test (self-contained)
  await prisma.product.deleteMany({ where: { shop: TEST_SHOP } });
});

afterEach(async () => {
  await prisma.product.deleteMany({ where: { shop: TEST_SHOP } });
});

// ============================================================
// Model Tests — data access layer
// ============================================================

describe("productModel", () => {
  describe("createProduct", () => {
    it("should create product with correct fields", async () => {
      // Arrange
      const input = {
        shop: TEST_SHOP,
        title: "Test Product",
        status: "DRAFT" as const,
      };

      // Act
      const product = await productModel.createProduct(input);

      // Assert
      expect(product).toMatchObject({
        shop: TEST_SHOP,
        title: "Test Product",
        status: "DRAFT",
      });
      expect(product.id).toBeDefined();
      expect(product.createdAt).toBeInstanceOf(Date);
      expect(product.deletedAt).toBeNull();
    });

    it("should enforce unique constraint on shop + slug", async () => {
      // Arrange
      await productModel.createProduct({
        shop: TEST_SHOP,
        title: "Product A",
        slug: "product-a",
      });

      // Act & Assert
      await expect(
        productModel.createProduct({
          shop: TEST_SHOP,
          title: "Product B",
          slug: "product-a", // duplicate slug for same shop
        }),
      ).rejects.toThrow();
    });
  });

  describe("getProducts", () => {
    it("should only return products for the given shop", async () => {
      // Arrange — multi-tenant isolation
      await productModel.createProduct({ shop: TEST_SHOP, title: "Mine" });
      await productModel.createProduct({
        shop: "other-shop.myshopify.com",
        title: "Not Mine",
      });

      // Act
      const products = await productModel.getProducts(TEST_SHOP);

      // Assert
      expect(products).toHaveLength(1);
      expect(products[0].title).toBe("Mine");
    });

    it("should exclude soft-deleted products", async () => {
      // Arrange
      const product = await productModel.createProduct({
        shop: TEST_SHOP,
        title: "Deleted",
      });
      await productModel.softDelete(product.id, TEST_SHOP);

      // Act
      const products = await productModel.getProducts(TEST_SHOP);

      // Assert
      expect(products).toHaveLength(0);
    });
  });
});

// ============================================================
// Service Tests — business logic layer
// ============================================================

describe("productService", () => {
  describe("publishProduct", () => {
    it("should change status from DRAFT to ACTIVE", async () => {
      // Arrange
      const product = await productModel.createProduct({
        shop: TEST_SHOP,
        title: "Draft Product",
        status: "DRAFT",
      });

      // Act
      const published = await productModel.updateProduct(product.id, TEST_SHOP, {
        status: "ACTIVE",
      });

      // Assert
      expect(published.status).toBe("ACTIVE");
    });

    it("should throw NotFoundError for non-existent product", async () => {
      // Act & Assert
      await expect(
        productModel.updateProduct("non-existent-id", TEST_SHOP, {
          status: "ACTIVE",
        }),
      ).rejects.toThrow("not found");
    });

    it("should not allow publishing product from another shop", async () => {
      // Arrange — security: multi-tenant isolation
      const product = await productModel.createProduct({
        shop: "other-shop.myshopify.com",
        title: "Other Shop Product",
      });

      // Act & Assert — should not find product in wrong shop
      await expect(
        productModel.updateProduct(product.id, TEST_SHOP, {
          status: "ACTIVE",
        }),
      ).rejects.toThrow();
    });
  });
});
