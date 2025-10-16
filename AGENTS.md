# Repository Guidelines

## Project Structure & Module Organization
- Express services start in `server.js`; route logic sits in `controllers/`, `routes/`, and `middlewares/`, with Mongoose schemas in `models/` and database wiring in `config/db.js` (reads `.env` values).
- React code lives in `client/src`: screens in `pages/`, shared UI in `components/`, state in `context/` and `hooks/`, and assets in `client/public`. Jest specs sit beside their targets (`controllers/*.test.js`, `client/src/**/*test.js`), and Playwright suites live in `e2e/`.

## Build, Test, and Development Commands
- Install dependencies with `npm install` (root) and `npm install --prefix client`. `npm run dev` starts both servers; `npm run server` or `npm run client` isolate each side.
- `npm test` executes all Jest suites; target back end or front end with `npm run test:backend` (spins up `mongodb-memory-server`) and `npm run test:frontend`.
- `npm run e2e` triggers Playwright; use `npm run e2e:headed` for debugging, `npm run e2e:report` to open the HTML report, and `npm run sonarqube` when a scanner is available.

## Coding Style & Naming Conventions
- Maintain ES modules, 2-space indentation, and early-return validation. Prefer `const`/`let`, camelCase naming, and concise helper methods.
- Backend files stay camelCase (`authController.js`); React components use PascalCase filenames and default exports. Tests mirror their subject with `.test.js` (Jest) or `.spec.ts` (Playwright).
- Format before committing with your editor or Prettier; the client build highlights lingering lint violations.

## Testing Guidelines
- Keep unit specs with their feature folders and reuse mocks in `__mocks__/`; rely on the in-memory Mongo utilities bundled with backend Jest config.
- React tests should use Testing Library queries (`screen.getByRole`, `findByText`) and avoid implementation-specific selectors.
- Extend end-to-end coverage in `e2e/`, reusing shared setup helpers from `e2e/utils` and Page Objects from `e2e/pom`.

## Commit & Pull Request Guidelines
- Follow the Conventional Commit pattern (`test: add playwright config`), keep subjects imperative and under 72 characters, and group related work.
- PR descriptions should call out the change summary, linked issue, and local verification (`npm test`, `npm run e2e`, screenshots for UI tweaks); mention skipped checks.
- Use descriptive branches like `feature/cart-bulk-actions`, and ensure Jest and Playwright (when relevant) are green before requesting review.

## Environment & Configuration Tips
- Keep a private `.env` with `MONGO_URL`, `DEV_MODE`, `PORT`, `JWT_SECRET`, and the Braintree triplet (`BRAINTREE_MERCHANT_ID`, `BRAINTREE_PUBLIC_KEY`, `BRAINTREE_PRIVATE_KEY`); never commit secrets.
- Share deterministic seed or fixture updates through versioned scripts or utilities so other contributors can replay the changes reliably.
