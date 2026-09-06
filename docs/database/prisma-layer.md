# Prisma layer — R2 / Blueprint B3

This layer implements the approved nine models and three enums. Navigation relations do not create join tables. No migration, seed, database push or database connection is executed by this change.

## Ownership and configuration

- PrismaModule is not global. Consumers explicitly import it; UsersModule must not re-export PrismaService.
- PrismaService owns a PrismaPg adapter and its internally managed pool. Construction performs no network I/O; Nest initialization connects and fails on errors, context shutdown disconnects. Runtime bootstrap must enable Nest shutdown hooks; operational entry points must close their context in finally.
- The composition root must configure validated ConfigModule settings before initializing consumers. DATABASE_URL is the primary PostgreSQL connection for that process, never a read replica. Runtime, setup and recovery each receive their own explicit credential through their separate composition roots; this layer does not choose privileged credentials or fall back to another URL.
- Offline OpenAPI tooling must override PrismaService before context initialization, as required by B3. There is no skip-DB/auth flag or runtime fallback.
- prisma.config.ts reads DATABASE_URL from the process environment; it does not auto-load .env files or configure seed execution. Offline validation/generation can run without a URL. Database CLI commands need an explicitly supplied migration credential; do not reuse the runtime credential for migrations.
- Generator output is apps/api/src/generated/prisma, CJS, excluded from Git. Generate before API typecheck/build on a clean checkout. The client is not exported to packages/contracts or apps/web.
- The generated output directory must not contain a scaffold .gitkeep before its first generation: Prisma refuses a nonempty directory that is not already a generated client. The original placeholder has been removed.

## Index support

The pinned Prisma 7.10.0 supports the partialIndexes preview feature. It is enabled only to represent the approved partial unique index on product_images(product_id) WHERE is_primary = true. Other indexes, unique constraints and foreign keys match R2. This does not restrict a product to one image overall.

Reference: [Prisma indexes](https://docs.prisma.io/docs/orm/prisma-schema/data-model/indexes).

## Required migration SQL before deployment

Prisma schema does not represent PostgreSQL CHECK constraints. The approved constraints are implemented across migrations `202609030002_admin_constraints`, `202609030003_content_schedule_constraints` and `202609050001_r2_domain_constraints`; schema validation or db push alone is not a deployment gate:

- users: singleton_key = 1, auth_version >= 0, refresh_generation >= 0; canonical trimmed lowercase non-empty email; non-empty display_name. UNIQUE singleton_key without CHECK does not enforce a singleton.
- users: session_id, refresh_token_hash and session_expires_at must be all NULL or all NOT NULL; absent session implies refresh_generation = 0; present hash must match 64 lowercase hexadecimal characters. No expiry CHECK using now().
- Canonical lowercase ASCII non-empty slugs on categories, brands, products and news; canonical uppercase trimmed non-empty SKU on products. Preserve R2 normalization semantics.
- Non-empty required names/titles, product image storage_key, product attribute key/label/value, marketplace URL, news content, banner image_key/placement. Attribute key is lowercase ASCII. Banner alt_text may be empty; nullable descriptive fields retain R2 nullability.
- All sort_order values are nonnegative. Product reference_price is NULL or nonnegative; currency = 'VND'.
- categories: parent_id IS NULL OR parent_id <> id.
- news: DRAFT requires published_at IS NULL, PUBLISHED requires published_at IS NOT NULL, ARCHIVED permits either.
- banners: ends_at > starts_at when both are present.

The migrations must also be paired with the approved database privileges: runtime cannot INSERT/DELETE/TRUNCATE users or UPDATE id/singleton_key/role; setup and recovery use distinct limited roles. The SQL is prepared but has not been applied to a deployment database. Do not treat these constraints as deployed until migrations, grants and PostgreSQL gates have passed in that environment.

## Invariants outside Prisma schema

Public products require a valid image. Publish/delete-last-image operations must lock the same Product row, and public reads must filter image existence. Category multi-level cycles require transactional serialization. URL allowlists, storage object validity, Markdown safety, immutable IDs and single-session authentication checks retain their R2 service/operations ownership; this infrastructure layer does not implement them.

No AuthSession, Catalogue, ContentType, extra role/permission/settings tables, controllers or business services are introduced.

## Verification completed

Prisma 7.10.0 format, validate and generate passed. API TypeScript build, focused ESLint and Prettier checks passed. An offline schema diff confirmed exactly nine CREATE TABLE statements and the partial unique index predicate; no SQL file was saved or applied. Generated model names and enum values match R2. Lifecycle probes verified connect/disconnect delegation, rejection of missing/blank credentials and propagation of connection failure using stubbed connections. Live PostgreSQL constraints, privileges and runtime behavior remain untested.

# Content schedule remediation update

Migration `202609030003_content_schedule_constraints` now implements the approved News state/timestamp and Banner interval CHECKs with a fail-fast preflight. The migration is prepared but not applied to a live database by this task. See `deploy/database/content-schedule-preflight.sql` and `docs/architecture/content-media-remediation.md`. Other previously pending content constraints remain separate work.
