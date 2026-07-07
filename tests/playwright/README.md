# Playwright E2E (OPT-034 — staged rollout)

Node VM smoke tests (`flow_lobby_combat_smoke.js`) remain the CI default. Playwright adds optional real-browser coverage.

## Prerequisites

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## Run

```bash
npx playwright test
# or after adding script: npm run test:playwright
```

## Current scope

- `lobby_load.spec.js` — loads `index.html` via local static server, asserts `#app` mounts without fatal error screen.

## CI note

Playwright is **not** required for `npm test` / `npm run ci:smoke`. `playwright_setup_smoke.mjs` only verifies config + spec files exist.
