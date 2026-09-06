# OpenAPI export and contracts

Backend controllers, DTOs and Swagger decorators are the contract source. `packages/contracts` contains a committed OpenAPI snapshot, generated TypeScript schema and a type-only public index. There are no runtime enums, validators, clients, Prisma models or Nest imports in this package.

## File ownership

- apps/api/src/app.module.ts is the shared controller registry for Auth, Catalog, Categories, Brands, News, Banners and Uploads. Health is not exported until implemented. Users remains an internal module, with no user/account CRUD endpoints.
- apps/api/src/openapi/create-document.ts is the shared Swagger document factory. Runtime Swagger integration must call this factory rather than define another document. Stable operation IDs are ControllerName_methodName.
- apps/api/tooling/openapi builds a Nest testing composition from that same AppModule. It replaces Prisma, both storage provider tokens and PasswordService before constructors are resolved. Offline I/O methods throw. Configuration is an isolated object with deterministic tooling-only values; it cannot read process.env or production secrets.
- Export scans compiled metadata without app.init or app.listen. This avoids runtime lifecycle hooks, including Auth's dummy-password initialization. The context is closed in finally. The offline providers are outside runtime source/build and are not runtime fallbacks.
- scripts/generate-contracts.mjs compiles tooling, exports to an isolated temporary directory, sorts object keys, generates types using pinned openapi-typescript and applies the repository's pinned Prettier config. Temporary files are removed afterward.
- scripts/check-contracts.mjs follows the same pipeline and compares generated strings without overwriting committed artifacts. Missing or changed artifacts fail with a list of paths to regenerate. It may rebuild ignored dist-tooling output; it does not require Git state to detect drift.

## Commands and build order

From repository root, with the pinned Node/pnpm toolchain installed:

```sh
pnpm install --frozen-lockfile
pnpm --filter @bookstore/api exec prisma generate
pnpm contracts:generate
pnpm contracts:check
pnpm --filter @bookstore/contracts typecheck
pnpm --filter @bookstore/api test:openapi
```

After a DTO/controller change, regenerate and review both the JSON snapshot and TypeScript diff. Never hand-edit generated files. CI performs generation in check mode before contracts typechecking and web build. No database is required for export; Prisma generation supplies the compile-time/runtime client types only and does not run migrations.

## Public type API

Only the package root is exported, and only under the types condition. Consumers must use `import type`; generated internal file paths are not package exports.

```ts
import type { components, operations, paths } from '@bookstore/contracts';

type News = components['schemas']['NewsResponseDto'];
type NewBanner =
  operations['BannersAdminController_create']['requestBody']['content']['application/json'];
type ProductPage = paths['/products']['get']['responses'][200]['content']['application/json'];
```

The existing News frontend response parser now checks its projection against the generated News type. Zod still performs runtime validation and tightens public publishedAt to non-null; generated types alone do not validate network responses. Dates are wire-format strings, not Date objects. Binary multipart fields are represented as strings by OpenAPI; callers still construct FormData/Blob at the transport boundary.

API paths are relative to the deployment mount prefix. No environment-specific host or server URL is embedded. Configure the actual API base URL in the client. Auth POSTs declare their required Origin header, refresh uses the named secure cookie scheme, and logout documents its optional cookie/Bearer alternatives. These Swagger annotations do not change auth behavior.

## Verification and limits

Tests check implemented route coverage, unique operation IDs, valid security scheme references, local schema references, upload/scheduling request shapes, committed snapshot parity, deterministic export and blocked offline I/O. Contracts are typechecked independently. Runtime decorators remain the source; mixed public/admin response DTOs preserve optional fields exactly as currently declared.

Full runtime/OpenAPI parity against a running application and real PostgreSQL is a later integration gate, not claimed by offline export. DTO validators do not automatically become every OpenAPI constraint; constraints must be expressed through Swagger metadata when clients need them. This change does not add a runtime bootstrap/server, change models/enums or run database/storage operations.
