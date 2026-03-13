/**
 * Example: Component Test (React Testing Library + Polaris)
 * Framework: Vitest + @testing-library/react
 *
 * Pattern:
 * - Test user interactions, not implementation details
 * - Use Polaris test utilities for wrapped components
 * - Arrange → Act → Assert
 * - Screen queries: getByRole > getByText > getByTestId
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PolarisTestProvider } from "@shopify/polaris";

import { ProductCard } from "~/components/organisms/ProductCard";

// ============================================================
// Helper — wrap component with Polaris provider
// ============================================================

function renderWithPolaris(ui: React.ReactElement) {
  return render(<PolarisTestProvider>{ui}</PolarisTestProvider>);
}

// ============================================================
// Component Tests
// ============================================================

describe("ProductCard", () => {
  const defaultProps = {
    product: {
      id: "prod_1",
      title: "Test Product",
      status: "ACTIVE" as const,
      description: "A test product",
    },
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it("should render product title and status", () => {
    // Arrange & Act
    renderWithPolaris(<ProductCard {...defaultProps} />);

    // Assert
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("should call onEdit when edit button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderWithPolaris(<ProductCard {...defaultProps} onEdit={onEdit} />);

    // Act
    await user.click(screen.getByRole("button", { name: /edit/i }));

    // Assert
    expect(onEdit).toHaveBeenCalledWith("prod_1");
  });

  it("should show confirmation modal before delete", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithPolaris(<ProductCard {...defaultProps} />);

    // Act — click delete
    await user.click(screen.getByRole("button", { name: /delete/i }));

    // Assert — modal should appear
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it("should call onDelete after confirming deletion", async () => {
    // Arrange
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderWithPolaris(<ProductCard {...defaultProps} onDelete={onDelete} />);

    // Act — click delete → confirm
    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    // Assert
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith("prod_1");
    });
  });

  it("should show DRAFT badge for draft products", () => {
    // Arrange
    const draftProduct = {
      ...defaultProps.product,
      status: "DRAFT" as const,
    };

    // Act
    renderWithPolaris(<ProductCard {...defaultProps} product={draftProduct} />);

    // Assert
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("should disable actions for ARCHIVED products", () => {
    // Arrange
    const archivedProduct = {
      ...defaultProps.product,
      status: "ARCHIVED" as const,
    };

    // Act
    renderWithPolaris(
      <ProductCard {...defaultProps} product={archivedProduct} />,
    );

    // Assert
    expect(screen.getByRole("button", { name: /edit/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /delete/i })).toBeDisabled();
  });
});

// ============================================================
// Loader/Action Test Pattern (Remix route testing)
// ============================================================

// Note: For route loader/action tests, use the pattern below:
//
// import { loader, action } from "~/routes/app.products";
//
// describe("app.products loader", () => {
//   it("should return products for authenticated shop", async () => {
//     const request = new Request("http://app.test/app/products");
//     const response = await loader({
//       request,
//       params: {},
//       context: { session: { shop: TEST_SHOP } },
//     });
//     const data = await response.json();
//     expect(data.products).toBeDefined();
//   });
// });
