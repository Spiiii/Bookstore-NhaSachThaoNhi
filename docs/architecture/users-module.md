# UsersModule — approved B3/R2 ownership

UsersModule imports PrismaModule and exports only UsersService and IdentityReaderService. It has no controller, global scope, JWT/password-hashing/HTTP dependency, general user CRUD or PrismaService re-export. Database schema and enums are unchanged.

## Internal API

| Consumer API                                     | Purpose / precondition                                                                                                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IdentityReaderService.findLoginCredential(email) | Canonical email lookup constrained to singletonKey=1; returns only id, role, authVersion and passwordHash for internal password verification                                                                                |
| IdentityReaderService.readCurrentIdentity()      | Fresh primary DB read for guard/profile composition; no passwordHash or refreshTokenHash, no cache                                                                                                                          |
| UsersService.replaceSession(input, tx?)          | Login persistence after password verification; rechecks id/version/hash, increments version, replaces session and resets generation                                                                                         |
| UsersService.rotateSession(input, tx?)           | After refresh JWT verification by Auth/Security: match sid/version/generation/digest, rotate once without extending absolute expiry; a lower generation in the same current session commits revocation and returns replayed |
| UsersService.revokeSession(expected, tx?)        | Conditional logout; old sid/version cannot revoke a new session; already-absent session is unchanged                                                                                                                        |
| UsersService.replacePassword(input, tx?)         | After authenticated re-verification and hashing: require current nonexpired session and unchanged password hash; replace hash and revoke atomically                                                                         |
| UsersService.recoverPassword(input, tx?)         | Only the independently authorized operational recovery command: recheck credential snapshot, replace hash and revoke; no session required and no implicit bootstrap                                                         |
| UsersService.assertCurrentSession(tx, expected)  | Call first inside an outer content mutation transaction; lock/recheck singleton and throw AdminSessionRejectedError when stale/missing/expired                                                                              |

The types in types/admin-state.types.ts are internal contracts, not HTTP DTOs. Credential projection and session metadata must not be returned directly as a public Me response; Auth owns response shaping. UUID inputs are canonical UUID v4, matching the approved uuid() IDs and generated session IDs. Password hashes must already be produced by PasswordModule; refresh-token digests must already be SHA-256 computed by the auth orchestration boundary. Users does not generate, sign or verify tokens and does not accept raw passwords.

Recovery's existence as an internal persistence primitive is not authorization to expose it through Auth/HTTP. Operations must select the approved recovery DB credential and verify operator authority first. Admin account creation belongs to the separate initial operational setup implementation; this module deliberately has no create/upsert/delete method.

## State and transaction rules

All mutations first lock singletonKey=1 with SELECT ... FOR UPDATE, then read/check/update on that same transaction client. The default wrapper uses ReadCommitted. With tx supplied, no nested transaction is opened. Content callers must acquire the singleton lock before product/content locks and keep the transaction open through the protected write.

Nullability, generation reset, version increment and password-plus-revoke data are centralized in admin-state.rules.ts. Invalid persisted state and integer overflow fail closed. Database errors propagate rather than producing successful outcomes. No DB transaction includes hashing, signing or storage I/O.

MutationResult contains either updated with a hash-free session projection or a typed status: not_found, stale, expired, unchanged, replayed. Expected concurrent changes return stale; the caller must re-read/re-verify, never reuse a token prepared against the old version. Tokens for login use expected.authVersion+1/generation 0; refresh uses the same version and expected generation+1. Return tokens only after successful commit.

With the default transaction wrapper, replay revocation commits before the replayed result reaches Auth. The caller must translate it into an authentication failure outside the transaction. If an outer tx is supplied, all results are provisional until its owner commits. That owner must not throw in response to replayed inside the transaction and accidentally roll back the required revocation. Auth should use the default wrapper for refresh. Transaction failures/serialization errors require explicit caller handling; Users does not retry stale precomputed token material automatically.

## Configuration and integration gates

This module uses the plain PrismaModule import. Provision its primary DATABASE_URL synchronously before creating the Nest context, or await validated secret loading before bootstrap. Merely importing PrismaModule.withConfig separately in a sibling module does not configure the plain PrismaModule inside UsersModule. Runtime/setup/recovery remain separate processes with distinct credentials; bootstrap/shutdown wiring is not added here.

Required SQL CHECK constraints, singleton database privileges and initial admin setup remain deployment gates documented in database-design.md and prisma-layer.md. No migrations or database writes were run by this implementation task. The state-lock SQL assumes the connection search_path resolves users to the same table used by the Prisma mapping; provision a trusted search_path and do not grant untrusted schema creation to runtime credentials.

## Verification

22 unit tests passed, along with API typecheck/build and focused ESLint. Tests cover stale credential snapshots, old-session logout/refresh, rotation and replay, password/recovery invalidation, outer transaction reuse, invalid persisted state, counter overflow, error propagation and read projections/module exports. The transaction mock asserts lock-before-read/write but does not simulate PostgreSQL locking or concurrency. Real concurrency, rollback, isolation and database privilege tests remain required at database integration.

Use the isolated Jest/ts-jest command documented in infrastructure-review.md, changing testMatch to `<rootDir>/src/modules/users/tests/*.spec.ts`. Generate the Prisma client first on a clean checkout. The `.js` moduleNameMapper is needed for generated Prisma TypeScript in this isolated runner. No test-runner scaffold config was overwritten.
