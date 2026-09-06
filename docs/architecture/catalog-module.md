# CatalogModule - B3/R2 implementation

Catalog owns Product, ProductImage, ProductAttribute and ProductMarketplaceLink. It does not create Category/Brand/User CRUD, Authors/Publishers, orders, carts or Catalogue/PDF functionality. Schema and enums are unchanged.

The module imports PrismaModule for its own persistence, UsersModule for transaction-bound session checks, StorageModule for reading referenced immutable objects and SecurityModule for the existing global JWT/RBAC guards. Importing the same SecurityModule from Auth and Catalog uses Nest's shared module instance; guards are not duplicated as local controller guards. Catalog does not sign tokens or mutate User state.

## API

Paths below are relative to the API mount prefix. Import CatalogModule in the application composition root when implementing bootstrap. Swagger request/response metadata is provided, including binary image responses; shared OpenAPI export and frontend contract generation remain their existing tooling ownership.

| Method | Path                                               | Access / behavior                                                       |
| ------ | -------------------------------------------------- | ----------------------------------------------------------------------- |
| GET    | /products                                          | Public paginated catalogue, active products with image references only  |
| GET    | /products/:slug                                    | Public detail; hidden/missing products return 404                       |
| GET    | /products/:slug/images/:imageId                    | Image bytes only when the product is active and the image belongs to it |
| GET    | /admin/products                                    | Admin list, optionally filtered by isActive                             |
| GET    | /admin/products/:id                                | Admin detail including inactive marketplace rows                        |
| POST   | /admin/products                                    | Create hidden VND product                                               |
| PATCH  | /admin/products/:id                                | Edit fields; publication cannot be mass-assigned                        |
| PATCH  | /admin/products/:id/publication                    | Explicit publish/hide using isActive                                    |
| DELETE | /admin/products/:id                                | Delete product and cascaded child metadata; retain storage bytes        |
| POST   | /admin/products/:id/images                         | Attach an existing uploaded storageKey                                  |
| PATCH  | /admin/products/:id/images/:imageId                | Edit altText/sortOrder/primary flag                                     |
| DELETE | /admin/products/:id/images/:imageId                | Remove reference; cannot remove last image while public                 |
| GET    | /admin/products/:id/images/:imageId/content        | Authenticated preview, including hidden products                        |
| POST   | /admin/products/:id/attributes                     | Add display attribute                                                   |
| PATCH  | /admin/products/:id/attributes/:attributeId        | Edit scoped attribute                                                   |
| DELETE | /admin/products/:id/attributes/:attributeId        | Remove scoped attribute                                                 |
| PUT    | /admin/products/:id/marketplace-links/:marketplace | Upsert one SHOPEE/TIKTOK_SHOP link per product/platform                 |
| DELETE | /admin/products/:id/marketplace-links/:marketplace | Idempotently remove platform link                                       |

Lists accept page (1-10000, default 1), limit (1-50, default 20), q (name/SKU substring, up to 100 characters), categoryId and brandId. Ordering is createdAt descending then id descending; response includes items/page/limit/hasMore. Offset pagination may shift when products are inserted between requests. Public query validation rejects isActive and unknown properties. List responses omit description/attributes; detail responses include them.

All admin routes require the current ADMIN identity through Security. Mutation payloads use explicit validated DTOs; IDs are parsed as UUID v4, required fields cannot be patched to null, optional nullable fields can be cleared. Create always uses isActive=false and currency=VND. referencePrice is a nonnegative integer decimal string of at most 14 digits, serialized as a string to avoid precision loss; null means contact for price. Description remains Markdown text for the approved safe frontend renderer. FK enforcement checks referenced Category/Brand existence; Catalog does not alter taxonomy or automatically hide products when taxonomy is inactive.

## Mutation invariants

Every mutation uses a Prisma transaction, first calling UsersService.assertCurrentSession with the same transaction, then locking public.products for an existing product, then writing its metadata. This serializes writes against login/logout/recovery and serializes publication against image removal. Stale sessions fail with 401 SESSION_REPLACED. Missing scoped children produce 404, unique conflicts 409, invalid FK references 400. Database failures are not reported as success.

Publishing requires at least one image row. Deleting the last image on an active product returns 409; hiding first allows removal. Primary-image replacement clears the previous flag before setting/inserting the new primary inside the same transaction. The approved partial unique index is a second line of enforcement. Child IDs are always constrained to their parent before a write. Attribute key uniqueness and marketplace cardinality use existing database unique constraints.

Image attachment reads the object before opening the transaction. Storage objects must remain immutable after upload and must not be removed while referenced. No storage I/O occurs inside the database transaction, and Catalog never physically deletes objects, including on product deletion. A future cleanup operation must check every media-owning model and serialize reference attachment/removal before deleting shared bytes.

## Image and marketplace integration

Uploads retains ownership of multipart/Multer handling, size limits, full decoding, dimension/decompression checks and generation of immutable Storage keys. This task does not implement UploadsModule. Catalog accepts existing storage keys and checks readability plus PNG/JPEG/WebP signatures as defense in depth. Signature inspection alone does not prove a well-formed image and does not replace upload validation. SVG/HTML references are rejected. Product visibility filters image-row existence; storage durability and reference-aware cleanup are required so those rows continue to refer to valid uploaded files.

Public image responses use explicit image content types, nosniff, inline disposition and no-store. They expose no filesystem path or storage key. Missing/unsupported referenced objects return 404; other storage failures propagate. Admin image URLs require a Bearer header, so a frontend preview must fetch an authenticated blob rather than assume a plain img element can send a Bearer token. Image URLs are API-relative and must be resolved against the configured API mount prefix; global /api prefixes are not guessed here.

Marketplace URLs require HTTPS, exact allowed hosts, supported product/share paths and no credentials, non-default port or fragment. Shopee supports shopee.vn/www.shopee.vn product paths and s.shopee.vn shares; TikTok supports tiktok.com/www.tiktok.com/shop.tiktok.com product paths and vt.tiktok.com shares. No remote URL fetching or redirect expansion occurs. An accepted share URL's actual destination must be verified by the admin; the backend does not claim it checked the marketplace listing's existence. Host/path policy is centralized in marketplace-links/marketplace.policy.ts for explicit updates when platform formats change.

The public mapper always returns SHOPEE and TIKTOK_SHOP slots. Missing/inactive rows produce available=false, url=null and the message "Chưa có liên kết". The frontend renders the approved icons without interaction in that state; no placeholder links or new UI implementation are included here.

## Verification and deployment gates

Run `pnpm --filter @bookstore/api test:catalog` after Prisma client generation. The tests exercise real Nest HTTP validation/JWT guards with a mocked CatalogService, and separately exercise Catalog transaction sequencing and invariants with mocked persistence. They cover publish/last-image rules, primary replacement order, stale-session rejection, child scoping, public projections, URL validation and request mass-assignment defenses. They do not prove PostgreSQL locking/concurrency, filesystem atomicity or upload decoding.

Before deployment, complete and test UploadsModule, configure STORAGE_LOCAL_ROOT and existing JWT/DB settings, apply the approved schema/indexes/grants, and finish the remaining R2 product/content CHECK migrations documented in prisma-layer.md. Add real PostgreSQL tests for publication versus last-image deletion and primary-image replacement. No migration, storage deletion, live database write or application bootstrap change was executed by this implementation task.

## Query review patches

See [Catalog, Categories and Brands query review](./catalogue-query-review.md) for strict pagination parsing, literal trimmed search, persistence-safe DTO strings and regression coverage. Existing relation and visibility semantics are unchanged.
