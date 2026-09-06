# CategoriesModule - B3/R2 implementation

CategoriesModule owns Category CRUD and tree projection. It does not own Product updates, Brand, Catalogue/PDF, files or authentication. The approved Category schema and enum set are unchanged.

The module imports PrismaModule, UsersModule and SecurityModule. Every admin mutation uses the existing current-session persistence operation; Categories does not read/write User directly or sign tokens. Public controllers are explicitly Public, while every admin route carries the ADMIN role requirement.

## API

Paths are relative to the API mount prefix. Import CategoriesModule in the API composition root when implementing bootstrap.

| Method | Path                      | Behavior                                                     |
| ------ | ------------------------- | ------------------------------------------------------------ |
| GET    | /categories               | Active flat list; filters page, limit, q and stored parentId |
| GET    | /categories/tree          | Complete visible tree in one response                        |
| GET    | /categories/by-slug/:slug | Active category detail                                       |
| GET    | /admin/categories         | Admin flat list with optional isActive filter                |
| GET    | /admin/categories/tree    | Complete tree including inactive nodes                       |
| GET    | /admin/categories/:id     | Admin detail by UUID                                         |
| POST   | /admin/categories         | Create category, active by default                           |
| PATCH  | /admin/categories/:id     | Edit fields, reparent or move to root with parentId=null     |
| DELETE | /admin/categories/:id     | Delete an unreferenced leaf only                             |

The explicit by-slug segment avoids ambiguity between a public category whose slug is tree and the fixed tree endpoint. Lists use page 1-10000, limit 1-50, deterministic sortOrder/id ordering and a bounded name substring query. They return items/page/limit/hasMore. Tree endpoints reject pagination/filter query properties and intentionally return the full hierarchy.

DTOs reject mass assignment and unknown fields. Name is nonblank up to 160 characters, slug is lowercase canonical ASCII up to 180, description is nullable plain text, parentId is nullable UUID v4, sortOrder is a nonnegative PostgreSQL integer and isActive is boolean. Required fields cannot be patched to null; nullable description/parentId can be cleared. Names remain nonunique as approved.

## Tree semantics

Category activity does not cascade. Public flat/detail reads hide the inactive row itself. The public tree removes inactive nodes but preserves each active descendant: it attaches the descendant to its nearest active ancestor or promotes it to a visible root. The response retains stored parentId and adds treeParentId so the consumer can distinguish persistence from the visible projection. It never exposes an inactive node's name/slug/description through the tree.

The admin tree includes active and inactive nodes using stored parents. Siblings and roots are ordered by sortOrder then UUID. Tree construction is iterative for ancestry validation and detects cycles, self-links and missing parents before linking nodes. Corrupt trees fail closed with CATEGORY_TREE_INVALID instead of looping or returning a partial hierarchy. A single Prisma findMany statement supplies the tree snapshot.

No maximum category depth was approved or added. The builder itself avoids recursive traversal, but HTTP JSON serialization and frontend rendering are recursive concerns for extremely deep operator-created trees. If an operational depth limit is later required, approve it as a business constraint and enforce it consistently on reparent plus database/import tooling.

## Mutation and deletion rules

All category mutations open a ReadCommitted transaction and first call UsersService.assertCurrentSession. Its singleton admin row lock acts as the shared serialization lock for every Category mutation and session replacement. Parent-chain validation and the final write occur while that common lock is held. This prevents two API reparent requests from independently creating a cycle; future category writers must use the same protocol. Lock order remains singleton first, followed by Category/FK locks acquired by Prisma/PostgreSQL.

Reparenting walks the proposed parent chain, rejects the category itself, repeated ancestors and missing parents. parentId self-reference is also covered by the pending R2 database CHECK. A concurrent session replacement cannot complete until the category transaction ends, and a stale authenticated request cannot write after replacement.

Deletion checks child and Product counts and rejects either reference with 409. PostgreSQL Restrict foreign keys are the authoritative race-safe fallback; no implicit child move, subtree deletion, Product unassignment or Product visibility change occurs. Duplicate slugs return 409; missing records/parents return 404. Database failures never become successful responses.

Changing a parent/category is independent of activity. Hiding a parent does not mutate its children or Product visibility, matching R2. Public product navigation must query active taxonomy separately; Catalog retains Product ownership.

## Verification and remaining gates

Run `pnpm --filter @bookstore/api test:categories`. Twenty-two tests exercise tree ordering/promotion/corruption, mutation lock order, stale sessions, self/descendant cycles, missing parents, deletion restrictions, public activity filters, real Nest JWT routing/validation and recursive Swagger output. Persistence is mocked.

The module passes API typecheck, build, focused ESLint and Prettier checks. Real PostgreSQL tests still need to cover simultaneous opposing reparent operations, reparent versus delete, Category deletion versus Product assignment and FK/unique error translation. The approved Category CHECK and remaining catalogue/content constraints are still pending in the database migration work documented in prisma-layer.md. No migration, database write or application bootstrap change was made by this task.

## Query review patches

See [Catalog, Categories and Brands query review](./catalogue-query-review.md) for strict pagination parsing, literal trimmed search, persistence-safe DTO strings and regression coverage. Existing relation and visibility semantics are unchanged.
