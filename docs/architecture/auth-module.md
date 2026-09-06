# AuthModule - B3/R2 implementation

AuthModule imports UsersModule, SecurityModule, PasswordModule and ConfigModule. AuthService owns authentication orchestration; AuthController and AuthHttpPolicy own HTTP/cookie semantics. Users owns all persistence and transactions, Security owns JWT mechanics/current-session authorization, and Password owns Argon2id. Auth has no Prisma dependency, account creation, register or recovery endpoint. Database design and dependencies are unchanged.

## HTTP contract

Paths below assume no global API prefix. Import AuthModule in the API composition root when implementing bootstrap; this task does not replace the existing bootstrap scaffold.

| Endpoint                   | Input / authorization                                                                         | Success                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| POST /auth/login           | JSON email/password; trusted Origin                                                           | 200 `{ accessToken, tokenType: "Bearer" }` and refresh cookie |
| GET /auth/me               | Access Bearer token; Security checks current primary DB identity                              | 200 `{ id, email, displayName, role }`                        |
| POST /auth/refresh         | Refresh cookie; trusted Origin; no access token required                                      | 200 access response and rotated refresh cookie                |
| POST /auth/logout          | Refresh cookie, or access Bearer token when cookie parsing/verification fails; trusted Origin | 204 and cleared cookie                                        |
| POST /auth/change-password | JSON currentPassword/newPassword; current access Bearer token; trusted Origin                 | 204 and cleared cookie; sign in again                         |

Login, refresh and logout explicitly bypass the current-session access guard. Logout still verifies the selected token's signature, purpose and expiry before calling conditional revocation. Missing/invalid/expired logout credentials cause only local cookie clearing; stale credentials cannot revoke a newer session. A cryptographically valid refresh cookie takes precedence over a potentially expired access token. If cookie verification fails, logout verifies the access Bearer token and conditionally revokes its session. Persistence failures never trigger fallback or a false success. No logout success is returned when a required database revocation fails.

Refresh tokens never appear in JSON, URLs or logs. Responses use Cache-Control: no-store. Access tokens remain in client memory. Swagger DTOs describe requests and success responses; the composition root must register matching Bearer/cookie schemes in the shared Swagger setup.

Controller-local ValidationPipe rejects extra DTO properties and excludes submitted values/objects from validation errors. Passwords are not trimmed or normalized and are limited to 1024 UTF-8 bytes. New passwords require at least 15 characters and must differ from the current password; this is the implementation default for password-only admin authentication, not a schema change. Existing passwords remain usable for login. Setup/recovery should adopt the same minimum when those operations are implemented. Login email lookup uses the normalization owned by Users.

## Session orchestration

Login verifies credentials, prepares a random session ID, incremented version, 15-minute access token and seven-day absolute refresh/session expiry. It sends only the refresh SHA-256 digest and expected credential snapshot to Users.replaceSession. A stale credential snapshot fails rather than issuing precomputed tokens. Unknown email still performs Argon2 verification against a random dummy hash initialized once during Nest module initialization. No fixed dummy password is stored in source.

Refresh first verifies the refresh JWT using Security. It signs the next generation with a fresh jti and the same absolute expiry, then calls Users.rotateSession with old/new digests. The default Users transaction commits before its result is inspected. In particular, replay revocation commits before Auth throws REFRESH_REPLAYED. HTTP 401 clears the refresh cookie; unexpected persistence errors do not clear it or emit prepared tokens. The client must not blindly retry refresh after an ambiguous failure: rotation may already have committed.

Password change re-reads the credential projection, verifies currentPassword, hashes newPassword outside a transaction and calls Users.replacePassword with the expected session and password hash. The Users transaction atomically replaces the password and revokes the session. No raw password enters persistence and no JWT is signed inside a transaction.

Me exposes only the profile selected from the Security principal. It does not expose hashes, session IDs, versions or refresh generations. Security continues to read primary database state on every protected request.

## Configuration and deployment

Required JWT/password/database configuration and synchronous secret provisioning follow security-module.md and users-module.md. Auth adds:

| Setting               | Behavior                                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUTH_ALLOWED_ORIGINS  | Required comma-separated exact browser origins; HTTPS, with HTTP permitted only for loopback development origins; no wildcard, credentials or path |
| AUTH_COOKIE_SAME_SITE | strict by default; supports lax/none for the reviewed deployment topology                                                                          |
| AUTH_COOKIE_PATH      | /auth by default; set to the actual mounted path, e.g. /api/auth when a global prefix is used                                                      |

The cookie name is `__Secure-bookstore-refresh`. It is always HttpOnly/Secure, host-only (no Domain), with the configured path and absolute session expiry. Clearing uses identical scope/attributes. Local browser development must support Secure cookies; use HTTPS where loopback browser handling is insufficient. No cookie-parser dependency is required: the policy reads only its one JWT cookie and rejects duplicate values.

All four POST actions require an exact allowed Origin, including login and logout. Missing and null origins are denied; nonbrowser clients must explicitly send a trusted Origin. This is the CSRF defense for cookie mutations; SameSite is additional protection. Do not allow untrusted origins in deployment CORS. Cross-origin browser calls require credentials enabled in CORS and the client; same-site versus cross-site topology determines SameSite. The feature does not guess deployment domains or modify root CORS.

AuthRequestGuard limits login/change-password to five attempts per minute each, refresh/logout to thirty, per resolved source IP. Verified session tokens additionally use a session/version bucket; invalid tokens never consume that session bucket. Express request.ip is used; the guard never trusts forwarded headers directly. Configure exact trusted proxy addresses in bootstrap before proxy deployment, never trust proxy=true indiscriminately. IPv4-mapped addresses share their IPv4 quota. Buckets expire after one minute and the map is capped at 10,000 entries without evicting active limits. Saturation rejects new buckets. Clients sharing an IP still share a source quota; an external shared edge limiter is required for replicas and distributed traffic. No Redis or table is introduced. Request-body size limits, TLS, header limits and trusted proxy configuration remain bootstrap/deployment responsibilities.

## Verification scope

Integration tests in apps/api/test/integration/auth.spec.ts use real Nest HTTP routing/validation, Passport/JWT and Argon2id. Users/identity persistence is mocked to verify orchestration, cookie behavior, replay outcomes, stale-session rejection, password replacement, rate limiting and failure paths. This does not establish PostgreSQL lock/concurrency behavior or browser cookie/CORS acceptance; those require the database and deployed browser integration gates.

Run with the isolated Jest/ts-jest runner documented in infrastructure-review.md, using `<rootDir>/test/integration/auth.spec.ts` as testMatch and retaining the generated Prisma `.js` moduleNameMapper. Existing test-runner scaffolds and application bootstrap are unchanged.
