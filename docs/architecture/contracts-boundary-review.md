# API -> OpenAPI -> Contracts boundary review

The current dependency direction is correct. The patches strengthen enforcement rather than remove a business dependency.

## Findings and applied patches

- API does not import the generated contracts package. Contracts contains no Prisma/Nest/application imports and no runtime dependencies. The News frontend uses `import type` from the public package root.
- ESLint previously missed TypeScript `import('...')` type expressions and `import = require(...)`. Both now use the same boundary checks as static/dynamic imports and re-exports; absolute filesystem imports are also resolved for boundary checking.
- Consumers must use type-only imports/exports for contracts. Contracts source is self-contained: only internal type references, interfaces and type aliases are allowed; runtime variables, functions, classes, namespaces and enums are rejected.
- The general ESLint configuration ignores generated directories. A dedicated boundary scanner now includes packages/contracts/src/generated explicitly, with the same boundary rule and TypeScript parser, so generated code cannot bypass this gate.
- Package manifest checks reject API -> Contracts dependencies, backend dependencies in Contracts, runtime dependencies and runtime package entry points.
- OpenAPI tooling cannot directly import Prisma clients/generated clients or pg. It may import PrismaService solely as the Nest override token, which B3 requires to replace runtime persistence before constructing the export context. API runtime remains allowed to use Prisma normally.
- `contracts:check` now runs boundary verification before the existing regeneration/drift check. CI also runs boundary regression tests.

## Direction and exceptions

API DTO/Swagger -> offline OpenAPI JSON -> generated Contracts types -> type-only Web consumers.

The exporter imports AppModule and the shared Swagger factory to discover the actual runtime controller registry; this is the approved tooling-to-runtime metadata dependency, not a reverse import of generated contracts. Root scripts orchestrate artifact generation. No change to models, enums, runtime guards or storage/DB behavior was needed.

## Commands

```sh
pnpm contracts:boundaries
pnpm test:contract-boundaries
pnpm contracts:check
```

Boundary regression cases cover imports, type expressions, require assignments, dynamic imports, absolute paths, Prisma references, generated runtime declarations, manifest violations and permitted type-only exports. The generated OpenAPI/schema contents remain unchanged by this patch.
