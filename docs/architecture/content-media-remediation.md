# News, Banners and Uploads remediation

Status: APPROVED — user approved the implementation on 2026-09-03. This approval records acceptance of the code and operational defaults; deployment, live database migration and real-storage cleanup have not been performed. The PostgreSQL and real-browser verification gates below remain outstanding.

## Changes against the six findings

1. PNG chunk boundaries are parsed before Sharp. APNG animation chunks are rejected, including when Sharp omits metadata.pages. Malformed/truncated chunks are rejected. Existing real decode/re-encode remains mandatory.
2. An upload admission interceptor runs before Multer: UPLOAD_MAX_CONCURRENT defaults to 2 per API process (configurable 1-8). There is no unbounded queue. Rejected requests receive 429 and Retry-After: 2. Capacity is released on completion/error/unsubscription; socket close alone does not prematurely release a still-running processing task. Nginx configuration examples include upload body/rate/connection/time limits. They must be adapted and enabled by deployment; a per-process limit is not a fleet-wide quota.
3. Standalone cleanup defaults to dry-run. It checks references in ProductImage, Brand, News and Banner, ignores young/nonregular objects and requires explicit offline maintenance confirmation for deletion. See [runbook](../operations/media-cleanup.md). No cleanup was applied to real storage.
4. Markdown uses remark-parse -> remark-rehype (raw HTML disabled) -> rehype-sanitize (explicit tag/attribute/protocol allowlist, no inline media) -> rehype-stringify. MarkdownView and client MarkdownPreview share the same renderer and fixtures. Dependencies are pinned in package.json/lockfile. API source remains unchanged.
5. A new migration adds only the approved News/Banner scheduling CHECKs. It locks the affected tables during a read-only preflight and aborts on invalid data rather than repairing content. A separate SQL report identifies violating rows. Existing migrations and Prisma models are unchanged. Run the PostgreSQL test gate before migration deployment.
6. Public News list/detail routes now use the public API without persistent caching. Page content and generateMetadata share the request-scoped fetch. Canonical/OG URLs come from configured SITE_URL and API_BASE_URL (including API prefix), never request Host headers. Hidden articles receive the API's 404; future publication timestamps also fail closed. Sitemap uses only the public list. Admin shell metadata is noindex/nofollow. Dynamic sitemap/robots routes are not statically cached.

## Frontend integration scope

The prior frontend route/layout/error/config files were empty scaffold. Minimal valid root/storefront/admin layouts and error/loading boundaries were needed to build and exercise News routing. Empty admin pages remain empty; no admin authentication UI or account functionality was introduced. The home shell links to News. Tailwind v4 includes packages/ui sources.

The News feature has a server-only public entry, preserving package/feature boundaries. Its response validation is local to the feature until generated OpenAPI contracts are populated. Origins are validated lazily so build does not require live API access. Production requires HTTPS. Example development configuration: SITE_URL=http://localhost:3000 and API_BASE_URL=http://localhost:4000/api; use the actual API mount prefix. Backend bootstrap is still separate work.

The new public sitemap currently covers News only; other catalogue routes remain their respective frontend implementation scope. Offset pagination cannot produce a cross-request database snapshot during concurrent edits. Very large news archives need partitioned sitemaps before exceeding protocol limits. Admin noindex metadata is not authorization; future admin pages must use the approved auth flow before showing private data.

## Verification

- Uploads: 20 tests passing (real Sharp/Nest/Multer, mocked identity/storage).
- Cleanup: 4 tests passing on disposable temporary directories. The content-review runner also repeats 2 admission/APNG tests.
- Markdown/SEO: 13 tests passing, including the same XSS fixtures for view and preview SSR.
- API/frontend typechecks, API/operations builds, frontend production build and focused ESLint checks passed. Formatting is checked for the changed source/config/docs.
- Real PostgreSQL test suite is prepared and wired into CI. This machine has no PostgreSQL tooling/Docker; it has not been executed locally.
- Browser binaries are absent locally; a real-browser preview/XSS run has not been claimed. The renderer and both component paths were exercised with React SSR.

## Approval and deployment gates

Review the code and operational defaults, then run the PostgreSQL gate in CI. Inspect preflight output before applying migration through the normal deployment process. Do not run cleanup apply until every writer is stopped. Configure ingress limits across all instances. No schema redesign or new models/enums are requested.

Official implementation references: [remark-rehype HTML policy](https://github.com/remarkjs/remark-rehype), [rehype-sanitize](https://github.com/rehypejs/rehype-sanitize), [Next generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata).
