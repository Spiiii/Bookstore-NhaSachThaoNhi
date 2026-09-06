# Database provisioning for admin security

Review both Prisma migrations before applying them. The initial migration creates the existing nine R2 models and three enums; the second adds the approved admin singleton/session CHECK constraints. No account is inserted, deleted or reset by either migration.

For a fresh empty database, run Prisma migrate deploy with the migration-owner credential. For an existing schema created outside migrations, first compare it against the initial migration and inspect existing data; only after an exact baseline review may the initial migration be marked applied with Prisma migrate resolve. Never run the initial CREATE TABLE migration blindly on an existing database. The second migration refuses multiple/non-singleton rows instead of choosing an account to delete.

The migration adds admin constraints only. Remaining R2 product/content CHECK constraints listed in docs/database/prisma-layer.md still need their own reviewed migration before those modules are deployed. Do not interpret this admin remediation as completion of every catalogue database requirement.

Provision three dedicated LOGIN roles outside Git, with secrets supplied by your secret manager. They must be distinct, non-owner, non-superuser, and have no role memberships. privileges.sql accepts role names through PostgreSQL transaction-local settings, not SQL string substitution or embedded passwords:

```sql
BEGIN;
-- Set each value using your database client's bound parameters:
-- SELECT set_config('bookstore.runtime_role', $1, true);
-- SELECT set_config('bookstore.setup_role', $1, true);
-- SELECT set_config('bookstore.recovery_role', $1, true);
-- Execute the exact contents of privileges.sql on this same connection.
COMMIT;
```

The script revokes existing PUBLIC and dedicated-role table/column grants on the nine application tables before assigning the approved grants. It also revokes CREATE on public and pins each role's database search_path to pg_catalog,public. Review that PUBLIC revocation against any existing consumers before application; these tables are intended to be private to this platform. Roles that own objects or inherit permissions are rejected rather than silently altered. Connect as the actual resulting roles and run the PostgreSQL deployment gate; do not validate runtime behavior through the migration owner.

Neither runtime, setup nor recovery receives DELETE/TRUNCATE on users. Runtime/recovery cannot change id, singleton_key, role or created_at. Setup has SELECT/INSERT only; recovery has the approved credential/session columns; content DML belongs only to runtime. Provisioning owners can still change schema and privileges and must remain outside the application trust boundary.

## PostgreSQL test gate

From apps/api: `pnpm test:admin` runs the non-DB regression suites; `pnpm test:admin:postgres` runs real PostgreSQL tests and fails immediately when TEST_POSTGRES_ADMIN_URL is missing. Generate the Prisma client before testing on a fresh checkout.

Supply TEST_POSTGRES_ADMIN_URL for a disposable test cluster where the test owner can create/drop databases and roles. Never use production credentials. The suite creates a random bookstore_test_* database and three random dedicated roles, applies the actual migration/grants files, then drops only resources it created. It never resets the database named in the input URL. An interrupted run may leave test resources requiring explicit cleanup after inspection.

An optional local cluster is defined by deploy/compose.test.yaml. Inject a randomly generated TEST_POSTGRES_PASSWORD into the environment, start it using `docker compose -p bookstore-admin-test -f deploy/compose.test.yaml up -d --wait`, and inject a matching loopback TEST_POSTGRES_ADMIN_URL on port 55432 through the test runner. Stop it using the same compose project with `down`. Storage is tmpfs; no application volume is mounted. Do not print passwords/URLs or pass them as command arguments. PostgreSQL 17 here is a test target, not a production-version decision.

Required release gate: all admin regression tests and real PostgreSQL tests must pass on the approved PostgreSQL major before deployment. The database tests cover limited-role preflight, singleton checks/grants, concurrent setup, concurrent login, refresh replay, password/recovery versus refresh, and outer-transaction rollback with protected HTTP requests using old tokens.
