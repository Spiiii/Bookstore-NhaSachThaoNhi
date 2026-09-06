# Browser E2E gate

Run these tests only against a disposable environment with the API and Web app already running. The environment must contain exactly one admin and may be reset between runs.

Required environment variables:

- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`

Optional endpoints default to local development:

- `E2E_WEB_BASE_URL=http://127.0.0.1:3000`
- `E2E_API_BASE_URL=http://127.0.0.1:3001`

Run `pnpm test:e2e` from the repository root. The suite is serial because logging in intentionally replaces the singleton admin session. Product and News records created by tests use unique values and are deleted through a fresh admin session in cleanup.
