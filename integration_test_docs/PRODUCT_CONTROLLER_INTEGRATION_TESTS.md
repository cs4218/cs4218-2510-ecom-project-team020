# Product Controller Integration Tests

## Overview
These integration tests exercise the product module end-to-end by starting at the Express router entry points and allowing requests to travel through middleware (`requireSignIn`, `isAdmin`), controller logic, and the real Mongoose models backed by an in-memory MongoDB instance (`mongodb-memory-server`). This gives us confidence that the wiring between modules behaves correctly under realistic HTTP interactions, extending the earlier unit coverage that mocked individual dependencies.

## Integration Strategy
- **Approach:** Top-down. Each test begins at the highest level exposed to clients—the REST endpoints under `/api/v1/product`—and verifies behaviour as the request flows down the stack. Because all collaborating modules (routes, middleware, controllers, models) are already implemented, no stubs were needed for lower levels.
- **Tooling:** `supertest` for driving HTTP requests against an Express app configured with the real `productRoutes`, and `mongodb-memory-server` to supply an isolated database. JWTs are signed using the project’s middleware to mimic authenticated admin/non-admin actors.

## Test Coverage
### Authentication and Authorisation
- **Create Product (unauthenticated):** Validates that missing `Authorization` headers cause `401 Unauthorized`.
- **Create Product (non-admin):** Ensures `isAdmin` middleware blocks contributors (`403 Forbidden`).
- **Update Product (non-admin):** Confirms access control on the update endpoint.

### CRUD + Business Flows
- **Create Product (happy path):** Posts multipart form data, asserts slug generation via `slugify`, and verifies persistence in MongoDB.
- **Update Product:** Uses `PUT /update-product/:pid` to update name/price and checks slug regeneration, database mutation, and 201 response contract.
- **Update Validation:** Omits the required `name` field to surface the controller’s validation guard (`500` with error payload).
- **Delete Product:** Deletes a seeded product, ensuring the response confirms deletion and the document is removed from the collection.

### Retrieval Endpoints
- **List Products:** `GET /get-product` returns newly created products with populated category metadata and correct total counts.
- **Single Product:** `GET /get-product/:slug` retrieves a populated product; also asserts that unknown slugs return `success: true` with `product: null`.
- **Category Listing:** `GET /product-category/:slug` returns the category details and associated product list.
- **Related Products:** `GET /related-product/:pid/:cid` yields siblings within the same category while excluding the current product.
- **Photo Delivery:** `GET /product-photo/:pid` streams the stored binary payload, validating content type headers and byte-for-byte correctness.

### Query Utilities
- **Filtering:** `POST /product-filters` with category IDs and price range ensures the controller filters products server-side.
- **Pagination:** `GET /product-list/:page` confirms skip/limit behaviour across multiple pages.
- **Search:** `GET /search/:keyword` performs keyword matching against name/description.
- **Count:** `GET /product-count` tallies total products after multiple creations.

## Fixtures & Helpers
- Two users are seeded up-front: an admin (role `1`) and a contributor (role `0`), with JWTs signed via the real secret to test auth flows.
- `createCategory(name)` seeds categories in Mongo with a unique slug per test.
- `createProductViaApi(params, options)` posts through the create-product endpoint, optionally attaching binary photos, overriding auth tokens, or expecting non-201 responses. It returns both the raw response and the created product document for reuse.

## How to Run
1. Ensure local dependencies are installed (`npm install`).
2. Execute the integration suite alone:  
   ```bash
   npm run test:backend -- productController.integration.test.js
   ```
   *Note:* The sandboxed environment blocks `mongodb-memory-server`; run locally or allow Mongo binaries to bind to loopback.

## Limitations & Next Steps
- The suite focuses on HTTP-level integration; it does not simulate network failures or external services (e.g., Braintree).
- Additional negative tests could cover malformed IDs, missing photos, or database disconnections.
- Similar top-down suites should be created for other controllers to maintain consistent integration coverage across the backend.
