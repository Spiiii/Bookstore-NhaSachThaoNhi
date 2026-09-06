# BrandsModule - B3/R2 implementation

BrandsModule owns Brand CRUD, visibility and optional logo references. It imports PrismaModule, UsersModule, SecurityModule and StorageModule, following the existing Catalog pattern. It does not import Catalog internals, alter Products, sign tokens, create accounts or change the schema/enums.

## API

All paths are relative to the API mount prefix. Import BrandsModule in the application composition root when bootstrap is implemented. Request/response DTOs include Swagger metadata.

| Method | Path                       | Behavior                                         |
| ------ | -------------------------- | ------------------------------------------------ |
| GET    | /brands                    | Paginated active brands                          |
| GET    | /brands/by-slug/:slug      | Active brand detail                              |
| GET    | /brands/by-slug/:slug/logo | Logo of an active brand                          |
| GET    | /admin/brands              | Admin list, optionally filtered by isActive      |
| GET    | /admin/brands/:id          | Admin detail                                     |
| POST   | /admin/brands              | Create, active by default                        |
| PATCH  | /admin/brands/:id          | Update, hide/show or clear nullable fields       |
| DELETE | /admin/brands/:id          | Delete only when no Product references remain    |
| GET    | /admin/brands/:id/logo     | Authenticated preview, including inactive brands |

Lists accept page 1-10000 (default 1), limit 1-50 (default 20) and q (name substring, max 100 characters). Ordering is name then id, ascending. Responses contain items/page/limit/hasMore. Public queries reject isActive and unknown properties. Admin routes require the current ADMIN identity through Security's existing global guards.

Name is required, nonblank and at most 160 characters; names are not unique. Slug is canonical lowercase ASCII and unique. Description is nullable plain text, websiteUrl is nullable HTTPS without embedded credentials, logoKey is a nullable UUID v4 from the existing immutable upload store. The local-store UUID restriction matches the current StorageAdapter; supporting another key format later requires updating validation together with that adapter integration. No remote website requests are made. Clients must render description as text and external links with their normal safe-link handling.

PATCH cannot clear required name/slug or set isActive=null. It may clear description, websiteUrl and logoKey. Unknown properties, including nested products or IDs, are rejected. Hiding a Brand does not change visibility of its Products, matching R2.

## Transactions and files

Every mutation rechecks the session through UsersService.assertCurrentSession inside its ReadCommitted transaction before accessing mutable Brand state. That shared singleton lock serializes the write with session replacement and other cooperating content mutations. Unique conflicts map to 409, missing rows to 404, referenced Brand deletion to 409 and stale sessions to 401 SESSION_REPLACED. PostgreSQL FK Restrict remains authoritative for references; no Product is implicitly reassigned or deleted.

Logo bytes are checked before the transaction; no storage I/O occurs while holding database locks. Uploads retains multipart/Multer handling, size limits and full image decode validation. Brands adds a readability/signature check for PNG/JPEG/WebP and rejects SVG/HTML references; signature inspection is not a substitute for the upload pipeline. UploadsModule is not implemented by this task.

Replacing, clearing or deleting a logo reference never deletes bytes, because Product/News/Banner or another Brand may share the object. Future storage cleanup must prove no remaining references and serialize with attachment across owners. Logo URLs are API-relative, not filesystem paths; the frontend resolves them with the API prefix. Public responses omit storage keys, activity flags and internal timestamps. Missing logos return null URL or HTTP 404, with no placeholder URL.

Logo responses use an explicit image MIME, nosniff and no-store. Admin previews require a Bearer-authenticated fetch/blob; a plain img tag cannot supply a Bearer header. Existing STORAGE_LOCAL_ROOT/JWT/database configuration must be ready before Nest initialization. Public logo access checks current Brand visibility before reading bytes.

## Verification

Run `pnpm --filter @bookstore/api test:brands` after Prisma client generation. HTTP tests use real Nest routing/JWT/validation with a mocked BrandsService. Service tests use persistence/storage doubles to check session ordering, logo preparation outside transactions, nullable updates, HTTPS policy, reference restrictions, error mapping and public projections. PostgreSQL concurrency and actual upload decoding remain integration gates.

No migration, database write, filesystem deletion or application bootstrap change was performed. The approved Brand/content CHECK constraints remain part of pending migration work documented in prisma-layer.md; this module does not claim those deployment gates have passed.

## Query review patches

See [Catalog, Categories and Brands query review](./catalogue-query-review.md) for strict pagination parsing, literal trimmed search, persistence-safe DTO strings and regression coverage. Existing relation and visibility semantics are unchanged.
