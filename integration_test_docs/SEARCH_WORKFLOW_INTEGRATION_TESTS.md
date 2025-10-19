# Search Workflow Integration Tests

## Overview
These tests verify the end-to-end behaviour of the search feature from the user’s perspective. They render the real `SearchInput` and `Search` components inside the genuine `SearchProvider` and `CartProvider`, then drive user interactions with Testing Library. HTTP traffic is routed through axios; the tests spy on `axios.get` responses to emulate the product API so we can exercise the full front-end flow without mocking the contexts or cart logic.

## Integration Strategy
- **Approach:** Top-down, starting from the entry point a shopper uses—the search bar. The form submission travels through `SearchInput` → axios API call → `SearchProvider` state update → navigation to the `/search` route → `Search` page rendering → `CartProvider` state persistence.
- **Collaborators Exercised:** React Router navigation, context providers (`SearchProvider`, `CartProvider`), localStorage persistence, toast notifications, and the product API contract at `/api/v1/product/search/:keyword`.
- **Test Harness:** `MemoryRouter` to emulate routing, `supertest` not required because axios handles HTTP; `jest.spyOn(axios, "get")` stubs responses while keeping the real axios module so the component logic remains untouched.

## Test Scenarios
1. **Search → Display → Add to Cart**
   - Type a keyword, submit the form, and assert that axios is called with the correct REST path.
   - Wait for navigation to `/search` and confirm search results render with accurate metadata.
   - Click `ADD TO CART` to ensure `CartProvider` updates state, localStorage reflects the persisted cart, and a success toast is raised.

2. **Navigation and Input Guardrails**
   - Seed the API response with one product containing a slug and another without.
   - Assert the slugged product exposes an enabled `More Details` button while the slugless product keeps it disabled.
   - Click the enabled button and verify React Router navigates to `/product/:slug`.

3. **Cart Persistence**
   - Seed localStorage with an existing cart before rendering, then run the search flow.
   - After adding a new product, verify the persisted cart contains both the original and newly added items, confirming that `CartProvider` hydrates state from storage before mutations.

## Running the Tests
```bash
npm run test:frontend -- Search.integration.test.js
```
The sandbox environment used in automation blocks full coverage aggregation; run locally to combine these results with the rest of the Jest suite.

## Next Steps
- Extend coverage to ensure cart contents survive a simulated page refresh by reloading state from localStorage.
- Integrate MSW or a lightweight Express stub if we want to execute the actual HTTP request chain without spying on axios.
- Mirror this top-down pattern for other shopper flows (e.g., category browsing or cart checkout) to maintain consistent integration coverage.
