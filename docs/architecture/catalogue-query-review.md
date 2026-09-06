# Catalog, Categories and Brands query review

Reviewed scope: relations, Prisma queries, DTO validation, pagination and filters. These patches preserve B3/R2 ownership, models, enums and database design.

## Applied patches

- All three list DTOs share canonical positive decimal query parsing. Hexadecimal, exponent notation, leading zeros, fractional strings, arrays and null are rejected. Existing page/limit defaults and bounds remain unchanged.
- Search text is trimmed; whitespace-only input omits the search filter. PostgreSQL LIKE metacharacters `%`, `_` and backslash are escaped so substring searches treat user input literally.
- String DTO fields reject NUL before persistence. Canonical slug, SKU, price and attribute-key patterns reject a trailing newline. SKU normalization happens before length validation, including Unicode uppercase expansion.
- Product list queries select response fields and required image/marketplace relations without loading description or attributes. Detail queries retain their complete projection.
- Missing marketplace messages use the correct UTF-8 text: "Chưa có liên kết". Missing links remain unavailable with null URLs.
- Brand website URLs are checked against the 2048-character storage limit after URL serialization, which can expand Unicode into percent-encoded characters.

The shared helpers belong to `apps/api/src/common/dto`; they introduce no cross-business-module dependency. A shared regression suite is included by each of the three existing test runners.

## Relations and query behavior retained

Product has optional single Category and Brand references. Catalog owns its image, attribute and marketplace children; child writes remain parent-scoped. Marketplace upserts use the existing product/platform unique key. Category and Brand deletion refuse referenced records, backed by Restrict foreign keys. No implicit Product unassignment or taxonomy visibility cascade is introduced.

Category ancestry validation and cooperating content writes retain the transaction-bound singleton session lock. The category tree preserves its existing active-node promotion semantics. No relation or migration change was required by this review.

Public Product queries require activity and at least one image row. Public taxonomy queries filter activity; admin activity filters remain explicit. Product category/brand filters and Category parent filters target stored direct references, not descendants.

Pagination remains bounded offset pagination with a deterministic unique tie-breaker and `limit + 1` for `hasMore`. Concurrent inserts, deletes or sort-field changes can shift pages; these endpoints do not promise a multi-request snapshot. Tree endpoints continue to return the full hierarchy and reject list filters.

## Verification

- Catalog runner: 61 passing tests.
- Categories runner: 58 passing tests.
- Brands runner: 55 passing tests.
- Each runner includes the same 36 new regression tests: 102 distinct tests across the three runners.
- API typecheck/build, focused ESLint and formatting checks pass.

Persistence is mocked in these tests. They verify Prisma arguments and application sequencing, not actual PostgreSQL LIKE execution, foreign-key enforcement or concurrent locking. Real PostgreSQL integration tests and the existing approved migration/deployment gates remain outstanding. No migration or live database write was performed.
