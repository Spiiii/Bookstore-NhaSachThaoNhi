# BannersModule - B3/R2 implementation

BannersModule owns Banner CRUD, visibility windows, placement validation, target links and image references. It imports PrismaModule, UsersModule, SecurityModule, StorageModule and ConfigModule. No schema, enum, dependency or migration is changed.

## Schedule contract

The requested API fields are `startAt` and `endAt`. They map explicitly to approved Prisma fields `startsAt` and `endsAt`; database names remain unchanged. Request and admin-response DTOs use the singular API names. Sending database field names in a request is rejected as an unknown property.

Both timestamps are optional and nullable. Null means unbounded. Non-null input requires an ISO timestamp with timezone and at most millisecond precision. When both bounds exist, endAt must be strictly later than startAt. PATCH merges supplied bounds with the current row before checking the resulting interval, inside the session-checked transaction. Omitting a bound preserves it; null clears it.

Public list, detail and image requests require isActive=true, an allowed placement and the half-open interval `[startAt, endAt)`: start <= now and end > now. Both predicates use the same server timestamp per query. Thus the exact start is included and exact end excluded. No cron job or persisted scheduling status is needed. A newly created banner defaults to inactive under the approved schema; isActive can be supplied explicitly. Overlapping banners in the same placement are allowed.

## API

Paths are relative to the API mount prefix. Import BannersModule in the composition root when application bootstrap is implemented, consistent with the other content modules.

| Method | Path                     | Behavior                                              |
| ------ | ------------------------ | ----------------------------------------------------- |
| GET    | /banners                 | Public currently visible banners                      |
| GET    | /banners/:id             | Public currently visible banner by UUID               |
| GET    | /banners/:id/image       | Image bytes with the same visibility checks           |
| GET    | /admin/banners           | Admin list, including inactive/expired/future banners |
| GET    | /admin/banners/:id       | Admin detail                                          |
| POST   | /admin/banners           | Create with an existing uploaded image                |
| PATCH  | /admin/banners/:id       | Edit metadata, activation and schedule                |
| DELETE | /admin/banners/:id       | Delete metadata; retain shared image bytes            |
| GET    | /admin/banners/:id/image | Authenticated preview regardless of schedule          |

Lists accept page 1-10000, limit 1-50 and optional placement. Defaults are page=1/limit=20. Admin lists additionally accept isActive and a literal title substring q up to 100 characters. Public queries reject those private filters. Pagination uses sortOrder then id ascending, fetches limit+1 and returns items/page/limit/hasMore. Pages can shift during concurrent edits. No uniqueness is imposed on sortOrder or placement.

Public responses omit the internal title, storage key, scheduling metadata and timestamps. Image URLs are API-relative; clients resolve them against the API origin/mount prefix. Public list/detail/image and admin read responses use no-store. Frontend/CDN caching must not bypass schedule or withdrawal checks. Image responses use explicit PNG/JPEG/WebP MIME and nosniff. Admin image previews require an authenticated fetch/blob.

## Placement and target policy

`BANNER_PLACEMENTS` is a comma-separated configuration allowlist, default `home-hero` as approved in R2. Entries must be canonical lowercase hyphenated names up to 64 characters. Invalid configuration fails initialization. Supply configuration through the existing ConfigService before Nest initialization; this module does not introduce independent dotenv loading. Changing placement configuration requires restarting the API.

Unsupported placement values are rejected on create/update and filtered queries. Public reads also exclude previously stored placements removed from configuration. Admin unfiltered list/detail retain access to those records for correction or deletion.

targetUrl is nullable and accepts site-root-relative paths or absolute HTTPS URLs without credentials. Protocol-relative URLs, backslashes, control characters and unsafe normalized internal paths are rejected. Internal encoded path separators/control bytes are rejected. Serialized URLs are bounded to the approved 2048-character storage limit. No remote fetching occurs. Null means no navigation: clients must not generate a fake link. Frontend safe-link rendering remains its responsibility.

## Transactions and images

All mutations call UsersService.assertCurrentSession first inside the same Prisma transaction. The singleton row lock serializes cooperating content writes and session replacement, including partial schedule validation. Stale sessions fail with 401; missing records with 404; invalid schedule/placement/target input with 400. Required fields cannot be patched to null; an empty altText is allowed for decorative images.

The existing uploaded image is checked for readability and PNG/JPEG/WebP signatures before opening a transaction. Storage keys use the current local immutable store UUID format. Uploads owns multipart intake, limits and full image decoding. Signature checks do not replace those validations. Storage objects must remain immutable and available while referenced. Image replacement or Banner deletion never physically deletes bytes that other models may share.

## Verification and remaining gates

Run `pnpm --filter @bookstore/api test:banners` after Prisma generation. Unit tests cover schedule predicates, partial updates, null bounds, session rejection, URL/placement policy, public projections and image rejection. HTTP tests use real Nest routing/JWT/validation with a mocked BannersService. Persistence/storage are mocked: actual PostgreSQL locking and CHECK constraints are not verified by this suite.

The approved SQL CHECK for the time interval and remaining R2 deployment constraints stay in migration ownership. Upload decoding, storage durability and frontend rendering/caching remain integration gates. No migration, live database write, storage deletion, frontend code or bootstrap change was performed.
