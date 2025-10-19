# Category Product Integration Tests

## Overview
The CategoryProduct integration suite validates the end-to-end behaviour of the category listing page, ensuring the component fetches category data via axios, renders product cards, supports navigation into product details, and refetches data when the category slug changes.

## Integration Strategy
- **Approach:** Top-down, starting from the category route (`/category/:slug`). Tests render the real component inside a `MemoryRouter`, replacing only the layout wrapper. This allows axios calls, routing, and user interactions to play out exactly as they do in the app.
- **Collaborators Exercised:** React Router (`useParams`, `useNavigate`), axios (`/api/v1/product/product-category/:slug`), DOM rendering of product cards, and navigation links to `/product/:slug`.
- **Test Harness:** `MemoryRouter` with a helper `CategorySwitcher` button to simulate route changes, and a simple stub route to confirm navigation to product details.

## Test Scenarios
1. **Category Load and Rendering**
   - Fetches category metadata and product list, then confirms the heading, result count, and product cards render correctly.

2. **Navigation to Product Details**
   - After data fetch, clicking `More Details` should navigate to `/product/:slug`; the probe component verifies the route change.

3. **Slug Change Refetch**
   - Simulates a user switching categories via routing, verifying axios is called for the new slug and the UI updates with the new category name and products.

## Running the Tests
```bash
npm run test:frontend -- CategoryProduct.integration.test.js
```
Run the full frontend suite locally to meet global coverage thresholds.

## Future Enhancements
- Add a failure-path test where the axios request is rejected to ensure the UI degrades gracefully.
- Extend the suite once pagination/load-more behaviour is reintroduced to confirm additional pages fetch correctly.
