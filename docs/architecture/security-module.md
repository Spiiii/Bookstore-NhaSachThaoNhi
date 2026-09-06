# SecurityModule - B3/R2 implementation

Security owns JWT signing/verification, the access strategy, guards and decorators. It has no controller, login/refresh/logout orchestration, password handling or session mutation. Schema, enums and dependencies are unchanged.

## Boundaries

SecurityModule imports ConfigModule, JwtModule, PassportModule and UsersModule. Security providers inject only IdentityReaderService from Users; they never inject PrismaService or UsersService. The module exports SecurityTokenService, JwtAccessGuard and RolesGuard. Decorators and internal types are imported from their owning files.

Import SecurityModule once in the API composition root. It registers APP_GUARD with useExisting in JWT-then-RBAC order. It does not bootstrap the application or register HTTP endpoints. Test controllers exist only in the integration test.

## Required configuration

| Variable             | Requirement                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| JWT_ACCESS_SECRET    | Canonical standard base64 encoding of 32 cryptographically random bytes |
| JWT_REFRESH_SECRET   | Same format; independently generated and different from the access key  |
| JWT_ISSUER           | Nonempty issuer without surrounding whitespace or control characters    |
| JWT_ACCESS_AUDIENCE  | Nonempty access audience with the same string restrictions              |
| JWT_REFRESH_AUDIENCE | Nonempty refresh audience, different from the access audience           |

No secret or label has a fallback value. Format validation cannot establish randomness: provision random keys through the deployment secret mechanism and keep them out of Git. HS256 is the only accepted algorithm. Keys and audiences separate access and refresh token purposes. Changing keys invalidates existing tokens; overlapping key rotation is outside this implementation.

Provision configuration and the primary DATABASE_URL before creating the Nest context. Await external secret loading before bootstrap. UsersModule imports plain PrismaModule, so a separately configured sibling PrismaModule does not configure that nested instance. This feature does not load .env files or solve asynchronous root configuration ordering; see infrastructure-review.md and users-module.md.

## Tokens and session authorization

SecurityTokenService exposes signAccess, signRefresh, verifyAccess and verifyRefresh. TokenSession maps adminId to sub, sessionId to sid, authVersion to ver, and carries the existing absolute sessionExpiresAt. IDs must be canonical UUID v4 and counters must fit a nonnegative PostgreSQL integer.

Access lifetime is at most 15 minutes and is capped by session expiry. Refresh expiry equals the existing absolute session expiry, at most seven days from signing; rotation must reuse that expiry. Each signed refresh token has a fresh 256-bit random jti and an explicit generation. Signing does not create or extend a persisted session.

Verification checks signature, algorithm, issuer, audience, purpose, timestamps and claim shape. verifyAccess and verifyRefresh are cryptographic checks only. Auth must use Users session operations for persisted authorization, rotation, digest comparison and replay handling. Auth must expose prepared tokens only after the corresponding persistence transaction commits. Signing and hashing stay outside database transactions.

AccessTokenStrategy reads current identity from the primary database for every protected request, without caching. It matches sub, sid and ver, requires the database ADMIN role and a future session expiry, and constructs a principal without password or refresh hashes. Replaced/revoked sessions are rejected on their next protected request even while the JWT remains unexpired. Database read errors fail closed with HTTP 503 and no underlying database details.

The guard read alone cannot serialize a later content write against session replacement. Protected mutations must still call UsersService.assertCurrentSession inside their outer transaction before acquiring content locks, as required by B3.

## Guards and decorators

Routes are protected by default. Public explicitly skips authentication; Protected overrides a controller-level Public declaration. Roles accepts only the approved role type, and an empty role list denies access. Public combined with role metadata is contradictory and fails closed. CurrentAdmin retrieves the authenticated database projection and rejects missing identity; Auth remains responsible for shaping the public Me response.

The access guard accepts a Bearer token from the Authorization header only, with an 8192-character limit. Missing/invalid tokens produce HTTP 401 with ACCESS_TOKEN_INVALID; an expired signature-verified access token produces ACCESS_TOKEN_EXPIRED. Claim validation uses TOKEN_INVALID. Session mismatches use SESSION_REPLACED, expired sessions use SESSION_EXPIRED, unavailable state uses AUTH_STATE_UNAVAILABLE, and RBAC denial uses FORBIDDEN. These are internal Nest responses pending any approved application-wide error envelope.

## Verification

28 tests exercise real signed JWTs, Passport, global guard ordering and HTTP requests through a Nest application. IdentityReaderService is mocked and PrismaService is replaced to avoid database connections. Coverage includes default protection, public overrides, role enforcement, session replacement, expiry, database failure, token-purpose separation, malformed claims, wrong keys/audiences/issuer, disallowed algorithms and unsigned tokens.

These tests do not verify PostgreSQL connectivity, locking or concurrency. Database constraints and deployment integration remain the gates documented in prisma-layer.md and users-module.md. Use the isolated runner in infrastructure-review.md with testMatch set to `<rootDir>/test/integration/security.spec.ts`; retain the generated Prisma `.js` moduleNameMapper. No test-runner scaffold or application bootstrap was overwritten.
