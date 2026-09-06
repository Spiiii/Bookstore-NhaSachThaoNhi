# Admin security remediation - APPROVED

User approval recorded on 2026-09-03 for the implementation addressing all five audit findings. This approves the reviewed code and supporting files; it does not mark the pending PostgreSQL deployment gate as passed or record any database application.

This implements the five findings from the Users/Security/Auth/Operations audit. Models, enums and module ownership remain unchanged. No production or existing database has been modified.

| Finding                                         | Implementation                                                                                                                                                                                         | Verification                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Singleton and grants missing                    | Initial migration generated from the approved nine-model Prisma schema; separate admin CHECK migration; explicit least-privilege grants for dedicated roles                                            | Files prepared; real PostgreSQL gate requires a test cluster                                                 |
| Shared unauthenticated quota                    | Per-source buckets plus verified-session/version buckets; bounded memory/expiry; forwarded headers are not read directly                                                                               | Source isolation, IPv4 mapping, expiry, invalid-token isolation and session limits tested                    |
| Logout ignores valid Bearer when cookie invalid | Crypto failure returns a typed boolean to the controller, which falls back to Bearer; database errors propagate                                                                                        | Regression verifies revocation and subsequent protected-request rejection; DB failure cannot become success  |
| Context init resource leak                      | Operations-owned registry captures Prisma resources during construction, before Nest init; finally closes registered resources even without a returned context; failed Prisma connect cleans up itself | Failed connect, later failing hook, cleanup failure and original-error preservation tested                   |
| No database concurrency/grant gate              | Real PostgreSQL suite creates a temporary database/roles, executes actual SQL files, exercises setup/session/password/recovery races and rollback; isolated Compose and CI gate supplied               | Suite typechecked; execution blocked locally by absent PostgreSQL/Docker and missing TEST_POSTGRES_ADMIN_URL |

## Results on this workspace

- 85 tests passed across Users, Security, Auth, rate-limit and Operations suites with persistence doubles.
- API typecheck, API build, operations build and focused ESLint passed.
- The PostgreSQL runner exits 1 rather than silently skipping when its test URL is absent. The eight PostgreSQL integration tests have NOT been executed locally.
- No migrations, grants, account changes or live PostgreSQL writes were executed.

## Review decisions and release gates

Review the initial-schema baseline procedure and PUBLIC grant revocation in deploy/database/README.md before applying to an existing installation. Existing schema/data must be inspected; no automated account deletion or migration-baseline assumption is made. The initial migration reproduces the existing schema, and the follow-up migration adds only the approved admin constraints. Other catalogue/content CHECK constraints remain outside this admin remediation scope.

The CI workflow runs `test:admin` and `test:admin:postgres` against an ephemeral PostgreSQL 17 container with a freshly generated test password. It is prepared in the repository and has not been dispatched. Configure its successful job as a required branch/deployment check in the repository hosting settings; local files cannot enforce remote branch protection.

Deployment must configure exact trusted proxy addresses so request.ip represents the client, and a shared edge limiter before using multiple replicas. The in-process limiter does not claim distributed enforcement or immunity to clients sharing a NAT/large distributed floods. PostgreSQL 17 is a test target; rerun against the approved production major as well.

The pending PostgreSQL run is material: these changes are approved, but the database findings cannot be marked deployment-verified until that gate passes. See deploy/database/README.md for the safe test setup and commands.
