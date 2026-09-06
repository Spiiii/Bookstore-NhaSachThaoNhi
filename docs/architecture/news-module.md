# NewsModule - B3/R2 implementation

NewsModule owns News persistence, Markdown source, publication state and cover references. It imports PrismaModule, UsersModule, SecurityModule and StorageModule. No model, enum, database field or migration is changed. The author is assigned from the authenticated singleton admin; there is no author/account CRUD or client-selectable authorId.

## Routes

Paths are relative to the API mount prefix. Import NewsModule in the application composition root when bootstrap is implemented, matching the existing content modules.

| Method | Path                        | Behavior                                                             |
| ------ | --------------------------- | -------------------------------------------------------------------- |
| GET    | /news                       | Public paginated list of due published articles                      |
| GET    | /news/by-slug/:slug         | Public Markdown detail                                               |
| GET    | /news/by-slug/:slug/cover   | Cover bytes for a due published article                              |
| GET    | /admin/news                 | Admin list; optional status filter                                   |
| GET    | /admin/news/:id             | Admin detail, including drafts and scheduled articles                |
| POST   | /admin/news                 | Create DRAFT with publishedAt=null                                   |
| PATCH  | /admin/news/:id             | Edit title, slug, excerpt, content and coverKey                      |
| PATCH  | /admin/news/:id/publication | Set DRAFT, PUBLISHED or ARCHIVED; optional explicit publication time |
| DELETE | /admin/news/:id             | Delete article metadata; retain shared cover bytes                   |
| GET    | /admin/news/:id/cover       | Authenticated cover preview                                          |

Lists accept page 1-10000, limit 1-50 and a trimmed literal title substring q of at most 100 characters. Defaults are page=1 and limit=20. Sorting uses publishedAt descending/nulls last, then id descending. Responses include items/page/limit/hasMore. Lists exclude the content column and never load the User relation. Offset pagination may shift during concurrent changes. Public status filters and unknown query/body properties are rejected.

## Publication and ownership

Public list, detail and cover queries require status=PUBLISHED and publishedAt <= server query time. DRAFT, ARCHIVED and future schedules are invisible, including their covers. No scheduler or extra SCHEDULED enum is needed. Public reads use no-store so the API does not authorize stale cached visibility; future frontend/CDN caching must preserve publication and withdrawal behavior.

DRAFT clears publishedAt. ARCHIVED retains the existing timestamp, including null for an archived draft. PUBLISHED uses an explicit timezone-qualified timestamp when supplied. Otherwise a transition into PUBLISHED uses server time; an already PUBLISHED article keeps its existing timestamp. Returning from ARCHIVED to PUBLISHED without a timestamp publishes now. Dates on DRAFT/ARCHIVED commands are rejected. All three states can transition to each other because R2 specifies no further transition restriction.

Generic content edits cannot change status, publishedAt or authorId. Every mutation rechecks the current session inside its transaction before accessing mutable News state. The singleton row lock serializes cooperating mutations with publication changes and session replacement. Duplicate slugs return 409, missing records 404 and replaced sessions 401. Real PostgreSQL concurrency verification remains a deployment gate.

## Markdown and SEO

The API stores and returns Markdown source unchanged, never rendered HTML. Content is nonblank with a 100000-character request limit, matching the existing bounded content DTO approach. Raw HTML appearing in source is not trusted executable output. B3 assigns rendering to apps/web/lib/content: disable raw HTML, enforce link protocol allowlists, disable arbitrary inline media for this scope and sanitize the final render. View and editor preview must share that pipeline and XSS fixtures. This backend module does not implement or claim to verify frontend rendering safety.

SEO uses existing fields: title, plain-text excerpt, slug, cover URL, publishedAt and updatedAt. The response includes derived seo.title, description, canonicalPath, imageUrl, type=article and noIndex. Empty excerpts yield null descriptions rather than copying unrendered Markdown. Admin previews are always noIndex. No independent SEO overrides or schema fields are added.

The frontend resolves canonicalPath against its configured website origin and imageUrl against the configured API origin/prefix, then uses Next metadata for title/description/canonical/Open Graph/article dates. It must not insert these values as raw HTML. The website article path is /news/:slug; the API lookup uses /news/by-slug/:slug. No origin is inferred from untrusted request headers. Actual metadata tags, sitemap and robots integration remain frontend ownership.

## Covers and validation

Nullable excerpt and coverKey can be cleared; required title/slug/content cannot be null. Titles are trimmed, canonical slugs reject trailing newlines, text rejects NUL and pagination uses the shared strict decimal parser. Date inputs require an explicit timezone, valid calendar date and at most millisecond precision.

Cover keys use the current local immutable store UUID format. Existing objects are read and checked for PNG/JPEG/WebP signatures before opening a transaction. Uploads remains responsible for multipart intake, size limits and complete image decode validation. Signature checks do not replace that pipeline. Missing or unsupported public cover objects return 404; storage failures otherwise propagate. Responses use nosniff, explicit MIME and no-store. Admin previews require an authenticated fetch/blob. Clearing, replacing or deleting cover references never deletes shared bytes.

## Verification

Run `pnpm --filter @bookstore/api test:news` after Prisma client generation. Unit tests cover publication/scheduling, public filters, author assignment, session lock order, stale-session rejection, projections, nullable edits, conflict handling and cover rejection. HTTP tests exercise real Nest routing, JWT authorization and DTO validation with a mocked NewsService. Persistence and storage are mocked; actual PostgreSQL locking, migration constraints, upload decoding and safe frontend Markdown rendering remain integration gates.

No database write, migration, application bootstrap, frontend implementation or new dependency was introduced.
