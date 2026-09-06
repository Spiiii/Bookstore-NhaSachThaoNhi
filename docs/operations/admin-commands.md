# Admin operational commands

Implementation companion to the approved admin-access.md runbook. The TypeScript commands now exist; migrations and database grants have not been applied by this task. Its earlier statements that scripts are not yet created are superseded here. No database design changes were made.

## Build and execute

From apps/api, generate the approved Prisma client using the existing toolchain, then run `pnpm build:operations`. Use the pinned pnpm version from package.json. Entry points are:

```text
node dist-operations/operations/setup-admin.js
node dist-operations/operations/recover-admin.js
```

These commands accept no CLI arguments. Run them as separate short-lived processes, never import them into the HTTP application. OperationalModule contains only ConfigModule, PrismaModule, PasswordModule and UsersModule, and starts through createApplicationContext with Nest logging disabled. No HTTP listener, AuthModule, SecurityModule, controller or AppModule is imported.

## Credentials and secret input

Inject SETUP_DATABASE_URL and SETUP_DATABASE_ROLE for setup, or RECOVERY_DATABASE_URL and RECOVERY_DATABASE_ROLE for recovery, through the authorized secret manager/runner. OPERATOR_ID is required for attribution. Role names must use lowercase PostgreSQL identifiers; actor identifiers may contain letters, digits, @, dot, underscore, colon and hyphen. No fallback to runtime DATABASE_URL exists. An externally verified hosting/secret-manager identity authorizes recovery; OPERATOR_ID is audit metadata, not an authentication mechanism.

The selected mode credential is assigned to process-local DATABASE_URL before Nest constructs the shared plain PrismaModule, including the instance imported by UsersModule. No asynchronous configuration loader is used. Existing PasswordModule environment parameters retain their shared validation and defaults. Do not supply runtime or migration-owner credentials to either command. Temporary mode credential environment entries are removed during cleanup; do not treat JavaScript string cleanup as guaranteed memory erasure.

Pipe one UTF-8 JSON object from the secret manager to stdin, followed by EOF. Interactive TTY input is rejected to avoid accidentally echoing a password. Do not construct the secret with shell arguments, paste it into shell history or save it in the repository. Configure the runner to suppress input capture and secret logging.

| Command       | Secret JSON fields           |
| ------------- | ---------------------------- |
| setup-admin   | email, displayName, password |
| recover-admin | password                     |

Only these fields are accepted. The input is capped at 16 KiB; passwords require at least 15 characters and at most 1024 UTF-8 bytes, matching Auth's current policy. No password normalization is performed. Setup normalizes email and trims displayName. There is no default password. The setup command does not consume stdin when the singleton already exists; stop/close any upstream secret producer after the command exits. No email-change operation is implemented by recovery.

## Preflight and persistence

Preflight reads current database identity and effective basic table/column grants, rejects an unexpected login/role, superuser/owner and selected elevated privileges, and requires the validated `CHECK (singleton_key = 1)` constraint. Setup requires SELECT/INSERT without UPDATE/DELETE/TRUNCATE. Recovery requires SELECT and the password/session update columns without INSERT/DELETE/TRUNCATE or table-wide UPDATE and protected-column updates. The preflight accepts the approved simple singleton CHECK expression, not an arbitrary logically equivalent expression.

This is a fail-closed sanity check, not a full database authorization audit. Before execution, provisioning must also verify the Prisma unique singleton constraint, all R2 constraints, trusted schema/search_path, no unsafe role memberships or SET ROLE escalation, and no unrelated schema/data privileges. The query resolves users through the same trusted search_path used by Users row locking. No SQL grants, migrations or constraints are created by these commands.

Setup first reads singletonKey=1. An existing row is an unconditional no-op: no secret read, hash replacement, session mutation, update or upsert. Otherwise it hashes before insertion and inserts through this operational entry point only. A unique conflict becomes a no-op only after a second lookup confirms the singleton now exists. Other errors fail. Database uniqueness arbitrates simultaneous setup processes; there is no service-only singleton guarantee.

Recovery reads a credential snapshot, hashes outside a transaction, then calls UsersService.recoverPassword. That primitive owns row locking, snapshot checks, password replacement, version increment and session clearing. A missing admin or stale outcome fails without fallback creation or automatic retry. Operator authorization must be renewed/rechecked as appropriate before retrying an interrupted operation.

## Exit, audit and validation

The process writes JSON audit events containing mode, operator ID, timestamp and outcome to stdout. It never prints input, passwords, hashes, tokens, database URLs or raw exception stacks. Failure sets exit code 1 and writes a generic safe error to stderr. Created/already_exists/recovered identify committed results; a later cleanup_failed event means the database operation may already have committed. The Nest context is closed in finally. Prisma instances register in an operations-owned resource set before initialization; finally also closes this set when context creation rejects. Prisma closes its own failed connection initialization and preserves the original failure. Disconnect is shared through one promise. Abrupt process termination must still be handled by the runner. Keep these commands short-lived and supervise their timeout/exit.

Ten tests cover setup idempotence, insertion payload, unique-conflict handling, permission failure, missing admin, recovery delegation/stale state, environment/password validation, preflight decisions and controller-free module lifecycle. Persistence and SQL responses are mocked. Actual PostgreSQL constraint enforcement, grants, concurrent setup/recovery, connection failure and secret-manager piping remain deployment integration checks. No live database or admin password was touched during this task.

The isolated Jest runner from infrastructure-review.md can target `<rootDir>/test/integration/operations.spec.ts` with the same Prisma `.js` moduleNameMapper. Operations build separately from runtime; distribute only the operations artifact and its required shared code to authorized operators.
