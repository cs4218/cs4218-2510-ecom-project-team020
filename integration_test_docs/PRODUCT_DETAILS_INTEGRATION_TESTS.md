# Product Details Integration Tests

## Overview
These integration tests cover the `ProductDetails` page from the React router entry point down through the cart context and localStorage persistence. They render the actual component inside `CartProvider`, spy on axios to emulate the backend product API, and validate that cart updates propagate through both context state and browser storage.

## Integration Strategy
- **Approach:** Top-down. Each test begins by routing to `/product/:slug`, allowing the component to fetch its data with axios, hydrate related products, and interact with `CartProvider`.
- **Collaborators Exercised:** React Router, axios HTTP calls (`/api/v1/product/get-product/:slug`, `/api/v1/product/related-product/:pid/:cid`), `CartProvider` state + localStorage hydration, toast notifications, and navigation to related products.
- **Test Harness:** `MemoryRouter` for navigation, `CartProvider` for cart state, and `jest.spyOn(axios, "get")` to supply deterministic API responses while running real component logic.

## Test Scenarios
1. **Main Product Add-to-Cart Persistence**
   - Seed localStorage with an existing cart item, load the product details, and add the main product to cart.
   - Verify localStorage reflects both the original and new items, ensuring provider hydration + persistence works end-to-end.

2. **Related Products Cart & Navigation Guards**
   - Load product details alongside two related products (one with a slug, one without).
   - Add a related item to cart and assert persistence + toast; confirm the “More Details” button is disabled when a slug is missing.

3. **Navigate to Related Product**
   - Click “More Details” on a related product with a slug and confirm the component refetches the new product and updates the displayed details.

## Running the Tests
```bash
npm run test:frontend -- ProductDetails.integration.test.js
```
Execute this locally (outside the sandbox) alongside the broader frontend suite to satisfy coverage thresholds.

## Next Steps
- Add a negative-path spec by forcing axios to reject so we can confirm the UI fails gracefully without breaking cart state.
- Consider asserting the in-memory cart (via a test-only context probe) if you need stronger guarantees beyond localStorage checks.
- Mirror this pattern for other product pages (e.g., CategoryProduct) to maintain consistent integration coverage across shopper flows.
